import React, { useState } from 'react';
import {
  View,
  StatusBar,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../lib/types';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../lib/design';
import AuthBotanical from '../../components/AuthBotanical';

const { width: screenWidth, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConfirmEmail'>;
  route: RouteProp<RootStackParamList, 'ConfirmEmail'>;
};

export default function ConfirmEmailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  async function handleResend() {
    setResending(true);
    setError('');
    setResent(false);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResent(true);
    } catch (e: any) {
      setError(e.message || 'Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050F09' }}>
      {/* Green header */}
      <View style={[styles.greenHeader, { paddingTop: insets.top + SPACING.base }]}>
        <AuthBotanical width={screenWidth} height={240} />
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Check your inbox</Text>
          <Text style={styles.headerSub}>One step left to get started</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Envelope icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={36} color={'#72F0AB'} />
        </View>

        <Text style={styles.bodyTitle}>Confirm your email</Text>
        <Text style={styles.bodyText}>
          We sent a confirmation link to
        </Text>
        <Text style={styles.emailText}>{email}</Text>
        <Text style={styles.bodyText}>
          Tap the link in that email to activate your account, then come back and sign in.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.resendLabel}>Didn't get the email?</Text>

        {resent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={15} color={'#72F0AB'} />
            <Text style={styles.successText}>Email resent — check your inbox.</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={COLORS.rose} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.resendBtn, resending && { opacity: 0.65 }]}
          onPress={handleResend}
          disabled={resending}
          activeOpacity={0.85}
        >
          {resending ? (
            <ActivityIndicator color={'#72F0AB'} size="small" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color={'#72F0AB'} style={{ marginRight: 6 }} />
              <Text style={styles.resendBtnText}>Resend confirmation email</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signinBtn}
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.85}
        >
          <Text style={styles.signinBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greenHeader: {
    backgroundColor: '#050F09',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 72,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: '#050F09',
    marginHorizontal: SPACING.xl,
    marginTop: -28,
    borderRadius: 24,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    gap: SPACING.base,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(82,183,136,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  bodyTitle: {
    fontSize: 20, fontWeight: '700',
    color: '#F2FAF5', letterSpacing: -0.3,
  },
  bodyText: {
    fontSize: 14, color: 'rgba(242,250,245,0.70)',
    textAlign: 'center', lineHeight: 21,
  },
  emailText: {
    fontSize: 15, fontWeight: '600',
    color: '#F2FAF5', textAlign: 'center',
  },
  divider: {
    width: '100%', height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  resendLabel: {
    fontSize: 13, color: 'rgba(242,250,245,0.70)', textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(45,106,79,0.08)', borderRadius: 10,
    paddingHorizontal: SPACING.base, paddingVertical: 10,
    width: '100%',
  },
  successText: { fontSize: 13, color: '#72F0AB', flex: 1 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.roseLight,
    borderRadius: 10,
    paddingHorizontal: SPACING.base, paddingVertical: 10,
    width: '100%',
  },
  errorText: { fontSize: 13, color: COLORS.rose, flex: 1 },
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(114,240,171,0.35)',
    borderRadius: 14, height: 50, width: '100%',
    marginTop: 4,
  },
  resendBtnText: { fontSize: 15, fontWeight: '600', color: '#72F0AB' },
  signinBtn: {
    backgroundColor: '#050F09',
    borderRadius: 14, height: 54, width: '100%',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  signinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
