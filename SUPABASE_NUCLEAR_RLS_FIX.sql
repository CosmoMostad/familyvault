-- NUCLEAR CALENDAR RLS FIX
-- Run this in Supabase SQL editor
-- Drops ALL policies on all 4 calendar tables and rebuilds clean

-- ── family_calendars ────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'family_calendars' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.family_calendars'; END LOOP;
END $$;

CREATE POLICY "fc_owner" ON public.family_calendars
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "fc_member" ON public.family_calendars
  FOR SELECT USING (
    id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
  );

-- ── calendar_members ────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'calendar_members' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.calendar_members'; END LOOP;
END $$;

CREATE POLICY "cm_own_row" ON public.calendar_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cm_calendar_owner_select" ON public.calendar_members
  FOR SELECT USING (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
  );

CREATE POLICY "cm_calendar_owner_insert" ON public.calendar_members
  FOR INSERT WITH CHECK (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
  );

CREATE POLICY "cm_calendar_owner_delete" ON public.calendar_members
  FOR DELETE USING (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
  );

-- ── calendar_events ─────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'calendar_events' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.calendar_events'; END LOOP;
END $$;

CREATE POLICY "ce_select" ON public.calendar_events
  FOR SELECT USING (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
    OR calendar_id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
  );

CREATE POLICY "ce_insert" ON public.calendar_events
  FOR INSERT WITH CHECK (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
    OR calendar_id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
  );

CREATE POLICY "ce_update" ON public.calendar_events
  FOR UPDATE USING (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
  );

CREATE POLICY "ce_delete" ON public.calendar_events
  FOR DELETE USING (
    calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
  );

-- ── event_assignees ─────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'event_assignees' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.event_assignees'; END LOOP;
END $$;

CREATE POLICY "ea_select" ON public.event_assignees
  FOR SELECT USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE owner_id = auth.uid())
    OR event_id IN (
      SELECT ce.id FROM public.calendar_events ce
      WHERE ce.calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
         OR ce.calendar_id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "ea_insert" ON public.event_assignees
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT ce.id FROM public.calendar_events ce
      WHERE ce.calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
         OR ce.calendar_id IN (SELECT calendar_id FROM public.calendar_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "ea_delete" ON public.event_assignees
  FOR DELETE USING (
    event_id IN (
      SELECT ce.id FROM public.calendar_events ce
      WHERE ce.calendar_id IN (SELECT id FROM public.family_calendars WHERE owner_id = auth.uid())
    )
  );
