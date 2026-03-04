import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEditMember'>;
  route: RouteProp<RootStackParamList, 'AddEditMember'>;
};

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function defaultDob(): Date {
  const d = new Date(2000, 0, 1);
  return d;
}

function formatDob(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddEditMemberScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { memberId } = route.params ?? {};
  const isEditing = !!memberId;

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState<Date>(defaultDob());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [relationship, setRelationship] = useState('');

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this family member.');
      return;
    }
    setSaving(true);
    try {
      // Format DOB as YYYY-MM-DD without timezone shift
      const dobStr = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;

      const { error } = await supabase
        .from('family_members')
        .insert({
          owner_id: user?.id,
          full_name: fullName.trim(),
          dob: dobStr,
          relationship: relationship || null,
          is_self: false,
        });

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <FormInput
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="First and last name"
            autoCapitalize="words"
          />

          {/* DOB — spinner picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.dobBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDobPicker(v => !v);
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={17} color={COLORS.primary} />
              <Text style={styles.dobBtnText}>{formatDob(dob)}</Text>
              <Ionicons
                name={showDobPicker ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
            {showDobPicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={(_, date) => { if (date) setDob(date); }}
                  style={styles.picker}
                />
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setShowDobPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <FormInput
            label="Relationship"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Mother, Daughter, Husband"
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>Add Member</Text>}
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, paddingTop: SPACING.lg },
  card: { ...CARD, padding: SPACING.base, gap: SPACING.md, marginBottom: SPACING.xl },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: SPACING.base, height: 48,
    fontSize: 15, color: COLORS.textPrimary,
  },
  inputMulti: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  dobBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: SPACING.base, height: 48,
  },
  dobBtnText: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  pickerWrap: {
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, overflow: 'hidden',
  },
  picker: { height: 200 },
  pickerDone: {
    alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  pickerDoneText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
