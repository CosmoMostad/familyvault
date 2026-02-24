import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { ShareLink, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Share'>;
  route: RouteProp<RootStackParamList, 'Share'>;
};

function formatExpiry(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function ShareScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: 'Share Profile',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLinks();
    }, [memberId])
  );

  async function fetchLinks() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('share_links')
        .select('*')
        .eq('member_id', memberId)
        .eq('revoked', false)
        .order('created_at', { ascending: false });
      setLinks(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function generateLink() {
    setGenerating(true);
    try {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('share_links').insert({
        member_id: memberId,
        token,
        expires_at: expiresAt,
        created_by: user?.id,
        revoked: false,
      });
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchLinks();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function revokeLink(id: string) {
    Alert.alert('Revoke Link', 'This link will no longer work.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('share_links').update({ revoked: true }).eq('id', id);
          fetchLinks();
        },
      },
    ]);
  }

  async function shareLink(token: string) {
    const url = `https://wrenhealth.app/share/${token}`;
    try {
      await Share.share({
        message: `${memberName}'s health profile: ${url}`,
        url,
        title: `${memberName}'s Health Profile`,
      });
    } catch {}
  }

  const activeLinks = links.filter((l) => !isExpired(l.expires_at));

  return (
    <View style={styles.container}>
      {/* How it works */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconBg}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Secure, read-only links</Text>
            <Text style={styles.infoDesc}>
              Share links expire in 7 days and can only view — never edit — health info. Revoke anytime.
            </Text>
          </View>
        </View>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, generating && { opacity: 0.6 }]}
        onPress={generateLink}
        disabled={generating}
        activeOpacity={0.85}
      >
        {generating ? (
          <ActivityIndicator color={COLORS.textInverse} />
        ) : (
          <>
            <Ionicons name="link" size={18} color={COLORS.textInverse} />
            <Text style={styles.generateBtnText}>Generate Share Link</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Active links */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : activeLinks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="link-outline" size={40} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No active links</Text>
          <Text style={styles.emptySubtext}>Generated links will appear here</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Active Links ({activeLinks.length})</Text>
          {activeLinks.map((link) => (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.linkLeft}>
                <View style={styles.linkIconBg}>
                  <Ionicons name="link" size={16} color={COLORS.primaryLight} />
                </View>
                <View>
                  <Text style={styles.linkToken} numberOfLines={1}>
                    ...{link.token.slice(-12)}
                  </Text>
                  <Text style={styles.linkExpiry}>Expires {formatExpiry(link.expires_at)}</Text>
                </View>
              </View>
              <View style={styles.linkActions}>
                <TouchableOpacity
                  onPress={() => shareLink(link.token)}
                  style={styles.linkActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => revokeLink(link.id)}
                  style={styles.linkActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.rose} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.xl },
  infoCard: {
    ...CARD,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  infoRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 4 },
  infoDesc: { ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 20 },
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  sectionLabel: {
    ...FONTS.label,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  linkCard: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  linkLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  linkIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkToken: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600', maxWidth: 140 },
  linkExpiry: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  linkActions: { flexDirection: 'row', gap: SPACING.md },
  linkActionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.sm },
  emptyText: { ...FONTS.h4, color: COLORS.textSecondary },
  emptySubtext: { ...FONTS.bodySmall, color: COLORS.textTertiary },
});
