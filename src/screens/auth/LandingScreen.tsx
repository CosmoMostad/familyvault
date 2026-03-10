import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../lib/types';
import { SPACING } from '../../lib/design';

function WrenBird({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M6 15 Q3 11 5 7 Q5.5 10.5 7.5 12.5Z" fill="#2D6A4F" />
      <Ellipse cx="11.5" cy="14" rx="5.5" ry="3.8" fill="#2D6A4F" />
      <Circle cx="15.5" cy="10" r="3.2" fill="#2D6A4F" />
      <Path d="M18.2,9.2 L20,10 L18.2,10.8Z" fill="#2D6A4F" />
      <Circle cx="16.5" cy="9" r="0.55" fill="rgba(255,255,255,0.7)" />
    </Svg>
  );
}

const { width: W } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'> };

export default function LandingScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Light background */}
      <LinearGradient colors={['#F4F9F6', '#EBF4EF', '#F4F9F6']} style={StyleSheet.absoluteFill} />

      {/* Subtle top tint */}
      <LinearGradient
        colors={['rgba(45,106,79,0.07)', 'rgba(45,106,79,0.02)', 'transparent']}
        locations={[0, 0.4, 0.75]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

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
              colors={['#52C48A', '#2D6A4F']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('SignIn')}
            activeOpacity={0.88}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
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
  root: { flex: 1, backgroundColor: '#F4F9F6' },
  safe: { flex: 1, justifyContent: 'space-between' },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xxl, gap: SPACING.md,
  },
  birdWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(45,106,79,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  brand: {
    fontSize: 42, fontWeight: '800', color: '#0D1810',
    letterSpacing: -1.2,
  },
  tagline: {
    fontSize: 18, color: 'rgba(13,24,16,0.58)',
    textAlign: 'center', lineHeight: 28, fontWeight: '500',
  },

  actions: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl, gap: SPACING.md },

  primaryBtn: {
    borderRadius: 16, height: 56, overflow: 'hidden',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  secondaryBtn: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(45,106,79,0.30)',
    backgroundColor: 'rgba(45,106,79,0.05)',
  },
  secondaryBtnText: { color: '#2D6A4F', fontSize: 15, fontWeight: '700' },

  legal: { fontSize: 12, color: 'rgba(13,24,16,0.38)', textAlign: 'center', lineHeight: 18 },
  legalLink: { color: '#2D6A4F', fontWeight: '600' },
});
