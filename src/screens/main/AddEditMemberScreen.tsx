import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Allergy,
  Medication,
  Condition,
  Insurance,
  EmergencyContact,
  Doctor,
  RootStackParamList,
} from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEditMember'>;
  route: RouteProp<RootStackParamList, 'AddEditMember'>;
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEVERITIES: Allergy['severity'][] = ['Mild', 'Moderate', 'Severe'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  group: { gap: SPACING.xs },
  label: {
    ...FONTS.label,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 48,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
});

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={secStyles.row}>
      <View style={secStyles.iconBg}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <Text style={secStyles.title}>{title}</Text>
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, marginTop: SPACING.lg },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary },
});

export default function AddEditMemberScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { memberId, isSelf: isSelfParam } = route.params ?? {};
  const isEditing = !!memberId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Basic info
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSelf, setIsSelf] = useState(!!isSelfParam);

  // Health
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [notes, setNotes] = useState('');

  // Insurance
  const [insCarrier, setInsCarrier] = useState('');
  const [insPolicyNum, setInsPolicyNum] = useState('');
  const [insGroupNum, setInsGroupNum] = useState('');
  const [insMemberId, setInsMemberId] = useState('');

  // Doctor
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docAddress, setDocAddress] = useState('');

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Member' : 'Add Member',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
    });
    if (isEditing) loadMember();
  }, []);

  async function loadMember() {
    try {
      const [memberRes, healthRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('health_info').select('*').eq('member_id', memberId).single(),
      ]);
      if (memberRes.data) {
        const m = memberRes.data;
        setFullName(m.full_name || '');
        setDob(m.dob || '');
        setBloodType(m.blood_type || '');
        setRelationship(m.relationship || '');
        setGender(m.gender || '');
        setPhone(m.phone || '');
        setAddress((m as any).address || '');
        setIsSelf(m.is_self || false);
      }
      if (healthRes.data) {
        const h = healthRes.data;
        setAllergies(h.allergies || []);
        setMedications(h.medications || []);
        setConditions(h.conditions || []);
        setNotes(h.notes || '');
        if (h.insurance) {
          setInsCarrier(h.insurance.carrier || '');
          setInsPolicyNum(h.insurance.policy_number || '');
          setInsGroupNum(h.insurance.group_number || '');
          setInsMemberId(h.insurance.member_id || '');
        }
        if (h.primary_doctor) {
          setDocName(h.primary_doctor.name || '');
          setDocSpecialty(h.primary_doctor.specialty || '');
          setDocPhone(h.primary_doctor.phone || '');
          setDocAddress(h.primary_doctor.address || '');
        }
        setContacts(h.emergency_contacts || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this family member.');
      return;
    }
    setSaving(true);
    try {
      let mId = memberId;

      if (!isEditing) {
        const { data: newMember, error: mErr } = await supabase
          .from('family_members')
          .insert({
            owner_id: user?.id,
            full_name: fullName.trim(),
            dob: dob || null,
            blood_type: bloodType || null,
            relationship: relationship || null,
            gender: gender || null,
            phone: phone || null,
            address: address || null,
            is_self: isSelf,
          })
          .select()
          .single();
        if (mErr) throw mErr;
        mId = newMember.id;
      } else {
        const { error: mErr } = await supabase
          .from('family_members')
          .update({
            full_name: fullName.trim(),
            dob: dob || null,
            blood_type: bloodType || null,
            relationship: relationship || null,
            gender: gender || null,
            phone: phone || null,
            address: address || null,
            is_self: isSelf,
          })
          .eq('id', mId);
        if (mErr) throw mErr;
      }

      const insurance: Insurance | null =
        insCarrier || insPolicyNum || insGroupNum || insMemberId
          ? {
              carrier: insCarrier,
              policy_number: insPolicyNum,
              group_number: insGroupNum,
              member_id: insMemberId,
            }
          : null;

      const primaryDoctor: Doctor | null =
        docName
          ? { name: docName, specialty: docSpecialty, phone: docPhone, address: docAddress }
          : null;

      const healthData = {
        member_id: mId,
        allergies,
        medications,
        conditions,
        notes,
        insurance,
        primary_doctor: primaryDoctor,
        emergency_contacts: contacts,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('health_info')
        .select('id')
        .eq('member_id', mId)
        .single();

      if (existing) {
        await supabase.from('health_info').update(healthData).eq('member_id', mId);
      } else {
        await supabase.from('health_info').insert(healthData);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  function addAllergy() {
    setAllergies([...allergies, { name: '', severity: 'Mild' }]);
  }
  function removeAllergy(i: number) {
    setAllergies(allergies.filter((_, idx) => idx !== i));
  }
  function updateAllergy(i: number, field: keyof Allergy, val: string) {
    const updated = [...allergies];
    (updated[i] as any)[field] = val;
    setAllergies(updated);
  }

  function addMedication() {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  }
  function removeMedication(i: number) {
    setMedications(medications.filter((_, idx) => idx !== i));
  }
  function updateMedication(i: number, field: keyof Medication, val: string) {
    const updated = [...medications];
    (updated[i] as any)[field] = val;
    setMedications(updated);
  }

  function addCondition() {
    setConditions([...conditions, { name: '', notes: '' }]);
  }
  function removeCondition(i: number) {
    setConditions(conditions.filter((_, idx) => idx !== i));
  }
  function updateCondition(i: number, field: keyof Condition, val: string) {
    const updated = [...conditions];
    (updated[i] as any)[field] = val;
    setConditions(updated);
  }

  function addContact() {
    setContacts([...contacts, { name: '', phone: '', relationship: '' }]);
  }
  function removeContact(i: number) {
    setContacts(contacts.filter((_, idx) => idx !== i));
  }
  function updateContact(i: number, field: keyof EmergencyContact, val: string) {
    const updated = [...contacts];
    (updated[i] as any)[field] = val;
    setContacts(updated);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <SectionTitle icon="person-outline" title="Basic Information" />
        <View style={styles.card}>
          <FormInput label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="First and last name" autoCapitalize="words" />
          <FormInput label="Date of Birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
          <FormInput label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="e.g. Mother, Daughter, Husband" autoCapitalize="words" />
          <FormInput label="Phone" value={phone} onChangeText={setPhone} placeholder="(555) 555-0100" keyboardType="phone-pad" autoCapitalize="none" />
          <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="Street, City, State, ZIP" autoCapitalize="words" />

          <View style={inputStyles.group}>
            <Text style={inputStyles.label}>Blood Type</Text>
            <View style={styles.chipRow}>
              {BLOOD_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt}
                  style={[styles.selectChip, bloodType === bt && styles.selectChipActive]}
                  onPress={() => setBloodType(bloodType === bt ? '' : bt)}
                >
                  <Text style={[styles.selectChipText, bloodType === bt && styles.selectChipTextActive]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={inputStyles.group}>
            <Text style={inputStyles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.selectChip, gender === g && styles.selectChipActive]}
                  onPress={() => setGender(gender === g ? '' : g)}
                >
                  <Text style={[styles.selectChipText, gender === g && styles.selectChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!isSelfParam && (
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={inputStyles.label}>THIS IS MY OWN ACCOUNT</Text>
                <Text style={styles.switchDesc}>Mark if this health account belongs to you</Text>
              </View>
              <Switch
                value={isSelf}
                onValueChange={setIsSelf}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={isSelf ? COLORS.primary : COLORS.textTertiary}
                ios_backgroundColor={COLORS.border}
              />
            </View>
          )}
          {!!isSelfParam && (
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={inputStyles.label}>THIS IS MY OWN ACCOUNT</Text>
                <Text style={styles.switchDesc}>This profile belongs to you</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Allergies */}
        <SectionTitle icon="warning-outline" title="Allergies" />
        <View style={styles.card}>
          {allergies.map((a, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <TextInput
                  style={inputStyles.input}
                  value={a.name}
                  onChangeText={(v) => updateAllergy(i, 'name', v)}
                  placeholder="Allergy name"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <View style={styles.chipRow}>
                  {SEVERITIES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.selectChip, a.severity === s && styles.selectChipActive]}
                      onPress={() => updateAllergy(i, 'severity', s)}
                    >
                      <Text style={[styles.selectChipText, a.severity === s && styles.selectChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => removeAllergy(i)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addAllergy}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Add Allergy</Text>
          </TouchableOpacity>
        </View>

        {/* Medications */}
        <SectionTitle icon="medkit-outline" title="Medications" />
        <View style={styles.card}>
          {medications.map((m, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <TextInput
                  style={inputStyles.input}
                  value={m.name}
                  onChangeText={(v) => updateMedication(i, 'name', v)}
                  placeholder="Medication name"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TextInput
                  style={inputStyles.input}
                  value={m.dosage}
                  onChangeText={(v) => updateMedication(i, 'dosage', v)}
                  placeholder="Dosage (e.g. 10mg)"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TextInput
                  style={inputStyles.input}
                  value={m.frequency}
                  onChangeText={(v) => updateMedication(i, 'frequency', v)}
                  placeholder="Frequency (e.g. Once daily)"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
              <TouchableOpacity onPress={() => removeMedication(i)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addMedication}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        {/* Conditions */}
        <SectionTitle icon="fitness-outline" title="Medical Conditions" />
        <View style={styles.card}>
          {conditions.map((c, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <TextInput
                  style={inputStyles.input}
                  value={c.name}
                  onChangeText={(v) => updateCondition(i, 'name', v)}
                  placeholder="Condition name"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TextInput
                  style={[inputStyles.input, { height: 72, paddingTop: SPACING.sm }]}
                  value={c.notes}
                  onChangeText={(v) => updateCondition(i, 'notes', v)}
                  placeholder="Notes (optional)"
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                />
              </View>
              <TouchableOpacity onPress={() => removeCondition(i)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addCondition}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Add Condition</Text>
          </TouchableOpacity>
        </View>

        {/* Insurance */}
        <SectionTitle icon="shield-checkmark-outline" title="Insurance" />
        <View style={styles.card}>
          <FormInput label="Insurance Carrier" value={insCarrier} onChangeText={setInsCarrier} placeholder="e.g. Blue Cross" />
          <FormInput label="Policy Number" value={insPolicyNum} onChangeText={setInsPolicyNum} placeholder="Policy #" autoCapitalize="none" />
          <FormInput label="Group Number" value={insGroupNum} onChangeText={setInsGroupNum} placeholder="Group #" autoCapitalize="none" />
          <FormInput label="Member ID" value={insMemberId} onChangeText={setInsMemberId} placeholder="Member ID" autoCapitalize="none" />
        </View>

        {/* Primary Doctor */}
        <SectionTitle icon="person-outline" title="Primary Doctor" />
        <View style={styles.card}>
          <FormInput label="Doctor Name" value={docName} onChangeText={setDocName} placeholder="Dr. First Last" autoCapitalize="words" />
          <FormInput label="Specialty" value={docSpecialty} onChangeText={setDocSpecialty} placeholder="e.g. Family Medicine" autoCapitalize="words" />
          <FormInput label="Phone" value={docPhone} onChangeText={setDocPhone} placeholder="(555) 555-5555" keyboardType="phone-pad" autoCapitalize="none" />
          <FormInput label="Address" value={docAddress} onChangeText={setDocAddress} placeholder="Clinic address" autoCapitalize="sentences" />
        </View>

        {/* Emergency Contacts */}
        <SectionTitle icon="call-outline" title="Emergency Contacts" />
        <View style={styles.card}>
          {contacts.map((c, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <TextInput
                  style={inputStyles.input}
                  value={c.name}
                  onChangeText={(v) => updateContact(i, 'name', v)}
                  placeholder="Contact name"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                />
                <TextInput
                  style={inputStyles.input}
                  value={c.phone}
                  onChangeText={(v) => updateContact(i, 'phone', v)}
                  placeholder="Phone number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={inputStyles.input}
                  value={c.relationship}
                  onChangeText={(v) => updateContact(i, 'relationship', v)}
                  placeholder="Relationship (e.g. Spouse)"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                />
              </View>
              <TouchableOpacity onPress={() => removeContact(i)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addContact}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>Add Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <SectionTitle icon="create-outline" title="Notes" />
        <View style={styles.card}>
          <TextInput
            style={[inputStyles.input, { height: 100, paddingTop: SPACING.sm }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional health notes..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.textInverse} />
              <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Member'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, paddingTop: SPACING.sm },
  card: {
    ...CARD,
    padding: SPACING.base,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  selectChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  selectChipActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  selectChipText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '500' },
  selectChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  listItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  removeBtn: { paddingTop: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  addBtnText: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  switchDesc: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
});
