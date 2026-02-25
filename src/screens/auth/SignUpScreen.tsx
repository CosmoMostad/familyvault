import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';
import AuthBotanical from '../../components/AuthBotanical';

const { width: screenWidth, height } = Dimensions.get('window');

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
    if (!fullName.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try { await signUp(email.trim(), password, fullName.trim()); }
    catch (e: any) { setError(e.message || 'Sign up failed. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ minHeight: height }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Green header */}
        <View style={[styles.greenHeader, { paddingTop: insets.top + SPACING.base }]}>
          <AuthBotanical width={screenWidth} height={190} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Create account</Text>
            <Text style={styles.headerSub}>Your family's health, all in one place</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.form}>
            {[
              { label: 'Full Name', icon: 'person-outline', value: fullName, onChange: setFullName, placeholder: 'Your full name', props: { autoCapitalize: 'words' as const } },
              { label: 'Email', icon: 'mail-outline', value: email, onChange: setEmail, placeholder: 'your@email.com', props: { keyboardType: 'email-address' as const, autoCapitalize: 'none' as const } },
            ].map((f) => (
              <View key={f.label} style={{ gap: 6 }}>
                <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon as any} size={18} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textTertiary}
                    value={f.value}
                    onChangeText={f.onChange}
                    autoCorrect={false}
                    {...f.props}
                  />
                </View>
              </View>
            ))}

            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.rose} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.65 }]} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <Text style={styles.legal}>
              By creating an account you agree to our{' '}
              <Text style={{ color: COLORS.primary }}>Privacy Policy</Text>
              {' & '}
              <Text style={{ color: COLORS.primary }}>Terms</Text>
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  greenHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  headerTextBlock: { gap: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  card: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.xl,
    marginTop: -28,
    borderRadius: 24,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: SPACING.xxl,
  },
  form: { gap: SPACING.lg },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, height: 52,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.roseLight, borderRadius: 10,
    paddingHorizontal: SPACING.base, paddingVertical: 10,
  },
  errorText: { fontSize: 13, color: COLORS.rose, flex: 1 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4, marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  legal: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
