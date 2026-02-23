import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const APP_VERSION = '1.0.0';

function SettingRow({
  emoji,
  label,
  onPress,
  value,
  showArrow = true,
  right,
}: {
  emoji?: string;
  label: string;
  onPress?: () => void;
  value?: string;
  showArrow?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      {emoji && <Text style={styles.rowEmoji}>{emoji}</Text>}
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {right}
        {showArrow && onPress && <Text style={styles.rowArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkNotifications();
  }, []);

  async function checkNotifications() {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } else {
      // Can't disable from app — open Settings
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, go to Settings > FamilyVault > Notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('user_id', user?.id);

      if (error) throw error;
      await refreshProfile();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  function getInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(profile?.full_name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || 'Your Name'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditName(profile?.full_name || '');
            setShowEditModal(true);
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.card}>
          <SettingRow
            emoji="🔔"
            label="Notifications"
            showArrow={false}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E5E7EB', true: '#00B4A6' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <SettingRow
            emoji="🔒"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://familyvault.app/privacy')}
          />
          <View style={styles.divider} />
          <SettingRow
            emoji="📄"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://familyvault.app/terms')}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <SettingRow emoji="📱" label="App Version" value={APP_VERSION} showArrow={false} />
          <View style={styles.divider} />
          <SettingRow emoji="🛡️" label="FamilyVault" value="Made with ❤️" showArrow={false} />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Your data is encrypted and stored securely.</Text>

      <View style={{ height: 40 }} />

      {/* Edit name modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#00B4A6" /> : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.formLabel}>Full Name</Text>
            <TextInput
              style={styles.formInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  content: { padding: 16 },
  profileCard: {
    backgroundColor: '#1B2A4A',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,180,166,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00B4A6',
    marginRight: 14,
  },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowEmoji: { fontSize: 18, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, color: '#9CA3AF' },
  rowArrow: { fontSize: 20, color: '#D1D5DB', marginLeft: 4 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  signOutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  signOutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
  footer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 8 },
  modal: { flex: 1, backgroundColor: '#FAFAF8' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCancel: { color: '#6B7280', fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4A' },
  modalSave: { color: '#00B4A6', fontSize: 16, fontWeight: '700' },
  modalContent: { padding: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
});
