import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { Appointment, FamilyMember, RootStackParamList } from '../../lib/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
  route: RouteProp<RootStackParamList, 'Appointments'>;
};

interface Section {
  title: string;
  data: (Appointment & { memberName?: string })[];
}

function formatDateTime(dateStr: string): { date: string; time: string; monthYear: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    monthYear: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

async function scheduleReminder(appointment: Appointment, memberName: string) {
  const appointmentDate = new Date(appointment.datetime);
  const reminderDate = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before

  if (reminderDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Appointment Reminder',
        body: `${memberName} has "${appointment.title}" tomorrow${appointment.doctor ? ` with ${appointment.doctor}` : ''}.`,
        data: { appointmentId: appointment.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
    });
  }
}

export default function AppointmentsScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params || {};
  const [appointments, setAppointments] = useState<(Appointment & { memberName?: string })[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formMemberId, setFormMemberId] = useState(memberId || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDoctor, setFormDoctor] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formReminder, setFormReminder] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: memberName ? `Appointments · ${memberName}` : 'Appointments',
    });
    fetchMembers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [memberId])
  );

  async function fetchMembers() {
    const { data } = await supabase.from('family_members').select('*').order('full_name');
    setMembers(data || []);
    if (!formMemberId && data && data.length > 0) setFormMemberId(data[0].id);
  }

  async function fetchAppointments() {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*, family_members(full_name)')
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true });

      if (memberId) query = query.eq('member_id', memberId);

      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((a: any) => ({
          ...a,
          memberName: a.family_members?.full_name,
        }));
        setAppointments(mapped);
      }
    } finally {
      setLoading(false);
    }
  }

  function groupByMonth(appts: typeof appointments): Section[] {
    const groups: Record<string, typeof appointments> = {};
    for (const a of appts) {
      const { monthYear } = formatDateTime(a.datetime);
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(a);
    }
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }

  function resetForm() {
    setFormMemberId(memberId || (members[0]?.id ?? ''));
    setFormTitle('');
    setFormDate('');
    setFormTime('');
    setFormDoctor('');
    setFormLocation('');
    setFormNotes('');
    setFormReminder(true);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formDate.trim() || !formMemberId) {
      Alert.alert('Missing Info', 'Please fill in the member, title, and date.');
      return;
    }

    setSaving(true);
    try {
      const datetimeStr = formTime
        ? `${formDate}T${formTime}:00`
        : `${formDate}T09:00:00`;

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          member_id: formMemberId,
          title: formTitle.trim(),
          datetime: new Date(datetimeStr).toISOString(),
          doctor: formDoctor || null,
          location: formLocation || null,
          notes: formNotes || null,
          reminder_set: formReminder,
        })
        .select()
        .single();

      if (error) throw error;

      if (formReminder && data) {
        const selectedMember = members.find((m) => m.id === formMemberId);
        await scheduleReminder(data, selectedMember?.full_name || 'Your family member');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Appointment', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('appointments').delete().eq('id', id);
          fetchAppointments();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  const sections = groupByMonth(appointments);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const { date, time } = formatDateTime(item.datetime);
          return (
            <TouchableOpacity
              style={styles.apptCard}
              onLongPress={() => handleDelete(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.apptDateBlock}>
                <Text style={styles.apptDateNum}>
                  {new Date(item.datetime).getDate()}
                </Text>
                <Text style={styles.apptDateMon}>
                  {new Date(item.datetime).toLocaleString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.apptContent}>
                <Text style={styles.apptTitle}>{item.title}</Text>
                {item.memberName && !memberId && (
                  <Text style={styles.apptMember}>{item.memberName}</Text>
                )}
                <Text style={styles.apptTime}>🕐 {time}</Text>
                {item.doctor && <Text style={styles.apptDetail}>👨‍⚕️ {item.doctor}</Text>}
                {item.location && <Text style={styles.apptDetail}>📍 {item.location}</Text>}
                {item.reminder_set && <Text style={styles.reminderBadge}>🔔 Reminder set</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
            <Text style={styles.emptyDesc}>
              Stay on top of your family's health by tracking doctor visits, checkups, and specialist appointments.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add First Appointment</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      {appointments.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Appointment Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Appointment</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#00B4A6" /> : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.formLabel}>Family Member *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberPicker}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, formMemberId === m.id && styles.memberChipSelected]}
                  onPress={() => setFormMemberId(m.id)}
                >
                  <Text style={[styles.memberChipText, formMemberId === m.id && styles.memberChipTextSelected]}>
                    {m.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>Title *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Annual Physical" placeholderTextColor="#9CA3AF" value={formTitle} onChangeText={setFormTitle} />

            <Text style={styles.formLabel}>Date * (YYYY-MM-DD)</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 2026-03-15" placeholderTextColor="#9CA3AF" value={formDate} onChangeText={setFormDate} keyboardType="numbers-and-punctuation" />

            <Text style={styles.formLabel}>Time (HH:MM)</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 14:30 (2:30 PM)" placeholderTextColor="#9CA3AF" value={formTime} onChangeText={setFormTime} keyboardType="numbers-and-punctuation" />

            <Text style={styles.formLabel}>Doctor</Text>
            <TextInput style={styles.formInput} placeholder="Doctor name" placeholderTextColor="#9CA3AF" value={formDoctor} onChangeText={setFormDoctor} />

            <Text style={styles.formLabel}>Location</Text>
            <TextInput style={styles.formInput} placeholder="Clinic/Hospital name or address" placeholderTextColor="#9CA3AF" value={formLocation} onChangeText={setFormLocation} />

            <Text style={styles.formLabel}>Notes</Text>
            <TextInput style={[styles.formInput, styles.formTextarea]} placeholder="Additional notes..." placeholderTextColor="#9CA3AF" value={formNotes} onChangeText={setFormNotes} multiline numberOfLines={3} textAlignVertical="top" />

            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.formLabel}>Set Reminder</Text>
                <Text style={styles.reminderSub}>Get notified 1 day before</Text>
              </View>
              <Switch
                value={formReminder}
                onValueChange={setFormReminder}
                trackColor={{ false: '#E5E7EB', true: '#00B4A6' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  emptyContainer: { flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FAFAF8' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  apptDateBlock: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  apptDateNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 22 },
  apptDateMon: { color: '#00B4A6', fontSize: 11, fontWeight: '600' },
  apptContent: { flex: 1 },
  apptTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  apptMember: { fontSize: 12, color: '#00B4A6', fontWeight: '600', marginBottom: 3 },
  apptTime: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  apptDetail: { fontSize: 13, color: '#6B7280' },
  reminderBadge: { fontSize: 11, color: '#7C3AED', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00B4A6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1B2A4A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyButton: { backgroundColor: '#00B4A6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, backgroundColor: '#FAFAF8' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCancel: { color: '#6B7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4A' },
  modalSave: { color: '#00B4A6', fontSize: 16, fontWeight: '700' },
  modalScroll: { padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  formTextarea: { height: 80 },
  memberPicker: { marginBottom: 4 },
  memberChip: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  memberChipSelected: { borderColor: '#00B4A6', backgroundColor: '#F0FDF4' },
  memberChipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  memberChipTextSelected: { color: '#00B4A6', fontWeight: '700' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  reminderSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
