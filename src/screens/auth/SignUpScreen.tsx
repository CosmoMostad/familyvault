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
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F4F9F6', '#EBF4EF', '#F4F9F6']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[S.scroll, { paddingTop: insets.top + SPACING.base }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#0D1810" />
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
                  <Ionicons name={f.icon as any} size={18} color="rgba(45,106,79,0.50)" style={{ marginRight: 10 }} />
                  <TextInput
                    style={S.input}
                    placeholder={f.label}
                    placeholderTextColor="rgba(13,24,16,0.30)"
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
                <Ionicons name="lock-closed-outline" size={18} color="rgba(45,106,79,0.50)" style={{ marginRight: 10 }} />
                <TextInput
                  style={[S.input, { flex: 1 }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor="rgba(13,24,16,0.30)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(13,24,16,0.40)" />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={S.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#C0472B" />
                <Text style={S.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[S.submitBtn, loading && { opacity: 0.65 }]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#52C48A', '#2D6A4F']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={S.submitGradient}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
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
  root: { flex: 1, backgroundColor: '#F4F9F6' },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 60, minHeight: height * 0.9 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.09)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },

  headerBlock: { marginBottom: SPACING.xxxl, gap: 6 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: '#0D1810', letterSpacing: -1 },
  headerSub: { fontSize: 16, color: 'rgba(13,24,16,0.55)', fontWeight: '500' },

  form: { gap: SPACING.lg },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#2D6A4F',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: SPACING.base, height: 54,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  input: { flex: 1, fontSize: 15, color: '#0D1810', fontWeight: '500' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(192,71,43,0.08)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,71,43,0.20)',
    paddingHorizontal: SPACING.base, paddingVertical: 12,
  },
  errorText: { fontSize: 13, color: '#C0472B', flex: 1, fontWeight: '500' },

  submitBtn: {
    borderRadius: 16, height: 56, overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30, shadowRadius: 16, elevation: 8,
  },
  submitGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  legal: { fontSize: 12, color: 'rgba(13,24,16,0.38)', textAlign: 'center', lineHeight: 18 },
  legalLink: { color: '#2D6A4F', fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xxxl },
  footerText: { fontSize: 14, color: 'rgba(13,24,16,0.45)', fontWeight: '500' },
  footerLink: { fontSize: 14, color: '#2D6A4F', fontWeight: '700' },
});
