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
import * as Notifications from 'expo-notifications';
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
    title: 'Welcome to Rosemary',
    description:
      'Keep your entire family\'s health records in one secure, organized place — always ready when you need it most.',
  },
  {
    icon: 'medkit-outline',
    iconColor: COLORS.rose,
    iconBg: COLORS.roseLight,
    title: 'Complete health profiles',
    description:
      'Store blood type, medications, allergies, insurance, emergency contacts, and more — for every family member.',
  },
  {
    icon: 'share-social-outline',
    iconColor: COLORS.primaryLight,
    iconBg: COLORS.primaryMuted,
    title: 'Ready for any emergency',
    description:
      'Generate a secure share link in one tap. Perfect for ER visits, new doctors, or when a family member needs to step in.',
  },
];

// Notification value screen — shown before the iOS system prompt
function NotificationValueScreen({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  return (
    <View style={notifStyles.container}>
      <View style={notifStyles.iconContainer}>
        <Ionicons name="notifications-outline" size={52} color={COLORS.primary} />
      </View>

      <Text style={notifStyles.title}>Never miss an appointment</Text>
      <Text style={notifStyles.subtitle}>
        Rosemary sends the notifications that actually matter.
      </Text>

      <View style={notifStyles.benefits}>
        {[
          { icon: 'calendar-outline' as const, text: '24-hour reminders before appointments' },
          { icon: 'time-outline' as const, text: "Day-of reminders so you're always prepared" },
          { icon: 'checkmark-circle-outline' as const, text: "That's it — no spam, ever" },
        ].map((item, i) => (
          <View key={i} style={notifStyles.benefitRow}>
            <View style={notifStyles.benefitIcon}>
              <Ionicons name={item.icon} size={18} color={COLORS.primary} />
            </View>
            <Text style={notifStyles.benefitText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={notifStyles.allowButton} onPress={onAllow} activeOpacity={0.85}>
        <Text style={notifStyles.allowButtonText}>Turn On Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={notifStyles.skipButton}>
        <Text style={notifStyles.skipText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  container: {
    width,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  benefits: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: SPACING.base,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  allowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: SPACING.base,
  },
  allowButtonText: {
    color: COLORS.textInverse,
    ...FONTS.h4,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
});

type Props = { onComplete?: () => void; [key: string]: any };

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotifValue, setShowNotifValue] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Total: 3 info slides + notif value screen + "You're ready" slide = 5 steps
  const totalSlides = slides.length + 2; // +notif value +ready
  const isNotifStep = currentIndex === slides.length;
  const isReadyStep = currentIndex === slides.length + 1;

  async function requestNotifications() {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (e) {
      // Fine on simulators
    }
    goToNextSlide();
  }

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

  const progressDots = Array.from({ length: totalSlides });

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Info slides */}
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: slide.iconBg }]}>
              <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.description}</Text>
          </View>
        ))}

        {/* Notification value screen */}
        <NotificationValueScreen
          onAllow={requestNotifications}
          onSkip={goToNextSlide}
        />

        {/* You're ready slide */}
        <View style={styles.slide}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryMuted }]}>
            <Ionicons name="checkmark-circle" size={52} color={COLORS.primary} />
          </View>
          <Text style={styles.slideTitle}>You're all set!</Text>
          <Text style={styles.slideDesc}>
            Let's add your first family member. It takes about 2 minutes to set up a complete health profile.
          </Text>
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {progressDots.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Bottom button */}
      <View style={styles.buttonArea}>
        {isReadyStep ? (
          <TouchableOpacity style={styles.mainButton} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.mainButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ) : isNotifStep ? null : (
          <TouchableOpacity style={styles.mainButton} onPress={goToNextSlide} activeOpacity={0.85}>
            <Text style={styles.mainButtonText}>Next</Text>
          </TouchableOpacity>
        )}
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
    paddingTop: 80,
    paddingHorizontal: SPACING.xxl,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
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
    ...FONTS.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
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
    minHeight: 72,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    color: COLORS.textInverse,
    ...FONTS.h4,
    fontWeight: '600',
  },
});
