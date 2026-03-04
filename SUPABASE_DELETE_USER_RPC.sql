-- ─────────────────────────────────────────────────────────────────────────────
-- delete_user_account RPC
-- Called from the app Settings screen when a user deletes their account.
-- SECURITY DEFINER lets this run as postgres so it can delete from auth.users.
-- Cascade deletes on all tables (family_members, health_info, etc.) handle
-- the rest automatically via FK ON DELETE CASCADE.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Explicit cleanup (belt + suspenders — cascades should cover most of this)
  DELETE FROM public.calendar_participants  WHERE user_id = uid;
  DELETE FROM public.calendar_members      WHERE user_id = uid;
  DELETE FROM public.calendar_invitations  WHERE invited_user_id = uid;
  DELETE FROM public.family_calendars      WHERE owner_id = uid;
  DELETE FROM public.shared_accounts       WHERE owner_id = uid OR recipient_id = uid;
  DELETE FROM public.account_shares        WHERE owner_id = uid OR recipient_id = uid;
  DELETE FROM public.family_members        WHERE owner_id = uid;
  DELETE FROM public.profiles              WHERE id = uid;

  -- Delete the auth user itself
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
