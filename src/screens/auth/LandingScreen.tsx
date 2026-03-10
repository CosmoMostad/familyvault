import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../lib/types';
import { SPACING } from '../../lib/design';
import AuthBotanical from '../../components/AuthBotanical';

function WrenBird({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M6 15 Q3 11 5 7 Q5.5 10.5 7.5 12.5Z" fill="white" />
      <Ellipse cx="11.5" cy="14" rx="5.5" ry="3.8" fill="white" />
      <Circle cx="15.5" cy="10" r="3.2" fill="white" />
      <Path d="M18.2,9.2 L20,10 L18.2,10.8Z" fill="white" />
      <Circle cx="16.5" cy="9" r="0.55" fill="rgba(0,0,0,0.35)" />
    </Svg>
  );
}

const { width: W, height: H } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'> };

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Deep dark background */}
      <LinearGradient colors={['#050F09', '#081A0E', '#050F09']} style={StyleSheet.absoluteFill} />

      {/* Atmospheric glow — top center */}
      <LinearGradient
        colors={['rgba(82,183,136,0.28)', 'rgba(82,183,136,0.08)', 'transparent']}
        locations={[0, 0.4, 0.75]}
        style={[StyleSheet.absoluteFill, { top: -100 }]}
        pointerEvents="none"
      />

      {/* Radial center glow behind the bird */}
      <View style={styles.centerGlow} pointerEvents="none" />

      {/* Botanical overlay — low opacity on dark */}
      <AuthBotanical width={W} height={H} />

      <SafeAreaView style={styles.safe}>
        {/* ── Logo ── */}
        <View style={styles.center}>
          <View style={styles.birdWrap}>
            <WrenBird size={72} />
          </View>

          <Text style={styles.brand}>Wren Health</Text>
          <Text style={styles.tagline}>Your family's health,{'\n'}organized and secure.</Text>
        </View>

        {/* ── CTAs ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#72F0AB', '#3ECF82', '#1A9E5A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </LinearGradient>
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
  root: { flex: 1, backgroundColor: '#050F09' },
  safe: { flex: 1, justifyContent: 'space-between' },

  centerGlow: {
    position: 'absolute',
    width: 320, height: 320,
    borderRadius: 160,
    top: '18%', alignSelf: 'center',
    backgroundColor: 'rgba(72,200,130,0.10)',
    shadowColor: '#52B788',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xxl, gap: SPACING.md,
  },
  birdWrap: {
    shadowColor: '#72F0AB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  brand: {
    fontSize: 48, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(114,240,171,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  tagline: {
    fontSize: 18, color: 'rgba(242,250,245,0.70)',
    textAlign: 'center', lineHeight: 28, fontWeight: '500',
  },

  actions: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl, gap: SPACING.md },

  primaryBtn: {
    borderRadius: 16, height: 56, overflow: 'hidden',
    shadowColor: '#52B788',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBtnGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
  },
  primaryBtnText: { color: '#050F09', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  secondaryBtn: {
    borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(114,240,171,0.30)',
    backgroundColor: 'rgba(114,240,171,0.06)',
  },
  secondaryBtnText: {
    color: '#A8F5C4', fontSize: 16, fontWeight: '700',
    textShadowColor: 'rgba(114,240,171,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  legal: { fontSize: 12, color: 'rgba(242,250,245,0.38)', textAlign: 'center', lineHeight: 18, marginTop: SPACING.xs },
  legalLink: { color: 'rgba(114,240,171,0.65)', fontWeight: '600' },
});
