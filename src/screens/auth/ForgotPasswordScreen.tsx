import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (err) throw err;
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.sentState}>
              <View style={styles.sentIcon}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.sentTitle}>Check your email</Text>
              <Text style={styles.sentDesc}>
                We've sent a password reset link to{'\n'}
                <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>{email}</Text>
              </Text>
              <TouchableOpacity style={styles.backToSignIn} onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.backToSignInText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.titleArea}>
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={COLORS.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color={COLORS.rose} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitButton, loading && { opacity: 0.6 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textInverse} />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Reset Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACING.xl },
  header: { paddingTop: SPACING.base, paddingBottom: SPACING.lg },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: { marginBottom: SPACING.xxl },
  title: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary },
  form: { gap: SPACING.lg },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: {
    ...FONTS.label,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, ...FONTS.body, color: COLORS.textPrimary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.roseLight,
    borderRadius: 10,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  errorText: { ...FONTS.caption, color: COLORS.rose, flex: 1 },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  sentState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  sentIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  sentTitle: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: SPACING.md, textAlign: 'center' },
  sentDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  backToSignIn: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToSignInText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
});
