import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

interface SharedLink {
  id: string;
  member_id: string;
  token: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
  member_name?: string;
}

function formatExpiry(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function SharedScreen() {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [linkRes, memberRes] = await Promise.all([
        supabase
          .from('share_links')
          .select('*')
          .eq('revoked', false)
          .order('created_at', { ascending: false }),
        supabase.from('family_members').select('id, full_name'),
      ]);
      const memberMap: Record<string, string> = {};
      (memberRes.data || []).forEach((m) => { memberMap[m.id] = m.full_name; });
      const enriched = (linkRes.data || []).map((l) => ({
        ...l,
        member_name: memberMap[l.member_id] ?? 'Unknown',
      }));
      setLinks(enriched);
      setMembers(memberRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink(id: string) {
    Alert.alert('Revoke Link', 'This link will stop working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('share_links').update({ revoked: true }).eq('id', id);
          fetchData();
        },
      },
    ]);
  }

  const active = links.filter((l) => !isExpired(l.expires_at));
  const expired = links.filter((l) => isExpired(l.expires_at));

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shared</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : links.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="share-outline" size={48} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No shared links</Text>
          <Text style={styles.emptyDesc}>
            Share a family member's health profile from their profile page.
          </Text>
          <View style={styles.howTo}>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>1</Text></View>
              <Text style={styles.howToText}>Open a family member's profile</Text>
            </View>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>2</Text></View>
              <Text style={styles.howToText}>Tap the Share button</Text>
            </View>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>3</Text></View>
              <Text style={styles.howToText}>Generate a secure, read-only link</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={active.length > 0 ? <Text style={styles.sectionLabel}>Active Links</Text> : null}
          ListFooterComponent={
            expired.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>Expired</Text>
                {expired.map((l) => (
                  <View key={l.id} style={[styles.linkCard, styles.linkCardExpired]}>
                    <View style={[styles.linkIconBg, { opacity: 0.5 }]}>
                      <Ionicons name="link" size={16} color={COLORS.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.linkMember, { color: COLORS.textSecondary }]}>{l.member_name}</Text>
                      <Text style={styles.linkExpiry}>Expired</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.linkCard}>
              <View style={styles.linkIconBg}>
                <Ionicons name="link" size={16} color={COLORS.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkMember}>{item.member_name}</Text>
                <Text style={styles.linkExpiry}>{formatExpiry(item.expires_at)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => revokeLink(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.rose} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.lg,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  sectionLabel: {
    ...FONTS.label, color: COLORS.textTertiary,
    textTransform: 'uppercase', marginBottom: SPACING.sm,
  },
  linkCard: {
    ...CARD, flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm, gap: SPACING.md,
  },
  linkCardExpired: { opacity: 0.6 },
  linkIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  linkMember: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 2 },
  linkExpiry: { ...FONTS.caption, color: COLORS.textSecondary },
  emptyState: {
    flex: 1, alignItems: 'center', paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },
  howTo: {
    width: '100%', gap: SPACING.md,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: SPACING.base,
  },
  howToRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  howToNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  howToNumText: { ...FONTS.label, color: COLORS.primary, fontSize: 13 },
  howToText: { ...FONTS.body, color: COLORS.textPrimary, flex: 1 },
});
