import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { ShareLink, RootStackParamList } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Share'>;
  route: RouteProp<RootStackParamList, 'Share'>;
};

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export default function ShareScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const { user } = useAuth();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `Share · ${memberName}` });
  }, [memberName]);

  useFocusEffect(
    useCallback(() => {
      fetchLinks();
    }, [memberId])
  );

  async function fetchLinks() {
    try {
      const { data } = await supabase
        .from('share_links')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      setLinks(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function generateLink() {
    if (!user) return;
    setGenerating(true);

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('share_links').insert({
        member_id: memberId,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        revoked: false,
      });

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchLinks();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate share link.');
    } finally {
      setGenerating(false);
    }
  }

  async function revokeLink(link: ShareLink) {
    Alert.alert(
      'Revoke Link',
      'This link will immediately stop working. Anyone with this link will lose access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await supabase.from('share_links').update({ revoked: true }).eq('id', link.id);
            fetchLinks();
          },
        },
      ]
    );
  }

  function getLinkUrl(token: string): string {
    return `https://familyvault.app/share/${token}`;
  }

  function copyLink(token: string) {
    Clipboard.setString(getLinkUrl(token));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied!', 'Share link copied to clipboard.');
  }

  async function shareLink(token: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `${memberName}'s health profile (secure, 7-day access): ${getLinkUrl(token)}`,
      title: `Share ${memberName}'s Health Profile`,
    });
  }

  const activeLinks = links.filter((l) => !l.revoked && !isExpired(l.expires_at));
  const inactiveLinks = links.filter((l) => l.revoked || isExpired(l.expires_at));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoEmoji}>🔗</Text>
        <Text style={styles.infoTitle}>Share {memberName}'s Health Profile</Text>
        <Text style={styles.infoDesc}>
          Generate a secure, read-only link that gives access to this health profile for 7 days.
          Links expire automatically and can be revoked at any time.
        </Text>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
        onPress={generateLink}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.generateButtonText}>Generate New Share Link</Text>
        )}
      </TouchableOpacity>

      {/* Active links */}
      {activeLinks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Links ({activeLinks.length})</Text>
          {activeLinks.map((link) => (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.linkInfo}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>● Active</Text>
                </View>
                <Text style={styles.linkDate}>Created {formatDate(link.created_at)}</Text>
                <Text style={styles.linkExpiry}>Expires {formatDate(link.expires_at)}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {getLinkUrl(link.token)}
                </Text>
              </View>
              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.copyButton} onPress={() => copyLink(link.token)}>
                  <Text style={styles.copyText}>📋 Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={() => shareLink(link.token)}>
                  <Text style={styles.shareText}>📤 Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.revokeButton} onPress={() => revokeLink(link)}>
                  <Text style={styles.revokeText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Expired/revoked links */}
      {inactiveLinks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Links</Text>
          {inactiveLinks.map((link) => (
            <View key={link.id} style={[styles.linkCard, styles.linkCardInactive]}>
              <View style={styles.linkInfo}>
                <View style={[styles.activeBadge, styles.inactiveBadge]}>
                  <Text style={styles.inactiveBadgeText}>
                    {link.revoked ? '✕ Revoked' : '⏱ Expired'}
                  </Text>
                </View>
                <Text style={styles.linkDateInactive}>Created {formatDate(link.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {links.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={styles.emptyTitle}>No Links Generated Yet</Text>
          <Text style={styles.emptyDesc}>
            Tap "Generate New Share Link" above to create a secure 7-day access link.
          </Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoEmoji: { fontSize: 32, marginBottom: 10 },
  infoTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4A', marginBottom: 8 },
  infoDesc: { fontSize: 14, color: '#4B5563', lineHeight: 21 },
  generateButton: {
    backgroundColor: '#00B4A6',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#00B4A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  linkCardInactive: { opacity: 0.6 },
  linkInfo: { marginBottom: 12 },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activeBadgeText: { fontSize: 12, color: '#065F46', fontWeight: '700' },
  inactiveBadge: { backgroundColor: '#F3F4F6' },
  inactiveBadgeText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  linkDate: { fontSize: 13, color: '#374151', marginBottom: 2 },
  linkDateInactive: { fontSize: 13, color: '#9CA3AF' },
  linkExpiry: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  linkUrl: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' },
  linkActions: { flexDirection: 'row', gap: 8 },
  copyButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  shareButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  shareText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  revokeButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  revokeText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1B2A4A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21 },
});
