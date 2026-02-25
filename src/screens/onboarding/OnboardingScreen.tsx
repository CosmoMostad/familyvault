import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING } from '../../lib/design';

const { width } = Dimensions.get('window');

type SlideData = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

const slides: SlideData[] = [
  {
    icon: 'leaf',
    iconColor: COLORS.primary,
    iconBg: COLORS.primaryMuted,
    title: 'Welcome to Wren Health',
    description: 'Keep your entire family\'s health records in one secure, organized place.',
  },
  {
    icon: 'people-outline',
    iconColor: COLORS.primary,
    iconBg: COLORS.primaryMuted,
    title: 'One place for your whole family',
    description: 'Add family members and keep their profiles up to date — from medications to insurance.',
  },
  {
    icon: 'share-social-outline',
    iconColor: COLORS.primary,
    iconBg: COLORS.primaryMuted,
    title: 'Share when it matters',
    description: 'Share health info securely with doctors, family, or caregivers in one tap.',
  },
];

type Props = { onComplete?: () => void; [key: string]: any };

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const isLastSlide = currentIndex === slides.length - 1;

  function goToNextSlide() {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  async function handleFinish() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.();
  }

  function handleScroll(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={false}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            {/* Icon */}
            <View style={[styles.iconRing, { backgroundColor: slide.iconBg }]}>
              <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Bottom button */}
      <View style={styles.buttonArea}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={isLastSlide ? handleFinish : goToNextSlide}
          activeOpacity={0.85}
        >
          <Text style={styles.mainButtonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
          {isLastSlide && (
            <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: SPACING.xl,
    zIndex: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: SPACING.xxl,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  slideTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  slideDesc: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: '400',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  buttonArea: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    width: '100%',
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  mainButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
