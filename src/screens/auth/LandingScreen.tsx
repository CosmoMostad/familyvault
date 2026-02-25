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

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Full-screen botanical overlay */}
      <AuthBotanical width={screenWidth} height={height} />

      <SafeAreaView style={styles.safe}>
        {/* ── Logo + tagline centered ── */}
        <View style={styles.center}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf" size={28} color="rgba(255,255,255,0.9)" style={{ marginTop: 3 }} />
            <Text style={styles.brand}>Wren Health</Text>
          </View>
          <Text style={styles.tagline}>Your family's health,{'\n'}organized and secure.</Text>
        </View>

        {/* ── Bottom action area ── */}
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
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Center logo + tagline
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  brand: {
    fontSize: 44,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 27,
    fontWeight: '400',
  },

  // Bottom actions
  actions: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secondaryBtn: {
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legal: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
