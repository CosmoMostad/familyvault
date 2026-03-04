-- Replace the delete_user_account function with a resilient version.
-- Each table deletion is wrapped in its own exception block so missing
-- tables don't crash the whole function.

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

  BEGIN DELETE FROM public.calendar_participants  WHERE user_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.calendar_members       WHERE user_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.calendar_invitations   WHERE invited_user_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.family_calendars       WHERE owner_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.shared_accounts        WHERE owner_id = uid OR recipient_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.account_shares         WHERE owner_id = uid OR recipient_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.appointments           WHERE member_id IN (SELECT id FROM public.family_members WHERE owner_id = uid); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN DELETE FROM public.family_members         WHERE owner_id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.profiles               WHERE id = uid; EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Delete the auth user itself
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
