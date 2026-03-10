import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Switch, SafeAreaView, Linking, Share, TextInput,
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { SPACING } from '../../lib/design';

// ─── Change Credential Modal ──────────────────────────────────────────────────

function ChangeModal({
  visible, title, fields, onClose, onSave, saving,
}: {
  visible: boolean; title: string;
  fields: { label: string; value: string; set: (v: string) => void; secure?: boolean; placeholder?: string }[];
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  const { isDark, colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[modal.backdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)' }]}>
          <View style={[modal.sheet, {
            backgroundColor: isDark ? '#111A14' : '#FFFFFF',
            borderTopColor: colors.border,
          }]}>
            <View style={[modal.handle, { backgroundColor: colors.border }]} />
            <Text style={[modal.title, { color: colors.textPrimary }]}>{title}</Text>
            {fields.map((f, i) => (
              <View key={i} style={modal.field}>
                <Text style={[modal.label, { color: colors.primary }]}>{f.label}</Text>
                <TextInput
                  style={[modal.input, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }]}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder ?? ''}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={f.secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}
            <View style={modal.actions}>
              <TouchableOpacity
                style={[modal.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[modal.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, saving && { opacity: 0.6 }]}
                onPress={onSave} disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.textInverse} />
                  : <Text style={[modal.saveText, { color: colors.textInverse }]}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.xl, gap: SPACING.base,
    borderTopWidth: 1,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.sm },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, letterSpacing: -0.3 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  input: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: SPACING.base, height: 52, fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14,
  },
  saveText: { fontSize: 15, fontWeight: '800' },
});

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  icon, iconColor, label, value,
  onPress, isLast = false, rightElement, destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap; iconColor?: string;
  label: string; value?: string; onPress?: () => void;
  isLast?: boolean; rightElement?: React.ReactNode; destructive?: boolean;
}) {
  const { colors } = useTheme();
  const ic = iconColor ?? colors.textTertiary;
  const content = (
    <View style={[row.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <View style={[row.iconBg, { backgroundColor: `${ic}1A` }]}>
        <Ionicons name={icon} size={17} color={ic} />
      </View>
      <Text style={[row.label, { color: destructive ? colors.rose : colors.textPrimary }]}>{label}</Text>
      <View style={row.right}>
        {value ? <Text style={[row.value, { color: colors.textSecondary }]}>{value}</Text> : null}
        {rightElement ?? (onPress
          ? <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          : null)}
      </View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.65}>{content}</TouchableOpacity>;
  return content;
}

const row = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: SPACING.base, gap: SPACING.md },
  iconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, flex: 1, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { fontSize: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
  const { isDark, toggleTheme, colors, gradients } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
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
      setShowEmailModal(false); setNewEmail('');
      Alert.alert('Check your email', 'A confirmation link has been sent to your new email address.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSavingEmail(false); }
  }

  async function handleChangePassword() {
    if (!newPassword.trim()) { Alert.alert('Required', 'Please enter a new password.'); return; }
    if (newPassword.length < 8) { Alert.alert('Too short', 'Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowPasswordModal(false); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Done', 'Your password has been updated.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSavingPassword(false); }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await signOut(); } catch (e: any) { Alert.alert('Error', e.message); } } },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert('Delete Account', 'This permanently deletes your account and all health data. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account', style: 'destructive',
        onPress: () => Alert.alert('Are you absolutely sure?', 'All family profiles, health records, and data will be permanently deleted.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Delete Everything', style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase.rpc('delete_user_account');
                if (error) throw error;
                await signOut();
              } catch (e: any) { Alert.alert('Error', 'Something went wrong. Please try again.'); }
            },
          },
        ]),
      },
    ]);
  }

  const userEmail = session?.user?.email ?? '';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={gradients.background as any} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={gradients.topGlow as any}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Settings</Text>
          </View>

          {/* Profile card */}
          {profile && (
            <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.profileAvatar}>
                <Text style={[styles.profileAvatarText, { color: colors.textInverse }]}>{getInitials(profile.full_name)}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profile.full_name}</Text>
                {userEmail ? <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userEmail}</Text> : null}
              </View>
            </View>
          )}

          {/* Account */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row
              icon="mail-outline" iconColor='#60A5FA'
              label="Change Email"
              value={userEmail ? userEmail.split('@')[0] + '…' : ''}
              onPress={() => { setNewEmail(''); setShowEmailModal(true); }}
            />
            <Row
              icon="lock-closed-outline" iconColor='#F59E0B'
              label="Change Password"
              onPress={() => { setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}
              isLast
            />
          </View>

          {/* App */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>APP</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row
              icon="notifications-outline" iconColor='#A78BFA'
              label="Appointment Reminders"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
                />
              }
            />
            <Row
              icon={isDark ? 'moon-outline' : 'sunny-outline'}
              iconColor='#A78BFA'
              label={isDark ? 'Dark Mode' : 'Light Mode'}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={isDark ? colors.primary : colors.textTertiary}
                />
              }
            />
            <Row
              icon="star-outline" iconColor='#FBBF24'
              label="Rate Wren Health"
              onPress={() => Linking.openURL('https://apps.apple.com')}
            />
            <Row
              icon="share-outline" iconColor='#34D399'
              label="Share with a Friend"
              onPress={() => Share.share({ message: 'Check out Wren Health — a family health manager app: https://wrenhealth.app' })}
              isLast
            />
          </View>

          {/* Support */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SUPPORT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row icon="help-circle-outline" iconColor='#60A5FA' label="Help & FAQ" onPress={() => Linking.openURL('https://wrenhealth.app/help')} />
            <Row icon="chatbubble-ellipses-outline" iconColor='#93C5FD' label="Contact Support" onPress={() => Linking.openURL('mailto:support@wrenhealth.app')} />
            <Row icon="shield-checkmark-outline" iconColor={colors.primary} label="Privacy Policy" onPress={() => Linking.openURL('https://wrenhealth.app/privacy')} />
            <Row icon="document-text-outline" iconColor={colors.textTertiary} label="Terms of Service" onPress={() => Linking.openURL('https://wrenhealth.app/terms')} isLast />
          </View>

          {/* About */}
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row icon="leaf-outline" iconColor={colors.primary} label="Wren Health" value="v1.0.0" isLast />
          </View>

          {/* Sign out */}
          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: `${colors.rose}1A`, borderColor: `${colors.rose}40` }]}
            onPress={handleSignOut} activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.rose} />
            <Text style={[styles.signOutText, { color: colors.rose }]}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={[styles.deleteText, { color: colors.textTertiary }]}>Delete Account</Text>
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      <ChangeModal
        visible={showEmailModal} title="Change Email"
        fields={[{ label: 'NEW EMAIL', value: newEmail, set: setNewEmail, placeholder: 'new@email.com' }]}
        onClose={() => setShowEmailModal(false)} onSave={handleChangeEmail} saving={savingEmail}
      />
      <ChangeModal
        visible={showPasswordModal} title="Change Password"
        fields={[
          { label: 'NEW PASSWORD', value: newPassword, set: setNewPassword, placeholder: 'At least 8 characters', secure: true },
          { label: 'CONFIRM PASSWORD', value: confirmPassword, set: setConfirmPassword, placeholder: 'Repeat password', secure: true },
        ]}
        onClose={() => setShowPasswordModal(false)} onSave={handleChangePassword} saving={savingPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  headerArea: { paddingTop: SPACING.sm, marginBottom: SPACING.xl },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },

  profileCard: {
    borderRadius: 22, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    padding: 20, marginBottom: SPACING.xl, gap: SPACING.md,
    shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 6,
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14,
  },
  profileAvatarText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  profileName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: SPACING.sm, marginTop: 32, paddingLeft: 2,
  },

  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 4,
    shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, height: 56, borderRadius: 18, marginTop: 40,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  signOutText: { fontSize: 15, fontWeight: '700' },

  deleteBtn: { alignItems: 'center', paddingVertical: SPACING.base, marginTop: SPACING.sm },
  deleteText: { fontSize: 13, fontWeight: '500' },
});
