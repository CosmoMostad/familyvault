import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { LinearGradient } from 'expo-linear-gradient';
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
            <Ionicons name="checkmark-circle" size={48} color={'#72F0AB'} />
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
                <Ionicons name="lock-closed-outline" size={18} color={'rgba(242,250,245,0.40)'} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={'rgba(242,250,245,0.28)'}
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
                <Ionicons name="lock-closed-outline" size={18} color={'rgba(242,250,245,0.40)'} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={'rgba(242,250,245,0.28)'}
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
  container: { flex: 1, backgroundColor: '#050F09' },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  titleArea: { marginBottom: SPACING.xxl },
  title: { ...FONTS.h2, color: '#F2FAF5', marginBottom: SPACING.sm },
  subtitle: { ...FONTS.body, color: 'rgba(242,250,245,0.70)' },
  form: { gap: SPACING.lg },
  fieldGroup: { gap: SPACING.xs },
  fieldLabel: { ...FONTS.label, color: 'rgba(242,250,245,0.70)', textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.base, height: 52,
  },
  icon: { marginRight: SPACING.sm },
  input: { flex: 1, ...FONTS.body, color: '#F2FAF5' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.roseLight, borderRadius: 10,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
  },
  errorText: { ...FONTS.caption, color: COLORS.rose, flex: 1 },
  btn: {
    backgroundColor: '#050F09', borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(82,183,136,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
});
