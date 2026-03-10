import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';
import { TimePickerWheel, to24Hour, formatTime12 } from '../../components/TimePickerWheel';
import { scheduleAppointmentReminder, scheduleAppointmentReminderHour, cancelAppointmentReminders } from '../../lib/notifications';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
  route: RouteProp<RootStackParamList, 'Appointments'>;
};

interface Appointment {
  id: string;
  member_id: string;
  title: string;
  source?: 'direct' | 'calendar';
  datetime: string;
  doctor?: string | null;
  location?: string | null;
  notes?: string | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function AppointmentCard({
  appt,
  canEdit,
  onDelete,
  onPress,
  past = false,
}: {
  appt: Appointment;
  canEdit: boolean;
  onDelete: () => void;
  onPress: () => void;
  past?: boolean;
}) {
  const { month, day, time } = formatDate(appt.datetime);
  return (
    <TouchableOpacity
      style={[styles.card, past && styles.cardPast]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.dateBlock, past && styles.dateBlockPast]}>
        <Text style={[styles.dateMonth, past && styles.dateTextPast]}>{month}</Text>
        <Text style={[styles.dateDay, past && styles.dateTextPast]}>{day}</Text>
      </View>
      <View style={styles.apptInfo}>
        <Text style={[styles.apptTitle, past && styles.textPast]}>{appt.title}</Text>
        <View style={styles.apptMeta}>
          <Ionicons name="time-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.apptMetaText}>{time}</Text>
        </View>
        {appt.doctor ? (
          <View style={styles.apptMeta}>
            <Ionicons name="person-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.apptMetaText}>{appt.doctor}</Text>
          </View>
        ) : null}
        {appt.location ? (
          <View style={styles.apptMeta}>
            <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.apptMetaText}>{appt.location}</Text>
          </View>
        ) : null}
        {appt.notes ? (
          <Text style={styles.apptNotes} numberOfLines={2}>{appt.notes}</Text>
        ) : null}
      </View>
      {canEdit && appt.source !== 'calendar' && !past && (
        <TouchableOpacity
          onPress={e => { e.stopPropagation?.(); onDelete(); }}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      )}
      <Ionicons name="chevron-forward" size={15} color={COLORS.textTertiary} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

// ── Add Appointment Modal ────────────────────────────────────────────────────

function AddAppointmentModal({
  visible,
  memberId,
  memberName,
  onClose,
  onSaved,
}: {
  visible: boolean;
  memberId: string;
  memberName?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [pickerDate, setPickerDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [pickerHour12, setPickerHour12] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('AM');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    setPickerDate(today);
    setPickerHour12(9);
    setPickerMinute(0);
    setPickerAmPm('AM');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setDoctor(''); setLocation(''); setNotes('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function formatDisplayDate(d: Date) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDisplayTime(d: Date) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter an appointment title.');
      return;
    }
    setSaving(true);
    try {
      const apptDatetime = new Date(
        pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(),
        to24Hour(pickerHour12, pickerAmPm), pickerMinute, 0, 0
      );
      const { data: inserted, error } = await supabase.from('appointments').insert({
        member_id: memberId,
        title: title.trim(),
        datetime: apptDatetime.toISOString(),
        doctor: doctor.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      }).select('id').single();
      if (error) throw error;
      // Schedule local reminders (best-effort)
      if (inserted?.id) {
        scheduleAppointmentReminder(inserted.id, title.trim(), apptDatetime, memberName);
        scheduleAppointmentReminderHour(inserted.id, title.trim(), apptDatetime, memberName);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onSaved();
    } catch (e: any) {
      Alert.alert('Error saving', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={modal.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={modal.backdrop} onPress={handleClose} />
        <View style={modal.sheet}>
          {/* Header */}
          <View style={modal.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={modal.title}>Add Appointment</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {saving
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={modal.saveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
            <Text style={modal.label}>Title *</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. Annual physical"
              placeholderTextColor={COLORS.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            {/* Date picker */}
            <Text style={modal.label}>Date</Text>
            <TouchableOpacity
              style={modal.pickerBtn}
              onPress={() => { setShowTimePicker(false); setShowDatePicker(v => !v); }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
              <Text style={modal.pickerBtnText}>{formatDisplayDate(pickerDate)}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.textTertiary} />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={modal.pickerWrap}>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date(1900, 0, 1)}
                  maximumDate={new Date(2099, 11, 31)}
                  onChange={(_, date) => { if (date) setPickerDate(date); }}
                  style={{ height: 200 }}
                />
              </View>
            )}

            {/* Time picker */}
            <Text style={modal.label}>Time</Text>
            <TouchableOpacity
              style={modal.pickerBtn}
              onPress={() => { setShowDatePicker(false); setShowTimePicker(v => !v); }}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={17} color={COLORS.primary} />
              <Text style={modal.pickerBtnText}>{formatTime12(pickerHour12, pickerMinute, pickerAmPm)}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.textTertiary} />
            </TouchableOpacity>
            {showTimePicker && (
              <TimePickerWheel
                hour12={pickerHour12}
                minute={pickerMinute}
                ampm={pickerAmPm}
                onHourChange={setPickerHour12}
                onMinuteChange={setPickerMinute}
                onAmPmChange={setPickerAmPm}
              />
            )}

            <Text style={modal.label}>Doctor / Provider</Text>
            <TextInput
              style={modal.input}
              placeholder="Dr. Smith"
              placeholderTextColor={COLORS.textTertiary}
              value={doctor}
              onChangeText={setDoctor}
            />

            <Text style={modal.label}>Location</Text>
            <TextInput
              style={modal.input}
              placeholder="Clinic name or address"
              placeholderTextColor={COLORS.textTertiary}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={modal.label}>Notes</Text>
            <TextInput
              style={[modal.input, modal.textarea]}
              placeholder="Any additional details..."
              placeholderTextColor={COLORS.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function AppointmentsScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params ?? {};
  const { session } = useAuth();
  const { colors } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [pastHeight, setPastHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      title: memberName ? `${memberName}'s Appointments` : 'Appointments',
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
      headerRight: () => null, // will update after access check
    });
  }, [memberName]);

  // Clear headerRight — FAB is now in the screen content
  useEffect(() => {
    navigation.setOptions({ headerRight: undefined });
  }, []);

  useFocusEffect(useCallback(() => {
    scrolledRef.current = false;
    setPastHeight(0);
    fetchAll();
  }, [memberId]));

  // Auto-scroll past section off screen on load
  useEffect(() => {
    if (pastHeight > 0 && !scrolledRef.current) {
      scrolledRef.current = true;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: pastHeight, animated: false });
      }, 100);
    }
  }, [pastHeight]);

  async function fetchAll() {
    if (!memberId) { setLoading(false); return; }
    setLoading(true);
    try {
      await Promise.all([fetchAppointments(), checkEditAccess()]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAppointments() {
    // 1. Direct appointments (appointments table)
    const { data: directData, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('member_id', memberId)
      .order('datetime', { ascending: true });
    if (error) throw error;
    const direct: Appointment[] = (directData ?? []).map(a => ({ ...a, source: 'direct' as const }));

    // 2. Calendar events assigned to this family member via event_assignees
    const { data: assignedData } = await supabase
      .from('event_assignees')
      .select('event_id, calendar_events(id, calendar_id, created_by, title, date_time, location, notes)')
      .eq('family_member_id', memberId);

    const calendarAppts: Appointment[] = (assignedData ?? [])
      .filter((a: any) => a.calendar_events)
      .map((a: any) => {
        const evt = a.calendar_events;
        return {
          id: evt.id,
          member_id: memberId ?? '',
          title: evt.title,
          datetime: evt.date_time,
          doctor: null,
          location: evt.location ?? null,
          notes: evt.notes ?? null,
          created_at: evt.date_time,
          source: 'calendar' as const,
        };
      });

    // Merge + sort by datetime ascending
    const all = [...direct, ...calendarAppts].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    setAppointments(all);
  }

  async function checkEditAccess() {
    if (!session?.user?.id || !memberId) return;

    // Check ownership first
    const { data: member } = await supabase
      .from('family_members')
      .select('owner_id')
      .eq('id', memberId)
      .single();

    if (member?.owner_id === session.user.id) {
      setCanEdit(true);
      return;
    }

    // Check shared with edit permission
    const { data: share } = await supabase
      .from('shared_accounts')
      .select('access_level')
      .eq('account_id', memberId)
      .eq('recipient_id', session.user.id)
      .eq('status', 'accepted')
      .single();

    setCanEdit(share?.access_level === 'edit');
  }

  async function deleteAppointment(appt: Appointment) {
    Alert.alert(
      'Delete Appointment',
      `Delete "${appt.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { error } = await supabase.from('appointments').delete().eq('id', appt.id);
            if (error) Alert.alert('Error', error.message);
            else {
              cancelAppointmentReminders(appt.id);
              fetchAppointments();
            }
          },
        },
      ]
    );
  }

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.datetime) >= now);
  const past = [...appointments.filter(a => new Date(a.datetime) < now)].reverse();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
        ) : upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyDesc}>
              {canEdit
                ? `Tap + to add an appointment for ${memberName}.`
                : `No appointments have been added for ${memberName} yet.`}
            </Text>
          </View>
        ) : (
          <>
            {/* Past — scroll UP to find, greyed out */}
            {past.length > 0 && (
              <View
                onLayout={e => setPastHeight(e.nativeEvent.layout.height)}
              >
                <Text style={styles.sectionLabel}>Past</Text>
                {past.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    canEdit={canEdit}
                    onDelete={() => deleteAppointment(a)}
                    onPress={() => setSelectedAppt(a)}
                    past
                  />
                ))}
                {/* UPCOMING divider */}
                <View style={styles.upcomingDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>UPCOMING</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            )}

            {/* Upcoming */}
            <View style={{ minHeight: Dimensions.get('window').height }}>
              {upcoming.length === 0 ? (
                <View style={styles.emptyUpcoming}>
                  <Ionicons name="calendar-outline" size={36} color={COLORS.textTertiary} />
                  <Text style={styles.emptyUpcomingText}>No upcoming appointments</Text>
                </View>
              ) : (
                upcoming.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    canEdit={canEdit}
                    onDelete={() => deleteAppointment(a)}
                    onPress={() => setSelectedAppt(a)}
                  />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddAppointmentModal
        visible={showAddModal}
        memberId={memberId ?? ''}
        memberName={memberName}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); fetchAppointments(); }}
      />

      {/* FAB — sticky bottom-right */}
      {canEdit && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Appointment detail sheet */}
      <Modal
        visible={!!selectedAppt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAppt(null)}
      >
        {selectedAppt && (
          <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header */}
            <View style={detailStyles.header}>
              <TouchableOpacity onPress={() => setSelectedAppt(null)} style={detailStyles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={detailStyles.headerTitle}>Appointment</Text>
              {canEdit && selectedAppt.source !== 'calendar' ? (
                <TouchableOpacity
                  onPress={() => { setSelectedAppt(null); deleteAppointment(selectedAppt); }}
                  style={detailStyles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.rose} />
                </TouchableOpacity>
              ) : <View style={{ width: 36 }} />}
            </View>
            <ScrollView contentContainerStyle={detailStyles.body}>
              <Text style={detailStyles.title}>{selectedAppt.title}</Text>
              {selectedAppt.source === 'calendar' && (
                <View style={detailStyles.sourceBadge}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
                  <Text style={detailStyles.sourceBadgeText}>From calendar</Text>
                </View>
              )}
              <View style={detailStyles.row}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} style={detailStyles.rowIcon} />
                <View>
                  <Text style={detailStyles.rowText}>
                    {new Date(selectedAppt.datetime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={detailStyles.rowSub}>
                    {new Date(selectedAppt.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              {selectedAppt.doctor ? (
                <View style={detailStyles.row}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} style={detailStyles.rowIcon} />
                  <Text style={detailStyles.rowText}>{selectedAppt.doctor}</Text>
                </View>
              ) : null}
              {selectedAppt.location ? (
                <View style={detailStyles.row}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} style={detailStyles.rowIcon} />
                  <Text style={detailStyles.rowText}>{selectedAppt.location}</Text>
                </View>
              ) : null}
              {selectedAppt.notes ? (
                <View style={detailStyles.row}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={detailStyles.rowIcon} />
                  <Text style={detailStyles.rowText}>{selectedAppt.notes}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.bodyLarge, fontWeight: '600', color: COLORS.textPrimary },
  closeBtn: { width: 36, alignItems: 'flex-start' },
  deleteBtn: { width: 36, alignItems: 'flex-end' },
  body: { padding: SPACING.xl, gap: SPACING.base },
  title: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: SPACING.base, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: SPACING.sm,
  },
  sourceBadgeText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.base },
  rowIcon: { marginTop: 2 },
  rowText: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  rowSub: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingTop: SPACING.base },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionLabel: {
    ...FONTS.label,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  card: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  dateBlock: {
    alignItems: 'center',
    minWidth: 44,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primaryMuted,
  },
  dateMonth: { ...FONTS.label, fontSize: 10, color: COLORS.primary },
  dateDay: { ...FONTS.h3, fontWeight: '700', color: COLORS.primary },
  apptInfo: { flex: 1, gap: 4 },
  apptTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  apptMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptMetaText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1 },
  apptNotes: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  deleteBtn: { padding: 4, marginTop: 2 },
  cardPast: { opacity: 0.55 },
  dateBlockPast: { backgroundColor: COLORS.surfaceAlt },
  dateTextPast: { color: COLORS.textTertiary },
  textPast: { color: COLORS.textSecondary },
  upcomingDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.xl, marginVertical: SPACING.base, gap: SPACING.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    ...FONTS.label, fontSize: 11, fontWeight: '700',
    color: COLORS.textTertiary, letterSpacing: 0.8,
  },
  emptyUpcoming: {
    alignItems: 'center', paddingTop: 48, gap: SPACING.base,
  },
  emptyUpcomingText: { ...FONTS.body, color: COLORS.textTertiary },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xxxl },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary },
  cancelText: { ...FONTS.body, color: COLORS.textSecondary },
  saveText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  body: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  label: {
    ...FONTS.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
  textarea: { minHeight: 80, paddingTop: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  pickerBtnText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickerWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  pickerDoneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pickerDoneText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
