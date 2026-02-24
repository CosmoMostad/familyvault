// Run in Supabase SQL Editor before this screen will show real data:
//
// create table if not exists public.shared_accounts (
//   id uuid primary key default gen_random_uuid(),
//   account_id uuid references public.family_members(id) on delete cascade,
//   owner_id uuid references auth.users(id) on delete cascade,
//   recipient_id uuid references auth.users(id) on delete cascade,
//   access_level text not null default 'view',
//   shared_fields jsonb not null default '{}'::jsonb,
//   accepted boolean default false,
//   created_at timestamptz default now()
// );
// alter table public.shared_accounts enable row level security;
// create policy 'Recipients see shares for them' on public.shared_accounts
//   for select using (auth.uid() = recipient_id);
// create policy 'Owners manage their shares' on public.shared_accounts
//   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

interface IncomingShare {
  id: string;
  account_id: string;
  owner_id: string;
  access_level: 'view' | 'edit';
  shared_fields: Record<string, boolean>;
  accepted: boolean;
  created_at: string;
  member_name: string;
  member_relationship?: string;
  member_dob?: string;
  member_blood_type?: string;
  owner_name: string;
}

function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} years old`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function SharedAccountCard({
  share,
  onAccept,
  onDecline,
}: {
  share: IncomingShare;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const age = getAge(share.member_dob);
  const isPending = !share.accepted;

  const metaParts: string[] = [];
  if (share.member_relationship) metaParts.push(share.member_relationship);
  if (age) metaParts.push(age);
  if (share.member_blood_type) metaParts.push(share.member_blood_type);
  const meta = metaParts.join(' · ');

  return (
    <View style={[styles.card, isPending && styles.cardPending]}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(share.member_name)}</Text>
        </View>

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
            {share.access_level === 'edit' ? 'Can Edit' : 'View Only'}
          </Text>
        </View>
      </View>

      {isPending && (
        <View style={styles.pendingActions}>
          <Text style={styles.pendingLabel}>Accept this shared account?</Text>
          <View style={styles.pendingButtons}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SharedScreen() {
  const { user } = useAuth();
  const [shares, setShares] = useState<IncomingShare[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchShares();
    }, [user])
  );

  async function fetchShares() {
    if (!user) return;
    setLoading(true);
    try {
      // For now, show empty state (table may not exist yet)
      // Once the table is created in Supabase, this query will return real data
      const { data, error } = await supabase
        .from('shared_accounts')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table doesn't exist yet — show empty state gracefully
        setShares([]);
        return;
      }

      // Enrich with member + owner data
      const enriched: IncomingShare[] = await Promise.all(
        (data || []).map(async (share) => {
          const [memberRes, profileRes] = await Promise.all([
            supabase.from('family_members').select('full_name, relationship, dob, blood_type').eq('id', share.account_id).single(),
            supabase.from('profiles').select('full_name').eq('user_id', share.owner_id).single(),
          ]);
          return {
            ...share,
            member_name: memberRes.data?.full_name ?? 'Unknown',
            member_relationship: memberRes.data?.relationship,
            member_dob: memberRes.data?.dob,
            member_blood_type: memberRes.data?.blood_type,
            owner_name: profileRes.data?.full_name ?? 'Someone',
          };
        })
      );
      setShares(enriched);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(shareId: string) {
    await supabase
      .from('shared_accounts')
      .update({ accepted: true })
      .eq('id', shareId);
    fetchShares();
  }

  async function handleDecline(shareId: string) {
    Alert.alert('Decline Share', 'Remove this shared account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('shared_accounts').delete().eq('id', shareId);
          fetchShares();
        },
      },
    ]);
  }

  const pending = shares.filter((s) => !s.accepted);
  const accepted = shares.filter((s) => s.accepted);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shared With Me</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 48 }} />
      ) : shares.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="share-social-outline" size={48} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No accounts shared with you</Text>
          <Text style={styles.emptyDesc}>
            When a family member shares a health account with you, it will appear here. You can view or edit their health info depending on what access they gave you.
          </Text>

          <View style={styles.howTo}>
            <Text style={styles.howToHeading}>How sharing works</Text>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>1</Text></View>
              <Text style={styles.howToText}>Someone shares a health account with your email</Text>
            </View>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>2</Text></View>
              <Text style={styles.howToText}>You receive a notification and it appears here</Text>
            </View>
            <View style={styles.howToRow}>
              <View style={styles.howToNum}><Text style={styles.howToNumText}>3</Text></View>
              <Text style={styles.howToText}>Accept to view or edit the account they shared</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={[...pending, ...accepted]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            pending.length > 0 ? (
              <View style={styles.sectionHeader}>
                <View style={styles.pendingDot} />
                <Text style={styles.sectionLabel}>{pending.length} Pending</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const showAcceptedHeader = item.accepted && (index === 0 || !pending[index - 1]);
            return (
              <View>
                {showAcceptedHeader && accepted.length > 0 && (
                  <Text style={[styles.sectionLabel, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
                    Active
                  </Text>
                )}
                <SharedAccountCard
                  share={item}
                  onAccept={() => handleAccept(item.id)}
                  onDecline={() => handleDecline(item.id)}
                />
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 100, paddingTop: SPACING.sm },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
  sectionLabel: { ...FONTS.label, color: COLORS.textTertiary, textTransform: 'uppercase' },

  card: {
    ...CARD,
    padding: SPACING.base,
  },
  cardPending: {
    borderWidth: 1.5,
    borderColor: COLORS.amberLight,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  cardInfo: { flex: 1 },
  cardName: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 2 },
  cardMeta: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginBottom: 2 },
  sharedBy: { ...FONTS.caption, color: COLORS.textTertiary },

  accessBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  accessBadgeView: { backgroundColor: COLORS.surfaceAlt },
  accessBadgeEdit: { backgroundColor: COLORS.primaryMuted },
  accessBadgeText: { fontSize: 11, fontWeight: '700' },
  accessBadgeTextView: { color: COLORS.textSecondary },
  accessBadgeTextEdit: { color: COLORS.primary },

  pendingActions: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pendingLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  pendingButtons: { flexDirection: 'row', gap: SPACING.sm },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '600' },
  acceptBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { ...FONTS.body, color: COLORS.textInverse, fontWeight: '600' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: SPACING.xxl,
  },
  howTo: {
    width: '100%',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  howToHeading: { ...FONTS.label, color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: SPACING.xs },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  howToNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  howToNumText: { ...FONTS.label, color: COLORS.primary, fontSize: 12 },
  howToText: { ...FONTS.bodySmall, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
});
