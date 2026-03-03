import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupSelf'>;
  onSetupComplete: () => void;
};

// Default DOB: 30 years ago
function defaultDob(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 30);
  d.setHours(12, 0, 0, 0);
  return d;
}

function formatDob(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SetupSelfScreen({ navigation, onSetupComplete }: Props) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date>(defaultDob());
  const [saving, setSaving] = useState(false);

  const canProceed = name.trim().length > 0;

  async function saveMember(): Promise<string | null> {
    if (!session?.user?.id) return null;
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        owner_id: session.user.id,
        full_name: name.trim(),
        dob: dob.toISOString().split('T')[0],
        is_self: true,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id ?? null;
  }

  async function handleSaveLater() {
    if (!canProceed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await saveMember();
      onSetupComplete();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (!canProceed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const memberId = await saveMember();
      onSetupComplete();
      if (memberId) {
        // Navigate to their full profile after a tick
        setTimeout(() => {
          navigation.navigate('MemberProfile', {
            memberId,
            memberName: name.trim(),
          });
        }, 100);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
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
              <Ionicons name="person-add-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.heading}>Let's build your{'\n'}health account</Text>
            <Text style={styles.subheading}>
              Just your name and birthday to get started. You can add everything else later.
            </Text>
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={COLORS.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {/* DOB */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.dobDisplay}>
              <Text style={styles.dobText}>{formatDob(dob)}</Text>
            </View>
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                themeVariant="light"
                maximumDate={new Date()}
                onChange={(_, date) => { if (date) setDob(date); }}
                style={styles.picker}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btnPrimary, !canProceed && styles.btnDisabled]}
              onPress={handleFinish}
              disabled={!canProceed || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <Text style={styles.btnPrimaryText}>Finish Health Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, !canProceed && styles.btnDisabled]}
              onPress={handleSaveLater}
              disabled={!canProceed || saving}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnSecondaryText, !canProceed && styles.btnSecondaryTextDisabled]}>
                Save for Later
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heading: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  fieldGroup: { marginBottom: SPACING.xl },
  label: {
    ...FONTS.label,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    ...FONTS.bodyLarge,
    color: COLORS.textPrimary,
  },
  dobDisplay: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  dobText: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  pickerWrap: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: { height: 180 },
  buttons: { gap: SPACING.md, marginTop: SPACING.xl },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { ...FONTS.h4, color: COLORS.textInverse },
  btnSecondary: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: { ...FONTS.h4, color: COLORS.primary },
  btnSecondaryTextDisabled: { color: COLORS.textTertiary },
});
