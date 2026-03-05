/**
 * notifications.ts — Wren Health push & local notification helpers
 *
 * Local notifications:  work immediately, no EAS needed.
 * Push notifications:   require EAS project ID in app.json → add when ready.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission + token registration
// Call once after the user signs in.
// ─────────────────────────────────────────────────────────────────────────────

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return; // simulators can't receive push

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return; // user declined — that's fine

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get Expo push token — requires EAS projectId to be set in app.json.
  // If not yet configured, skip silently (local notifications still work).
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.info('[Wren] No EAS projectId — push notifications disabled until configured.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Save to Supabase profiles table
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  } catch (e) {
    console.warn('[Wren] Could not register push token:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Local appointment reminders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule a local reminder 24h before an appointment.
 * Returns the notification identifier so you can cancel it later.
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  title: string,
  datetime: Date,
  memberName?: string
): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  // Remind 24 hours before
  const triggerDate = new Date(datetime.getTime() - 24 * 60 * 60 * 1000);
  if (triggerDate <= new Date()) return null; // already past

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `appt-${appointmentId}`,
    content: {
      title: 'Appointment Tomorrow',
      body: memberName
        ? `${memberName} has "${title}" tomorrow.`
        : `"${title}" is tomorrow.`,
      data: { appointmentId },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });

  return identifier;
}

/**
 * Also schedule a 1-hour-before reminder.
 */
export async function scheduleAppointmentReminderHour(
  appointmentId: string,
  title: string,
  datetime: Date,
  memberName?: string
): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const triggerDate = new Date(datetime.getTime() - 60 * 60 * 1000);
  if (triggerDate <= new Date()) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `appt-1h-${appointmentId}`,
    content: {
      title: 'Appointment in 1 Hour',
      body: memberName
        ? `${memberName} has "${title}" in about an hour.`
        : `"${title}" is in about an hour.`,
      data: { appointmentId },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });

  return identifier;
}

/**
 * Cancel both reminders for an appointment when it's deleted.
 */
export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`appt-${appointmentId}`),
    Notifications.cancelScheduledNotificationAsync(`appt-1h-${appointmentId}`),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Server push — calls Supabase Edge Function which calls Expo Push API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a push notification to another Wren user.
 * Silently no-ops if the Edge Function isn't deployed or the user has no token.
 */
export async function sendPushToUser(
  recipientUserId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', {
      body: { recipient_user_id: recipientUserId, title, body, data: data ?? {} },
    });
  } catch (e) {
    // Non-fatal — push is best-effort
    console.warn('[Wren] sendPushToUser failed:', e);
  }
}
