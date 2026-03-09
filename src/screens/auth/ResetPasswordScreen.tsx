import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
};

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleUpdate() {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>Your password has been changed successfully.</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>Set new password</Text>
            <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={COLORS.textTertiary}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
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
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleUpdate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={COLORS.textInverse} />
                : <Text style={styles.btnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  titleArea: { marginBottom: SPACING.xxl },
  title: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary },
  form: { gap: SPACING.lg },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...FONTS.label, color: COLORS.textSecondary, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 52,
  },
  icon: { marginRight: SPACING.sm },
  input: { flex: 1, ...FONTS.body, color: COLORS.textPrimary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.roseLight, borderRadius: 10,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
  },
  errorText: { ...FONTS.caption, color: COLORS.rose, flex: 1 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
});
