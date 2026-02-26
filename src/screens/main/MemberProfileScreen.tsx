import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Switch, KeyboardAvoidingView,
  Platform, StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import {
  FamilyMember, HealthInfo, RootStackParamList,
  Allergy, Medication, Condition, EmergencyContact, Doctor,
} from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MemberProfile'>;
  route: RouteProp<RootStackParamList, 'MemberProfile'>;
};

type Section = 'general' | 'medical' | 'insurance' | 'emergency' | 'physicians' | null;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEVERITIES: Allergy['severity'][] = ['Mild', 'Moderate', 'Severe'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
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
  return (
    <View style={sec.card}>
      {/* Header row */}
      <TouchableOpacity
        style={sec.header}
        onPress={editing ? undefined : onToggle}
        activeOpacity={editing ? 1 : 0.7}
      >
        <Text style={sec.title}>{title}</Text>
        {editing ? (
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
        ) : (
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textTertiary}
          />
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {(isOpen || editing) && (
        <View style={sec.body}>
          {children}
        </View>
      )}
    </View>
  );
}

const sec = StyleSheet.create({
  card: { ...CARD, overflow: 'hidden', marginBottom: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '500' },
  saveBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 8, backgroundColor: COLORS.primary, minWidth: 52,
    alignItems: 'center',
  },
  saveText: { ...FONTS.bodySmall, color: '#fff', fontWeight: '700' },
  body: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.base },
});

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChangeText, placeholder, keyboardType, multiline, autoCapitalize }: {
  label?: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; autoCapitalize?: any;
}) {
  return (
    <View style={f.group}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <TextInput
        style={[f.input, multiline && f.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function DisplayRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  if (!value) return null;
  const inner = (
    <View style={f.row}>
      <Text style={f.rowLabel}>{label}</Text>
      <Text style={[f.rowValue, onPress && { color: COLORS.primary }]} numberOfLines={2}>{value}</Text>
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{inner}</TouchableOpacity> : inner;
}

function EditButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={f.editBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
      <Text style={f.editBtnText}>Edit</Text>
    </TouchableOpacity>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <Text style={f.emptyHint}>{text}</Text>;
}

const f = StyleSheet.create({
  group: { marginBottom: SPACING.base },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: SPACING.base, height: 46,
    fontSize: 15, color: COLORS.textPrimary,
  },
  inputMulti: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary, flex: 1 },
  rowValue: { ...FONTS.bodySmall, color: COLORS.textPrimary, fontWeight: '500', flex: 1.5, textAlign: 'right' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
    marginTop: SPACING.base, paddingVertical: 8, paddingHorizontal: SPACING.base,
    borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emptyHint: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontStyle: 'italic', paddingVertical: SPACING.sm },
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
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['general']));

  // General editable state
  const [eName, setEName] = useState('');
  const [eDob, setEDob] = useState('');
  const [eGender, setEGender] = useState('');
  const [eBlood, setEBlood] = useState('');
  const [eSsn, setESsn] = useState('');

  // Medical editable state
  const [eAllergies, setEAllergies] = useState<Allergy[]>([]);
  const [eMeds, setEMeds] = useState<Medication[]>([]);
  const [ePastSurgeries, setEPastSurgeries] = useState('');
  const [eConditions, setEConditions] = useState<Condition[]>([]);

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
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
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
    } finally {
      setLoading(false);
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
      setEAllergies(JSON.parse(JSON.stringify(healthInfo?.allergies || [])));
      setEMeds(JSON.parse(JSON.stringify(healthInfo?.medications || [])));
      setEPastSurgeries(healthInfo?.past_surgeries || '');
      setEConditions(JSON.parse(JSON.stringify(healthInfo?.conditions || [])));
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
          blood_type: eBlood || null,
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
          allergies: section === 'medical' ? eAllergies : (hi?.allergies || []),
          medications: section === 'medical' ? eMeds : (hi?.medications || []),
          conditions: section === 'medical' ? eConditions : (hi?.conditions || []),
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

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!member) return <View style={styles.loading}><Text style={FONTS.body}>Member not found.</Text></View>;

  const hi = healthInfo;
  const age = getAge(member.dob);
  const ssnDisplay = (member as any).ssn_last_four ? `•••–•••–${(member as any).ssn_last_four}` : undefined;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar + name header ── */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.heroName}>{member.full_name}</Text>
              {member.is_self && <View style={styles.selfBadge}><Text style={styles.selfBadgeText}>Me</Text></View>}
            </View>
            {member.dob ? (
              <Text style={styles.heroDob}>
                {new Date(member.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {age ? `  ·  ${age}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Quick action buttons ── */}
        <View style={styles.actionRow}>
          {[
            { icon: 'share-social-outline' as const, label: 'Share', onPress: () => navigation.navigate('ShareAccount', { memberId, memberName }) },
            { icon: 'calendar-outline' as const, label: 'Appointments', onPress: () => navigation.navigate('Appointments', { memberId, memberName }) },
            { icon: 'document-text-outline' as const, label: 'Documents', onPress: () => navigation.navigate('DocumentScanner', { memberId, memberName }) },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.onPress(); }} activeOpacity={0.7}>
              <View style={styles.actionIconBg}>
                <Ionicons name={a.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
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
              <FieldInput label="Full Name" value={eName} onChangeText={setEName} placeholder="First and last name" autoCapitalize="words" />
              <FieldInput label="Date of Birth" value={eDob} onChangeText={setEDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
              <View style={f.group}>
                <Text style={f.label}>GENDER</Text>
                <View style={f.chipRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g} style={[f.chip, eGender === g && f.chipActive]} onPress={() => setEGender(eGender === g ? '' : g)}>
                      <Text style={[f.chipText, eGender === g && f.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={f.group}>
                <Text style={f.label}>BLOOD TYPE</Text>
                <View style={f.chipRow}>
                  {BLOOD_TYPES.map(bt => (
                    <TouchableOpacity key={bt} style={[f.chip, eBlood === bt && f.chipActive]} onPress={() => setEBlood(eBlood === bt ? '' : bt)}>
                      <Text style={[f.chipText, eBlood === bt && f.chipTextActive]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <FieldInput label="SSN LAST 4" value={eSsn} onChangeText={(v) => setESsn(v.replace(/\D/g, '').slice(0, 4))} placeholder="1234" keyboardType="number-pad" autoCapitalize="none" />
            </>
          ) : (
            <>
              <DisplayRow label="Date of Birth" value={member.dob ? new Date(member.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined} />
              <DisplayRow label="Gender" value={member.gender ?? undefined} />
              <DisplayRow label="Blood Type" value={member.blood_type ?? undefined} />
              <DisplayRow label="SSN" value={ssnDisplay} />
              {!member.dob && !member.gender && !member.blood_type && <EmptyHint text="No details added yet." />}
              <EditButton onPress={() => startEditing('general')} />
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
              {/* Allergies */}
              <Text style={[f.label, { marginBottom: SPACING.sm }]}>ALLERGIES</Text>
              {eAllergies.map((a, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput style={f.input} value={a.name} onChangeText={v => { const u = [...eAllergies]; u[i].name = v; setEAllergies(u); }} placeholder="Allergy name" placeholderTextColor={COLORS.textTertiary} />
                    <View style={f.chipRow}>
                      {SEVERITIES.map(s => (
                        <TouchableOpacity key={s} style={[f.chip, a.severity === s && f.chipActive]} onPress={() => { const u = [...eAllergies]; u[i].severity = s; setEAllergies(u); }}>
                          <Text style={[f.chipText, a.severity === s && f.chipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setEAllergies(eAllergies.filter((_, j) => j !== i))} style={f.removeBtn}>
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={f.addBtn} onPress={() => setEAllergies([...eAllergies, { name: '', severity: 'Mild' }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={f.addBtnText}>Add Allergy</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base }} />

              {/* Medications */}
              <Text style={[f.label, { marginBottom: SPACING.sm }]}>CURRENT MEDICATIONS</Text>
              {eMeds.map((m, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput style={f.input} value={m.name} onChangeText={v => { const u = [...eMeds]; u[i].name = v; setEMeds(u); }} placeholder="Medication name" placeholderTextColor={COLORS.textTertiary} />
                    <TextInput style={f.input} value={m.dosage} onChangeText={v => { const u = [...eMeds]; u[i].dosage = v; setEMeds(u); }} placeholder="Dosage (e.g. 10mg)" placeholderTextColor={COLORS.textTertiary} />
                    <TextInput style={f.input} value={m.frequency} onChangeText={v => { const u = [...eMeds]; u[i].frequency = v; setEMeds(u); }} placeholder="Frequency (e.g. Once daily)" placeholderTextColor={COLORS.textTertiary} />
                  </View>
                  <TouchableOpacity onPress={() => setEMeds(eMeds.filter((_, j) => j !== i))} style={f.removeBtn}>
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={f.addBtn} onPress={() => setEMeds([...eMeds, { name: '', dosage: '', frequency: '' }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={f.addBtnText}>Add Medication</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base }} />

              {/* Past Surgeries */}
              <FieldInput label="PAST SURGERIES" value={ePastSurgeries} onChangeText={setEPastSurgeries} placeholder="Describe any past surgeries" multiline />

              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base }} />

              {/* Medical History */}
              <Text style={[f.label, { marginBottom: SPACING.sm }]}>PAST MEDICAL HISTORY</Text>
              {eConditions.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
                  <TextInput style={[f.input, { flex: 1 }]} value={c.name} onChangeText={v => { const u = [...eConditions]; u[i].name = v; setEConditions(u); }} placeholder="Condition or diagnosis" placeholderTextColor={COLORS.textTertiary} />
                  <TouchableOpacity onPress={() => setEConditions(eConditions.filter((_, j) => j !== i))} style={f.removeBtn}>
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={f.addBtn} onPress={() => setEConditions([...eConditions, { name: '' }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={f.addBtnText}>Add Condition</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* View: Allergies */}
              {(hi?.allergies?.length ?? 0) > 0 && (
                <View style={{ marginBottom: SPACING.base }}>
                  <Text style={[f.label, { marginBottom: 6 }]}>ALLERGIES</Text>
                  {hi!.allergies.map((a, i) => (
                    <View key={i} style={f.listItem}>
                      <View style={f.listItemContent}>
                        <Text style={f.listItemName}>{a.name}</Text>
                        <Text style={f.listItemSub}>{a.severity}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {/* View: Medications */}
              {(hi?.medications?.length ?? 0) > 0 && (
                <View style={{ marginBottom: SPACING.base }}>
                  <Text style={[f.label, { marginBottom: 6 }]}>CURRENT MEDICATIONS</Text>
                  {hi!.medications.map((m, i) => (
                    <View key={i} style={f.listItem}>
                      <View style={f.listItemContent}>
                        <Text style={f.listItemName}>{m.name}</Text>
                        {m.dosage ? <Text style={f.listItemSub}>{m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {/* View: Past Surgeries */}
              {hi?.past_surgeries ? (
                <View style={{ marginBottom: SPACING.base }}>
                  <Text style={[f.label, { marginBottom: 6 }]}>PAST SURGERIES</Text>
                  <Text style={{ ...FONTS.body, color: COLORS.textPrimary }}>{hi.past_surgeries}</Text>
                </View>
              ) : null}
              {/* View: Medical History */}
              {(hi?.conditions?.length ?? 0) > 0 && (
                <View style={{ marginBottom: SPACING.base }}>
                  <Text style={[f.label, { marginBottom: 6 }]}>PAST MEDICAL HISTORY</Text>
                  {hi!.conditions.map((c, i) => (
                    <View key={i} style={f.listItem}>
                      <Text style={f.listItemName}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!hi?.allergies?.length && !hi?.medications?.length && !hi?.past_surgeries && !hi?.conditions?.length && (
                <EmptyHint text="No medical information added yet." />
              )}
              <EditButton onPress={() => startEditing('medical')} />
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
              <DisplayRow label="Provider" value={hi?.insurance?.carrier} />
              <DisplayRow label="Policy Number" value={hi?.insurance?.policy_number} />
              {!hi?.insurance?.carrier && <EmptyHint text="No insurance information added yet." />}
              <EditButton onPress={() => startEditing('insurance')} />
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
              )) : <EmptyHint text="No emergency contacts added yet." />}
              <EditButton onPress={() => startEditing('emergency')} />
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
              ) : <EmptyHint text="No physician added yet." />}
              <EditButton onPress={() => startEditing('physicians')} />
            </>
          )}
        </SectionBlock>

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
    backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.3 },
  heroDob: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  selfBadge: { backgroundColor: COLORS.primaryMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  selfBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // Quick actions
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: SPACING.xl, gap: SPACING.sm,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionIconBg: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
