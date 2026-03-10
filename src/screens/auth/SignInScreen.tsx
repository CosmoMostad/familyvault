import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { SPACING } from '../../lib/design';

const { height } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'> };

function Field({ label, icon, extra, children }: { label: string; icon: any; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={S.labelRow}>
        <Text style={S.fieldLabel}>{label.toUpperCase()}</Text>
        {extra}
      </View>
      <View style={S.inputWrap}>
        <Ionicons name={icon} size={18} color="rgba(242,250,245,0.40)" style={{ marginRight: 10 }} />
        {children}
      </View>
    </View>
  );
}

export default function SignInScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try { await signIn(email.trim(), password); }
    catch (e: any) { setError(e.message || 'Incorrect email or password.'); }
    finally { setLoading(false); }
  }

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#050F09', '#081A0E', '#050F09']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(82,183,136,0.22)', 'rgba(82,183,136,0.06)', 'transparent']}
        locations={[0, 0.4, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[S.scroll, { paddingTop: insets.top + SPACING.base }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(242,250,245,0.85)" />
          </TouchableOpacity>

          {/* Header */}
          <View style={S.headerBlock}>
            <Text style={S.headerTitle}>Welcome back</Text>
            <Text style={S.headerSub}>Sign in to Wren Health</Text>
          </View>

          {/* Form */}
          <View style={S.form}>
            <Field label="Email" icon="mail-outline">
              <TextInput
                style={S.input}
                placeholder="your@email.com"
                placeholderTextColor="rgba(242,250,245,0.28)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field
              label="Password"
              icon="lock-closed-outline"
              extra={
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={S.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              }
            >
              <TextInput
                style={[S.input, { flex: 1 }]}
                placeholder="Your password"
                placeholderTextColor="rgba(242,250,245,0.28)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(242,250,245,0.40)" />
              </TouchableOpacity>
            </Field>

            {error ? (
              <View style={S.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#E07A5F" />
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[S.submitBtn, loading && { opacity: 0.65 }]} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#72F0AB', '#3ECF82', '#1A9E5A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.submitGradient}
              >
                {loading
                  ? <ActivityIndicator color="#050F09" />
                  : <Text style={S.submitBtnText}>Sign In</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={S.footer}>
            <Text style={S.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={S.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050F09' },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 60, minHeight: height * 0.9 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },

  headerBlock: { marginBottom: SPACING.xxxl, gap: 6 },
  headerTitle: {
    fontSize: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1,
    textShadowColor: 'rgba(114,240,171,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  headerSub: { fontSize: 16, color: 'rgba(242,250,245,0.60)', fontWeight: '500' },

  form: { gap: SPACING.lg },

  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#72F0AB',
    letterSpacing: 1.2, textTransform: 'uppercase',
    textShadowColor: 'rgba(114,240,171,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  forgotLink: { fontSize: 13, color: 'rgba(114,240,171,0.80)', fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.base, height: 54,
  },
  input: { flex: 1, fontSize: 15, color: '#F2FAF5', fontWeight: '500' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(224,122,95,0.12)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(224,122,95,0.25)',
    paddingHorizontal: SPACING.base, paddingVertical: 12,
  },
  errorText: { fontSize: 13, color: '#E07A5F', flex: 1, fontWeight: '500' },

  submitBtn: {
    borderRadius: 16, height: 56, overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#52B788', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 20, elevation: 10,
  },
  submitGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#050F09', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xxxl },
  footerText: { fontSize: 14, color: 'rgba(242,250,245,0.50)', fontWeight: '500' },
  footerLink: { fontSize: 14, color: '#72F0AB', fontWeight: '700' },
});
