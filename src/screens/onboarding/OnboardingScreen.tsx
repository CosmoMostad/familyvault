import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    emoji: '🏠',
    title: 'Welcome to FamilyVault',
    description:
      'Keep your entire family\'s health records in one secure, beautifully organized place. Always ready when you need it most.',
    color: '#EEF2FF',
    accentColor: '#818CF8',
  },
  {
    emoji: '🏥',
    title: 'Complete Health Profiles',
    description:
      'Store blood type, medications, allergies, insurance details, emergency contacts, and more — for every family member.',
    color: '#ECFDF5',
    accentColor: '#34D399',
  },
  {
    emoji: '🚨',
    title: 'Ready for Any Emergency',
    description:
      'Generate a secure share link in one tap. Perfect for ER visits, new doctor appointments, or when a family member needs to step in.',
    color: '#FFF7ED',
    accentColor: '#FB923C',
  },
  {
    emoji: '✅',
    title: "You're All Set!",
    description:
      "Let's add your first family member. It only takes a minute to set up a complete health profile.",
    color: '#F0FDF4',
    accentColor: '#00B4A6',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  async function requestNotifications() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in Settings to get appointment reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      // Ignore on simulators
    }
  }

  function handleScroll(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index === 2 && currentIndex !== 2) {
      requestNotifications();
    }
    setCurrentIndex(index);
  }

  function goToNext() {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
      if (next === 2) requestNotifications();
    }
  }

  async function handleGetStarted() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
  }

  const slide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.emojiContainer, { backgroundColor: s.color }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideDescription}>{s.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        {isLast ? (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
            <Text style={styles.nextText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  emoji: {
    fontSize: 56,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B2A4A',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  slideDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#00B4A6',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#1B2A4A',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  getStartedButton: {
    backgroundColor: '#00B4A6',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
