import React, { useCallback, useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView,
  Platform, StatusBar, Linking, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FamilyMember, HealthInfo, RootStackParamList,
  EmergencyContact, Doctor,
} from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';
import ThemedBackground from '../../components/ThemedBackground';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MemberProfile'>;
  route: RouteProp<RootStackParamList, 'MemberProfile'>;
};

type Section = 'general' | 'medical' | 'insurance' | 'emergency' | 'physicians' | null;

// Fields use free text inputs — no dropdown/chip selectors

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Parse a YYYY-MM-DD date string without UTC offset shifting.
// new Date("1988-07-14") is treated as UTC midnight → wrong day in negative TZs.
function parseDob(dob: string): Date {
  return new Date(dob.includes('T') ? dob : dob + 'T12:00:00');
}
function dobToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDob(dob: string): string {
  return parseDob(dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = parseDob(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

// ── Section wrapper — clean title + chevron, no icons, no data preview ──────

function SectionBlock({
  title, isOpen, onToggle, editing, onSave, onCancel, saving, children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[sec.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header row — always just title + chevron */}
      <TouchableOpacity
        style={sec.header}
        onPress={editing ? undefined : onToggle}
        activeOpacity={editing ? 1 : 0.7}
      >
        <Text style={[sec.title, { color: colors.textPrimary }]}>{title}</Text>
        <Ionicons
          name={(isOpen || editing) ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {/* Expanded content */}
      {(isOpen || editing) && (
        <View style={sec.body}>
          {children}
          {/* Cancel / Save at bottom when editing */}
          {editing && (
            <View style={sec.editActions}>
              <TouchableOpacity style={sec.cancelBtn} onPress={onCancel}>
                <Text style={sec.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sec.saveBtn} onPress={onSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={sec.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const sec = StyleSheet.create({
  card: { ...CARD, overflow: 'hidden', marginBottom: SPACING.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary, fontWeight: '600' },
  editActions: {
    flexDirection: 'row', gap: SPACING.sm,
    marginTop: SPACING.base, paddingTop: SPACING.base,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 11,
    borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  saveBtn: {
    flex: 1, paddingVertical: 11,
    borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: { ...FONTS.body, color: '#fff', fontWeight: '700' },
  body: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.base },
});

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChangeText, placeholder, keyboardType, multiline, autoCapitalize }: {
  label?: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; autoCapitalize?: any;
}) {
  const { colors } = useTheme();
  return (
    <View style={f.group}>
      {label ? <Text style={[f.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        style={[f.input, multiline && f.inputMulti, {
          backgroundColor: colors.surfaceSolid,
          borderColor: colors.border,
          color: colors.textPrimary,
        }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// Always renders even when empty — shows "—" placeholder
function DisplayField({ label, value, onPress }: { label: string; value?: string | null; onPress?: () => void }) {
  const { colors } = useTheme();
  const inner = (
    <View style={f.row}>
      <Text style={[f.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[f.rowValue, !value && { color: colors.textTertiary }, onPress && { color: colors.primary }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{inner}</TouchableOpacity> : inner;
}

function EditButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={f.editBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="pencil-outline" size={14} color={colors.primary} />
      <Text style={[f.editBtnText, { color: colors.primary }]}>Edit</Text>
    </TouchableOpacity>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <Text style={f.emptyHint}>{text}</Text>;
}

const f = StyleSheet.create({
  group: { marginBottom: SPACING.base },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#C8C2BA', paddingHorizontal: SPACING.base, height: 46,
    fontSize: 15, color: COLORS.textPrimary,
  },
  inputMulti: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary, flex: 1 },
  rowValue: { ...FONTS.bodySmall, color: COLORS.textPrimary, fontWeight: '500', flex: 1.5, textAlign: 'right' },
  rowEmpty: { color: COLORS.textTertiary, fontWeight: '400' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
    marginTop: SPACING.base, paddingVertical: 8, paddingHorizontal: SPACING.base,
    borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emptyHint: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontStyle: 'italic', paddingVertical: SPACING.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#C8C2BA', paddingHorizontal: SPACING.base, height: 46,
  },
  inputText: { fontSize: 15, color: COLORS.textPrimary, flex: 1 },
  inputPlaceholder: { fontSize: 15, color: COLORS.textTertiary, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.base, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  listItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  listItemContent: { flex: 1 },
  listItemName: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },
  listItemSub: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: SPACING.sm, marginTop: SPACING.sm,
  },
  addBtnText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  removeBtn: { padding: 4 },
});

// ── Main screen ──────────────────────────────────────────────────────────────

export default function MemberProfileScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const { session } = useAuth();
  const { colors } = useTheme();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState<{ share_id: string; recipient_name: string; recipient_email: string; access_level: string; status: string }[]>([]);
  const [removingShareId, setRemovingShareId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // General editable state
  const [eName, setEName] = useState('');
  const [eDob, setEDob] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [eGender, setEGender] = useState('');
  const [eBlood, setEBlood] = useState('');
  const [eSsn, setESsn] = useState('');

  // Medical editable state — plain text
  const [eAllergiesText, setEAllergiesText] = useState('');
  const [eMedsText, setEMedsText] = useState('');
  const [ePastSurgeries, setEPastSurgeries] = useState('');
  const [eConditionsText, setEConditionsText] = useState('');

  // Insurance editable state
  const [eInsProvider, setEInsProvider] = useState('');
  const [eInsPolicyNum, setEInsPolicyNum] = useState('');

  // Emergency contacts editable state
  const [eContacts, setEContacts] = useState<EmergencyContact[]>([]);

  // Physicians editable state
  const [eDocName, setEDocName] = useState('');
  const [eDocPhone, setEDocPhone] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: memberName,
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTintColor: '#1C1C1E',
      headerShadowVisible: false,
    });
  }, [memberName]);

  useFocusEffect(useCallback(() => { fetchData(); }, [memberId]));

  async function fetchData() {
    setLoading(true);
    try {
      const [memberRes, healthRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('health_info').select('*').eq('member_id', memberId).single(),
      ]);
      if (memberRes.data) setMember(memberRes.data);
      if (healthRes.data) setHealthInfo(healthRes.data);
      // Fetch shares (owner-only, returns empty for non-owners)
      const { data: sharesData } = await supabase.rpc('get_shared_with', { p_member_id: memberId });
      setShares(sharesData ?? []);

      // Determine edit access
      if (memberRes.data) {
        if (memberRes.data.owner_id === session?.user?.id) {
          setCanEdit(true);
        } else {
          // Check if shared with edit permission
          const { data: shareAccess } = await supabase
            .from('shared_accounts')
            .select('access_level')
            .eq('account_id', memberId)
            .eq('recipient_id', session?.user?.id)
            .eq('status', 'accepted')
            .single();
          setCanEdit(shareAccess?.access_level === 'edit');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function removeShare(shareId: string, recipientName: string) {
    Alert.alert(
      'Remove Access',
      `Remove ${recipientName}'s access to this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingShareId(shareId);
            const { error } = await supabase.from('shared_accounts').delete().eq('id', shareId);
            if (error) Alert.alert('Error', error.message);
            else setShares(prev => prev.filter(s => s.share_id !== shareId));
            setRemovingShareId(null);
          },
        },
      ]
    );
  }

  async function pickAndUploadPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `${session?.user?.id}/${memberId}_${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('family_members')
        .update({ photo_url: publicUrl })
        .eq('id', memberId);

      if (updateError) throw updateError;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function toggleSection(s: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function startEditing(section: Section) {
    if (!member || !section) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSection(section);
    setOpenSections(prev => new Set([...prev, section]));
    if (section === 'general') {
      setEName(member.full_name || '');
      setEDob(member.dob || '');
      setEGender(member.gender || '');
      setEBlood(member.blood_type || '');
      setESsn((member as any).ssn_last_four || '');
    } else if (section === 'medical') {
      setEBlood(member.blood_type || '');
      setEAllergiesText((healthInfo?.allergies || []).map(a => a.name).join('\n'));
      setEMedsText((healthInfo?.medications || []).map(m => [m.name, m.dosage, m.frequency].filter(Boolean).join(' - ')).join('\n'));
      setEPastSurgeries(healthInfo?.past_surgeries || '');
      setEConditionsText((healthInfo?.conditions || []).map(c => c.name).join('\n'));
    } else if (section === 'insurance') {
      setEInsProvider(healthInfo?.insurance?.carrier || '');
      setEInsPolicyNum(healthInfo?.insurance?.policy_number || '');
    } else if (section === 'emergency') {
      setEContacts(JSON.parse(JSON.stringify(healthInfo?.emergency_contacts || [])));
    } else if (section === 'physicians') {
      setEDocName(healthInfo?.primary_doctor?.name || '');
      setEDocPhone(healthInfo?.primary_doctor?.phone || '');
    }
  }

  function cancelEditing() { setEditingSection(null); }

  async function saveSection(section: Section) {
    setSaving(true);
    try {
      if (section === 'general') {
        await supabase.from('family_members').update({
          full_name: eName.trim(),
          dob: eDob || null,
          gender: eGender || null,
          ssn_last_four: eSsn.replace(/\D/g, '').slice(0, 4) || null,
        }).eq('id', memberId);
      } else {
        const hi = healthInfo;
        const insurance = eInsProvider || eInsPolicyNum
          ? { carrier: eInsProvider, policy_number: eInsPolicyNum, group_number: hi?.insurance?.group_number || '', member_id: hi?.insurance?.member_id }
          : null;
        const doctor = eDocName ? { name: eDocName, phone: eDocPhone, address: '', specialty: '' } : null;

        const payload: any = {
          member_id: memberId,
          allergies: section === 'medical'
            ? eAllergiesText.trim() ? [{ name: eAllergiesText.trim(), severity: 'Mild' as const }] : []
            : (hi?.allergies || []),
          medications: section === 'medical'
            ? eMedsText.trim() ? [{ name: eMedsText.trim(), dosage: '', frequency: '' }] : []
            : (hi?.medications || []),
          conditions: section === 'medical'
            ? eConditionsText.trim() ? [{ name: eConditionsText.trim() }] : []
            : (hi?.conditions || []),
          past_surgeries: section === 'medical' ? ePastSurgeries : (hi?.past_surgeries || ''),
          insurance: section === 'insurance' ? insurance : (hi?.insurance ?? null),
          emergency_contacts: section === 'emergency' ? eContacts : (hi?.emergency_contacts || []),
          primary_doctor: section === 'physicians' ? doctor : (hi?.primary_doctor ?? null),
          healthcare_proxy: hi?.healthcare_proxy ?? null,
          notes: hi?.notes || '',
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase.from('health_info').select('id').eq('member_id', memberId).single();
        if (existing) {
          await supabase.from('health_info').update(payload).eq('member_id', memberId);
        } else {
          await supabase.from('health_info').insert(payload);
        }
        // Blood type lives on family_members
        if (section === 'medical') {
          await supabase.from('family_members').update({ blood_type: eBlood || null }).eq('id', memberId);
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingSection(null);
      fetchData();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!member) return <View style={[styles.loading, { backgroundColor: colors.background }]}><Text style={FONTS.body}>Member not found.</Text></View>;

  const hi = healthInfo;
  const age = getAge(member.dob);
  const ssnDisplay = (member as any).ssn_last_four ?? null;


  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle='dark-content' />
      <ThemedBackground />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar + name header ── */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={pickAndUploadPhoto} activeOpacity={0.8} disabled={uploadingPhoto || member.owner_id !== session?.user?.id}>
            {uploadingPhoto ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : member.photo_url ? (
              <View>
                <Image source={{ uri: member.photo_url }} style={styles.avatarPhoto} />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={11} color="#fff" />
                </View>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Ionicons name="camera-outline" size={26} color={colors.textTertiary} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.textPrimary }]}>{member.full_name}</Text>
            {member.dob ? (
              <Text style={[styles.heroDob, { color: colors.textSecondary }]}>
                {formatDob(member.dob)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Quick action buttons ── */}
        <View style={styles.actionRow}>
          {([] as { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }[]).concat(
            member?.owner_id === session?.user?.id
              ? [{ icon: 'share-social-outline' as const, label: 'Share', onPress: () => navigation.navigate('ShareAccount', { memberId, memberName }) }]
              : [],
            [
              { icon: 'calendar-outline' as const, label: 'Appointments', onPress: () => navigation.navigate('Appointments', { memberId, memberName }) },
              { icon: 'document-text-outline' as const, label: 'Documents', onPress: () => navigation.navigate('DocumentScanner', { memberId, memberName }) },
            ]
          ).map((a, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.onPress(); }} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name={a.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ────────────────────────────────────────
            GENERAL INFORMATION
        ──────────────────────────────────────── */}
        <SectionBlock
          title="General Information"
          isOpen={openSections.has('general')}
          onToggle={() => toggleSection('general')}
          editing={editingSection === 'general'}
          onSave={() => saveSection('general')}
          onCancel={cancelEditing}
          saving={saving}
        >
          {editingSection === 'general' ? (
            <>
              {/* Profile photo */}
              <TouchableOpacity style={styles.photoEditRow} onPress={pickAndUploadPhoto} activeOpacity={0.75}>
                {uploadingPhoto ? (
                  <View style={styles.photoThumbEmpty}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : member.photo_url ? (
                  <Image source={{ uri: member.photo_url }} style={styles.photoThumb} />
                ) : (
                  <View style={styles.photoThumbEmpty}>
                    <Ionicons name="camera-outline" size={22} color={COLORS.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[f.label, { marginBottom: 2 }]}>PROFILE PHOTO</Text>
                  <Text style={styles.photoEditHint}>
                    {member.photo_url ? 'Tap to change photo' : 'Tap to add a photo'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
              <FieldInput label="FULL NAME" value={eName} onChangeText={setEName} placeholder="First and last name" autoCapitalize="words" />
              {/* DOB — tappable row + spinner picker */}
              <Text style={[f.label, { marginTop: SPACING.sm }]}>DATE OF BIRTH</Text>
              <TouchableOpacity
                style={[f.inputWrap, { marginBottom: SPACING.sm }]}
                onPress={() => setShowDobPicker(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={eDob ? f.inputText : f.inputPlaceholder}>
                  {eDob ? formatDob(eDob) : 'Select date of birth'}
                </Text>
                <Ionicons name={showDobPicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
              {showDobPicker && (
                <DateTimePicker
                  value={eDob ? parseDob(eDob) : new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_, d) => {
                    if (d) setEDob(dobToString(d));
                  }}
                  style={{ height: 200, marginBottom: SPACING.sm }}
                />
              )}
              <FieldInput label="GENDER" value={eGender} onChangeText={setEGender} placeholder="e.g. Male, Female, Non-binary" />
              <FieldInput label="SSN LAST 4" value={eSsn} onChangeText={(v) => setESsn(v.replace(/\D/g, '').slice(0, 4))} placeholder="1234" keyboardType="number-pad" autoCapitalize="none" />
            </>
          ) : (
            <>
              <DisplayField label="Full Name" value={member.full_name} />
              <DisplayField label="Date of Birth" value={member.dob ? formatDob(member.dob) : null} />
              <DisplayField label="Gender" value={member.gender} />
              <DisplayField label="Last 4 SSN" value={ssnDisplay} />
              {canEdit && <EditButton onPress={() => startEditing('general')} />}
            </>
          )}
        </SectionBlock>

        {/* ────────────────────────────────────────
            MEDICAL INFORMATION
        ──────────────────────────────────────── */}
        <SectionBlock
          title="Medical Information"
          isOpen={openSections.has('medical')}
          onToggle={() => toggleSection('medical')}
          editing={editingSection === 'medical'}
          onSave={() => saveSection('medical')}
          onCancel={cancelEditing}
          saving={saving}
        >
          {editingSection === 'medical' ? (
            <>
              <FieldInput label="BLOOD TYPE" value={eBlood} onChangeText={setEBlood} placeholder="e.g. A+, O-, AB+" autoCapitalize="characters" />
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
              <FieldInput label="ALLERGIES" value={eAllergiesText} onChangeText={setEAllergiesText} placeholder="List allergies here" multiline />
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
              <FieldInput label="CURRENT MEDICATIONS" value={eMedsText} onChangeText={setEMedsText} placeholder="List medications here" multiline />
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
              <FieldInput label="PAST SURGERIES" value={ePastSurgeries} onChangeText={setEPastSurgeries} placeholder="Describe any past surgeries" multiline />
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />
              <FieldInput label="PAST MEDICAL HISTORY" value={eConditionsText} onChangeText={setEConditionsText} placeholder="Conditions, diagnoses, history" multiline />
            </>
          ) : (
            <>
              <DisplayField label="Blood Type" value={member.blood_type} />
              <DisplayField label="Allergies" value={hi?.allergies?.[0]?.name} />
              <DisplayField label="Current Medications" value={hi?.medications?.[0]?.name} />
              <DisplayField label="Past Surgeries" value={hi?.past_surgeries} />
              <DisplayField label="Past Medical History" value={hi?.conditions?.[0]?.name} />
              {canEdit && <EditButton onPress={() => startEditing('medical')} />}
            </>
          )}
        </SectionBlock>

        {/* ────────────────────────────────────────
            INSURANCE INFORMATION
        ──────────────────────────────────────── */}
        <SectionBlock
          title="Insurance Information"
          isOpen={openSections.has('insurance')}
          onToggle={() => toggleSection('insurance')}
          editing={editingSection === 'insurance'}
          onSave={() => saveSection('insurance')}
          onCancel={cancelEditing}
          saving={saving}
        >
          {editingSection === 'insurance' ? (
            <>
              <FieldInput label="PROVIDER" value={eInsProvider} onChangeText={setEInsProvider} placeholder="e.g. Blue Cross Blue Shield" autoCapitalize="words" />
              <FieldInput label="POLICY NUMBER" value={eInsPolicyNum} onChangeText={setEInsPolicyNum} placeholder="Policy number" autoCapitalize="none" />
            </>
          ) : (
            <>
              <DisplayField label="Provider" value={hi?.insurance?.carrier} />
              <DisplayField label="Policy Number" value={hi?.insurance?.policy_number} />
              {canEdit && <EditButton onPress={() => startEditing('insurance')} />}
            </>
          )}
        </SectionBlock>

        {/* ────────────────────────────────────────
            EMERGENCY CONTACTS
        ──────────────────────────────────────── */}
        <SectionBlock
          title="Emergency Contacts"
          isOpen={openSections.has('emergency')}
          onToggle={() => toggleSection('emergency')}
          editing={editingSection === 'emergency'}
          onSave={() => saveSection('emergency')}
          onCancel={cancelEditing}
          saving={saving}
        >
          {editingSection === 'emergency' ? (
            <>
              {eContacts.map((c, i) => (
                <View key={i} style={{ marginBottom: SPACING.base }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={f.label}>CONTACT {i + 1}</Text>
                    <TouchableOpacity onPress={() => setEContacts(eContacts.filter((_, j) => j !== i))}>
                      <Text style={{ fontSize: 12, color: COLORS.rose }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <FieldInput value={c.name} onChangeText={v => { const u = [...eContacts]; u[i].name = v; setEContacts(u); }} placeholder="Full name" autoCapitalize="words" />
                  <FieldInput value={c.phone} onChangeText={v => { const u = [...eContacts]; u[i].phone = v; setEContacts(u); }} placeholder="Phone number" keyboardType="phone-pad" autoCapitalize="none" />
                  <FieldInput value={c.relationship} onChangeText={v => { const u = [...eContacts]; u[i].relationship = v; setEContacts(u); }} placeholder="Relationship (e.g. Mother)" autoCapitalize="words" />
                </View>
              ))}
              <TouchableOpacity style={f.addBtn} onPress={() => setEContacts([...eContacts, { name: '', phone: '', relationship: '' }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={f.addBtnText}>Add Contact</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {(hi?.emergency_contacts?.length ?? 0) > 0 ? hi!.emergency_contacts.map((c, i) => (
                <View key={i} style={f.listItem}>
                  <View style={f.listItemContent}>
                    <Text style={f.listItemName}>{c.name}</Text>
                    <Text style={f.listItemSub}>{c.relationship}{c.phone ? ` · ${c.phone}` : ''}</Text>
                  </View>
                  {c.phone ? (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                      <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )) : (
                <View style={f.row}>
                  <Text style={f.rowLabel}>Contacts</Text>
                  <Text style={[f.rowValue, f.rowEmpty]}>—</Text>
                </View>
              )}
              {canEdit && <EditButton onPress={() => startEditing('emergency')} />}
            </>
          )}
        </SectionBlock>

        {/* ────────────────────────────────────────
            PHYSICIANS / CARE PROVIDERS
        ──────────────────────────────────────── */}
        <SectionBlock
          title="Physicians / Care Providers"
          isOpen={openSections.has('physicians')}
          onToggle={() => toggleSection('physicians')}
          editing={editingSection === 'physicians'}
          onSave={() => saveSection('physicians')}
          onCancel={cancelEditing}
          saving={saving}
        >
          {editingSection === 'physicians' ? (
            <>
              <FieldInput label="PHYSICIAN NAME" value={eDocName} onChangeText={setEDocName} placeholder="Dr. Jane Smith" autoCapitalize="words" />
              <FieldInput label="CONTACT / PHONE" value={eDocPhone} onChangeText={setEDocPhone} placeholder="Office phone number" keyboardType="phone-pad" autoCapitalize="none" />
            </>
          ) : (
            <>
              {hi?.primary_doctor?.name ? (
                <View style={f.listItem}>
                  <View style={f.listItemContent}>
                    <Text style={f.listItemName}>{hi.primary_doctor.name}</Text>
                    {hi.primary_doctor.phone ? <Text style={f.listItemSub}>{hi.primary_doctor.phone}</Text> : null}
                  </View>
                  {hi.primary_doctor.phone ? (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${hi!.primary_doctor!.phone}`)}>
                      <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <>
                  <DisplayField label="Physician Name" value={null} />
                  <DisplayField label="Contact / Phone" value={null} />
                </>
              )}
              {canEdit && <EditButton onPress={() => startEditing('physicians')} />}
            </>
          )}
        </SectionBlock>

        {/* ────────────────────────────────────────
            SHARED WITH (owner only)
        ──────────────────────────────────────── */}
        {member.owner_id === session?.user?.id && (
          <SectionBlock
            title="Shared With"
            isOpen={openSections.has('sharedWith')}
            onToggle={() => toggleSection('sharedWith')}
            editing={false}
            onSave={() => {}}
            onCancel={() => {}}
          >
            {shares.length === 0 ? (
              <Text style={f.emptyHint}>Not shared with anyone yet.</Text>
            ) : (
              shares.map((s) => (
                <View key={s.share_id} style={f.listItem}>
                  <View style={f.listItemContent}>
                    <Text style={f.listItemName}>{s.recipient_name}</Text>
                    <Text style={f.listItemSub}>
                      {s.recipient_email}
                      {' · '}
                      {s.access_level === 'edit' ? 'Can edit' : 'View only'}
                      {s.status === 'pending' ? ' · Pending' : ''}
                    </Text>
                  </View>
                  {removingShareId === s.share_id ? (
                    <ActivityIndicator size="small" color={COLORS.rose} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => removeShare(s.share_id, s.recipient_name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={COLORS.rose} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </SectionBlock>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },

  // Hero
  hero: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base, marginBottom: SPACING.xl, paddingTop: SPACING.sm },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: { width: 64, height: 64, borderRadius: 32 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary,
    borderWidth: 2, borderColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.3 },
  heroDob: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  selfBadge: { backgroundColor: COLORS.primaryMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  selfBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // Photo edit row (inside General Info edit mode)
  photoEditRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  photoThumb: { width: 52, height: 52, borderRadius: 26 },
  photoThumbEmpty: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  photoEditHint: { ...FONTS.bodySmall, color: COLORS.textTertiary, flex: 1 },

  // Quick actions
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: SPACING.xl, gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconBg: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
