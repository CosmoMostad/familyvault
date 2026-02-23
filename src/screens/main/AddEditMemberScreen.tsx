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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import {
  Allergy,
  Medication,
  Condition,
  Insurance,
  EmergencyContact,
  Doctor,
  RootStackParamList,
} from '../../lib/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEditMember'>;
  route: RouteProp<RootStackParamList, 'AddEditMember'>;
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEVERITIES: Allergy['severity'][] = ['Mild', 'Moderate', 'Severe'];

function SectionHeader({ title, emoji }: { title: string; emoji: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function AddItemButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity style={styles.addItemButton} onPress={onPress}>
      <Text style={styles.addItemText}>+ {label}</Text>
    </TouchableOpacity>
  );
}

export default function AddEditMemberScreen({ navigation, route }: Props) {
  const { memberId } = route.params || {};
  const isEditing = !!memberId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Basic
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Health info
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [insurance, setInsurance] = useState<Partial<Insurance>>({});
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [doctor, setDoctor] = useState<Partial<Doctor>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Member' : 'Add Member' });
    if (isEditing) fetchExistingData();
  }, []);

  async function fetchExistingData() {
    try {
      const [memberRes, healthRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('health_info').select('*').eq('member_id', memberId).single(),
      ]);

      if (memberRes.data) {
        setFullName(memberRes.data.full_name || '');
        setDob(memberRes.data.dob || '');
        setBloodType(memberRes.data.blood_type || '');
      }

      if (healthRes.data) {
        setAllergies(healthRes.data.allergies || []);
        setMedications(healthRes.data.medications || []);
        setConditions(healthRes.data.conditions || []);
        setInsurance(healthRes.data.insurance || {});
        setEmergencyContacts(healthRes.data.emergency_contacts || []);
        setDoctor(healthRes.data.primary_doctor || {});
        setNotes(healthRes.data.notes || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter the family member\'s name.');
      return;
    }
    setSaving(true);

    try {
      let targetMemberId = memberId;

      if (isEditing) {
        await supabase
          .from('family_members')
          .update({ full_name: fullName.trim(), dob: dob || null, blood_type: bloodType || null })
          .eq('id', memberId);
      } else {
        const { data, error } = await supabase
          .from('family_members')
          .insert({ full_name: fullName.trim(), dob: dob || null, blood_type: bloodType || null })
          .select()
          .single();

        if (error) throw error;
        targetMemberId = data.id;
      }

      const healthData = {
        member_id: targetMemberId,
        allergies,
        medications,
        conditions,
        insurance: insurance.carrier ? insurance : null,
        emergency_contacts: emergencyContacts,
        primary_doctor: doctor.name ? doctor : null,
        notes,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('health_info')
        .select('id')
        .eq('member_id', targetMemberId)
        .single();

      if (existing) {
        await supabase.from('health_info').update(healthData).eq('member_id', targetMemberId);
      } else {
        await supabase.from('health_info').insert(healthData);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  // Allergy helpers
  function updateAllergy(index: number, field: keyof Allergy, value: string) {
    const updated = [...allergies];
    (updated[index] as any)[field] = value;
    setAllergies(updated);
  }

  // Medication helpers
  function updateMedication(index: number, field: keyof Medication, value: string) {
    const updated = [...medications];
    (updated[index] as any)[field] = value;
    setMedications(updated);
  }

  // Condition helpers
  function updateCondition(index: number, field: keyof Condition, value: string) {
    const updated = [...conditions];
    (updated[index] as any)[field] = value;
    setConditions(updated);
  }

  // Contact helpers
  function updateContact(index: number, field: keyof EmergencyContact, value: string) {
    const updated = [...emergencyContacts];
    (updated[index] as any)[field] = value;
    setEmergencyContacts(updated);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Basic Info */}
        <View style={styles.card}>
          <SectionHeader emoji="👤" title="Basic Information" />

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jane Smith"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g. 1975-04-22)"
            placeholderTextColor="#9CA3AF"
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Blood Type</Text>
          <View style={styles.bloodTypeGrid}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.bloodTypeChip, bloodType === type && styles.bloodTypeChipSelected]}
                onPress={() => setBloodType(bloodType === type ? '' : type)}
              >
                <Text style={[styles.bloodTypeText, bloodType === type && styles.bloodTypeTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.card}>
          <SectionHeader emoji="⚠️" title="Allergies" />
          {allergies.map((a, i) => (
            <View key={i} style={styles.listItemCard}>
              <View style={styles.listItemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Allergy name (e.g. Penicillin)"
                  placeholderTextColor="#9CA3AF"
                  value={a.name}
                  onChangeText={(v) => updateAllergy(i, 'name', v)}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setAllergies(allergies.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.severityRow}>
                {SEVERITIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.severityChip, a.severity === s && styles.severityChipSelected]}
                    onPress={() => updateAllergy(i, 'severity', s)}
                  >
                    <Text style={[styles.severityText, a.severity === s && styles.severityTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <AddItemButton
            label="Add Allergy"
            onPress={() => setAllergies([...allergies, { name: '', severity: 'Mild' }])}
          />
        </View>

        {/* Medications */}
        <View style={styles.card}>
          <SectionHeader emoji="💊" title="Medications" />
          {medications.map((m, i) => (
            <View key={i} style={styles.listItemCard}>
              <View style={styles.listItemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Medication name"
                  placeholderTextColor="#9CA3AF"
                  value={m.name}
                  onChangeText={(v) => updateMedication(i, 'name', v)}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setMedications(medications.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Dosage (e.g. 10mg)"
                  placeholderTextColor="#9CA3AF"
                  value={m.dosage}
                  onChangeText={(v) => updateMedication(i, 'dosage', v)}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Frequency (e.g. Daily)"
                  placeholderTextColor="#9CA3AF"
                  value={m.frequency}
                  onChangeText={(v) => updateMedication(i, 'frequency', v)}
                />
              </View>
            </View>
          ))}
          <AddItemButton
            label="Add Medication"
            onPress={() => setMedications([...medications, { name: '', dosage: '', frequency: '' }])}
          />
        </View>

        {/* Conditions */}
        <View style={styles.card}>
          <SectionHeader emoji="🏥" title="Medical Conditions" />
          {conditions.map((c, i) => (
            <View key={i} style={styles.listItemCard}>
              <View style={styles.listItemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Condition (e.g. Type 2 Diabetes)"
                  placeholderTextColor="#9CA3AF"
                  value={c.name}
                  onChangeText={(v) => updateCondition(i, 'name', v)}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setConditions(conditions.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Notes (optional)"
                placeholderTextColor="#9CA3AF"
                value={c.notes}
                onChangeText={(v) => updateCondition(i, 'notes', v)}
              />
            </View>
          ))}
          <AddItemButton
            label="Add Condition"
            onPress={() => setConditions([...conditions, { name: '', notes: '' }])}
          />
        </View>

        {/* Primary Doctor */}
        <View style={styles.card}>
          <SectionHeader emoji="🩺" title="Primary Doctor" />
          <TextInput
            style={styles.input}
            placeholder="Doctor name"
            placeholderTextColor="#9CA3AF"
            value={doctor.name || ''}
            onChangeText={(v) => setDoctor({ ...doctor, name: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor="#9CA3AF"
            value={doctor.phone || ''}
            onChangeText={(v) => setDoctor({ ...doctor, phone: v })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#9CA3AF"
            value={doctor.address || ''}
            onChangeText={(v) => setDoctor({ ...doctor, address: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Specialty (e.g. Cardiologist)"
            placeholderTextColor="#9CA3AF"
            value={doctor.specialty || ''}
            onChangeText={(v) => setDoctor({ ...doctor, specialty: v })}
          />
        </View>

        {/* Insurance */}
        <View style={styles.card}>
          <SectionHeader emoji="📋" title="Insurance" />
          <TextInput
            style={styles.input}
            placeholder="Insurance carrier"
            placeholderTextColor="#9CA3AF"
            value={insurance.carrier || ''}
            onChangeText={(v) => setInsurance({ ...insurance, carrier: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Policy number"
            placeholderTextColor="#9CA3AF"
            value={insurance.policy_number || ''}
            onChangeText={(v) => setInsurance({ ...insurance, policy_number: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Group number"
            placeholderTextColor="#9CA3AF"
            value={insurance.group_number || ''}
            onChangeText={(v) => setInsurance({ ...insurance, group_number: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Member ID (optional)"
            placeholderTextColor="#9CA3AF"
            value={insurance.member_id || ''}
            onChangeText={(v) => setInsurance({ ...insurance, member_id: v })}
          />
        </View>

        {/* Emergency Contacts */}
        <View style={styles.card}>
          <SectionHeader emoji="📞" title="Emergency Contacts" />
          {emergencyContacts.map((c, i) => (
            <View key={i} style={styles.listItemCard}>
              <View style={styles.listItemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="Contact name"
                  placeholderTextColor="#9CA3AF"
                  value={c.name}
                  onChangeText={(v) => updateContact(i, 'name', v)}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setEmergencyContacts(emergencyContacts.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Phone"
                  placeholderTextColor="#9CA3AF"
                  value={c.phone}
                  onChangeText={(v) => updateContact(i, 'phone', v)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Relationship"
                  placeholderTextColor="#9CA3AF"
                  value={c.relationship}
                  onChangeText={(v) => updateContact(i, 'relationship', v)}
                />
              </View>
            </View>
          ))}
          <AddItemButton
            label="Add Emergency Contact"
            onPress={() => setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: '' }])}
          />
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <SectionHeader emoji="📝" title="Notes" />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional notes about this family member's health..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add to Vault'} 🔒</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionEmoji: { fontSize: 20, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B2A4A' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    marginBottom: 8,
  },
  bloodTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodTypeChip: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  bloodTypeChipSelected: { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
  bloodTypeText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  bloodTypeTextSelected: { color: '#B91C1C' },
  listItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  listItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexInput: { flex: 1, marginBottom: 0 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
  severityRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  severityChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  severityChipSelected: { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' },
  severityText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  severityTextSelected: { color: '#92400E', fontWeight: '700' },
  twoCol: { flexDirection: 'row', gap: 8, marginTop: 8 },
  halfInput: { flex: 1, marginBottom: 0 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  addItemButton: {
    borderWidth: 1.5,
    borderColor: '#00B4A6',
    borderRadius: 10,
    borderStyle: 'dashed',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addItemText: { color: '#00B4A6', fontSize: 14, fontWeight: '600' },
  saveButton: {
    backgroundColor: '#00B4A6',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#00B4A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
