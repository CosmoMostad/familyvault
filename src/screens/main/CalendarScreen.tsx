import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function toDateString(dateStr: string) {
  return new Date(dateStr).toISOString().split('T')[0];
}

function AddEventModal({
  visible,
  selectedDate,
  members,
  onSave,
  onClose,
}: {
  visible: boolean;
  selectedDate: string;
  members: { id: string; full_name: string }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMember, setSelectedMember] = useState(members[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    setSaving(true);
    try {
      const dt = new Date(`${selectedDate}T${time}:00`);
      if (isNaN(dt.getTime())) throw new Error('Invalid time format. Use HH:MM (e.g. 09:30)');
      await supabase.from('appointments').insert({
        member_id: selectedMember || members[0]?.id,
        title: title.trim(),
        datetime: dt.toISOString(),
        doctor: doctor.trim() || null,
        location: location.trim() || null,
        reminder_set: true,
      });
      try {
        const notifTime = new Date(dt.getTime() - 24 * 60 * 60 * 1000);
        if (notifTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'Tomorrow: ' + title, body: doctor ? `with ${doctor}` : '' },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifTime },
          });
        }
      } catch {}
      setTitle(''); setTime('09:00'); setDoctor(''); setLocation('');
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.container}>
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={modal.title}>New Appointment</Text>
          <TouchableOpacity onPress={save} disabled={saving} style={modal.saveBtn}>
            {saving ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={modal.saveBtnText}>Add</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modal.scroll} keyboardShouldPersistTaps="handled">
          <Text style={modal.dateLabel}>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

          {[
            { label: 'Title *', value: title, set: setTitle, placeholder: 'e.g. Annual checkup' },
            { label: 'Time', value: time, set: setTime, placeholder: '09:00' },
            { label: 'Doctor', value: doctor, set: setDoctor, placeholder: 'Dr. Name' },
            { label: 'Location', value: location, set: setLocation, placeholder: 'Clinic or address' },
          ].map((f, i) => (
            <View key={i} style={modal.field}>
              <Text style={modal.label}>{f.label}</Text>
              <TextInput
                style={modal.input}
                value={f.value}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          ))}

          {members.length > 1 && (
            <View style={modal.field}>
              <Text style={modal.label}>For</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.xs }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[modal.memberChip, selectedMember === m.id && modal.memberChipActive]}
                      onPress={() => setSelectedMember(m.id)}
                    >
                      <Text style={[modal.memberChipText, selectedMember === m.id && modal.memberChipTextActive]}>
                        {m.full_name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { ...FONTS.h4, color: COLORS.textPrimary },
  saveBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  saveBtnText: { ...FONTS.body, color: COLORS.primary, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, gap: SPACING.lg },
  dateLabel: { ...FONTS.h4, color: COLORS.primary, marginBottom: SPACING.sm },
  field: { gap: SPACING.xs },
  label: { ...FONTS.label, color: COLORS.textSecondary, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 48,
    ...FONTS.body, color: COLORS.textPrimary,
  },
  memberChip: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: 20, backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  memberChipActive: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary },
  memberChipText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '500' },
  memberChipTextActive: { color: COLORS.primary, fontWeight: '600' },
});

export default function CalendarScreen() {
  const [appointments, setAppointments] = useState<(Appointment & { member_name?: string })[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [apptRes, memberRes] = await Promise.all([
        supabase.from('appointments').select('*').order('datetime', { ascending: true }),
        supabase.from('family_members').select('id, full_name').order('is_self', { ascending: false }),
      ]);
      setAppointments(apptRes.data || []);
      setMembers(memberRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  // Build marked dates for calendar
  const markedDates: Record<string, MarkedDate> = {};
  appointments.forEach((a) => {
    const dateKey = toDateString(a.datetime);
    markedDates[dateKey] = {
      ...markedDates[dateKey],
      marked: true,
      dotColor: COLORS.primary,
    };
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: COLORS.primary,
    };
  }

  const dayAppointments = appointments.filter((a) => toDateString(a.datetime) === selectedDate);
  const memberName = (id: string) => members.find((m) => m.id === id)?.full_name ?? '';

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: COLORS.background,
            calendarBackground: COLORS.background,
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: COLORS.textInverse,
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.textPrimary,
            textDisabledColor: COLORS.textTertiary,
            dotColor: COLORS.primary,
            selectedDotColor: COLORS.textInverse,
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.textPrimary,
            textMonthFontWeight: '700',
            textMonthFontSize: 17,
            textDayFontSize: 14,
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: '600',
          }}
        />

        {/* Selected day events */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsDate}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
          ) : dayAppointments.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No appointments</Text>
              <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addEventLink}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.addEventLinkText}>Add appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {dayAppointments.map((a) => (
                <View key={a.id} style={styles.eventCard}>
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>{formatTime(a.datetime)}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{a.title}</Text>
                    {memberName(a.member_id) && (
                      <Text style={styles.eventMember}>{memberName(a.member_id)}</Text>
                    )}
                    {a.doctor && (
                      <View style={styles.eventMeta}>
                        <Ionicons name="person-outline" size={12} color={COLORS.textTertiary} />
                        <Text style={styles.eventMetaText}>{a.doctor}</Text>
                      </View>
                    )}
                    {a.location && (
                      <View style={styles.eventMeta}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
                        <Text style={styles.eventMetaText}>{a.location}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Remove', 'Remove this appointment?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: async () => {
                        await supabase.from('appointments').delete().eq('id', a.id);
                        fetchData();
                      }},
                    ])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddEventModal
        visible={showAddModal}
        selectedDate={selectedDate}
        members={members}
        onSave={() => { setShowAddModal(false); fetchData(); }}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.base,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  eventsSection: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  eventsDate: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: SPACING.md },
  emptyDay: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyDayText: { ...FONTS.body, color: COLORS.textTertiary },
  addEventLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addEventLinkText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  eventsList: { gap: SPACING.sm },
  eventCard: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  eventTime: {
    minWidth: 56,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 8,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  eventTimeText: { ...FONTS.label, color: COLORS.primary, fontSize: 11 },
  eventInfo: { flex: 1, gap: 3 },
  eventTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  eventMember: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { ...FONTS.caption, color: COLORS.textSecondary },
});
