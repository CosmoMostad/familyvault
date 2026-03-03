-- ================================================================
-- WREN HEALTH — Run all of this in the Supabase SQL Editor
-- https://supabase.com/dashboard/project/vgbqxneyyjgltzyciakq/sql/new
-- ================================================================


-- ================================================================
-- FIX 1: Email lookup function (fixes "no email found" in sharing)
-- ================================================================
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.full_name
  FROM public.profiles p
  WHERE lower(p.email) = lower(p_email)
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO authenticated;


-- ================================================================
-- FIX 2: Calendar RLS recursion fix
-- Drop and recreate all calendar policies with simple non-recursive logic
-- ================================================================

-- family_calendars
DROP POLICY IF EXISTS "Users can view their calendars" ON public.family_calendars;
DROP POLICY IF EXISTS "Users can create calendars" ON public.family_calendars;
DROP POLICY IF EXISTS "Users can update their calendars" ON public.family_calendars;
DROP POLICY IF EXISTS "Users can delete their calendars" ON public.family_calendars;
DROP POLICY IF EXISTS "calendar_select_policy" ON public.family_calendars;
DROP POLICY IF EXISTS "calendar_insert_policy" ON public.family_calendars;
DROP POLICY IF EXISTS "calendar_owner_all" ON public.family_calendars;
DROP POLICY IF EXISTS "calendar_member_select" ON public.family_calendars;

CREATE POLICY "calendar_owner_all" ON public.family_calendars
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "calendar_member_select" ON public.family_calendars
  FOR SELECT USING (
    id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
  );

-- family_calenders (typo version — fix this too just in case)
DROP POLICY IF EXISTS "Users can view their calendars" ON public.family_calenders;
DROP POLICY IF EXISTS "calendar_select_policy" ON public.family_calenders;
DROP POLICY IF EXISTS "calendar_insert_policy" ON public.family_calenders;
DROP POLICY IF EXISTS "calendar_owner_all" ON public.family_calenders;
DROP POLICY IF EXISTS "calendar_member_select" ON public.family_calenders;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'family_calenders') THEN
    EXECUTE 'CREATE POLICY "calendar_owner_all" ON public.family_calenders
      FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())';
    EXECUTE 'CREATE POLICY "calendar_member_select" ON public.family_calenders
      FOR SELECT USING (
        id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
      )';
  END IF;
END $$;


-- ================================================================
-- FIX 3: event_assignees table (appointments assigned to family members)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.event_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, family_member_id)
);

ALTER TABLE public.event_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_assignees_select" ON public.event_assignees;
DROP POLICY IF EXISTS "event_assignees_insert" ON public.event_assignees;
DROP POLICY IF EXISTS "event_assignees_delete" ON public.event_assignees;

-- View: calendar participants + family member owners can see assignees
CREATE POLICY "event_assignees_select" ON public.event_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = event_assignees.family_member_id
        AND fm.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      JOIN public.family_calendars fc ON fc.id = ce.calendar_id
      WHERE ce.id = event_assignees.event_id
        AND fc.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      JOIN public.calendar_members cm ON cm.calendar_id = ce.calendar_id
      WHERE ce.id = event_assignees.event_id
        AND cm.user_id = auth.uid()
    )
  );

-- Insert: event creator can assign members
CREATE POLICY "event_assignees_insert" ON public.event_assignees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      WHERE ce.id = event_id
        AND ce.created_by = auth.uid()
    )
  );

-- Delete: event creator can remove assignees
CREATE POLICY "event_assignees_delete" ON public.event_assignees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events ce
      WHERE ce.id = event_id
        AND ce.created_by = auth.uid()
    )
  );
