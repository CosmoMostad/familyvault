import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, SafeAreaView, TextInput, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarData {
  id: string;
  title: string;
  color: string;
  owner_id: string;
  is_owner: boolean;
}

interface CalendarEvent {
  id: string;
  calendar_id: string;
  created_by: string;
  title: string;
  date_time: string;
  location?: string | null;
  notes?: string | null;
  attendees?: string | null;
}

interface PendingInvite {
  id: string;
  calendar_id: string;
  invited_by: string;
  calendar_title?: string;
  inviter_name?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateHeader(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function toDateKey(dateStr: string) {
  return new Date(dateStr).toISOString().split('T')[0];
}
function groupByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach(e => {
    const k = toDateKey(e.date_time);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });
  return groups;
}

const CALENDAR_COLORS = [
  '#2D6A4F', '#40916C', '#1B4332', '#C9614A', '#E07A5F',
  '#3D405B', '#81B29A', '#F2CC8F', '#118AB2', '#06D6A0',
];

// ─────────────────────────────────────────────────────────────────────────────
// Add Event Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddEventModal({ visible, calendars, onSave, onClose }: {
  visible: boolean;
  calendars: CalendarData[];
  onSave: () => void;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [attendees, setAttendees] = useState('');
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  const selectedCalendar = calendars.find(c => c.id === calendarId) ?? calendars[0];

  async function save() {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (!calendarId) { Alert.alert('Required', 'Please select a calendar.'); return; }
    setSaving(true);
    try {
      const dt = new Date(`${date}T${time}:00`);
      if (isNaN(dt.getTime())) throw new Error('Invalid date/time format.');
      const { error } = await supabase.from('calendar_events').insert({
        calendar_id: calendarId,
        created_by: session?.user.id,
        title: title.trim(),
        date_time: dt.toISOString(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        attendees: attendees.trim() || null,
      });
      if (error) throw error;
      setTitle(''); setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00'); setLocation(''); setNotes(''); setAttendees('');
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
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
          {[
            { label: 'Title *', value: title, set: setTitle, placeholder: 'e.g. Annual checkup' },
            { label: 'Date (YYYY-MM-DD)', value: date, set: setDate, placeholder: '2026-02-24' },
            { label: 'Time (HH:MM)', value: time, set: setTime, placeholder: '09:00' },
            { label: 'Location', value: location, set: setLocation, placeholder: 'Clinic or address' },
            { label: 'Attendees', value: attendees, set: setAttendees, placeholder: 'Who is this appointment for?' },
            { label: 'Notes', value: notes, set: setNotes, placeholder: 'Any extra details' },
          ].map((f) => (
            <View key={f.label} style={modal.field}>
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

          {calendars.length > 1 && (
            <View style={modal.field}>
              <Text style={modal.label}>Calendar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                  {calendars.map(cal => (
                    <TouchableOpacity
                      key={cal.id}
                      style={[modal.calChip, calendarId === cal.id && { borderColor: cal.color, backgroundColor: `${cal.color}15` }]}
                      onPress={() => setCalendarId(cal.id)}
                    >
                      <View style={[modal.calDot, { backgroundColor: cal.color }]} />
                      <Text style={[modal.calChipText, calendarId === cal.id && { color: cal.color, fontWeight: '600' }]}>{cal.title}</Text>
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
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 60, gap: SPACING.lg },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 48,
    fontSize: 15, color: COLORS.textPrimary,
  },
  calChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calChipText: { fontSize: 13, color: COLORS.textSecondary },
});

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Setup (no calendars yet)
// ─────────────────────────────────────────────────────────────────────────────

function CalendarSetup({ pendingInvites, onCreated, onJoined }: {
  pendingInvites: PendingInvite[];
  onCreated: () => void;
  onJoined: () => void;
}) {
  const { session } = useAuth();
  const [creating, setCreating] = useState(false);
  const [calName, setCalName] = useState('');
  const [calColor, setCalColor] = useState(COLORS.primary);
  const [savingCreate, setSavingCreate] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!calName.trim()) { Alert.alert('Required', 'Please enter a calendar name.'); return; }
    setSavingCreate(true);
    try {
      const userId = session?.user.id;
      const { error } = await supabase.from('family_calendars').insert({
        title: calName.trim(),
        owner_id: userId,
        color: calColor,
      });
      if (error) throw error;
      onCreated();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSavingCreate(false); }
  }

  async function acceptInvite(invite: PendingInvite) {
    setAcceptingId(invite.id);
    try {
      const userId = session?.user.id;
      const { error: memberError } = await supabase.from('calendar_members').insert({
        calendar_id: invite.calendar_id,
        user_id: userId,
        role: 'member',
      });
      if (memberError) throw memberError;
      await supabase.from('calendar_invitations').update({ status: 'accepted' }).eq('id', invite.id);
      onJoined();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setAcceptingId(null); }
  }

  async function declineInvite(inviteId: string) {
    await supabase.from('calendar_invitations').update({ status: 'declined' }).eq('id', inviteId);
    onJoined();
  }

  return (
    <ScrollView contentContainerStyle={setup.scroll}>
      {/* Hero */}
      <View style={setup.hero}>
        <View style={setup.heroIcon}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={setup.heroTitle}>Family Health Calendar</Text>
        <Text style={setup.heroDesc}>
          Create a calendar to track family appointments, or join one that's been shared with you.
        </Text>
      </View>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <View style={setup.section}>
          <Text style={setup.sectionLabel}>PENDING INVITATIONS</Text>
          {pendingInvites.map(inv => (
            <View key={inv.id} style={setup.inviteCard}>
              <View style={setup.inviteInfo}>
                <Ionicons name="person-add-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={setup.inviteTitle}>{inv.calendar_title ?? 'Family Calendar'}</Text>
                  <Text style={setup.inviteFrom}>from {inv.inviter_name ?? 'Someone'}</Text>
                </View>
              </View>
              <View style={setup.inviteActions}>
                <TouchableOpacity
                  style={setup.acceptBtn}
                  onPress={() => acceptInvite(inv)}
                  disabled={acceptingId === inv.id}
                >
                  {acceptingId === inv.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={setup.acceptBtnText}>Join</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={setup.declineBtn} onPress={() => declineInvite(inv.id)}>
                  <Text style={setup.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Create */}
      <View style={setup.section}>
        <Text style={setup.sectionLabel}>CREATE A CALENDAR</Text>
        <View style={setup.createCard}>
          <TextInput
            style={setup.nameInput}
            placeholder="Calendar name (e.g. Our Family)"
            placeholderTextColor={COLORS.textTertiary}
            value={calName}
            onChangeText={setCalName}
          />
          <Text style={[setup.sectionLabel, { marginBottom: SPACING.sm }]}>COLOR</Text>
          <View style={setup.colorRow}>
            {CALENDAR_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[setup.colorDot, { backgroundColor: c }, calColor === c && setup.colorDotActive]}
                onPress={() => setCalColor(c)}
              >
                {calColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[setup.createBtn, savingCreate && { opacity: 0.65 }]} onPress={handleCreate} disabled={savingCreate} activeOpacity={0.85}>
            {savingCreate
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={setup.createBtnText}>Create Calendar</Text>
                </>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const setup = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 80, paddingTop: SPACING.lg },
  hero: { alignItems: 'center', marginBottom: SPACING.xxl, paddingTop: SPACING.xl },
  heroIcon: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  heroTitle: { ...FONTS.h2, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  heroDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
  section: { marginBottom: SPACING.xxl },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.md },
  inviteCard: {
    ...CARD, padding: SPACING.base, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: `${COLORS.primary}30`,
  },
  inviteInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  inviteTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  inviteFrom: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  inviteActions: { flexDirection: 'row', gap: SPACING.sm },
  acceptBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    alignItems: 'center', justifyContent: 'center', minWidth: 64,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  declineBtn: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  declineBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  createCard: { ...CARD, padding: SPACING.base },
  nameInput: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 50,
    fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.lg,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Settings Modal
// ─────────────────────────────────────────────────────────────────────────────

function CalendarSettingsModal({ visible, calendars, onClose, onRefresh }: {
  visible: boolean;
  calendars: CalendarData[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { session } = useAuth();
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, { user_id: string; full_name: string; role: string }[]>>({});

  React.useEffect(() => {
    if (visible) loadAllMembers();
  }, [visible, calendars]);

  async function loadAllMembers() {
    for (const cal of calendars) {
      const { data } = await supabase
        .from('calendar_members')
        .select('user_id, role')
        .eq('calendar_id', cal.id);
      const memberRows = data || [];
      // Fetch profile names
      const enriched = await Promise.all(
        memberRows.map(async m => {
          const { data: p } = await supabase.from('profiles').select('full_name, email').eq('id', m.user_id).single();
          return { ...m, full_name: p?.full_name || p?.email || 'Member' };
        })
      );
      setMembers(prev => ({ ...prev, [cal.id]: enriched }));
    }
  }

  async function sendInvite(calendarId: string) {
    const email = inviteEmail[calendarId]?.trim();
    if (!email) return;
    setSendingInvite(calendarId);
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      await supabase.from('calendar_invitations').insert({
        calendar_id: calendarId,
        invited_by: session?.user.id,
        invited_email: email,
        invited_user_id: profile?.id ?? null,
        status: 'pending',
      });
      Alert.alert('Invited', `Invitation sent to ${email}`);
      setInviteEmail(prev => ({ ...prev, [calendarId]: '' }));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSendingInvite(null); }
  }

  async function removeMember(calendarId: string, userId: string) {
    await supabase.from('calendar_members').delete().eq('calendar_id', calendarId).eq('user_id', userId);
    loadAllMembers();
  }

  async function deleteCalendar(calendarId: string, title: string) {
    Alert.alert('Delete Calendar', `Delete "${title}" and all its events? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('family_calendars').delete().eq('id', calendarId);
          onRefresh(); onClose();
        },
      },
    ]);
  }

  async function leaveCalendar(calendarId: string) {
    await supabase.from('calendar_members').delete().eq('calendar_id', calendarId).eq('user_id', session?.user.id);
    onRefresh(); onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={csm.container}>
        <View style={csm.header}>
          <Text style={csm.title}>Calendar Settings</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={csm.scroll} showsVerticalScrollIndicator={false}>
          {calendars.map(cal => (
            <View key={cal.id} style={csm.calCard}>
              <View style={csm.calHeader}>
                <View style={[csm.calDot, { backgroundColor: cal.color }]} />
                <Text style={csm.calTitle}>{cal.title}</Text>
                <View style={[csm.roleBadge, !cal.is_owner && csm.roleBadgeMember]}>
                  <Text style={[csm.roleText, !cal.is_owner && csm.roleTextMember]}>
                    {cal.is_owner ? 'Owner' : 'Member'}
                  </Text>
                </View>
              </View>

              {/* Members list */}
              {(members[cal.id] ?? []).length > 0 && (
                <View style={csm.membersSection}>
                  <Text style={csm.memberLabel}>MEMBERS</Text>
                  {(members[cal.id] ?? []).map(m => (
                    <View key={m.user_id} style={csm.memberRow}>
                      <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={csm.memberName}>{m.full_name}</Text>
                      {cal.is_owner && m.role !== 'owner' && (
                        <TouchableOpacity onPress={() => removeMember(cal.id, m.user_id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle-outline" size={18} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Invite (owner only) */}
              {cal.is_owner && (
                <View style={csm.inviteRow}>
                  <TextInput
                    style={csm.inviteInput}
                    placeholder="Invite by email"
                    placeholderTextColor={COLORS.textTertiary}
                    value={inviteEmail[cal.id] ?? ''}
                    onChangeText={v => setInviteEmail(prev => ({ ...prev, [cal.id]: v }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={csm.inviteBtn}
                    onPress={() => sendInvite(cal.id)}
                    disabled={sendingInvite === cal.id}
                  >
                    {sendingInvite === cal.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="paper-plane-outline" size={18} color="#fff" />}
                  </TouchableOpacity>
                </View>
              )}

              {/* Actions */}
              <View style={csm.actions}>
                {cal.is_owner ? (
                  <TouchableOpacity style={csm.deleteBtn} onPress={() => deleteCalendar(cal.id, cal.title)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.rose} />
                    <Text style={csm.deleteBtnText}>Delete Calendar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={csm.leaveBtn} onPress={() => leaveCalendar(cal.id)}>
                    <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={csm.leaveBtnText}>Leave Calendar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const csm = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 80 },
  calCard: { ...CARD, padding: SPACING.base, marginBottom: SPACING.base },
  calHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.base },
  calDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  calTitle: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1 },
  roleBadge: {
    backgroundColor: COLORS.primaryMuted, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  roleBadgeMember: { backgroundColor: COLORS.surfaceAlt },
  roleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  roleTextMember: { color: COLORS.textSecondary },
  membersSection: { marginBottom: SPACING.base },
  memberLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.6, marginBottom: 8 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  memberName: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  inviteRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  inviteInput: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 44, fontSize: 14, color: COLORS.textPrimary,
  },
  inviteBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm },
  deleteBtnText: { fontSize: 13, color: COLORS.rose, fontWeight: '600' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm },
  leaveBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// CalendarScreen (main)
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { session } = useAuth();
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, [session]));

  async function loadAll() {
    if (!session?.user) return;
    setLoading(true);
    try {
      const userId = session.user.id;

      // Owned calendars
      const { data: owned } = await supabase
        .from('family_calendars')
        .select('id, title, color, owner_id')
        .eq('owner_id', userId);

      // Member calendars
      const { data: memberCals } = await supabase
        .from('calendar_members')
        .select('calendar_id, family_calendars(id, title, color, owner_id)')
        .eq('user_id', userId);

      const allCalendars: CalendarData[] = [
        ...(owned ?? []).map(c => ({ ...c, is_owner: true })),
        ...(memberCals ?? []).filter(m => m.family_calendars).map(m => ({
          ...(m.family_calendars as any),
          is_owner: false,
        })),
      ];
      setCalendars(allCalendars);

      // Pending invites
      const { data: invites } = await supabase
        .from('calendar_invitations')
        .select('id, calendar_id, invited_by')
        .or(`invited_user_id.eq.${userId},invited_email.eq.${session.user.email ?? ''}`)
        .eq('status', 'pending');

      const enrichedInvites: PendingInvite[] = await Promise.all(
        (invites ?? []).map(async inv => {
          const [{ data: cal }, { data: inviter }] = await Promise.all([
            supabase.from('family_calendars').select('title').eq('id', inv.calendar_id).single(),
            supabase.from('profiles').select('full_name, email').eq('id', inv.invited_by).single(),
          ]);
          return {
            ...inv,
            calendar_title: cal?.title,
            inviter_name: inviter?.full_name || inviter?.email,
          };
        })
      );
      setPendingInvites(enrichedInvites);

      // Load events for all calendars
      if (allCalendars.length > 0) {
        const calIds = allCalendars.map(c => c.id);
        const { data: evts } = await supabase
          .from('calendar_events')
          .select('*')
          .in('calendar_id', calIds)
          .order('date_time', { ascending: true });
        setEvents(evts ?? []);
      } else {
        setEvents([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function deleteEvent(id: string) {
    Alert.alert('Remove', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await supabase.from('calendar_events').delete().eq('id', id); loadAll(); } },
    ]);
  }

  const hasCalendars = calendars.length > 0 || pendingInvites.length > 0;

  const filteredEvents = selectedCalendarId === 'all'
    ? events
    : events.filter(e => e.calendar_id === selectedCalendarId);

  const now = new Date();
  const upcoming = filteredEvents.filter(e => new Date(e.date_time) >= now);
  const past = filteredEvents.filter(e => new Date(e.date_time) < now).reverse();
  const upcomingGroups = groupByDate(upcoming);
  const upcomingDates = Object.keys(upcomingGroups).sort();

  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);
  const headerColor = selectedCalendar?.color ?? COLORS.primary;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerActions}>
            {hasCalendars && (
              <>
                <TouchableOpacity style={styles.iconBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}>
                  <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)}>
                  <Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Calendar switcher (if multiple) */}
        {calendars.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calSwitcher}
          >
            <TouchableOpacity
              style={[styles.calChip, selectedCalendarId === 'all' && styles.calChipActive]}
              onPress={() => setSelectedCalendarId('all')}
            >
              <Text style={[styles.calChipText, selectedCalendarId === 'all' && styles.calChipTextActive]}>All</Text>
            </TouchableOpacity>
            {calendars.map(cal => (
              <TouchableOpacity
                key={cal.id}
                style={[styles.calChip, selectedCalendarId === cal.id && { borderColor: cal.color, backgroundColor: `${cal.color}15` }]}
                onPress={() => setSelectedCalendarId(cal.id)}
              >
                <View style={[styles.calDot, { backgroundColor: cal.color }]} />
                <Text style={[styles.calChipText, selectedCalendarId === cal.id && { color: cal.color, fontWeight: '600' }]}>{cal.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Single calendar indicator */}
        {calendars.length === 1 && (
          <View style={styles.singleCalBar}>
            <View style={[styles.calDot, { backgroundColor: calendars[0].color }]} />
            <Text style={styles.singleCalText}>{calendars[0].title}</Text>
            <Text style={styles.singleCalRole}>{calendars[0].is_owner ? 'Owner' : 'Member'}</Text>
          </View>
        )}
      </SafeAreaView>

      {!hasCalendars ? (
        <CalendarSetup pendingInvites={pendingInvites} onCreated={loadAll} onJoined={loadAll} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.primary} />}
        >
          {upcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <TouchableOpacity style={styles.addLink} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.addLinkText}>Add your first appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingDates.map(dateKey => (
              <View key={dateKey}>
                <Text style={styles.dateHeader}>{formatDateHeader(dateKey)}</Text>
                {upcomingGroups[dateKey].map(evt => {
                  const cal = calendars.find(c => c.id === evt.calendar_id);
                  return (
                    <TouchableOpacity
                      key={evt.id}
                      style={styles.eventCard}
                      activeOpacity={0.8}
                      onLongPress={() => deleteEvent(evt.id)}
                    >
                      <View style={[styles.eventColorBar, { backgroundColor: cal?.color ?? COLORS.primary }]} />
                      <View style={styles.eventBody}>
                        {calendars.length > 1 && cal && (
                          <Text style={styles.eventCalName}>{cal.title}</Text>
                        )}
                        <Text style={styles.eventTitle}>{evt.title}</Text>
                        <View style={styles.eventMeta}>
                          <Text style={styles.eventTime}>{formatTime(evt.date_time)}</Text>
                          {evt.location ? (
                            <><Text style={styles.metaDot}>·</Text><Text style={styles.eventMetaText}>{evt.location}</Text></>
                          ) : null}
                        </View>
                        {evt.attendees ? (
                          <View style={styles.eventAttendeesRow}>
                            <Ionicons name="person-outline" size={12} color={COLORS.textTertiary} />
                            <Text style={styles.eventMetaText}>{evt.attendees}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}

          {past.length > 0 && (
            <View style={styles.pastSection}>
              <Text style={styles.pastLabel}>PAST APPOINTMENTS</Text>
              {past.slice(0, 5).map(evt => (
                <View key={evt.id} style={[styles.eventCard, styles.eventCardPast]}>
                  <View style={[styles.eventColorBar, { backgroundColor: COLORS.border }]} />
                  <View style={styles.eventBody}>
                    <Text style={[styles.eventTitle, { color: COLORS.textSecondary }]}>{evt.title}</Text>
                    <Text style={styles.eventTime}>{formatDateHeader(toDateKey(evt.date_time))} · {formatTime(evt.date_time)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEventModal
          visible={showAddModal}
          calendars={calendars}
          onSave={() => { setShowAddModal(false); loadAll(); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      <CalendarSettingsModal
        visible={showSettings}
        calendars={calendars}
        onClose={() => setShowSettings(false)}
        onRefresh={loadAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.base,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  headerActions: { flexDirection: 'row', gap: SPACING.xs },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  calSwitcher: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.base, gap: SPACING.sm, flexDirection: 'row' },
  calChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.base, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt,
  },
  calChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  calChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  calChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  singleCalBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.base,
  },
  singleCalText: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600', flex: 1 },
  singleCalRole: { ...FONTS.caption, color: COLORS.textTertiary },
  listContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  dateHeader: { ...FONTS.h4, color: COLORS.textPrimary, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  eventCard: {
    ...CARD,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', marginBottom: SPACING.sm,
    paddingVertical: SPACING.md, paddingRight: SPACING.base,
  },
  eventCardPast: { opacity: 0.65 },
  eventColorBar: { width: 4, alignSelf: 'stretch', marginRight: SPACING.md, borderRadius: 2 },
  eventBody: { flex: 1, gap: 3 },
  eventCalName: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600' },
  eventTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventTime: { ...FONTS.caption, color: COLORS.textSecondary },
  metaDot: { ...FONTS.caption, color: COLORS.textTertiary },
  eventMetaText: { ...FONTS.caption, color: COLORS.textSecondary },
  eventAttendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { ...FONTS.h4, color: COLORS.textTertiary },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  pastSection: { marginTop: SPACING.xxl },
  pastLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.md },
});
