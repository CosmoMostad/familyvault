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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupSelf'>;
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function SetupSelfScreen({ navigation }: Props) {
  const { session, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(goToProfile: boolean) {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const userId = session?.user.id;

      // Create the self health account
      const { data: member, error: mErr } = await supabase
        .from('family_members')
        .insert({
          owner_id: userId,
          full_name: fullName.trim(),
          dob: dob || null,
          blood_type: bloodType || null,
          gender: gender || null,
          is_self: true,
        })
        .select()
        .single();

      if (mErr) throw mErr;

      // Create an empty health_info record
      await supabase.from('health_info').insert({ member_id: member.id });

      if (goToProfile) {
        // Navigate to member profile to fill in the rest
        navigation.navigate('MainTabs');
        setTimeout(() => {
          navigation.navigate('MemberProfile', { memberId: member.id, memberName: member.full_name });
        }, 100);
      } else {
        navigation.navigate('MainTabs');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-circle-outline" size={52} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Your health profile</Text>
            <Text style={styles.subtitle}>
              Let's start with the basics. You can fill in the rest anytime.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Full name"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Blood Type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>BLOOD TYPE <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.chipRow}>
                {BLOOD_TYPES.map(bt => (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.chip, bloodType === bt && styles.chipActive]}
                    onPress={() => setBloodType(bloodType === bt ? '' : bt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>GENDER <Text style={styles.optional}>(optional)</Text></Text>
              <View style={styles.chipRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipActive]}
                    onPress={() => setGender(gender === g ? '' : g)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.65 }]}
              onPress={() => save(true)}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Save & Complete My Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => save(false)}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>Save & Explore the App</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: 60 },

  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: { ...FONTS.h2, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  form: { gap: SPACING.xl, marginBottom: SPACING.xxl },
  field: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.6 },
  optional: { fontWeight: '400', color: COLORS.textTertiary },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },

  actions: { gap: SPACING.md },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
});
