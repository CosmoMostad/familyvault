import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

function SettingsRow({
  icon,
  iconColor = COLORS.textSecondary,
  label,
  value,
  onPress,
  isLast = false,
  rightElement,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}) {
  const content = (
    <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
      <View style={[rowStyles.iconBg, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.right}>
        {value ? <Text style={rowStyles.value}>{value}</Text> : null}
        {rightElement ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} /> : null)}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { ...FONTS.bodySmall, color: COLORS.textSecondary },
});

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  function getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        {/* Profile card */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{getInitials(profile.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.full_name}</Text>
            </View>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>Free</Text>
            </View>
          </View>
        )}

        {/* App settings */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            iconColor={COLORS.primary}
            label="Appointment Reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primaryMuted }}
                thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="shield-outline"
            iconColor={COLORS.primaryLight}
            label="Privacy Policy"
            isLast
            onPress={() => {}}
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="mail-outline"
            iconColor={COLORS.textSecondary}
            label="Email"
            value=""
            isLast
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="leaf-outline"
            iconColor={COLORS.primary}
            label="Wren Health"
            value="v1.0.0"
            isLast
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.rose} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  headerArea: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  pageTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  profileCard: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
  profileName: { ...FONTS.h4, color: COLORS.textPrimary },
  profileBadge: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  profileBadgeText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },
  sectionLabel: {
    ...FONTS.label,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  card: { ...CARD, overflow: 'hidden', marginBottom: SPACING.sm },
  signOutBtn: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: SPACING.sm,
    marginTop: SPACING.base,
    backgroundColor: COLORS.roseLight,
    borderWidth: 0,
  },
  signOutText: { ...FONTS.h4, color: COLORS.rose, fontWeight: '600' },
});
