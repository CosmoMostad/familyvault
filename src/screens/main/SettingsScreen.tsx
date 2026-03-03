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
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

// ── Small change-credential modal ──────────────────────────────────────────

function ChangeModal({
  visible,
  title,
  fields,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  title: string;
  fields: { label: string; value: string; set: (v: string) => void; secure?: boolean; placeholder?: string }[];
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modal.backdrop}>
          <View style={modal.sheet}>
            <Text style={modal.title}>{title}</Text>
            {fields.map((f, i) => (
              <View key={i} style={modal.field}>
                <Text style={modal.label}>{f.label}</Text>
                <TextInput
                  style={modal.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder ?? ''}
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={f.secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
            <View style={modal.actions}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                <Text style={modal.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.saveBtn, saving && { opacity: 0.65 }]}
                onPress={onSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={modal.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: SPACING.xl,
    gap: SPACING.base,
  },
  title: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.6 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 50,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { ...FONTS.body, color: '#fff', fontWeight: '700' },
});

// ── Row component ───────────────────────────────────────────────────────────

function Row({
  icon,
  iconColor = COLORS.textSecondary,
  label,
  value,
  onPress,
  isLast = false,
  rightElement,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const content = (
    <View style={[rowS.row, !isLast && rowS.border]}>
      <View style={[rowS.iconBg, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[rowS.label, destructive && { color: COLORS.rose }]}>{label}</Text>
      <View style={rowS.right}>
        {value ? <Text style={rowS.value}>{value}</Text> : null}
        {rightElement ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} /> : null)}
      </View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  return content;
}

const rowS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  iconBg: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { ...FONTS.bodySmall, color: COLORS.textSecondary },
});

// ── SettingsScreen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Email change modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  function getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) { Alert.alert('Required', 'Please enter a new email.'); return; }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      setShowEmailModal(false);
      setNewEmail('');
      Alert.alert('Check your email', 'A confirmation link has been sent to your new email address.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSavingEmail(false); }
  }

  async function handleChangePassword() {
    if (!newPassword.trim()) { Alert.alert('Required', 'Please enter a new password.'); return; }
    if (newPassword.length < 8) { Alert.alert('Too short', 'Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Done', 'Your password has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSavingPassword(false); }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await signOut(); } catch (e: any) { Alert.alert('Error', e.message); } } },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated health data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All family profiles, health records, and calendar data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Delete user data via Supabase (RLS cascade handles family_members, health_info, etc.)
                      const { error } = await supabase.rpc('delete_user_account');
                      if (error) throw error;
                      await signOut();
                    } catch (e: any) {
                      // Fallback: contact support
                      Alert.alert(
                        'Contact Support',
                        'To complete account deletion, please email support@wrenhealth.app from your registered address.',
                        [
                          { text: 'OK' },
                          { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@wrenhealth.app?subject=Account Deletion Request') },
                        ]
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  const userEmail = session?.user?.email ?? '';

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
              {userEmail ? <Text style={styles.profileEmail}>{userEmail}</Text> : null}
            </View>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>Free</Text>
            </View>
          </View>
        )}

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Row
            icon="mail-outline"
            iconColor={COLORS.textSecondary}
            label="Change Email"
            value={userEmail ? userEmail.split('@')[0] + '…' : ''}
            onPress={() => { setNewEmail(''); setShowEmailModal(true); }}
          />
          <Row
            icon="lock-closed-outline"
            iconColor={COLORS.textSecondary}
            label="Change Password"
            onPress={() => { setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}
            isLast
          />
        </View>

        {/* App */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <Row
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
          <Row
            icon="star-outline"
            iconColor="#F59E0B"
            label="Rate Wren Health"
            onPress={() => Linking.openURL('https://apps.apple.com')}
          />
          <Row
            icon="share-outline"
            iconColor={COLORS.primary}
            label="Share with a Friend"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <Row
            icon="help-circle-outline"
            iconColor={COLORS.primary}
            label="Help & FAQ"
            onPress={() => Linking.openURL('https://wrenhealth.app/help')}
          />
          <Row
            icon="chatbubble-ellipses-outline"
            iconColor={COLORS.primary}
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@wrenhealth.app')}
          />
          <Row
            icon="shield-checkmark-outline"
            iconColor={COLORS.primaryLight}
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://wrenhealth.app/privacy')}
          />
          <Row
            icon="document-text-outline"
            iconColor={COLORS.textSecondary}
            label="Terms of Service"
            onPress={() => Linking.openURL('https://wrenhealth.app/terms')}
            isLast
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <Row
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

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Email change modal */}
      <ChangeModal
        visible={showEmailModal}
        title="Change Email"
        fields={[{ label: 'NEW EMAIL', value: newEmail, set: setNewEmail, placeholder: 'new@email.com' }]}
        onClose={() => setShowEmailModal(false)}
        onSave={handleChangeEmail}
        saving={savingEmail}
      />

      {/* Password change modal */}
      <ChangeModal
        visible={showPasswordModal}
        title="Change Password"
        fields={[
          { label: 'NEW PASSWORD', value: newPassword, set: setNewPassword, placeholder: 'At least 8 characters', secure: true },
          { label: 'CONFIRM PASSWORD', value: confirmPassword, set: setConfirmPassword, placeholder: 'Repeat password', secure: true },
        ]}
        onClose={() => setShowPasswordModal(false)}
        onSave={handleChangePassword}
        saving={savingPassword}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  headerArea: { marginBottom: SPACING.xl, paddingTop: SPACING.sm },
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
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
  profileName: { ...FONTS.h4, color: COLORS.textPrimary },
  profileEmail: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
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
  deleteAccountBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    marginTop: SPACING.sm,
  },
  deleteAccountText: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontWeight: '500' },
});
