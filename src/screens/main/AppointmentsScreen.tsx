import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { Appointment, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
  route: RouteProp<RootStackParamList, 'Appointments'>;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

function AppointmentCard({ appt, onDelete }: { appt: Appointment; onDelete: () => void }) {
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
      </View>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

function AddForm({
  memberId,
  onSave,
  onCancel,
}: {
  memberId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !datetime.trim()) {
      Alert.alert('Required', 'Please enter a title and date/time.');
      return;
    }
    setSaving(true);
    try {
      const dt = new Date(datetime);
      if (isNaN(dt.getTime())) throw new Error('Invalid date format. Use YYYY-MM-DD HH:MM');
      const { data, error } = await supabase.from('appointments').insert({
        member_id: memberId,
        title: title.trim(),
        datetime: dt.toISOString(),
        doctor: doctor.trim() || null,
        location: location.trim() || null,
        reminder_set: true,
      }).select().single();
      if (error) throw error;
      // Schedule local notification 24h before
      try {
        const notifTime = new Date(dt.getTime() - 24 * 60 * 60 * 1000);
        if (notifTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Appointment Tomorrow',
              body: `${title}${doctor ? ` with ${doctor}` : ''}`,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifTime },
          });
        }
      } catch {}
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={formStyles.container}>
      <View style={formStyles.header}>
        <Text style={formStyles.title}>New Appointment</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      {[
        { label: 'Title *', value: title, set: setTitle, placeholder: 'e.g. Annual checkup', keyboard: 'default' as const },
        { label: 'Date & Time *', value: datetime, set: setDatetime, placeholder: 'YYYY-MM-DD HH:MM', keyboard: 'default' as const },
        { label: 'Doctor', value: doctor, set: setDoctor, placeholder: 'Dr. Name', keyboard: 'default' as const },
        { label: 'Location', value: location, set: setLocation, placeholder: 'Clinic or address', keyboard: 'default' as const },
      ].map((f, i) => (
        <View key={i} style={formStyles.field}>
          <Text style={formStyles.label}>{f.label}</Text>
          <TextInput
            style={formStyles.input}
            value={f.value}
            onChangeText={f.set}
            placeholder={f.placeholder}
            placeholderTextColor={COLORS.textTertiary}
            keyboardType={f.keyboard}
          />
        </View>
      ))}
      <TouchableOpacity style={[formStyles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color={COLORS.textInverse} /> : <Text style={formStyles.saveBtnText}>Add Appointment</Text>}
      </TouchableOpacity>
    </View>
  );
}

const formStyles = StyleSheet.create({
  container: { ...CARD, padding: SPACING.base, marginHorizontal: SPACING.xl, marginBottom: SPACING.base, gap: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...FONTS.h4, color: COLORS.textPrimary },
  field: { gap: SPACING.xs },
  label: { ...FONTS.label, color: COLORS.textSecondary, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
});

export default function AppointmentsScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params ?? {};
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: memberName ? `${memberName}'s Appointments` : 'Appointments',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [memberId])
  );

  async function fetchAppointments() {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('datetime', { ascending: true });
      if (memberId) query = query.eq('member_id', memberId);
      const { data } = await query;
      setAppointments(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAppointment(id: string) {
    Alert.alert('Remove Appointment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await supabase.from('appointments').delete().eq('id', id);
          fetchAppointments();
        },
      },
    ]);
  }

  const upcoming = appointments.filter((a) => new Date(a.datetime) >= new Date());
  const past = appointments.filter((a) => new Date(a.datetime) < new Date());

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showForm && memberId ? (
          <AddForm
            memberId={memberId}
            onSave={() => { setShowForm(false); fetchAppointments(); }}
            onCancel={() => setShowForm(false)}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
        ) : upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyDesc}>Add upcoming appointments and we'll remind you 24 hours before.</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Upcoming</Text>
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onDelete={() => deleteAppointment(a.id)} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Past</Text>
                {past.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onDelete={() => deleteAppointment(a.id)} />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {memberId && !showForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  dateMonth: { ...FONTS.label, color: COLORS.primary, fontSize: 10 },
  dateDay: { ...FONTS.h3, color: COLORS.primary, fontWeight: '700' },
  apptInfo: { flex: 1, gap: 4 },
  apptTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  apptMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptMetaText: { ...FONTS.caption, color: COLORS.textSecondary },
  deleteBtn: { padding: 4, marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.xxxl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
