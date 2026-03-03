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
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';
import AuthBotanical from '../../components/AuthBotanical';

function WrenBird({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 26">
      {/* Single upswept tail */}
      <Path d="M6 17 Q2.5 11 4 5.5 Q4.5 10 7 13.5Z" fill="white" />
      {/* Body */}
      <Ellipse cx="13.5" cy="15" rx="6.5" ry="4.5" fill="white" />
      {/* Wing fold lines */}
      <Path d="M9 14.5 Q13 11.5 18 13.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M9.5 16 Q13.5 13.5 18.5 15.5" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* Head */}
      <Circle cx="18" cy="10" r="4" fill="white" />
      {/* Beak */}
      <Path d="M21.5 8.8 L24 10 L21.5 11Z" fill="white" />
      {/* Eye */}
      <Circle cx="19.5" cy="9" r="0.9" fill="rgba(0,0,0,0.35)" />
      {/* Legs */}
      <Path d="M11.5 19.5 L11 23" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <Path d="M14.5 19.5 L15 23" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Left foot toes */}
      <Path d="M11 23 L9 24.5" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M11 23 L11 25" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M11 23 L13 24.5" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Right foot toes */}
      <Path d="M15 23 L13 24.5" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M15 23 L15 25" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M15 23 L17 24.5" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

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
          <WrenBird size={72} />
          <Text style={styles.brand}>Wren Health</Text>
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
    gap: SPACING.md,
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
