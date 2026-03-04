import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, SafeAreaView, TextInput, Modal, RefreshControl, Platform, Dimensions, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';
import { TimePickerWheel, to24Hour, formatTime12 } from '../../components/TimePickerWheel';

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
}

interface PendingInvite {
  id: string;
  calendar_id: string;
  invited_by: string;
  calendar_title?: string;
  inviter_name?: string;
}

interface FamilyMemberOption {
  id: string;
  full_name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateHeader(dateKey: string) {
  // dateKey is "YYYY-MM-DD" local — parse as local to avoid UTC midnight shifting the day
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function toDateKey(dateStr: string) {
  // Use local date components — toISOString() would give UTC date which is wrong in PST/EST
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
// SubAccountPickerModal
// Shown after creating or joining a calendar — pick which sub-accounts to add.
// ─────────────────────────────────────────────────────────────────────────────

function SubAccountPickerModal({ visible, calendarId, calendarTitle, onDone }: {
  visible: boolean;
  calendarId: string;
  calendarTitle: string;
  onDone: () => void;
}) {
  const { session } = useAuth();
  const [members, setMembers] = useState<FamilyMemberOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  React.useEffect(() => {
    if (visible && session?.user.id) load();
  }, [visible]);

  async function load() {
    setLoading(true);
    setSelected([]);
    const { data } = await supabase
      .from('family_members')
      .select('id, full_name')
      .eq('owner_id', session?.user.id)
      .order('is_self', { ascending: false })
      .order('full_name');
    setMembers(data ?? []);
    setLoading(false);
  }

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function confirm() {
    if (selected.length === 0) { onDone(); return; }
    setSaving(true);
    try {
      await supabase.from('calendar_participants').insert(
        selected.map(mid => ({
          calendar_id: calendarId,
          family_member_id: mid,
          user_id: session?.user.id,
        }))
      );
      onDone();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  }

  async function sendInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setSendingInvite(true);
    try {
      const { data: profileRows } = await supabase.rpc('find_user_by_email', { p_email: email });
      const profile = profileRows?.[0];
      const { data: myProfile } = await supabase
        .from('profiles').select('full_name, email').eq('id', session?.user.id).single();
      const inviterName = myProfile?.full_name || myProfile?.email || session?.user.email || 'Someone';
      await supabase.from('calendar_invitations').insert({
        calendar_id: calendarId,
        invited_by: session?.user.id,
        invited_email: email,
        invited_user_id: profile?.user_id ?? null,
        status: 'pending',
        calendar_title: calendarTitle,
        inviter_display_name: inviterName,
      });
      Alert.alert('Invited', `Invitation sent to ${email}`);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSendingInvite(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDone}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={sp.container}>
        <View style={sp.header}>
          <Text style={sp.title}>Add to {calendarTitle}</Text>
          <Text style={sp.subtitle}>Choose which of your accounts to add. They'll appear when creating appointments.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : members.length === 0 ? (
          <View style={sp.emptyWrap}>
            <Text style={sp.emptyText}>No accounts found. Add family members first.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={sp.list}>
            {members.map(m => {
              const on = selected.includes(m.id);
              return (
                <TouchableOpacity key={m.id} style={[sp.row, on && sp.rowSelected]} onPress={() => toggle(m.id)} activeOpacity={0.75}>
                  <Text style={[sp.rowName, on && sp.rowNameSelected]}>{m.full_name}</Text>
                  <View style={[sp.check, on && sp.checkSelected]}>
                    {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Invite a family member by email */}
        <View style={sp.inviteSection}>
          <Text style={sp.inviteLabel}>Invite a family member</Text>
          <View style={sp.inviteRow}>
            <TextInput
              style={sp.inviteInput}
              placeholder="their@email.com"
              placeholderTextColor={COLORS.textTertiary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[sp.inviteBtn, (!inviteEmail.trim() || sendingInvite) && { opacity: 0.45 }]}
              onPress={sendInvite}
              disabled={!inviteEmail.trim() || sendingInvite}
            >
              {sendingInvite
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={sp.inviteBtnText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={sp.footer}>
          <TouchableOpacity style={sp.skipBtn} onPress={onDone}>
            <Text style={sp.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sp.confirmBtn, saving && { opacity: 0.65 }]} onPress={confirm} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={sp.confirmText}>{selected.length > 0 ? `Add ${selected.length} Account${selected.length > 1 ? 's' : ''}` : 'Done'}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sp = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, lineHeight: 22 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  emptyText: { ...FONTS.body, color: COLORS.textTertiary, textAlign: 'center' },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 20, gap: SPACING.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...CARD, padding: SPACING.base,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  rowSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  rowName: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },
  rowNameSelected: { color: COLORS.primary, fontWeight: '600' },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  checkSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  footer: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  skipBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  confirmBtn: {
    flex: 2, height: 50, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { ...FONTS.body, color: '#fff', fontWeight: '700' },
  inviteSection: {
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inviteLabel: { ...FONTS.caption, color: COLORS.textSecondary, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  inviteInput: {
    flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.base,
    ...FONTS.body, color: COLORS.textPrimary,
  },
  inviteBtn: {
    height: 44, paddingHorizontal: SPACING.base, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  inviteBtnText: { ...FONTS.body, color: '#fff', fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// CalendarEmpty — shown when user has no calendars
// ─────────────────────────────────────────────────────────────────────────────

function CalendarEmpty({ pendingInvites, onCreatePress, onJoinPress }: {
  pendingInvites: PendingInvite[];
  onCreatePress: () => void;
  onJoinPress: () => void;
}) {
  return (
    <View style={ce.wrap}>
      <View style={ce.iconWrap}>
        <Ionicons name="calendar-outline" size={52} color={COLORS.primary} />
      </View>
      <Text style={ce.title}>Track Family Health Appointments</Text>
      <Text style={ce.desc}>
        Join or create a calendar to start tracking health appointments today.
      </Text>
      {pendingInvites.length > 0 && (
        <View style={ce.badge}>
          <Ionicons name="mail-outline" size={15} color={COLORS.primary} />
          <Text style={ce.badgeText}>{pendingInvites.length} pending invitation{pendingInvites.length > 1 ? 's' : ''}</Text>
        </View>
      )}
      <View style={ce.btnRow}>
        <TouchableOpacity style={ce.joinBtn} onPress={onJoinPress} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
          <Text style={ce.joinText}>Join a Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ce.createBtn} onPress={onCreatePress} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={ce.createText}>Create a Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ce = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingBottom: 60 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  desc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  badgeText: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  joinBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  joinText: { ...FONTS.body, color: COLORS.primary, fontWeight: '700' },
  createBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 52, borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  createText: { ...FONTS.body, color: '#fff', fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// CreateCalendarModal
// ─────────────────────────────────────────────────────────────────────────────

function CreateCalendarModal({ visible, onCreated, onClose }: {
  visible: boolean;
  onCreated: (calId: string, calTitle: string) => void;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [calName, setCalName] = useState('');
  const [calColor, setCalColor] = useState(COLORS.primary);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!calName.trim()) { Alert.alert('Required', 'Please enter a calendar name.'); return; }
    setSaving(true);
    try {
      const { data: newCal, error } = await supabase
        .from('family_calendars')
        .insert({ title: calName.trim(), owner_id: session?.user.id, color: calColor })
        .select().single();
      if (error) throw error;
      // Also add owner as a calendar_member row for consistent RLS access
      await supabase.from('calendar_members').insert({
        calendar_id: newCal.id,
        user_id: session?.user.id,
        role: 'owner',
      });
      setCalName('');
      setCalColor(COLORS.primary);
      onCreated(newCal.id, newCal.title);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={cc.container}>
        <View style={cc.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={cc.title}>New Calendar</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={cc.scroll} keyboardShouldPersistTaps="handled">
          <Text style={cc.label}>CALENDAR NAME</Text>
          <TextInput
            style={cc.input}
            placeholder="e.g. Our Family"
            placeholderTextColor={COLORS.textTertiary}
            value={calName}
            onChangeText={setCalName}
            autoFocus
          />
          <Text style={[cc.label, { marginTop: SPACING.xl }]}>COLOR</Text>
          <View style={cc.colorRow}>
            {CALENDAR_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[cc.colorDot, { backgroundColor: c }, calColor === c && cc.colorDotActive]}
                onPress={() => setCalColor(c)}
              >
                {calColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[cc.createBtn, saving && { opacity: 0.65 }]} onPress={handleCreate} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={cc.createBtnText}>Create Calendar</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const cc = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: 60 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.md },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 52,
    fontSize: 16, color: COLORS.textPrimary,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xxxl },
  colorDot: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// JoinCalendarModal — shows pending invites or "no invites" state
// ─────────────────────────────────────────────────────────────────────────────

function JoinCalendarModal({ visible, pendingInvites, userEmail, onJoined, onClose }: {
  visible: boolean;
  pendingInvites: PendingInvite[];
  userEmail: string;
  onJoined: (calId: string, calTitle: string, inviteId: string) => void;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function acceptInvite(invite: PendingInvite) {
    if (acceptingId) return; // prevent double-tap
    setAcceptingId(invite.id);
    try {
      // upsert so double-tap never throws a duplicate key error
      await supabase.from('calendar_members').upsert(
        { calendar_id: invite.calendar_id, user_id: session?.user.id, role: 'member' },
        { onConflict: 'calendar_id,user_id', ignoreDuplicates: true }
      );
      await supabase.from('calendar_invitations').update({ status: 'accepted' }).eq('id', invite.id);
      onJoined(invite.calendar_id, invite.calendar_title ?? 'Calendar', invite.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setAcceptingId(null); }
  }

  async function declineInvite(inviteId: string) {
    await supabase.from('calendar_invitations').update({ status: 'declined' }).eq('id', inviteId);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={jm.container}>
        <View style={jm.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={jm.title}>Join a Calendar</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={jm.scroll}>
          {pendingInvites.length === 0 ? (
            <View style={jm.empty}>
              <Ionicons name="mail-outline" size={48} color={COLORS.textTertiary} />
              <Text style={jm.emptyTitle}>No pending invitations</Text>
              <Text style={jm.emptyDesc}>
                Ask a family member to invite you to their calendar using your email:
              </Text>
              <View style={jm.emailBox}>
                <Text style={jm.emailText}>{userEmail}</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={jm.sectionLabel}>PENDING INVITATIONS</Text>
              {pendingInvites.map(inv => (
                <View key={inv.id} style={jm.inviteCard}>
                  <View style={jm.inviteInfo}>
                    <View style={jm.inviteIcon}>
                      <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={jm.inviteTitle}>{inv.calendar_title ?? 'Family Calendar'}</Text>
                      <Text style={jm.inviteFrom}>Invited by {inv.inviter_name ?? 'Someone'}</Text>
                    </View>
                  </View>
                  <View style={jm.inviteActions}>
                    <TouchableOpacity style={jm.declineBtn} onPress={() => declineInvite(inv.id)}>
                      <Text style={jm.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={jm.acceptBtn}
                      onPress={() => acceptInvite(inv)}
                      disabled={acceptingId === inv.id}
                    >
                      {acceptingId === inv.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={jm.acceptText}>Join</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const jm = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: 60 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.md },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center' },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
  emailBox: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  emailText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600', textAlign: 'center' },
  inviteCard: { ...CARD, padding: SPACING.base, marginBottom: SPACING.sm, borderWidth: 1, borderColor: `${COLORS.primary}30` },
  inviteInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  inviteIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  inviteTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  inviteFrom: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  inviteActions: { flexDirection: 'row', gap: SPACING.sm },
  declineBtn: {
    flex: 1, height: 42, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  declineText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  acceptBtn: {
    flex: 2, height: 42, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentDetailModal({ event, calendar, onClose, onDelete }: {
  event: CalendarEvent | null;
  calendar?: CalendarData;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { session } = useAuth();
  const [assignees, setAssignees] = useState<{ id: string; full_name: string }[]>([]);

  React.useEffect(() => {
    if (event) loadAssignees(event.id);
    else setAssignees([]);
  }, [event?.id]);

  async function loadAssignees(eventId: string) {
    const { data } = await supabase
      .from('event_assignees')
      .select('family_member_id, family_members(id, full_name)')
      .eq('event_id', eventId);
    setAssignees(
      (data ?? []).map((r: any) => r.family_members).filter(Boolean)
    );
  }

  if (!event) return null;

  const dt = new Date(event.date_time);
  const isOwner = event.created_by === session?.user.id;

  function confirmDelete() {
    Alert.alert('Remove Appointment', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { if (event) { onDelete(event.id); onClose(); } } },
    ]);
  }

  return (
    <Modal visible={!!event} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={adm.container}>
        <View style={adm.header}>
          <TouchableOpacity onPress={onClose} style={adm.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={adm.title} numberOfLines={1}>Appointment</Text>
          {isOwner ? (
            <TouchableOpacity onPress={confirmDelete} style={adm.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={COLORS.rose} />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}
        </View>

        <ScrollView contentContainerStyle={adm.scroll} showsVerticalScrollIndicator={false}>
          {/* Title + calendar color bar */}
          <View style={adm.titleRow}>
            {calendar && <View style={[adm.colorBar, { backgroundColor: calendar.color }]} />}
            <Text style={adm.eventTitle}>{event.title}</Text>
          </View>

          {/* Calendar name */}
          {calendar && (
            <View style={adm.row}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={adm.rowIcon} />
              <Text style={adm.rowText}>{calendar.title}</Text>
            </View>
          )}

          {/* Date & time */}
          <View style={adm.row}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} style={adm.rowIcon} />
            <View>
              <Text style={adm.rowText}>
                {dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Text style={adm.rowSub}>
                {dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* Location */}
          {event.location ? (
            <View style={adm.row}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} style={adm.rowIcon} />
              <Text style={adm.rowText}>{event.location}</Text>
            </View>
          ) : null}

          {/* Notes */}
          {event.notes ? (
            <View style={adm.row}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={adm.rowIcon} />
              <Text style={adm.rowText}>{event.notes}</Text>
            </View>
          ) : null}

          {/* Assignees */}
          {assignees.length > 0 && (
            <View style={adm.row}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} style={adm.rowIcon} />
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {assignees.map(a => (
                  <View key={a.id} style={adm.chip}>
                    <Text style={adm.chipText}>{a.full_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const adm = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: 60, gap: SPACING.lg },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    ...CARD, padding: SPACING.base,
  },
  colorBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  eventTitle: { ...FONTS.h2, color: COLORS.textPrimary, flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    ...CARD, padding: SPACING.base,
  },
  rowIcon: { marginTop: 2 },
  rowText: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  rowSub: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
  chip: {
    backgroundColor: COLORS.primaryMuted, borderRadius: 20,
    paddingHorizontal: SPACING.md, paddingVertical: 5,
  },
  chipText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Add Event Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddEventModal({ visible, calendars, defaultCalendarId, onSave, onClose }: {
  visible: boolean;
  calendars: CalendarData[];
  defaultCalendarId?: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [pickerDate, setPickerDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [pickerHour12, setPickerHour12] = useState(9);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('AM');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarId, setCalendarId] = useState(defaultCalendarId ?? calendars[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState<FamilyMemberOption[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  React.useEffect(() => {
    if (visible && calendarId) loadParticipants(calendarId);
  }, [visible, calendarId]);

  React.useEffect(() => {
    if (visible) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setPickerDate(today);
      setPickerHour12(9);
      setPickerMinute(0);
      setPickerAmPm('AM');
      setTitle(''); setLocation(''); setNotes(''); setSelectedMemberIds([]);
      setCalendarId(defaultCalendarId ?? calendars[0]?.id ?? '');
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [visible]);

  async function loadParticipants(calId: string) {
    // Try calendar_participants first (opt-in sub-account model)
    const { data, error } = await supabase
      .from('calendar_participants')
      .select('family_member_id, family_members(id, full_name)')
      .eq('calendar_id', calId);

    const fromParticipants = !error
      ? (data ?? []).map((r: any) => r.family_members).filter(Boolean) as FamilyMemberOption[]
      : [];

    if (fromParticipants.length > 0) {
      setParticipants(fromParticipants);
      setSelectedMemberIds(fromParticipants.map(m => m.id));
      return;
    }

    // Fallback: load ALL family members for ALL users on this calendar
    // so anyone can assign anyone else when creating an appointment
    const [{ data: calendarData }, { data: memberRows }] = await Promise.all([
      supabase.from('family_calendars').select('owner_id').eq('id', calId).single(),
      supabase.from('calendar_members').select('user_id').eq('calendar_id', calId),
    ]);

    const userIds = Array.from(new Set([
      ...(calendarData ? [calendarData.owner_id] : []),
      ...(memberRows ?? []).map((m: any) => m.user_id),
    ])).filter(Boolean);

    if (userIds.length === 0) {
      // Last resort: just own members
      const { data: ownMembers } = await supabase
        .from('family_members').select('id, full_name')
        .eq('owner_id', session?.user.id).order('full_name');
      const own = ownMembers ?? [];
      setParticipants(own);
      setSelectedMemberIds(own.map(m => m.id));
      return;
    }

    const { data: allMembers } = await supabase
      .from('family_members')
      .select('id, full_name')
      .in('owner_id', userIds)
      .order('full_name');

    const all = allMembers ?? [];
    setParticipants(all);
    setSelectedMemberIds(all.map(m => m.id));
  }

  function toggleMember(id: string) {
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function save() {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (!calendarId) { Alert.alert('Required', 'Please select a calendar.'); return; }
    setSaving(true);
    try {
      const { data: newEvent, error } = await supabase.from('calendar_events').insert({
        calendar_id: calendarId,
        created_by: session?.user.id,
        title: title.trim(),
        date_time: new Date(
          pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(),
          to24Hour(pickerHour12, pickerAmPm), pickerMinute, 0, 0
        ).toISOString(),
        location: location.trim() || null,
        notes: notes.trim() || null,
      }).select().single();
      if (error) throw error;

      if (selectedMemberIds.length > 0 && newEvent) {
        await supabase.from('event_assignees').insert(
          selectedMemberIds.map(mid => ({ event_id: newEvent.id, family_member_id: mid }))
        );
      }
      onSave();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          {/* Title */}
          <View style={modal.field}>
            <Text style={modal.label}>TITLE *</Text>
            <TextInput
              style={modal.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Annual checkup"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Date picker */}
          <View style={modal.field}>
            <Text style={modal.label}>DATE</Text>
            <TouchableOpacity
              style={modal.pickerRow}
              onPress={() => { setShowDatePicker(v => !v); setShowTimePicker(false); }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={modal.pickerValue}>
                {pickerDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={modal.pickerCard}>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date(1900, 0, 1)}
                  maximumDate={new Date(2099, 11, 31)}
                  onChange={(_, d) => { if (d) setPickerDate(d); }}
                  style={{ height: 200 }}
                />
              </View>
            )}
          </View>

          {/* Time picker */}
          <View style={modal.field}>
            <Text style={modal.label}>TIME</Text>
            <TouchableOpacity
              style={modal.pickerRow}
              onPress={() => { setShowTimePicker(v => !v); setShowDatePicker(false); }}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={modal.pickerValue}>
                {formatTime12(pickerHour12, pickerMinute, pickerAmPm)}
              </Text>
              <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textTertiary} />
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
          </View>

          {/* Location */}
          <View style={modal.field}>
            <Text style={modal.label}>LOCATION</Text>
            <TextInput
              style={modal.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Clinic, hospital, or address"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Notes */}
          <View style={modal.field}>
            <Text style={modal.label}>NOTES</Text>
            <TextInput
              style={[modal.input, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any extra details"
              placeholderTextColor={COLORS.textTertiary}
              multiline
            />
          </View>

          {/* Assign to calendar participants */}
          {participants.length > 0 && (
            <View style={modal.field}>
              <Text style={modal.label}>WHO IS THIS FOR</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs }}>
                {participants.map(m => {
                  const sel = selectedMemberIds.includes(m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[modal.memberChip, sel && modal.memberChipSelected]}
                      onPress={() => toggleMember(m.id)}
                    >
                      {sel && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
                      <Text style={[modal.memberChipText, sel && modal.memberChipTextSelected]}>{m.full_name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Calendar picker — only shown when on "All Calendars" view */}
          {calendars.length > 1 && !defaultCalendarId && (
            <View style={modal.field}>
              <Text style={modal.label}>CALENDAR</Text>
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
      </KeyboardAvoidingView>
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
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt,
  },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calChipText: { fontSize: 13, color: COLORS.textSecondary },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt,
  },
  memberChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  memberChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  memberChipTextSelected: { color: COLORS.primary, fontWeight: '600' },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 48,
  },
  pickerValue: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  pickerCard: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    overflow: 'hidden', marginTop: SPACING.xs,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Settings Modal — grouped by main account, remove cascades
// ─────────────────────────────────────────────────────────────────────────────

interface ParticipantGroup {
  user_id: string;
  display_name: string;
  is_self: boolean;
  members: { id: string; full_name: string }[];
}

function CalendarSettingsModal({ visible, calendars, onClose, onRefresh }: {
  visible: boolean;
  calendars: CalendarData[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { session } = useAuth();
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, ParticipantGroup[]>>({});
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [editColors, setEditColors] = useState<Record<string, string>>({});
  const [savingName, setSavingName] = useState<string | null>(null);
  const [subMgrCalId, setSubMgrCalId] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      loadAllParticipants();
      // Seed edit state from current calendar values
      const names: Record<string, string> = {};
      const colors: Record<string, string> = {};
      calendars.forEach(c => { names[c.id] = c.title; colors[c.id] = c.color; });
      setEditNames(names);
      setEditColors(colors);
    }
  }, [visible, calendars]);

  async function loadAllParticipants() {
    const result: Record<string, ParticipantGroup[]> = {};
    for (const cal of calendars) {
      // Get sub-accounts added to this calendar
      const { data: cpRows } = await supabase
        .from('calendar_participants')
        .select('user_id, family_member_id, family_members(id, full_name)')
        .eq('calendar_id', cal.id);
      const byUser: Record<string, { id: string; full_name: string }[]> = {};
      (cpRows ?? []).forEach((r: any) => {
        if (!byUser[r.user_id]) byUser[r.user_id] = [];
        if (r.family_members) byUser[r.user_id].push(r.family_members);
      });

      // Also include ALL calendar owners + members even if they have no sub-accounts
      const [{ data: calData }, { data: memberData }] = await Promise.all([
        supabase.from('family_calendars').select('owner_id').eq('id', cal.id).single(),
        supabase.from('calendar_members').select('user_id').eq('calendar_id', cal.id),
      ]);
      const allUserIds = Array.from(new Set([
        ...(calData ? [calData.owner_id] : []),
        ...(memberData ?? []).map((m: any) => m.user_id),
      ]));
      for (const uid of allUserIds) {
        if (!byUser[uid]) byUser[uid] = [];
      }

      const calGroups: ParticipantGroup[] = await Promise.all(
        Object.entries(byUser).map(async ([uid, members]) => {
          const { data: profile } = await supabase
            .from('profiles').select('full_name, email').eq('id', uid).single();
          return {
            user_id: uid,
            display_name: profile?.full_name || profile?.email || 'Member',
            is_self: uid === session?.user.id,
            members,
          };
        })
      );
      calGroups.sort((a, b) => {
        if (a.is_self) return -1;
        if (b.is_self) return 1;
        return a.display_name.localeCompare(b.display_name);
      });
      result[cal.id] = calGroups;
    }
    setGroups(result);
  }

  async function saveName(calendarId: string) {
    const name = editNames[calendarId]?.trim();
    if (!name) return;
    setSavingName(calendarId);
    try {
      await supabase.from('family_calendars').update({ title: name }).eq('id', calendarId);
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSavingName(null); }
  }

  async function saveColor(calendarId: string, color: string) {
    setEditColors(prev => ({ ...prev, [calendarId]: color }));
    await supabase.from('family_calendars').update({ color }).eq('id', calendarId);
    onRefresh();
  }

  async function sendInvite(calendarId: string) {
    const email = inviteEmail[calendarId]?.trim();
    if (!email) return;
    setSendingInvite(calendarId);
    try {
      const { data: profileRows } = await supabase.rpc('find_user_by_email', { p_email: email.toLowerCase() });
      const profile = profileRows?.[0];

      // Get my display name to store on the invite
      const { data: myProfile } = await supabase
        .from('profiles').select('full_name, email').eq('id', session?.user.id).single();
      const inviterName = myProfile?.full_name || myProfile?.email || session?.user.email || 'Someone';

      // Get the calendar title from local state
      const calTitle = calendars.find(c => c.id === calendarId)?.title ?? 'Family Calendar';

      await supabase.from('calendar_invitations').insert({
        calendar_id: calendarId,
        invited_by: session?.user.id,
        invited_email: email,
        invited_user_id: profile?.user_id ?? null,
        status: 'pending',
        calendar_title: calTitle,
        inviter_display_name: inviterName,
      });
      Alert.alert('Invited', `Invitation sent to ${email}`);
      setInviteEmail(prev => ({ ...prev, [calendarId]: '' }));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSendingInvite(null); }
  }

  async function removeUserFromCalendar(calendarId: string, userId: string, displayName: string) {
    Alert.alert('Remove Member', `Remove ${displayName} and all their accounts from this calendar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('calendar_participants').delete()
            .eq('calendar_id', calendarId).eq('user_id', userId);
          await supabase.from('calendar_members').delete()
            .eq('calendar_id', calendarId).eq('user_id', userId);
          loadAllParticipants();
        },
      },
    ]);
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
    Alert.alert('Leave Calendar', 'Leave this calendar? Your sub-accounts will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          await supabase.from('calendar_participants').delete()
            .eq('calendar_id', calendarId).eq('user_id', session?.user.id);
          await supabase.from('calendar_members').delete()
            .eq('calendar_id', calendarId).eq('user_id', session?.user.id);
          onRefresh(); onClose();
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

              {/* ── Calendar header ── */}
              <View style={csm.calHeader}>
                <View style={[csm.calDot, { backgroundColor: editColors[cal.id] ?? cal.color }]} />
                <Text style={csm.calTitle}>{editNames[cal.id] ?? cal.title}</Text>
                <View style={[csm.roleBadge, !cal.is_owner && csm.roleBadgeMember]}>
                  <Text style={[csm.roleText, !cal.is_owner && csm.roleTextMember]}>
                    {cal.is_owner ? 'Owner' : 'Member'}
                  </Text>
                </View>
              </View>

              {/* ── Name (owner only) ── */}
              {cal.is_owner && (
                <View style={csm.section}>
                  <Text style={csm.sectionLabel}>CALENDAR NAME</Text>
                  <View style={csm.nameRow}>
                    <TextInput
                      style={csm.nameInput}
                      value={editNames[cal.id] ?? ''}
                      onChangeText={v => setEditNames(prev => ({ ...prev, [cal.id]: v }))}
                      placeholder="Calendar name"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                    <TouchableOpacity
                      style={[csm.saveNameBtn, savingName === cal.id && { opacity: 0.65 }]}
                      onPress={() => saveName(cal.id)}
                      disabled={savingName === cal.id}
                    >
                      {savingName === cal.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={csm.saveNameText}>Save</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── Color (owner only) ── */}
              {cal.is_owner && (
                <View style={csm.section}>
                  <Text style={csm.sectionLabel}>COLOR</Text>
                  <View style={csm.colorRow}>
                    {CALENDAR_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[csm.colorDot, { backgroundColor: c },
                          (editColors[cal.id] ?? cal.color) === c && csm.colorDotActive]}
                        onPress={() => saveColor(cal.id, c)}
                      >
                        {(editColors[cal.id] ?? cal.color) === c &&
                          <Ionicons name="checkmark" size={13} color="#fff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Members ── */}
              <View style={csm.section}>
                <Text style={csm.sectionLabel}>MEMBERS</Text>

                {(groups[cal.id] ?? []).length === 0 ? (
                  <Text style={csm.emptyMembers}>No members yet.</Text>
                ) : (
                  (groups[cal.id] ?? []).map(group => (
                    <View key={group.user_id} style={csm.groupBlock}>
                      <View style={csm.groupHeader}>
                        <View style={csm.groupAvatar}>
                          <Ionicons name="person-outline" size={15} color={COLORS.primary} />
                        </View>
                        <Text style={csm.groupName}>
                          {group.display_name}
                        </Text>
                        {(cal.is_owner && !group.is_self) && (
                          <TouchableOpacity
                            onPress={() => removeUserFromCalendar(cal.id, group.user_id, group.display_name)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle-outline" size={20} color={COLORS.textTertiary} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {group.members.map(m => (
                        <View key={m.id} style={csm.subRow}>
                          <View style={csm.subDash} />
                          <Text style={csm.subName}>{m.full_name}</Text>
                        </View>
                      ))}
                      {group.is_self && (
                        <TouchableOpacity
                          style={csm.manageSubBtn}
                          onPress={() => setSubMgrCalId(cal.id)}
                        >
                          <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                          <Text style={csm.manageSubText}>Manage my accounts</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}

                {/* Invite by email (owner only) */}
                {cal.is_owner && (
                  <View style={[csm.nameRow, { marginTop: SPACING.md }]}>
                    <TextInput
                      style={csm.nameInput}
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
              </View>

              {/* ── Delete / Leave ── */}
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
      </KeyboardAvoidingView>
      {subMgrCalId && (
        <SubAccountPickerModal
          visible={!!subMgrCalId}
          calendarId={subMgrCalId}
          calendarTitle={calendars.find(c => c.id === subMgrCalId)?.title ?? ''}
          onDone={() => { setSubMgrCalId(null); loadAllParticipants(); }}
        />
      )}
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
  calCard: { ...CARD, overflow: 'hidden', marginBottom: SPACING.lg },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  calDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  calTitle: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1 },
  roleBadge: { backgroundColor: COLORS.primaryMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeMember: { backgroundColor: COLORS.surfaceAlt },
  roleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  roleTextMember: { color: COLORS.textSecondary },

  // Section layout
  section: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.sm },

  // Name row
  nameRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  nameInput: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 44, fontSize: 14, color: COLORS.textPrimary,
  },
  saveNameBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: SPACING.base, height: 44,
    alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  saveNameText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Color row
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  colorDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },

  // Members
  emptyMembers: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontStyle: 'italic', marginBottom: SPACING.sm },
  groupBlock: { marginBottom: SPACING.md },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  groupAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  groupName: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600', flex: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 40, paddingVertical: 4 },
  subDash: { width: 16, height: 1, backgroundColor: COLORS.border, marginRight: SPACING.sm },
  subName: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  manageSubBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingLeft: 40, paddingVertical: 6,
  },
  manageSubText: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600' },

  // Invite
  inviteBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  // Actions
  actions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm },
  deleteBtnText: { fontSize: 13, color: COLORS.rose, fontWeight: '600' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm },
  leaveBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// CalendarSwitcherModal — tappable from the calendar bar below the header
// ─────────────────────────────────────────────────────────────────────────────

function CalendarSwitcherModal({ visible, calendars, selectedId, onSelect, onViewAll, onCreatePress, onClose }: {
  visible: boolean;
  calendars: CalendarData[];
  selectedId: string | 'all';
  onSelect: (id: string | 'all') => void;
  onViewAll: () => void;
  onCreatePress: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={csw.container}>
        <View style={csw.header}>
          <Text style={csw.title}>Calendars</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={csw.scroll}>
          {/* All calendars option */}
          {calendars.length > 1 && (
            <TouchableOpacity style={csw.row} onPress={() => { onSelect('all'); onClose(); }} activeOpacity={0.7}>
              <View style={[csw.dot, { backgroundColor: COLORS.textTertiary }]} />
              <Text style={csw.rowText}>All Calendars</Text>
              {selectedId === 'all' && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
            </TouchableOpacity>
          )}

          {/* Each calendar */}
          {calendars.map(cal => (
            <TouchableOpacity key={cal.id} style={csw.row} onPress={() => { onSelect(cal.id); onClose(); }} activeOpacity={0.7}>
              <View style={[csw.dot, { backgroundColor: cal.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={csw.rowText}>{cal.title}</Text>
                <Text style={csw.rowSub}>{cal.is_owner ? 'Owner' : 'Member'}</Text>
              </View>
              {selectedId === cal.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}

          <View style={csw.divider} />

          {/* View all appointments */}
          <TouchableOpacity style={csw.actionRow} onPress={() => { onViewAll(); onClose(); }} activeOpacity={0.7}>
            <View style={csw.actionIcon}>
              <Ionicons name="list-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={csw.actionText}>View All Appointments</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Create new calendar */}
          <TouchableOpacity style={csw.actionRow} onPress={() => { onCreatePress(); onClose(); }} activeOpacity={0.7}>
            <View style={csw.actionIcon}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={csw.actionText}>Create New Calendar</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const csw = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 60 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  rowText: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
  rowSub: { ...FONTS.caption, color: COLORS.textTertiary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// CalendarScreen (main)
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { session } = useAuth();
  const navigation = useNavigation();
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showSubPicker, setShowSubPicker] = useState<{ calId: string; calTitle: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useFocusEffect(useCallback(() => { loadAll(); }, [session]));

  // Drive tab bar badge from pending invite count
  React.useEffect(() => {
    navigation.setOptions({
      tabBarBadge: pendingInvites.length > 0 ? pendingInvites.length : undefined,
    });
  }, [pendingInvites.length]);

  async function loadAll() {
    if (!session?.user) return;
    scrolledRef.current = false;
    setPastHeight(0);
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
        ...(memberCals ?? [])
          .filter(m => m.family_calendars)
          .map(m => ({ ...(m.family_calendars as any), is_owner: false })),
      ];

      // Deduplicate (owner might also appear in calendar_members)
      const seen = new Set<string>();
      const deduped = allCalendars.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      setCalendars(deduped);

      // Pending invites — use stored title/name columns so RLS cross-table joins aren't needed
      const { data: invites } = await supabase
        .from('calendar_invitations')
        .select('id, calendar_id, invited_by, calendar_title, inviter_display_name')
        .or(`invited_user_id.eq.${userId},invited_email.eq.${session.user.email ?? ''}`)
        .eq('status', 'pending');

      const enrichedInvites: PendingInvite[] = (invites ?? []).map(inv => ({
        id: inv.id,
        calendar_id: inv.calendar_id,
        invited_by: inv.invited_by,
        calendar_title: inv.calendar_title ?? 'Family Calendar',
        inviter_name: inv.inviter_display_name ?? 'Someone',
      }));
      setPendingInvites(enrichedInvites);

      // Load events
      if (deduped.length > 0) {
        const calIds = deduped.map(c => c.id);
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

  function handleCalendarCreated(calId: string, calTitle: string) {
    setShowCreate(false);
    setShowSubPicker({ calId, calTitle });
  }

  function handleCalendarJoined(calId: string, calTitle: string, inviteId: string) {
    // Immediately clear the badge — don't wait for loadAll()
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    setShowJoin(false);
    setShowSubPicker({ calId, calTitle });
    loadAll(); // also refresh everything in the background
  }

  function handleSubPickerDone() {
    setShowSubPicker(null);
    loadAll();
  }

  async function deleteEventDirect(id: string) {
    await supabase.from('calendar_events').delete().eq('id', id);
    loadAll();
  }

  const scrollRef = useRef<ScrollView>(null);
  const scrolledRef = useRef(false);
  const [pastHeight, setPastHeight] = useState(0);

  const hasCalendars = calendars.length > 0;
  const filteredEvents = selectedCalendarId === 'all'
    ? events
    : events.filter(e => e.calendar_id === selectedCalendarId);

  const now = new Date();
  // Past: chronological order (oldest at top, most recent closest to upcoming)
  const past = filteredEvents.filter(e => new Date(e.date_time) < now);
  const upcoming = filteredEvents.filter(e => new Date(e.date_time) >= now);
  const upcomingGroups = groupByDate(upcoming);
  const upcomingDates = Object.keys(upcomingGroups).sort();
  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);

  function handlePastLayout(e: any) {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setPastHeight(h);
  }

  // As soon as pastHeight is measured, scroll upcoming to top
  React.useEffect(() => {
    if (pastHeight > 0 && !scrolledRef.current) {
      scrolledRef.current = true;
      scrollRef.current?.scrollTo({ y: pastHeight, animated: false });
    }
  }, [pastHeight]);

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
            {/* Bell — always shown, opens join modal */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowJoin(true)}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              {pendingInvites.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{pendingInvites.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            {hasCalendars && (
              <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)}>
                <Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tappable calendar bar — always shown when user has calendars */}
        {hasCalendars && (
          <TouchableOpacity
            style={styles.calBar}
            onPress={() => setShowSwitcher(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.calDot, {
              backgroundColor: selectedCalendarId === 'all'
                ? COLORS.textTertiary
                : (calendars.find(c => c.id === selectedCalendarId)?.color ?? COLORS.primary)
            }]} />
            <Text style={styles.calBarText}>
              {selectedCalendarId === 'all'
                ? 'All Calendars'
                : (calendars.find(c => c.id === selectedCalendarId)?.title ?? 'Calendar')}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

      </SafeAreaView>

      {!hasCalendars ? (
        <CalendarEmpty
          pendingInvites={pendingInvites}
          onCreatePress={() => setShowCreate(true)}
          onJoinPress={() => setShowJoin(true)}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.primary} />}
        >
          {/* ── Past appointments (scroll UP to find) ── */}
          {past.length > 0 && (
            <View style={styles.pastSection} onLayout={handlePastLayout}>
              <Text style={styles.pastLabel}>PAST APPOINTMENTS</Text>
              {past.map(evt => {
                const cal = calendars.find(c => c.id === evt.calendar_id);
                return (
                  <TouchableOpacity
                    key={evt.id}
                    style={[styles.eventCard, styles.eventCardPast]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedEvent(evt)}
                  >
                    <View style={[styles.eventColorBar, { backgroundColor: COLORS.border }]} />
                    <View style={styles.eventBody}>
                      {calendars.length > 1 && cal && (
                        <Text style={styles.eventCalName}>{cal.title}</Text>
                      )}
                      <Text style={[styles.eventTitle, { color: COLORS.textSecondary }]}>{evt.title}</Text>
                      <Text style={styles.eventTime}>
                        {formatDateHeader(toDateKey(evt.date_time))} · {formatTime(evt.date_time)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {/* Divider separating past from upcoming */}
              <View style={styles.todayDivider}>
                <View style={styles.todayLine} />
                <Text style={styles.todayLabel}>UPCOMING</Text>
                <View style={styles.todayLine} />
              </View>
            </View>
          )}

          {/* ── Upcoming appointments (soonest at top, furthest at bottom) ── */}
          {/* minHeight ensures past section is always scrollable off the top */}
          <View style={{ minHeight: Dimensions.get('window').height }}>
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
                      onPress={() => setSelectedEvent(evt)}
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
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Appointment detail */}
      <AppointmentDetailModal
        event={selectedEvent}
        calendar={selectedEvent ? calendars.find(c => c.id === selectedEvent.calendar_id) : undefined}
        onClose={() => setSelectedEvent(null)}
        onDelete={(id) => { deleteEventDirect(id); setSelectedEvent(null); }}
      />

      {/* FAB — sticky + button for new appointment */}
      {hasCalendars && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <CreateCalendarModal
        visible={showCreate}
        onCreated={handleCalendarCreated}
        onClose={() => setShowCreate(false)}
      />
      <JoinCalendarModal
        visible={showJoin}
        pendingInvites={pendingInvites}
        userEmail={session?.user.email ?? ''}
        onJoined={handleCalendarJoined}
        onClose={() => setShowJoin(false)}
      />
      {showSubPicker && (
        <SubAccountPickerModal
          visible={true}
          calendarId={showSubPicker.calId}
          calendarTitle={showSubPicker.calTitle}
          onDone={handleSubPickerDone}
        />
      )}
      {showAddModal && (
        <AddEventModal
          visible={showAddModal}
          calendars={calendars}
          defaultCalendarId={selectedCalendarId !== 'all' ? selectedCalendarId : undefined}
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
      <CalendarSwitcherModal
        visible={showSwitcher}
        calendars={calendars}
        selectedId={selectedCalendarId}
        onSelect={setSelectedCalendarId}
        onViewAll={() => setSelectedCalendarId('all')}
        onCreatePress={() => setShowCreate(true)}
        onClose={() => setShowSwitcher(false)}
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
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.rose,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  calBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, paddingVertical: 10,
  },
  calBarText: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600', flex: 1 },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  listContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm },
  dateHeader: { ...FONTS.h4, color: COLORS.textPrimary, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  eventCard: {
    ...CARD, flexDirection: 'row', alignItems: 'center',
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
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { ...FONTS.h4, color: COLORS.textTertiary },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  pastSection: { paddingBottom: SPACING.sm },
  pastLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.8, marginBottom: SPACING.md, marginTop: SPACING.sm },
  todayDivider: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: SPACING.lg, marginBottom: SPACING.xs,
  },
  todayLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  todayLabel: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.sm,
    backgroundColor: COLORS.primaryMuted, borderRadius: 12,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: `${COLORS.primary}30`,
  },
  inviteBannerText: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600', flex: 1 },
});
