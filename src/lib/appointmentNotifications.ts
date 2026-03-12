import * as Notifications from 'expo-notifications';

// Post-appointment check-in — fires 1 hour after the appointment
export async function schedulePostAppointmentCheckIn(appointment: {
  id: string;
  title: string;
  date_time: string;
  member_name: string;
}): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const appointmentDate = new Date(appointment.date_time);
  const triggerDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
  if (triggerDate <= new Date()) return;

  // Cancel any existing notification for this appointment
  await cancelPostAppointmentCheckIn(appointment.id);

  await Notifications.scheduleNotificationAsync({
    identifier: `post-appt-${appointment.id}`,
    content: {
      title: 'How did it go?',
      body: `Hope ${appointment.member_name}'s appointment with ${appointment.title} went well! Any new prescriptions or follow-up appointments to add to Wren Health?`,
      data: { appointmentId: appointment.id, type: 'post_appointment' },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

export async function cancelPostAppointmentCheckIn(appointmentId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`post-appt-${appointmentId}`).catch(() => {});
}

// Medication refill countdown reminders
export async function scheduleRefillReminder(medication: {
  id: string;
  name: string;
  member_name: string;
  refill_date: Date;
}): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel existing reminders first
  await cancelRefillReminders(medication.id);

  const now = new Date();

  // 7 days before
  const sevenDaysBefore = new Date(medication.refill_date.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (sevenDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `refill-7d-${medication.id}`,
      content: {
        title: 'Medication Refill Reminder',
        body: `Time to refill ${medication.name} for ${medication.member_name} — about 7 days of supply remaining`,
        data: { medicationId: medication.id, type: 'refill_reminder' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: sevenDaysBefore },
    });
  }

  // Day of
  const dayOf = new Date(medication.refill_date);
  dayOf.setHours(9, 0, 0, 0); // 9 AM on refill day
  if (dayOf > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `refill-today-${medication.id}`,
      content: {
        title: 'Refill Due Today',
        body: `${medication.member_name}'s ${medication.name} refill is due today`,
        data: { medicationId: medication.id, type: 'refill_due' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayOf },
    });
  }
}

export async function cancelRefillReminders(medicationId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`refill-7d-${medicationId}`),
    Notifications.cancelScheduledNotificationAsync(`refill-today-${medicationId}`),
  ]);
}
