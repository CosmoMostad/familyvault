import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Switch, SafeAreaView, Linking, Share, TextInput,
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING } from '../../lib/design';

// ─── Change Credential Modal ──────────────────────────────────────────────────

function ChangeModal({
  visible, title, fields, onClose, onSave, saving,
}: {
  visible: boolean; title: string;
  fields: { label: string; value: string; set: (v: string) => void; secure?: boolean; placeholder?: string }[];
  onClose: () => void; onSave: () => void; saving: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={modal.backdrop}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>{title}</Text>
            {fields.map((f, i) => (
              <View key={i} style={modal.field}>
                <Text style={modal.label}>{f.label}</Text>
                <TextInput
                  style={modal.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder ?? ''}
                  placeholderTextColor="rgba(242,250,245,0.55)"
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
                style={[modal.saveBtn, saving && { opacity: 0.6 }]}
                onPress={onSave} disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#090D0B" />
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111A14', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.xl, gap: SPACING.base,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: SPACING.sm },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.base, height: 52, fontSize: 15, color: COLORS.textPrimary,
  },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1, height: 50, borderRadius: 14, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14,
  },
  saveText: { fontSize: 15, color: '#090D0B', fontWeight: '800' },
});

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  icon, iconColor = 'rgba(237,247,241,0.5)', label, value,
  onPress, isLast = false, rightElement, destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap; iconColor?: string;
  label: string; value?: string; onPress?: () => void;
  isLast?: boolean; rightElement?: React.ReactNode; destructive?: boolean;
}) {
  const content = (
    <View style={[row.row, !isLast && row.divider]}>
      <View style={[row.iconBg, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={[row.label, destructive && { color: COLORS.rose }]}>{label}</Text>
      <View style={row.right}>
        {value ? <Text style={row.value}>{value}</Text> : null}
        {rightElement ?? (onPress ? <Ionicons name="chevron-forward" size={15} color="rgba(242,250,245,0.55)" /> : null)}
      </View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.65}>{content}</TouchableOpacity>;
  return content;
}

const row = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: SPACING.base, gap: SPACING.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  iconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, color: COLORS.textPrimary, flex: 1, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { fontSize: 13, color: COLORS.textSecondary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { profile, session, signOut } = useAuth();
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#090D0B', '#0D1810', '#090D0B']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(82,183,136,0.14)', 'rgba(82,183,136,0.04)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerArea}>
            <Text style={styles.pageTitle}>Settings</Text>
          </View>

          {/* Profile card */}
          {profile && (
            <View style={styles.profileCard}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{getInitials(profile.full_name)}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{profile.full_name}</Text>
                {userEmail ? <Text style={styles.profileEmail}>{userEmail}</Text> : null}
              </View>

            </View>
          )}

          {/* Account */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
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
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.card}>
            <Row
              icon="notifications-outline" iconColor='#A78BFA'
              label="Appointment Reminders"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(82,183,136,0.5)' }}
                  thumbColor={notificationsEnabled ? COLORS.primary : 'rgba(237,247,241,0.4)'}
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
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <Row icon="help-circle-outline" iconColor='#60A5FA' label="Help & FAQ" onPress={() => Linking.openURL('https://wrenhealth.app/help')} />
            <Row icon="chatbubble-ellipses-outline" iconColor='#93C5FD' label="Contact Support" onPress={() => Linking.openURL('mailto:support@wrenhealth.app')} />
            <Row icon="shield-checkmark-outline" iconColor={COLORS.primary} label="Privacy Policy" onPress={() => Linking.openURL('https://wrenhealth.app/privacy')} />
            <Row icon="document-text-outline" iconColor="rgba(237,247,241,0.5)" label="Terms of Service" onPress={() => Linking.openURL('https://wrenhealth.app/terms')} isLast />
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <Row icon="leaf-outline" iconColor={COLORS.primary} label="Wren Health" value="v1.0.0" isLast />
          </View>

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.rose} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Delete account — subtle, as it should be */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={styles.deleteText}>Delete Account</Text>
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
  root: { flex: 1, backgroundColor: '#090D0B' },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  headerArea: { paddingTop: SPACING.sm, marginBottom: SPACING.xl },
  pageTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6 },

  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row', alignItems: 'center',
    padding: 20, marginBottom: SPACING.xl, gap: SPACING.md,
    shadowColor: 'rgba(82,183,136,0.25)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 6,
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#52B788', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 14,
  },
  profileAvatarText: { fontSize: 18, fontWeight: '800', color: '#090D0B', letterSpacing: -0.5 },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(237,247,241,0.40)',
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: SPACING.sm, marginTop: 32, paddingLeft: 2,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden', marginBottom: 4,
    shadowColor: 'rgba(82,183,136,0.15)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, height: 56, borderRadius: 18, marginTop: 40,
    backgroundColor: 'rgba(224,122,95,0.10)',
    borderWidth: 1, borderColor: 'rgba(224,122,95,0.25)',
    shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  signOutText: { fontSize: 15, color: COLORS.rose, fontWeight: '700' },

  deleteBtn: { alignItems: 'center', paddingVertical: SPACING.base, marginTop: SPACING.sm },
  deleteText: { fontSize: 13, color: 'rgba(242,250,245,0.55)', fontWeight: '500' },
});
