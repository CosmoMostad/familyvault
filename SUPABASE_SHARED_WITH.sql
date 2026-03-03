-- Run this in Supabase SQL editor
-- Allows the account owner to see who they've shared a member with

CREATE OR REPLACE FUNCTION public.get_shared_with(p_member_id uuid)
RETURNS TABLE(share_id uuid, recipient_name text, recipient_email text, access_level text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT sa.id, p.full_name, p.email, sa.access_level, sa.status
  FROM public.shared_accounts sa
  JOIN public.profiles p ON p.user_id = sa.recipient_id
  WHERE sa.account_id = p_member_id
    AND sa.owner_id = auth.uid()
    AND sa.status != 'declined';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_with(uuid) TO authenticated;
