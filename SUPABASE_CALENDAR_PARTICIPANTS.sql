-- ─────────────────────────────────────────────────────────────────────────────
-- calendar_participants table
-- Tracks which family_member sub-accounts are opted into each calendar.
-- Separate from calendar_members (which tracks user-level access/invite status).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS calendar_participants (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id       uuid NOT NULL REFERENCES family_calendars(id) ON DELETE CASCADE,
  family_member_id  uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(calendar_id, family_member_id)
);

ALTER TABLE calendar_participants ENABLE ROW LEVEL SECURITY;

-- Calendar owners and members can see all participants on their calendars
CREATE POLICY "cp_select" ON calendar_participants
  FOR SELECT USING (
    calendar_id IN (
      SELECT id FROM family_calendars WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM calendar_members
      WHERE calendar_members.calendar_id = calendar_participants.calendar_id
        AND calendar_members.user_id = auth.uid()
    )
  );

-- Users can only add their own family members
CREATE POLICY "cp_insert" ON calendar_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove their own sub-accounts; calendar owner can remove anyone
CREATE POLICY "cp_delete" ON calendar_participants
  FOR DELETE USING (
    user_id = auth.uid()
    OR calendar_id IN (
      SELECT id FROM family_calendars WHERE owner_id = auth.uid()
    )
  );
