-- Add display columns to calendar_invitations so invitees can read
-- calendar name + inviter name without needing cross-table RLS access.
ALTER TABLE calendar_invitations ADD COLUMN IF NOT EXISTS calendar_title text;
ALTER TABLE calendar_invitations ADD COLUMN IF NOT EXISTS inviter_display_name text;
