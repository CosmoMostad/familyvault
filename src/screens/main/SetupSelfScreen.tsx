import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupSelf'>;
  onSetupComplete: () => void;
};

function WrenBird({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M6 15 Q3 11 5 7 Q5.5 10.5 7.5 12.5Z" fill={COLORS.primary} />
      <Ellipse cx="11.5" cy="14" rx="5.5" ry="3.8" fill={COLORS.primary} />
      <Circle cx="15.5" cy="10" r="3.2" fill={COLORS.primary} />
      <Path d="M18.2,9.2 L20,10 L18.2,10.8Z" fill={COLORS.primary} />
      <Circle cx="16.5" cy="9" r="0.55" fill="rgba(255,255,255,0.8)" />
    </Svg>
  );
}

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
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date>(defaultDob());
  const [showDobPicker, setShowDobPicker] = useState(false);
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
        setTimeout(() => {
          navigation.navigate('MemberProfile', { memberId, memberName: name.trim() });
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
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>

          {/* ── Hero row: bird + heading ── */}
          <View style={styles.heroRow}>
            <View style={styles.birdWrap}>
              <WrenBird size={44} />
            </View>
            <Text style={styles.heading}>Let's build your{'\n'}health account</Text>
          </View>

          {/* ── Fields ── */}
          <View style={styles.fields}>

            {/* Name */}
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
              onSubmitEditing={() => setShowDobPicker(false)}
            />

            {/* DOB */}
            <Text style={[styles.label, { marginTop: SPACING.lg }]}>Date of Birth</Text>
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

          {/* ── Spacer ── */}
          <View style={{ flex: 1 }} />

          {/* ── Buttons ── */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btnPrimary, !canProceed && styles.btnDisabled]}
              onPress={handleFinish}
              disabled={!canProceed || saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={COLORS.textInverse} />
                : <Text style={styles.btnPrimaryText}>Build My Profile</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, !canProceed && styles.btnSecondaryDisabled]}
              onPress={handleSaveLater}
              disabled={!canProceed || saving}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnSecondaryText, !canProceed && styles.btnSecondaryTextDisabled]}>
                Save for Later
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  kav: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  birdWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heading: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 28,
  },

  // Fields
  fields: {},
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
    paddingVertical: 13,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },
  dobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: SPACING.base,
    paddingVertical: 13,
  },
  dobBtnText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  pickerWrap: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: { height: 200 },
  pickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pickerDoneText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Buttons
  buttons: { gap: SPACING.sm },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.38 },
  btnPrimaryText: { ...FONTS.h4, color: COLORS.textInverse },
  btnSecondary: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnSecondaryDisabled: { borderColor: COLORS.border },
  btnSecondaryText: { ...FONTS.h4, color: COLORS.primary },
  btnSecondaryTextDisabled: { color: COLORS.textTertiary },
});
