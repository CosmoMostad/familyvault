import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
  route: RouteProp<RootStackParamList, 'Appointments'>;
};

interface AssignedEvent {
  assignee_row_id: string;
  event_id: string;
  title: string;
  date_time: string;
  location?: string | null;
  notes?: string | null;
  calendar_id: string;
  calendar_title: string;
  calendar_color: string;
  other_assignees: string[];
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

function EventCard({ event, onDelete }: { event: AssignedEvent; onDelete: () => void }) {
  const { month, day, time } = formatDate(event.date_time);
  return (
    <View style={styles.card}>
      <View style={[styles.dateBlock, { backgroundColor: `${event.calendar_color}18` }]}>
        <Text style={[styles.dateMonth, { color: event.calendar_color }]}>{month}</Text>
        <Text style={[styles.dateDay, { color: event.calendar_color }]}>{day}</Text>
      </View>
      <View style={styles.apptInfo}>
        <Text style={styles.calLabel}>{event.calendar_title}</Text>
        <Text style={styles.apptTitle}>{event.title}</Text>
        <View style={styles.apptMeta}>
          <Ionicons name="time-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.apptMetaText}>{time}</Text>
        </View>
        {event.location ? (
          <View style={styles.apptMeta}>
            <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.apptMetaText}>{event.location}</Text>
          </View>
        ) : null}
        {event.other_assignees.length > 0 && (
          <View style={styles.apptMeta}>
            <Ionicons name="people-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.apptMetaText}>{event.other_assignees.join(', ')}</Text>
          </View>
        )}
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

export default function AppointmentsScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params ?? {};
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    navigation.setOptions({
      title: memberName ? `${memberName}'s Appointments` : 'Appointments',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
    });
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [memberId]));

  async function fetchEvents() {
    if (!memberId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch all calendar events this member is assigned to
      const { data: assigneeRows, error } = await supabase
        .from('event_assignees')
        .select(`
          id,
          family_member_id,
          calendar_events!inner(
            id,
            title,
            date_time,
            location,
            notes,
            calendar_id,
            family_calendars(title, color)
          )
        `)
        .eq('family_member_id', memberId);

      if (error) throw error;

      const rows = assigneeRows ?? [];

      // Fetch all other assignees for each event (to show "also with ...")
      const eventIds = [...new Set(rows.map((r: any) => r.calendar_events?.id).filter(Boolean))];
      let allAssigneesMap: Record<string, string[]> = {};
      if (eventIds.length > 0) {
        const { data: allAssignees } = await supabase
          .from('event_assignees')
          .select('event_id, family_member_id, family_members!inner(full_name)')
          .in('event_id', eventIds)
          .neq('family_member_id', memberId);
        (allAssignees ?? []).forEach((a: any) => {
          if (!allAssigneesMap[a.event_id]) allAssigneesMap[a.event_id] = [];
          if (a.family_members?.full_name) {
            allAssigneesMap[a.event_id].push(a.family_members.full_name);
          }
        });
      }

      const mapped: AssignedEvent[] = rows
        .filter((r: any) => r.calendar_events)
        .map((r: any) => {
          const ce = r.calendar_events;
          const cal = Array.isArray(ce.family_calendars) ? ce.family_calendars[0] : ce.family_calendars;
          return {
            assignee_row_id: r.id,
            event_id: ce.id,
            title: ce.title,
            date_time: ce.date_time,
            location: ce.location,
            notes: ce.notes,
            calendar_id: ce.calendar_id,
            calendar_title: cal?.title ?? 'Calendar',
            calendar_color: cal?.color ?? COLORS.primary,
            other_assignees: allAssigneesMap[ce.id] ?? [],
          };
        })
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

      setEvents(mapped);
    } catch (e: any) {
      Alert.alert('Error loading appointments', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeAssignment(event: AssignedEvent) {
    Alert.alert(
      'Remove from Appointment',
      `Remove ${memberName} from "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('event_assignees').delete().eq('id', event.assignee_row_id);
            fetchEvents();
          },
        },
      ]
    );
  }

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date_time) >= now);
  const past = events.filter(e => new Date(e.date_time) < now).reverse();

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
              Appointments assigned to {memberName} from any calendar will appear here.
            </Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Upcoming</Text>
                {upcoming.map(e => (
                  <EventCard key={e.assignee_row_id} event={e} onDelete={() => removeAssignment(e)} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Past</Text>
                {past.map(e => (
                  <EventCard key={e.assignee_row_id} event={e} onDelete={() => removeAssignment(e)} />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingTop: SPACING.base },
  sectionLabel: {
    ...FONTS.label, color: COLORS.textTertiary, textTransform: 'uppercase',
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.sm, marginTop: SPACING.base,
  },
  card: {
    ...CARD, flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: SPACING.base, paddingHorizontal: SPACING.base,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, gap: SPACING.md,
  },
  dateBlock: {
    alignItems: 'center', minWidth: 44, borderRadius: 10,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
  },
  dateMonth: { ...FONTS.label, fontSize: 10 },
  dateDay: { ...FONTS.h3, fontWeight: '700' },
  apptInfo: { flex: 1, gap: 4 },
  calLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.5 },
  apptTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  apptMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptMetaText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1 },
  deleteBtn: { padding: 4, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xxxl },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
});
