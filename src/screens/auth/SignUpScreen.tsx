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
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'> };

export default function SignUpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.'); return;
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      navigation.navigate('ConfirmEmail', { email: email.trim() });
    }
    catch (e: any) { setError(e.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  const fields = [
    { label: 'Full Name', icon: 'person-outline', value: fullName, set: setFullName, keyboard: 'default', cap: 'words' as const },
    { label: 'Email', icon: 'mail-outline', value: email, set: setEmail, keyboard: 'email-address', cap: 'none' as const },
  ];

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(242,250,245,0.85)" />
          </TouchableOpacity>

          <View style={S.headerBlock}>
            <Text style={S.headerTitle}>Create account</Text>
            <Text style={S.headerSub}>Your family's health, all in one place</Text>
          </View>

          <View style={S.form}>
            {fields.map((f) => (
              <View key={f.label} style={{ gap: 6 }}>
                <Text style={S.fieldLabel}>{f.label.toUpperCase()}</Text>
                <View style={S.inputWrap}>
                  <Ionicons name={f.icon as any} size={18} color="rgba(242,250,245,0.40)" style={{ marginRight: 10 }} />
                  <TextInput
                    style={S.input}
                    placeholder={f.label}
                    placeholderTextColor="rgba(242,250,245,0.28)"
                    value={f.value}
                    onChangeText={f.set}
                    keyboardType={f.keyboard as any}
                    autoCapitalize={f.cap}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={{ gap: 6 }}>
              <Text style={S.fieldLabel}>PASSWORD</Text>
              <View style={S.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(242,250,245,0.40)" style={{ marginRight: 10 }} />
                <TextInput
                  style={[S.input, { flex: 1 }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor="rgba(242,250,245,0.28)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(242,250,245,0.40)" />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={S.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#E07A5F" />
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[S.submitBtn, loading && { opacity: 0.65 }]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#72F0AB', '#3ECF82', '#1A9E5A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.submitGradient}
              >
                {loading
                  ? <ActivityIndicator color="#050F09" />
                  : <Text style={S.submitBtnText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={S.legal}>
              By signing up you agree to our{' '}
              <Text style={S.legalLink}>Privacy Policy</Text>
              {' and '}
              <Text style={S.legalLink}>Terms</Text>
            </Text>
          </View>

          <View style={S.footer}>
            <Text style={S.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={S.footerLink}>Sign in</Text>
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

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#72F0AB',
    letterSpacing: 1.2, textTransform: 'uppercase',
    textShadowColor: 'rgba(114,240,171,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

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

  legal: { fontSize: 12, color: 'rgba(242,250,245,0.38)', textAlign: 'center', lineHeight: 18 },
  legalLink: { color: 'rgba(114,240,171,0.65)', fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xxxl },
  footerText: { fontSize: 14, color: 'rgba(242,250,245,0.50)', fontWeight: '500' },
  footerLink: { fontSize: 14, color: '#72F0AB', fontWeight: '700' },
});
