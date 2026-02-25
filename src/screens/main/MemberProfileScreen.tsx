// Additional SQL to run in Supabase (if not already done):
// alter table public.health_info
//   add column if not exists past_surgeries text default '',
//   add column if not exists healthcare_proxy jsonb;

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import {
  FamilyMember, HealthInfo, Document, RootStackParamList,
  Allergy, Medication, Condition, Insurance, EmergencyContact, Doctor, HealthcareProxy,
} from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MemberProfile'>;
  route: RouteProp<RootStackParamList, 'MemberProfile'>;
};

type Section =
  | 'personal' | 'allergies' | 'medications' | 'conditions'
  | 'insurance' | 'emergency' | 'proxy' | 'doctor' | 'notes' | null;

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
  return `${age} years old`;
}

function SectionHeader({
  icon, iconColor, title, editing, onEdit, onSave, onCancel, saving, isOpen, onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.secHeader}
      onPress={editing ? undefined : onToggle}
      activeOpacity={editing ? 1 : 0.7}
    >
      <View style={[styles.secIconBg, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={styles.secTitle}>{title}</Text>
      {editing ? (
        <View style={styles.secActions}>
          <TouchableOpacity onPress={onCancel} style={styles.secCancelBtn}>
            <Text style={styles.secCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSave} style={styles.secSaveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <Text style={styles.secSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={17} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={17}
            color={COLORS.textTertiary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

function FieldInput({
  label, value, onChangeText, placeholder, keyboardType, multiline, autoCapitalize,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
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

function InfoRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  if (!value) return null;
  const content = (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, onPress && { color: COLORS.primary }]} numberOfLines={2}>{value}</Text>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

export default function MemberProfileScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section>(null);
  const [saving, setSaving] = useState(false);
  const ALL_SECTIONS: NonNullable<Section>[] = ['personal','allergies','medications','conditions','insurance','emergency','proxy','doctor','notes'];
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']));

  function toggleSection(section: NonNullable<Section>) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  // Editable state — personal
  const [eName, setEName] = useState('');
  const [eDob, setEDob] = useState('');
  const [eBlood, setEBlood] = useState('');
  const [eGender, setEGender] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eAddress, setEAddress] = useState('');
  const [eRelationship, setERelationship] = useState('');
  const [eIsSelf, setEIsSelf] = useState(false);

  // Editable state — allergies
  const [eAllergies, setEAllergies] = useState<Allergy[]>([]);

  // Editable state — medications
  const [eMeds, setEMeds] = useState<Medication[]>([]);

  // Editable state — conditions + past surgeries
  const [eConditions, setEConditions] = useState<Condition[]>([]);
  const [ePastSurgeries, setEPastSurgeries] = useState('');

  // Editable state — insurance
  const [eInsCarrier, setEInsCarrier] = useState('');
  const [eInsPolicyNum, setEInsPolicyNum] = useState('');
  const [eInsGroupNum, setEInsGroupNum] = useState('');
  const [eInsMemberId, setEInsMemberId] = useState('');

  // Editable state — emergency contacts
  const [eContacts, setEContacts] = useState<EmergencyContact[]>([]);

  // Editable state — healthcare proxy
  const [eProxyName, setEProxyName] = useState('');
  const [eProxyPhone, setEProxyPhone] = useState('');
  const [eProxyEmail, setEProxyEmail] = useState('');
  const [eProxyRelationship, setEProxyRelationship] = useState('');

  // Editable state — doctor
  const [eDocName, setEDocName] = useState('');
  const [eDocSpecialty, setEDocSpecialty] = useState('');
  const [eDocPhone, setEDocPhone] = useState('');
  const [eDocAddress, setEDocAddress] = useState('');

  // Editable state — notes
  const [eNotes, setENotes] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: memberName,
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
    });
  }, [memberName]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [memberId])
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [memberRes, healthRes, docsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('health_info').select('*').eq('member_id', memberId).single(),
        supabase.from('documents').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      ]);
      if (memberRes.data) setMember(memberRes.data);
      if (healthRes.data) setHealthInfo(healthRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(section: Section) {
    if (!member || !section) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingSection(section);
    // Auto-open the section when editing starts
    setOpenSections((prev) => { const next = new Set(prev); next.add(section); return next; });
    if (section === 'personal') {
      setEName(member.full_name || '');
      setEDob(member.dob || '');
      setEBlood(member.blood_type || '');
      setEGender(member.gender || '');
      setEPhone(member.phone || '');
      setEAddress((member as any).address || '');
      setERelationship(member.relationship || '');
      setEIsSelf(member.is_self || false);
    } else if (section === 'allergies') {
      setEAllergies(JSON.parse(JSON.stringify(healthInfo?.allergies || [])));
    } else if (section === 'medications') {
      setEMeds(JSON.parse(JSON.stringify(healthInfo?.medications || [])));
    } else if (section === 'conditions') {
      setEConditions(JSON.parse(JSON.stringify(healthInfo?.conditions || [])));
      setEPastSurgeries(healthInfo?.past_surgeries || '');
    } else if (section === 'insurance') {
      setEInsCarrier(healthInfo?.insurance?.carrier || '');
      setEInsPolicyNum(healthInfo?.insurance?.policy_number || '');
      setEInsGroupNum(healthInfo?.insurance?.group_number || '');
      setEInsMemberId(healthInfo?.insurance?.member_id || '');
    } else if (section === 'emergency') {
      setEContacts(JSON.parse(JSON.stringify(healthInfo?.emergency_contacts || [])));
    } else if (section === 'proxy') {
      setEProxyName(healthInfo?.healthcare_proxy?.name || '');
      setEProxyPhone(healthInfo?.healthcare_proxy?.phone || '');
      setEProxyEmail(healthInfo?.healthcare_proxy?.email || '');
      setEProxyRelationship(healthInfo?.healthcare_proxy?.relationship || '');
    } else if (section === 'doctor') {
      setEDocName(healthInfo?.primary_doctor?.name || '');
      setEDocSpecialty(healthInfo?.primary_doctor?.specialty || '');
      setEDocPhone(healthInfo?.primary_doctor?.phone || '');
      setEDocAddress(healthInfo?.primary_doctor?.address || '');
    } else if (section === 'notes') {
      setENotes(healthInfo?.notes || '');
    }
  }

  function cancelEditing() {
    setEditingSection(null);
  }

  async function saveSection(section: Section) {
    setSaving(true);
    try {
      if (section === 'personal') {
        await supabase.from('family_members').update({
          full_name: eName.trim(),
          dob: eDob || null,
          blood_type: eBlood || null,
          gender: eGender || null,
          phone: ePhone || null,
          address: eAddress || null,
          relationship: eRelationship || null,
          is_self: eIsSelf,
        }).eq('id', memberId);
      } else {
        const current = healthInfo;
        const insurance: Insurance | null = eInsCarrier || eInsPolicyNum || eInsGroupNum || eInsMemberId
          ? { carrier: eInsCarrier, policy_number: eInsPolicyNum, group_number: eInsGroupNum, member_id: eInsMemberId }
          : null;
        const doctor: Doctor | null = eDocName
          ? { name: eDocName, specialty: eDocSpecialty, phone: eDocPhone, address: eDocAddress }
          : null;
        const proxy: HealthcareProxy | null = eProxyName
          ? { name: eProxyName, phone: eProxyPhone, email: eProxyEmail, relationship: eProxyRelationship }
          : null;

        const updatePayload: any = {
          member_id: memberId,
          allergies: section === 'allergies' ? eAllergies : (current?.allergies || []),
          medications: section === 'medications' ? eMeds : (current?.medications || []),
          conditions: section === 'conditions' ? eConditions : (current?.conditions || []),
          past_surgeries: section === 'conditions' ? ePastSurgeries : (current?.past_surgeries || ''),
          insurance: section === 'insurance' ? insurance : (current?.insurance ?? null),
          emergency_contacts: section === 'emergency' ? eContacts : (current?.emergency_contacts || []),
          healthcare_proxy: section === 'proxy' ? proxy : (current?.healthcare_proxy ?? null),
          primary_doctor: section === 'doctor' ? doctor : (current?.primary_doctor ?? null),
          notes: section === 'notes' ? eNotes : (current?.notes || ''),
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase.from('health_info').select('id').eq('member_id', memberId).single();
        if (existing) {
          await supabase.from('health_info').update(updatePayload).eq('member_id', memberId);
        } else {
          await supabase.from('health_info').insert(updatePayload);
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingSection(null);
      fetchData();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loading}>
        <Text style={FONTS.body}>Member not found.</Text>
      </View>
    );
  }

  const hi = healthInfo;
  const age = getAge(member.dob);

  const severityBg: Record<string, string> = { Mild: COLORS.primaryMuted, Moderate: COLORS.amberLight, Severe: COLORS.roseLight };
  const severityTxt: Record<string, string> = { Mild: COLORS.primary, Moderate: COLORS.amber, Severe: COLORS.rose };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{getInitials(member.full_name)}</Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>{member.full_name}</Text>
              {member.is_self && (
                <View style={styles.selfBadge}><Text style={styles.selfBadgeText}>Me</Text></View>
              )}
            </View>
            {member.relationship && (
              <Text style={styles.heroRelationship}>{member.relationship}</Text>
            )}
            {age ? <Text style={styles.heroAge}>{age}</Text> : null}
            {member.blood_type && (
              <View style={styles.bloodBadge}>
                <Ionicons name="water" size={11} color={COLORS.rose} />
                <Text style={styles.bloodText}>{member.blood_type}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.actionRow}>
          {[
            { icon: 'share-social-outline' as const, label: 'Share', onPress: () => navigation.navigate('ShareAccount', { memberId, memberName }) },
            { icon: 'calendar-outline' as const, label: 'Appointments', onPress: () => navigation.navigate('Appointments', { memberId, memberName }) },
            { icon: 'document-text-outline' as const, label: 'Documents', onPress: () => navigation.navigate('DocumentScanner', { memberId, memberName }) },
          ].map((a, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.onPress(); }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name={a.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Personal Info ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="person-outline" iconColor={COLORS.primary} title="Personal Info"
            editing={editingSection === 'personal'} saving={saving}
            onEdit={() => startEditing('personal')}
            onSave={() => saveSection('personal')}
            onCancel={cancelEditing}
            isOpen={openSections.has('personal')}
            onToggle={() => toggleSection('personal')}
          />
          {(openSections.has('personal') || editingSection === 'personal') ? editingSection === 'personal' ? (
            <View style={styles.editBody}>
              <FieldInput label="Full Name *" value={eName} onChangeText={setEName} placeholder="First and last name" autoCapitalize="words" />
              <FieldInput label="Date of Birth" value={eDob} onChangeText={setEDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
              <FieldInput label="Relationship" value={eRelationship} onChangeText={setERelationship} placeholder="e.g. Mother, Daughter, Husband" autoCapitalize="words" />
              <FieldInput label="Phone" value={ePhone} onChangeText={setEPhone} placeholder="(555) 555-0100" keyboardType="phone-pad" autoCapitalize="none" />
              <FieldInput label="Address" value={eAddress} onChangeText={setEAddress} placeholder="Street, City, State, ZIP" multiline autoCapitalize="words" />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Blood Type</Text>
                <View style={styles.chipRow}>
                  {BLOOD_TYPES.map((bt) => (
                    <TouchableOpacity key={bt} style={[styles.optChip, eBlood === bt && styles.optChipActive]} onPress={() => setEBlood(eBlood === bt ? '' : bt)}>
                      <Text style={[styles.optChipText, eBlood === bt && styles.optChipTextActive]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity key={g} style={[styles.optChip, eGender === g && styles.optChipActive]} onPress={() => setEGender(eGender === g ? '' : g)}>
                      <Text style={[styles.optChipText, eGender === g && styles.optChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>This is my own account</Text>
                <Switch
                  value={eIsSelf}
                  onValueChange={setEIsSelf}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={eIsSelf ? COLORS.primary : COLORS.textTertiary}
                  ios_backgroundColor={COLORS.border}
                />
              </View>
            </View>
          ) : (
            <View style={styles.viewBody}>
              <InfoRow label="Date of Birth" value={member.dob ? new Date(member.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
              <InfoRow label="Gender" value={member.gender ?? undefined} />
              <InfoRow label="Phone" value={member.phone ?? undefined} onPress={member.phone ? () => Linking.openURL(`tel:${member.phone}`) : undefined} />
              <InfoRow label="Address" value={(member as any).address ?? undefined} />
              {!member.dob && !member.gender && !member.phone && (
                <Text style={styles.emptyText}>No personal details added yet. Tap the pencil to edit.</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Allergies ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="warning-outline" iconColor={COLORS.amber} title="Allergies"
            editing={editingSection === 'allergies'} saving={saving}
            onEdit={() => startEditing('allergies')}
            onSave={() => saveSection('allergies')}
            onCancel={cancelEditing}
            isOpen={openSections.has('allergies')}
            onToggle={() => toggleSection('allergies')}
          />
          {(openSections.has('allergies') || editingSection === 'allergies') ? editingSection === 'allergies' ? (
            <View style={styles.editBody}>
              {eAllergies.map((a, i) => (
                <View key={i} style={styles.listEditItem}>
                  <View style={{ flex: 1, gap: SPACING.sm }}>
                    <TextInput style={styles.fieldInput} value={a.name} onChangeText={(v) => { const u = [...eAllergies]; u[i].name = v; setEAllergies(u); }} placeholder="Allergy name" placeholderTextColor={COLORS.textTertiary} />
                    <View style={styles.chipRow}>
                      {SEVERITIES.map((s) => (
                        <TouchableOpacity key={s} style={[styles.optChip, a.severity === s && styles.optChipActive]} onPress={() => { const u = [...eAllergies]; u[i].severity = s; setEAllergies(u); }}>
                          <Text style={[styles.optChipText, a.severity === s && styles.optChipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setEAllergies(eAllergies.filter((_, idx) => idx !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => setEAllergies([...eAllergies, { name: '', severity: 'Mild' }])}>
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.addRowText}>Add Allergy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.allergies?.length ? (
                <View style={styles.chipsWrap}>
                  {hi.allergies.map((a, i) => (
                    <View key={i} style={[styles.chip, { backgroundColor: severityBg[a.severity] || COLORS.surfaceAlt }]}>
                      <Text style={[styles.chipText, { color: severityTxt[a.severity] || COLORS.textSecondary }]}>{a.name}</Text>
                      <Text style={[styles.chipSub, { color: severityTxt[a.severity] || COLORS.textTertiary }]}>{a.severity}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No known allergies</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Medications ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="medkit-outline" iconColor={COLORS.primary} title="Medications"
            editing={editingSection === 'medications'} saving={saving}
            onEdit={() => startEditing('medications')}
            onSave={() => saveSection('medications')}
            onCancel={cancelEditing}
            isOpen={openSections.has('medications')}
            onToggle={() => toggleSection('medications')}
          />
          {(openSections.has('medications') || editingSection === 'medications') ? editingSection === 'medications' ? (
            <View style={styles.editBody}>
              {eMeds.map((m, i) => (
                <View key={i} style={styles.listEditItem}>
                  <View style={{ flex: 1, gap: SPACING.sm }}>
                    <TextInput style={styles.fieldInput} value={m.name} onChangeText={(v) => { const u = [...eMeds]; u[i].name = v; setEMeds(u); }} placeholder="Medication name" placeholderTextColor={COLORS.textTertiary} />
                    <TextInput style={styles.fieldInput} value={m.dosage} onChangeText={(v) => { const u = [...eMeds]; u[i].dosage = v; setEMeds(u); }} placeholder="Dosage (e.g. 10mg)" placeholderTextColor={COLORS.textTertiary} />
                    <TextInput style={styles.fieldInput} value={m.frequency} onChangeText={(v) => { const u = [...eMeds]; u[i].frequency = v; setEMeds(u); }} placeholder="Frequency (e.g. Once daily)" placeholderTextColor={COLORS.textTertiary} />
                  </View>
                  <TouchableOpacity onPress={() => setEMeds(eMeds.filter((_, idx) => idx !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => setEMeds([...eMeds, { name: '', dosage: '', frequency: '' }])}>
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.addRowText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.medications?.length ? (
                hi.medications.map((m, i) => (
                  <View key={i} style={[styles.listRow, i < hi.medications.length - 1 && styles.listRowBorder]}>
                    <Text style={styles.listRowTitle}>{m.name}</Text>
                    <Text style={styles.listRowSub}>{m.dosage}{m.dosage && m.frequency ? ' · ' : ''}{m.frequency}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No medications listed</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Medical History ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="fitness-outline" iconColor={COLORS.rose} title="Medical History"
            editing={editingSection === 'conditions'} saving={saving}
            onEdit={() => startEditing('conditions')}
            onSave={() => saveSection('conditions')}
            onCancel={cancelEditing}
            isOpen={openSections.has('conditions')}
            onToggle={() => toggleSection('conditions')}
          />
          {(openSections.has('conditions') || editingSection === 'conditions') ? editingSection === 'conditions' ? (
            <View style={styles.editBody}>
              <Text style={styles.subSectionLabel}>Conditions / Diagnoses</Text>
              {eConditions.map((c, i) => (
                <View key={i} style={styles.listEditItem}>
                  <View style={{ flex: 1, gap: SPACING.sm }}>
                    <TextInput style={styles.fieldInput} value={c.name} onChangeText={(v) => { const u = [...eConditions]; u[i].name = v; setEConditions(u); }} placeholder="Condition name" placeholderTextColor={COLORS.textTertiary} />
                    <TextInput style={[styles.fieldInput, styles.fieldInputMulti]} value={c.notes || ''} onChangeText={(v) => { const u = [...eConditions]; u[i].notes = v; setEConditions(u); }} placeholder="Notes (optional)" placeholderTextColor={COLORS.textTertiary} multiline numberOfLines={2} />
                  </View>
                  <TouchableOpacity onPress={() => setEConditions(eConditions.filter((_, idx) => idx !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => setEConditions([...eConditions, { name: '', notes: '' }])}>
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.addRowText}>Add Condition</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <FieldInput label="Past Surgeries & Procedures" value={ePastSurgeries} onChangeText={setEPastSurgeries} placeholder="Describe any past surgeries or major procedures..." multiline />
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.conditions?.length ? (
                hi.conditions.map((c, i) => (
                  <View key={i} style={[styles.listRow, i < hi.conditions.length - 1 && styles.listRowBorder]}>
                    <Text style={styles.listRowTitle}>{c.name}</Text>
                    {c.notes ? <Text style={styles.listRowSub}>{c.notes}</Text> : null}
                  </View>
                ))
              ) : null}
              {hi?.past_surgeries ? (
                <>
                  {hi.conditions?.length ? <View style={styles.divider} /> : null}
                  <Text style={styles.subSectionLabel}>Past Surgeries</Text>
                  <Text style={styles.listRowSub}>{hi.past_surgeries}</Text>
                </>
              ) : null}
              {!hi?.conditions?.length && !hi?.past_surgeries && (
                <Text style={styles.emptyText}>No medical history on file</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Insurance ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="card-outline" iconColor={COLORS.amber} title="Insurance"
            editing={editingSection === 'insurance'} saving={saving}
            onEdit={() => startEditing('insurance')}
            onSave={() => saveSection('insurance')}
            onCancel={cancelEditing}
            isOpen={openSections.has('insurance')}
            onToggle={() => toggleSection('insurance')}
          />
          {(openSections.has('insurance') || editingSection === 'insurance') ? editingSection === 'insurance' ? (
            <View style={styles.editBody}>
              <FieldInput label="Insurance Carrier" value={eInsCarrier} onChangeText={setEInsCarrier} placeholder="e.g. Blue Cross Blue Shield" />
              <FieldInput label="Policy Number" value={eInsPolicyNum} onChangeText={setEInsPolicyNum} placeholder="Policy number" autoCapitalize="none" />
              <FieldInput label="Group Number" value={eInsGroupNum} onChangeText={setEInsGroupNum} placeholder="Group number" autoCapitalize="none" />
              <FieldInput label="Member ID" value={eInsMemberId} onChangeText={setEInsMemberId} placeholder="Member ID" autoCapitalize="none" />
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.insurance ? (
                <>
                  <InfoRow label="Carrier" value={hi.insurance.carrier} />
                  <InfoRow label="Policy" value={hi.insurance.policy_number} />
                  <InfoRow label="Group" value={hi.insurance.group_number} />
                  <InfoRow label="Member ID" value={hi.insurance.member_id} />
                </>
              ) : (
                <Text style={styles.emptyText}>No insurance information added</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Emergency Contacts ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="call-outline" iconColor={COLORS.rose} title="Emergency Contacts"
            editing={editingSection === 'emergency'} saving={saving}
            onEdit={() => startEditing('emergency')}
            onSave={() => saveSection('emergency')}
            onCancel={cancelEditing}
            isOpen={openSections.has('emergency')}
            onToggle={() => toggleSection('emergency')}
          />
          {(openSections.has('emergency') || editingSection === 'emergency') ? editingSection === 'emergency' ? (
            <View style={styles.editBody}>
              {eContacts.map((c, i) => (
                <View key={i} style={styles.listEditItem}>
                  <View style={{ flex: 1, gap: SPACING.sm }}>
                    <TextInput style={styles.fieldInput} value={c.name} onChangeText={(v) => { const u = [...eContacts]; u[i].name = v; setEContacts(u); }} placeholder="Name" placeholderTextColor={COLORS.textTertiary} autoCapitalize="words" />
                    <TextInput style={styles.fieldInput} value={c.phone} onChangeText={(v) => { const u = [...eContacts]; u[i].phone = v; setEContacts(u); }} placeholder="Phone number" placeholderTextColor={COLORS.textTertiary} keyboardType="phone-pad" />
                    <TextInput style={styles.fieldInput} value={c.relationship} onChangeText={(v) => { const u = [...eContacts]; u[i].relationship = v; setEContacts(u); }} placeholder="Relationship (e.g. Spouse)" placeholderTextColor={COLORS.textTertiary} autoCapitalize="words" />
                  </View>
                  <TouchableOpacity onPress={() => setEContacts(eContacts.filter((_, idx) => idx !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => setEContacts([...eContacts, { name: '', phone: '', relationship: '' }])}>
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.addRowText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.emergency_contacts?.length ? (
                hi.emergency_contacts.map((c, i) => (
                  <View key={i} style={[styles.contactRow, i < hi.emergency_contacts.length - 1 && styles.listRowBorder]}>
                    <View>
                      <Text style={styles.listRowTitle}>{c.name}</Text>
                      <Text style={styles.listRowSub}>{c.relationship}</Text>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)} style={styles.callBtn}>
                      <Ionicons name="call-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.callText}>{c.phone}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No emergency contacts added</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Healthcare Proxy ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="shield-checkmark-outline" iconColor={COLORS.primary} title="Healthcare Proxy"
            editing={editingSection === 'proxy'} saving={saving}
            onEdit={() => startEditing('proxy')}
            onSave={() => saveSection('proxy')}
            onCancel={cancelEditing}
            isOpen={openSections.has('proxy')}
            onToggle={() => toggleSection('proxy')}
          />
          {(openSections.has('proxy') || editingSection === 'proxy') ? editingSection === 'proxy' ? (
            <View style={styles.editBody}>
              <Text style={styles.proxyHint}>A healthcare proxy can make medical decisions on behalf of this person if they are unable to.</Text>
              <FieldInput label="Proxy Name" value={eProxyName} onChangeText={setEProxyName} placeholder="Full name" autoCapitalize="words" />
              <FieldInput label="Relationship" value={eProxyRelationship} onChangeText={setEProxyRelationship} placeholder="e.g. Spouse, Adult Child" autoCapitalize="words" />
              <FieldInput label="Phone" value={eProxyPhone} onChangeText={setEProxyPhone} placeholder="Phone number" keyboardType="phone-pad" autoCapitalize="none" />
              <FieldInput label="Email" value={eProxyEmail} onChangeText={setEProxyEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.healthcare_proxy ? (
                <>
                  <InfoRow label="Name" value={hi.healthcare_proxy.name} />
                  <InfoRow label="Relationship" value={hi.healthcare_proxy.relationship} />
                  <InfoRow label="Phone" value={hi.healthcare_proxy.phone} onPress={() => Linking.openURL(`tel:${hi.healthcare_proxy!.phone}`)} />
                  <InfoRow label="Email" value={hi.healthcare_proxy.email} onPress={() => Linking.openURL(`mailto:${hi.healthcare_proxy!.email}`)} />
                </>
              ) : (
                <Text style={styles.emptyText}>No healthcare proxy designated</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Primary Doctor ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="person-circle-outline" iconColor={COLORS.primary} title="Primary Doctor"
            editing={editingSection === 'doctor'} saving={saving}
            onEdit={() => startEditing('doctor')}
            onSave={() => saveSection('doctor')}
            onCancel={cancelEditing}
            isOpen={openSections.has('doctor')}
            onToggle={() => toggleSection('doctor')}
          />
          {(openSections.has('doctor') || editingSection === 'doctor') ? editingSection === 'doctor' ? (
            <View style={styles.editBody}>
              <FieldInput label="Doctor Name" value={eDocName} onChangeText={setEDocName} placeholder="Dr. First Last" autoCapitalize="words" />
              <FieldInput label="Specialty" value={eDocSpecialty} onChangeText={setEDocSpecialty} placeholder="e.g. Family Medicine, Pediatrics" autoCapitalize="words" />
              <FieldInput label="Phone" value={eDocPhone} onChangeText={setEDocPhone} placeholder="Clinic phone number" keyboardType="phone-pad" autoCapitalize="none" />
              <FieldInput label="Address" value={eDocAddress} onChangeText={setEDocAddress} placeholder="Clinic address" autoCapitalize="words" />
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.primary_doctor ? (
                <>
                  <InfoRow label="Doctor" value={hi.primary_doctor.name} />
                  <InfoRow label="Specialty" value={hi.primary_doctor.specialty} />
                  <InfoRow label="Phone" value={hi.primary_doctor.phone} onPress={() => Linking.openURL(`tel:${hi.primary_doctor!.phone}`)} />
                  <InfoRow label="Address" value={hi.primary_doctor.address} />
                </>
              ) : (
                <Text style={styles.emptyText}>No primary doctor on file</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Notes ── */}
        <View style={styles.card}>
          <SectionHeader
            icon="create-outline" iconColor={COLORS.textSecondary} title="Notes"
            editing={editingSection === 'notes'} saving={saving}
            onEdit={() => startEditing('notes')}
            onSave={() => saveSection('notes')}
            onCancel={cancelEditing}
            isOpen={openSections.has('notes')}
            onToggle={() => toggleSection('notes')}
          />
          {(openSections.has('notes') || editingSection === 'notes') ? editingSection === 'notes' ? (
            <View style={styles.editBody}>
              <TextInput
                style={[styles.fieldInput, { height: 100, textAlignVertical: 'top', paddingTop: SPACING.sm }]}
                value={eNotes}
                onChangeText={setENotes}
                placeholder="Add any additional notes here..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />
            </View>
          ) : (
            <View style={styles.viewBody}>
              {hi?.notes ? (
                <Text style={[styles.listRowSub, { lineHeight: 21 }]}>{hi.notes}</Text>
              ) : (
                <Text style={styles.emptyText}>No notes added</Text>
              )}
            </View>
          ) : null}
        </View>

        {/* ── Documents ── */}
        {documents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.secHeader}>
              <View style={[styles.secIconBg, { backgroundColor: `${COLORS.primary}18` }]}>
                <Ionicons name="document-text-outline" size={17} color={COLORS.primary} />
              </View>
              <Text style={styles.secTitle}>Documents</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DocumentScanner', { memberId, memberName })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.seeAllText}>See All ({documents.length})</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.viewBody}>
              <Text style={styles.listRowSub}>{documents.length} document{documents.length !== 1 ? 's' : ''} stored securely</Text>
            </View>
          </View>
        )}

        {/* ── Sharing ── */}
        <View style={styles.card}>
          <View style={styles.secHeader}>
            <View style={[styles.secIconBg, { backgroundColor: `${COLORS.primary}18` }]}>
              <Ionicons name="share-social-outline" size={17} color={COLORS.primary} />
            </View>
            <Text style={styles.secTitle}>Sharing</Text>
          </View>
          <View style={styles.viewBody}>
            <Text style={styles.emptyText}>Control who has access to this account.</Text>
            <TouchableOpacity
              style={styles.shareAccountBtn}
              onPress={() => navigation.navigate('ShareAccount', { memberId, memberName })}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.shareAccountBtnText}>Share this account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: SPACING.base, paddingBottom: SPACING.xl },

  hero: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl, borderRadius: 20,
    padding: SPACING.xl, marginBottom: SPACING.md, gap: SPACING.base,
  },
  heroAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroAvatarText: { ...FONTS.h2, color: COLORS.textInverse, fontWeight: '800' },
  heroInfo: { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 2 },
  heroName: { ...FONTS.h3, color: COLORS.textInverse },
  selfBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  selfBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textInverse },
  heroRelationship: { ...FONTS.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  heroAge: { ...FONTS.bodySmall, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  bloodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.roseLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  bloodText: { fontSize: 12, fontWeight: '700', color: COLORS.rose },

  actionRow: { flexDirection: 'row', marginHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: { flex: 1, ...CARD, alignItems: 'center', paddingVertical: SPACING.md },
  actionIconBg: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs,
  },
  actionLabel: { ...FONTS.caption, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },

  card: { ...CARD, marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, overflow: 'hidden' },
  secHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: SPACING.sm },
  secIconBg: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  secTitle: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1 },
  secActions: { flexDirection: 'row', gap: SPACING.sm },
  secCancelBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  secCancelText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '600' },
  secSaveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    minWidth: 48, alignItems: 'center',
  },
  secSaveText: { ...FONTS.bodySmall, color: COLORS.textInverse, fontWeight: '700' },
  seeAllText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },

  viewBody: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.base, gap: SPACING.xs },
  editBody: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.base, gap: SPACING.md },

  emptyText: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontStyle: 'italic' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.xs },
  infoLabel: { ...FONTS.bodySmall, color: COLORS.textTertiary, flex: 1 },
  infoValue: { ...FONTS.bodySmall, color: COLORS.textPrimary, flex: 2, textAlign: 'right' },

  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...FONTS.label, color: COLORS.textSecondary, textTransform: 'uppercase', fontSize: 11 },
  fieldInput: {
    backgroundColor: COLORS.background, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 44,
    ...FONTS.body, color: COLORS.textPrimary,
  },
  fieldInputMulti: { height: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 10, backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  optChipActive: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary },
  optChipText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '500' },
  optChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  switchLabel: { ...FONTS.body, color: COLORS.textPrimary },

  listEditItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingTop: SPACING.xs },
  addRowText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { ...FONTS.bodySmall, fontWeight: '700' },
  chipSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  listRow: { paddingVertical: SPACING.sm },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  listRowTitle: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600' },
  listRowSub: { ...FONTS.bodySmall, color: COLORS.textSecondary },

  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryMuted, borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  callText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },

  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.sm },
  subSectionLabel: { ...FONTS.label, color: COLORS.textTertiary, textTransform: 'uppercase', marginBottom: SPACING.xs },
  proxyHint: { ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 20, fontStyle: 'italic' },

  shareAccountBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  shareAccountBtnText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
});
