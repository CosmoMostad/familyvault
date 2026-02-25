import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';
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
  const age = getAge(share.member_dob);
  const metaParts: string[] = [];
  if (share.member_relationship) metaParts.push(share.member_relationship);
  if (age) metaParts.push(age);
  if (share.member_blood_type) metaParts.push(share.member_blood_type);
  const meta = metaParts.join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {share.member_photo ? (
          <Image source={{ uri: share.member_photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getInitials(share.member_name)}</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{share.member_name}</Text>
          {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
          <Text style={styles.sharedBy}>Shared by {share.owner_name}</Text>
        </View>

        <View style={[
          styles.accessBadge,
          share.access_level === 'edit' ? styles.accessBadgeEdit : styles.accessBadgeView,
        ]}>
          <Text style={[
            styles.accessBadgeText,
            share.access_level === 'edit' ? styles.accessBadgeTextEdit : styles.accessBadgeTextView,
          ]}>
            {share.access_level === 'edit' ? 'Can Edit' : 'View'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SharedScreen() {
  const { user } = useAuth();
  const [shares, setShares] = useState<AcceptedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchShares();
    }, [user])
  );

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

      if (sharesRes.error || !sharesRes.data) {
        setShares([]);
        return;
      }

      const enriched: AcceptedShare[] = await Promise.all(
        sharesRes.data.map(async (share) => {
          const [memberRes, profileRes] = await Promise.all([
            supabase
              .from('family_members')
              .select('full_name, relationship, dob, blood_type, photo_url')
              .eq('id', share.account_id)
              .single(),
            supabase
              .from('profiles')
              .select('full_name')
              .eq('id', share.owner_id)
              .single(),
          ]);
          return {
            ...share,
            member_name: memberRes.data?.full_name ?? 'Unknown',
            member_relationship: memberRes.data?.relationship,
            member_dob: memberRes.data?.dob,
            member_blood_type: memberRes.data?.blood_type,
            member_photo: memberRes.data?.photo_url,
            owner_name: profileRes.data?.full_name ?? 'Someone',
          };
        })
      );
      setShares(enriched);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shared With Me</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setNotifVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : String(pendingCount)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : shares.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="share-social-outline" size={48} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No shared accounts yet</Text>
          <Text style={styles.emptyDesc}>
            When someone shares a health account with you, it'll appear here after you accept.
          </Text>

          {pendingCount > 0 && (
            <TouchableOpacity
              style={styles.pendingBanner}
              onPress={() => setNotifVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pendingDot} />
              <Text style={styles.pendingBannerText}>
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.amber} />
            </TouchableOpacity>
          )}

          <View style={styles.howTo}>
            <Text style={styles.howToHeading}>HOW SHARING WORKS</Text>
            {[
              'Someone shares a health account with your email',
              'You get a notification — tap the bell to accept',
              'Accepted accounts appear here for easy access',
            ].map((text, i) => (
              <View key={i} style={styles.howToRow}>
                <View style={styles.howToNum}>
                  <Text style={styles.howToNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.howToText}>{text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pendingCount > 0 && (
            <TouchableOpacity
              style={styles.pendingBanner}
              onPress={() => setNotifVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pendingDot} />
              <Text style={styles.pendingBannerText}>
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.amber} />
            </TouchableOpacity>
          )}
          {shares.map((share) => (
            <SharedCard key={share.id} share={share} />
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <NotificationsDrawer
        visible={notifVisible}
        onClose={() => {
          setNotifVisible(false);
          fetchShares(); // refresh after accepting/declining
        }}
        onCountChange={(count) => setPendingCount(count)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#E53E3E',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.background,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: 100 },
  card: { ...CARD, padding: SPACING.base, marginBottom: SPACING.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 2 },
  cardMeta: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginBottom: 2 },
  sharedBy: { ...FONTS.caption, color: COLORS.textTertiary },
  accessBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  accessBadgeView: { backgroundColor: COLORS.surfaceAlt },
  accessBadgeEdit: { backgroundColor: COLORS.primaryMuted },
  accessBadgeText: { fontSize: 11, fontWeight: '700' },
  accessBadgeTextView: { color: COLORS.textSecondary },
  accessBadgeTextEdit: { color: COLORS.primary },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.amberLight,
    borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber, flexShrink: 0 },
  pendingBannerText: { ...FONTS.bodySmall, color: COLORS.amber, fontWeight: '600', flex: 1 },
  emptyState: {
    alignItems: 'center', paddingTop: 48, paddingHorizontal: SPACING.xxl, paddingBottom: 100,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },
  howTo: {
    width: '100%', backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16, padding: SPACING.base, gap: SPACING.sm,
  },
  howToHeading: { ...FONTS.label, color: COLORS.textTertiary, marginBottom: SPACING.xs },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  howToNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  howToNumText: { ...FONTS.label, color: COLORS.primary, fontSize: 12 },
  howToText: { ...FONTS.bodySmall, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
});
