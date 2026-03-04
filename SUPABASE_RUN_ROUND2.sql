-- ============================================================
-- WREN HEALTH — Round 2 Supabase fixes
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── 1. Add shared_fields column to shared_accounts ──────────
ALTER TABLE public.shared_accounts
  ADD COLUMN IF NOT EXISTS shared_fields jsonb NOT NULL DEFAULT '{}'::jsonb;


-- ── 2. Create avatars storage bucket (if it doesn't exist) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read (public bucket)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- RLS: only upload to your own folder (path starts with your user id)
DROP POLICY IF EXISTS "avatars_owner_upload" ON storage.objects;
CREATE POLICY "avatars_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ── 3. family_members RLS — allow reading other users' members ──
--    Needed so "Who is this for" in AddEventModal can show all
--    calendar participants, not just your own family members.
DROP POLICY IF EXISTS "family_members_calendar_read" ON public.family_members;
CREATE POLICY "family_members_calendar_read" ON public.family_members
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT cp.family_member_id
      FROM public.calendar_participants cp
      WHERE cp.calendar_id IN (
        SELECT id FROM public.family_calendars WHERE owner_id = auth.uid()
        UNION
        SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid()
      )
    )
  );


-- ── 4. get_user_display_names RPC (SECURITY DEFINER) ─────────
--    Needed so CalendarSettings can show real names for other
--    calendar members (profiles RLS normally blocks this).
CREATE OR REPLACE FUNCTION public.get_user_display_names(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id AS user_id,
      COALESCE(NULLIF(TRIM(p.full_name), ''), p.email, 'Member') AS display_name
    FROM public.profiles p
    WHERE p.id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_display_names(uuid[]) TO authenticated;
