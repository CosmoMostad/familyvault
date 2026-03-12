-- ============================================================
-- Wren Health v1.1 Database Migrations
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. Add text_content column to documents for OCR text storage
ALTER TABLE documents ADD COLUMN IF NOT EXISTS text_content TEXT;

-- 2. Caregiver notes table
CREATE TABLE IF NOT EXISTS caregiver_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE caregiver_notes ENABLE ROW LEVEL SECURITY;

-- Insert policy: only the author can insert their own notes
CREATE POLICY "caregiver_notes_insert" ON caregiver_notes FOR INSERT
WITH CHECK (author_id = auth.uid());

-- Select policy: owner of the member or someone with accepted share access can read
CREATE POLICY "caregiver_notes_select" ON caregiver_notes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM family_members WHERE id = member_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM shared_accounts WHERE account_id = member_id AND recipient_id = auth.uid() AND status = 'accepted')
);

-- 3. Index for faster caregiver notes lookups
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_member_id ON caregiver_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_created_at ON caregiver_notes(created_at DESC);
