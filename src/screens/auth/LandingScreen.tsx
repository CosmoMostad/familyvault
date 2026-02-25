import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';
import AuthBotanical from '../../components/AuthBotanical';

const { width: screenWidth, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

const TRUST_ITEMS = [
  { icon: 'shield-checkmark-outline' as const, label: 'End-to-end encrypted' },
  { icon: 'lock-closed-outline' as const, label: 'HIPAA-ready' },
  { icon: 'eye-off-outline' as const, label: 'Private by default' },
];

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Green hero background with botanical decoration */}
      <View style={styles.heroBg}>
        <AuthBotanical width={screenWidth} height={height * 0.52} />
      </View>

      <SafeAreaView style={styles.safe}>
        {/* ── Hero section ── */}
        <View style={styles.hero}>
          {/* Soft halo glow behind the logo */}
          <View style={styles.logoHalo} />
          <View style={styles.logoRing}>
            <Ionicons name="leaf" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.brand}>Wren Health</Text>
          <Text style={styles.tagline}>Your family's health,{'\n'}organized and secure.</Text>
        </View>

        {/* ── Floating card ── */}
        <View style={styles.card}>
          {/* Trust rows */}
          <View style={styles.trustList}>
            {TRUST_ITEMS.map((item, i) => (
              <View key={i} style={styles.trustRow}>
                <View style={styles.trustIconBg}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* CTA buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.88}
            >
              <Text style={styles.secondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' & '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.52,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  safe: { flex: 1 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.07,
    paddingBottom: height * 0.04,
    paddingHorizontal: SPACING.xxl,
  },
  logoHalo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 0,
    alignSelf: 'center',
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },

  // Card
  card: {
    marginHorizontal: SPACING.xl,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  trustList: { gap: SPACING.base },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  trustIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustLabel: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  actions: { gap: SPACING.md },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  secondaryBtn: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  legal: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  legalLink: { color: COLORS.primary, fontWeight: '500' },
});
