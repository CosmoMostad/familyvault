import React, { useState } from 'react';
import {
  View, StatusBar, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING } from '../../lib/design';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError(''); setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://wrenhealth.app/reset-password',
      });
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
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F4F9F6', '#EBF4EF', '#F4F9F6']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color="#0D1810" />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.sentState}>
              <View style={styles.sentIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#2D6A4F" />
              </View>
              <Text style={styles.sentTitle}>Check your email</Text>
              <Text style={styles.sentDesc}>
                We've sent a password reset link to{'\n'}
                <Text style={{ fontWeight: '600', color: '#0D1810' }}>{email}</Text>
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
                  <Text style={styles.fieldLabel}>EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="rgba(45,106,79,0.50)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="rgba(13,24,16,0.30)"
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
                    <Ionicons name="alert-circle-outline" size={16} color="#C0472B" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.submitButton, loading && { opacity: 0.6 }]}
                  onPress={handleReset} disabled={loading} activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#52C48A', '#2D6A4F']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFFFFF" />
                      : <Text style={styles.submitButtonText}>Send Reset Email</Text>}
                  </LinearGradient>
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
  container: { flex: 1, backgroundColor: '#F4F9F6' },
  content: { flex: 1, paddingHorizontal: SPACING.xl },
  header: { paddingTop: SPACING.base, paddingBottom: SPACING.lg },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.09)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleArea: { marginBottom: SPACING.xxl },
  title: { ...FONTS.h2, color: '#0D1810', marginBottom: SPACING.sm },
  subtitle: { ...FONTS.body, color: 'rgba(13,24,16,0.58)' },
  form: { gap: SPACING.lg },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...FONTS.label, color: '#2D6A4F', textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: SPACING.base, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, ...FONTS.body, color: '#0D1810' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(192,71,43,0.08)',
    borderRadius: 10, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(192,71,43,0.20)',
  },
  errorText: { ...FONTS.caption, color: '#C0472B', flex: 1 },
  submitButton: {
    borderRadius: 16, height: 56, overflow: 'hidden', marginTop: SPACING.sm,
    shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 8,
  },
  submitGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sentState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  sentIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(45,106,79,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  sentTitle: { ...FONTS.h2, color: '#0D1810', marginBottom: SPACING.md, textAlign: 'center' },
  sentDesc: { ...FONTS.body, color: 'rgba(13,24,16,0.60)', textAlign: 'center', lineHeight: 24 },
  backToSignIn: {
    marginTop: SPACING.xxl, overflow: 'hidden',
    borderRadius: 16, height: 56, width: '100%',
  },
  backToSignInText: { color: '#2D6A4F', ...FONTS.h4, fontWeight: '700' },
});
