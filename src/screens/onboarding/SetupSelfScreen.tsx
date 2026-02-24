import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupSelf'>;
};

export default function SetupSelfScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-circle-outline" size={96} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Set up your health profile</Text>
        <Text style={styles.subtitle}>
          Your own account comes first. Add your info so family members can share with you.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('AddEditMember', { isSelf: true })}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={20} color={COLORS.textInverse} />
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.navigate('MainTabs')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  iconWrap: {
    marginBottom: SPACING.xxl,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxxl,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: SPACING.xxxl,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  primaryBtnText: {
    ...FONTS.h4,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
  },
});
