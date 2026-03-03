import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
  route: RouteProp<RootStackParamList, 'Appointments'>;
};

interface Appointment {
  id: string;
  member_id: string;
  title: string;
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
}: {
  appt: Appointment;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const { month, day, time } = formatDate(appt.datetime);
  return (
    <View style={styles.card}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>
      <View style={styles.apptInfo}>
        <Text style={styles.apptTitle}>{appt.title}</Text>
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
      {canEdit && (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Add Appointment Modal ────────────────────────────────────────────────────

function AddAppointmentModal({
  visible,
  memberId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  memberId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle(''); setDate(''); setTime('');
    setDoctor(''); setLocation(''); setNotes('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter an appointment title.');
      return;
    }

    // Parse date + time into ISO datetime
    let datetime: string;
    try {
      const dateStr = date.trim() || new Date().toLocaleDateString('en-US');
      const timeStr = time.trim() || '12:00 PM';
      const combined = new Date(`${dateStr} ${timeStr}`);
      if (isNaN(combined.getTime())) throw new Error('invalid');
      datetime = combined.toISOString();
    } catch {
      Alert.alert('Invalid date/time', 'Please use a format like "3/15/2026" and "2:30 PM".');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        member_id: memberId,
        title: title.trim(),
        datetime,
        doctor: doctor.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
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

            <View style={modal.row}>
              <View style={{ flex: 1 }}>
                <Text style={modal.label}>Date</Text>
                <TextInput
                  style={modal.input}
                  placeholder="3/15/2026"
                  placeholderTextColor={COLORS.textTertiary}
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modal.label}>Time</Text>
                <TextInput
                  style={modal.input}
                  placeholder="2:30 PM"
                  placeholderTextColor={COLORS.textTertiary}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: memberName ? `${memberName}'s Appointments` : 'Appointments',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
      headerRight: () => null, // will update after access check
    });
  }, [memberName]);

  // Update header + button once we know edit access
  useEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <Ionicons name="add" size={26} color={COLORS.primary} />
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [canEdit]);

  useFocusEffect(useCallback(() => {
    fetchAll();
  }, [memberId]));

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
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('member_id', memberId)
      .order('datetime', { ascending: true });

    if (error) throw error;
    setAppointments(data ?? []);
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
            else fetchAppointments();
          },
        },
      ]
    );
  }

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.datetime) >= now);
  const past = [...appointments.filter(a => new Date(a.datetime) < now)].reverse();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Upcoming</Text>
                {upcoming.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    canEdit={canEdit}
                    onDelete={() => deleteAppointment(a)}
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Past</Text>
                {past.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appt={a}
                    canEdit={canEdit}
                    onDelete={() => deleteAppointment(a)}
                  />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddAppointmentModal
        visible={showAddModal}
        memberId={memberId ?? ''}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); fetchAppointments(); }}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingTop: SPACING.base },
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
});
