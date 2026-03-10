import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING } from '../../lib/design';
import { RootStackParamList } from '../../lib/types';
import NotificationsDrawer from '../../components/NotificationsDrawer';

interface AcceptedShare {
  id: string;
  account_id: string;
  owner_id: string;
  access_level: string;
  member_name: string;
  member_relationship?: string;
  member_dob?: string;
  member_blood_type?: string;
  member_photo?: string | null;
  owner_name: string;
}

function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function SharedCard({ share }: { share: AcceptedShare }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const age = getAge(share.member_dob);
  const metaParts: string[] = [];
  if (share.member_relationship) metaParts.push(share.member_relationship);
  if (age) metaParts.push(age);
  if (share.member_blood_type) metaParts.push(share.member_blood_type);
  const meta = metaParts.join(' · ');
  const canEdit = share.access_level === 'edit';

  return (
    <TouchableOpacity
      style={[styles.sharedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('MemberProfile', { memberId: share.account_id, memberName: share.member_name })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        {share.member_photo ? (
          <Image
            source={{ uri: share.member_photo }}
            style={[styles.sharedPhoto, { borderColor: colors.borderStrong }]}
          />
        ) : (
          <LinearGradient
            colors={[colors.primaryMuted, `${colors.primaryDark}30`]}
            style={[styles.sharedAvatar, { borderColor: colors.borderStrong }]}
          >
            <Text style={[styles.sharedInitials, { color: colors.primary }]}>{getInitials(share.member_name)}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sharedName, { color: colors.textPrimary }]}>{share.member_name}</Text>
          {meta ? <Text style={[styles.sharedMeta, { color: colors.textSecondary }]}>{meta}</Text> : null}
          <View style={[
            styles.accessBadge,
            { backgroundColor: canEdit ? colors.primaryMuted : colors.surface },
          ]}>
            <Text style={[styles.accessBadgeText, { color: canEdit ? colors.primary : colors.textSecondary }]}>
              {canEdit ? 'Editor' : 'Viewer'}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.sharedByRow, { borderTopColor: colors.divider }]}>
        <Ionicons name="person-circle-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.sharedByText, { color: colors.textTertiary }]}>Shared by {share.owner_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SharedScreen() {
  const { user } = useAuth();
  const { isDark, colors, gradients } = useTheme();
  const [shares, setShares] = useState<AcceptedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);

  useFocusEffect(useCallback(() => { fetchShares(); }, [user]));

  async function fetchShares() {
    if (!user) return;
    setLoading(true);
    try {
      const [sharesRes, pendingRes] = await Promise.all([
        supabase
          .from('shared_accounts')
          .select('id, account_id, owner_id, access_level')
          .eq('recipient_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false }),
        supabase
          .from('shared_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('status', 'pending'),
      ]);

      setPendingCount(pendingRes.count ?? 0);
      if (sharesRes.error || !sharesRes.data) { setShares([]); return; }

      const shareIds = sharesRes.data.map((s) => s.id);
      const { data: shareInfo } = await supabase.rpc('get_share_info', { p_share_ids: shareIds });
      const nameMap: Record<string, { owner_name: string; member_name: string }> = {};
      (shareInfo ?? []).forEach((row: any) => {
        nameMap[row.share_id] = { owner_name: row.owner_name, member_name: row.member_name };
      });

      setShares(sharesRes.data.map((share) => ({
        ...share,
        member_name: nameMap[share.id]?.member_name ?? 'Unknown',
        member_relationship: undefined,
        member_dob: undefined,
        member_blood_type: undefined,
        member_photo: null,
        owner_name: nameMap[share.id]?.owner_name ?? 'Someone',
      })));
    } finally {
      setLoading(false);
    }
  }

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

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Shared With Me</Text>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
            onPress={() => setNotifVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {pendingCount > 0 && (
              <View style={[styles.badge, { borderColor: colors.background }]}>
                <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : String(pendingCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : shares.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyWrap} showsVerticalScrollIndicator={false}>
          {pendingCount > 0 && (
            <TouchableOpacity
              style={[styles.pendingBanner, { backgroundColor: colors.amberLight, borderColor: `${colors.amber}40` }]}
              onPress={() => setNotifVisible(true)} activeOpacity={0.8}
            >
              <View style={[styles.pendingDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.pendingText, { color: colors.amber }]}>
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.amber} />
            </TouchableOpacity>
          )}
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted, borderColor: colors.borderStrong }]}>
            <Ionicons name="share-social-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing shared yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            When someone shares a health account with your email, it'll show up here after you accept.
          </Text>
          <View style={[styles.howToCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>HOW IT WORKS</Text>
            {[
              { icon: 'mail-outline', text: 'Someone shares a health account with your email' },
              { icon: 'notifications-outline', text: 'Tap the bell icon above to review and accept' },
              { icon: 'people-outline', text: 'Accepted accounts appear here for easy access' },
            ].map(({ icon, text }, i) => (
              <View key={i} style={styles.howToRow}>
                <View style={[styles.howToNum, { backgroundColor: colors.primaryMuted, borderColor: colors.borderStrong }]}>
                  <Text style={[styles.howToNumText, { color: colors.primary }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.howToText, { color: colors.textSecondary }]}>{text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pendingCount > 0 && (
            <TouchableOpacity
              style={[styles.pendingBanner, { backgroundColor: colors.amberLight, borderColor: `${colors.amber}40` }]}
              onPress={() => setNotifVisible(true)} activeOpacity={0.8}
            >
              <View style={[styles.pendingDot, { backgroundColor: colors.amber }]} />
              <Text style={[styles.pendingText, { color: colors.amber }]}>
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.amber} />
            </TouchableOpacity>
          )}
          <Text style={[styles.sectionLabel, { marginBottom: SPACING.md, color: colors.textTertiary }]}>
            {shares.length} SHARED ACCOUNT{shares.length !== 1 ? 'S' : ''}
          </Text>
          {shares.map((share) => <SharedCard key={share.id} share={share} />)}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <NotificationsDrawer
        visible={notifVisible}
        onClose={() => { setNotifVisible(false); fetchShares(); }}
        onCountChange={(count) => setPendingCount(count)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#E53E3E', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2, borderWidth: 1.5,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },

  // ── Shared card ──
  sharedCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
  },
  sharedPhoto: { width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
  sharedAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sharedInitials: { fontSize: 22, fontWeight: '800' },
  sharedName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  sharedMeta: { fontSize: 13, marginBottom: 6 },
  accessBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  accessBadgeText: { fontSize: 11, fontWeight: '700' },
  sharedByRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sharedByText: { fontSize: 12, fontWeight: '500' },

  // ── Pending banner ──
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  pendingText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // ── Empty state ──
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xxl, paddingBottom: 100 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.sm, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },

  howToCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: SPACING.base, gap: SPACING.md },
  howToRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  howToNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1,
  },
  howToNumText: { fontSize: 12, fontWeight: '800' },
  howToText: { fontSize: 14, flex: 1, lineHeight: 20 },

  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 100 },
});
