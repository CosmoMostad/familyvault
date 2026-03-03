// Run in Supabase SQL Editor before using this screen:
//
// create table if not exists public.shared_accounts (
//   id uuid primary key default gen_random_uuid(),
//   account_id uuid references public.family_members(id) on delete cascade,
//   owner_id uuid references auth.users(id) on delete cascade,
//   recipient_id uuid references auth.users(id) on delete cascade,
//   access_level text not null default 'view',
//   shared_fields jsonb not null default '{}'::jsonb,
//   accepted boolean default false,
//   created_at timestamptz default now()
// );

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ShareAccount'>;
  route: RouteProp<RootStackParamList, 'ShareAccount'>;
};

type Step = 1 | 2 | 3 | 'success';
type AccessLevel = 'view' | 'edit';

interface FieldToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_FIELDS: FieldToggle[] = [
  { key: 'basic_info', label: 'Basic Info', description: 'Name, date of birth, blood type, photo', enabled: true },
  { key: 'allergies', label: 'Allergies', description: 'All known allergies and severity', enabled: true },
  { key: 'medications', label: 'Medications', description: 'Current medications and dosages', enabled: true },
  { key: 'insurance', label: 'Insurance', description: 'Insurance carrier, policy and member ID', enabled: true },
  { key: 'medical_history', label: 'Medical History', description: 'Conditions and past surgeries', enabled: false },
  { key: 'appointments', label: 'Appointments', description: 'Upcoming and past appointments', enabled: true },
  { key: 'documents', label: 'Documents', description: 'Scanned medical documents and cards', enabled: false },
  { key: 'emergency_contacts', label: 'Emergency Contacts', description: 'Emergency contacts on file', enabled: true },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, current >= s && styles.stepDotActive]}>
            {current > s ? (
              <Ionicons name="checkmark" size={12} color={COLORS.textInverse} />
            ) : (
              <Text style={[styles.stepDotText, current >= s && styles.stepDotTextActive]}>{s}</Text>
            )}
          </View>
          {s < 3 && <View style={[styles.stepLine, current > s && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function ShareAccountScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [fields, setFields] = useState<FieldToggle[]>(DEFAULT_FIELDS);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('view');
  const [sending, setSending] = useState(false);

  function toggleField(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  }

  async function handleSend() {
    if (!user) return;
    setSending(true);
    try {
      // Look up recipient by email via SECURITY DEFINER function (bypasses RLS)
      const { data: recipients, error: recipientError } = await supabase
        .rpc('find_user_by_email', { p_email: email.trim().toLowerCase() });

      const recipient = recipients?.[0];
      if (recipientError || !recipient) {
        Alert.alert(
          'User Not Found',
          'No Wren account found for that email address. They need to create an account first.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (recipient.user_id === user.id) {
        Alert.alert('Oops', 'You cannot share an account with yourself.');
        return;
      }

      const sharedFields: Record<string, boolean> = {};
      fields.forEach((f) => { sharedFields[f.key] = f.enabled; });

      const { error } = await supabase.from('shared_accounts').insert({
        account_id: memberId,
        owner_id: user.id,
        recipient_id: recipient.user_id,
        access_level: accessLevel,
        fields_allowed: sharedFields,
        status: 'pending',
      });

      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  // — Success state —
  if (step === 'success') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.successState}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>Invite Sent</Text>
          <Text style={styles.successDesc}>
            {email.trim()} will receive a notification to accept access to {memberName}&apos;s account.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 1 ? navigation.goBack() : setStep((prev) => (prev as number) - 1 as Step))}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Share {memberName}&apos;s Account</Text>
            <StepIndicator current={step as number} />
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Who */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Who are you sharing with?</Text>
            <Text style={styles.stepDesc}>
              Enter the email address of the person you want to share {memberName}&apos;s health account with. They must have a Wren account.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="their@email.com"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (email.trim() && email.includes('@')) setStep(2);
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, (!email.trim() || !email.includes('@')) && styles.nextBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!email.trim() || !email.includes('@')}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: What fields */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What can they see?</Text>
            <Text style={styles.stepDesc}>
              Choose which sections of {memberName}&apos;s health profile to share. The recipient will only see what you enable.
            </Text>

            <View style={styles.fieldsList}>
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldDesc}>{field.description}</Text>
                  </View>
                  <Switch
                    value={field.enabled}
                    onValueChange={() => toggleField(field.key)}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                    thumbColor={field.enabled ? COLORS.primary : COLORS.textTertiary}
                    ios_backgroundColor={COLORS.border}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStep(3)}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Access level */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What can they do?</Text>
            <Text style={styles.stepDesc}>
              Choose whether {email.trim()} can only view the shared info, or also make edits.
            </Text>

            <View style={styles.accessOptions}>
              <TouchableOpacity
                style={[styles.accessCard, accessLevel === 'view' && styles.accessCardActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAccessLevel('view'); }}
                activeOpacity={0.8}
              >
                <View style={[styles.accessIconBg, accessLevel === 'view' && styles.accessIconBgActive]}>
                  <Ionicons name="eye-outline" size={24} color={accessLevel === 'view' ? COLORS.primary : COLORS.textTertiary} />
                </View>
                <View style={styles.accessText}>
                  <Text style={[styles.accessTitle, accessLevel === 'view' && styles.accessTitleActive]}>
                    View Only
                  </Text>
                  <Text style={styles.accessDesc}>
                    Can see all shared information but cannot make any changes
                  </Text>
                </View>
                {accessLevel === 'view' && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.accessCard, accessLevel === 'edit' && styles.accessCardActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAccessLevel('edit'); }}
                activeOpacity={0.8}
              >
                <View style={[styles.accessIconBg, accessLevel === 'edit' && styles.accessIconBgActive]}>
                  <Ionicons name="pencil-outline" size={24} color={accessLevel === 'edit' ? COLORS.primary : COLORS.textTertiary} />
                </View>
                <View style={styles.accessText}>
                  <Text style={[styles.accessTitle, accessLevel === 'edit' && styles.accessTitleActive]}>
                    Can Edit
                  </Text>
                  <Text style={styles.accessDesc}>
                    Can view and update information in the shared sections
                  </Text>
                </View>
                {accessLevel === 'edit' && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SUMMARY</Text>
              <Text style={styles.summaryText}>
                Sharing {memberName}&apos;s account with{' '}
                <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{email.trim()}</Text>
                {' '}— {accessLevel === 'view' ? 'view only' : 'can edit'} access to{' '}
                {fields.filter((f) => f.enabled).length} of {fields.length} sections.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={COLORS.textInverse} />
                  <Text style={styles.sendBtnText}>Send Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.base,
    gap: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: SPACING.sm },
  headerTitle: { ...FONTS.h4, color: COLORS.textPrimary, textAlign: 'center' },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotText: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary },
  stepDotTextActive: { color: COLORS.textInverse },
  stepLine: { width: 32, height: 2, backgroundColor: COLORS.border },
  stepLineActive: { backgroundColor: COLORS.primary },

  scroll: { paddingHorizontal: SPACING.xl },
  stepContent: { gap: SPACING.xl, paddingTop: SPACING.sm },
  stepTitle: { ...FONTS.h3, color: COLORS.textPrimary },
  stepDesc: { ...FONTS.body, color: COLORS.textSecondary, lineHeight: 23, marginTop: -SPACING.md },

  inputGroup: { gap: SPACING.xs },
  inputLabel: { ...FONTS.label, color: COLORS.textTertiary, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 52,
    gap: SPACING.sm,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textPrimary,
  },

  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { ...FONTS.h4, color: COLORS.textInverse, fontWeight: '600' },

  fieldsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.md,
  },
  fieldInfo: { flex: 1 },
  fieldLabel: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 2 },
  fieldDesc: { ...FONTS.caption, color: COLORS.textSecondary },

  accessOptions: { gap: SPACING.md },
  accessCard: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accessCardActive: { borderColor: COLORS.primary },
  accessIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accessIconBgActive: { backgroundColor: COLORS.primaryMuted },
  accessText: { flex: 1 },
  accessTitle: { ...FONTS.h4, color: COLORS.textSecondary, marginBottom: 3 },
  accessTitleActive: { color: COLORS.primary },
  accessDesc: { ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 19 },

  summaryCard: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 14,
    padding: SPACING.base,
    gap: SPACING.xs,
  },
  summaryLabel: { ...FONTS.label, color: COLORS.primary, textTransform: 'uppercase' },
  summaryText: { ...FONTS.body, color: COLORS.textSecondary, lineHeight: 23 },

  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { ...FONTS.h4, color: COLORS.textInverse, fontWeight: '700' },

  // Success
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    marginTop: -60,
  },
  successIcon: { marginBottom: SPACING.xl },
  successTitle: { ...FONTS.h2, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  successDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: SPACING.xxxl,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { ...FONTS.h4, color: COLORS.textInverse, fontWeight: '600' },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.xl,
    alignSelf: 'flex-start',
  },
});
