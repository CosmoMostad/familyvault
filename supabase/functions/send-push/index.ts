/**
 * send-push — Wren Health Supabase Edge Function
 *
 * Accepts: POST { recipient_user_id, title, body, data? }
 * Looks up the recipient's Expo push token from profiles,
 * then calls the Expo Push API.
 *
 * Deploy:
 *   npx supabase functions deploy send-push --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { recipient_user_id, title, body, data } = await req.json();

    if (!recipient_user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use service role to bypass RLS and read push_token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // profiles.id = auth.uid() (note: not profiles.user_id in all setups — check yours)
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', recipient_user_id)
      .single();

    // Also try user_id column as fallback
    let pushToken = profile?.push_token;
    if (!pushToken) {
      const { data: profileByUserId } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('user_id', recipient_user_id)
        .single();
      pushToken = profileByUserId?.push_token;
    }

    if (!pushToken) {
      // Recipient hasn't enabled notifications — that's fine
      return new Response(JSON.stringify({ skipped: true, reason: 'no_token' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send via Expo Push API
    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        priority: 'high',
      }),
    });

    const expoData = await expoRes.json();

    return new Response(JSON.stringify({ ok: true, expo: expoData }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
