import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS, SPACING, CARD } from '../lib/design';

interface PendingShare {
  id: string;
  owner_id: string;
  account_id: string;
  created_at: string;
  owner_name?: string;
  member_name?: string;
}

interface AcceptedShare {
  id: string;
  owner_id: string;
  updated_at: string;
  owner_name?: string;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
};

export default function NotificationsDrawer({ visible, onClose, onCountChange }: Props) {
  const { session } = useAuth();
  const [pending, setPending] = useState<PendingShare[]>([]);
  const [accepted, setAccepted] = useState<AcceptedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const userId = session.user.id;
      const [pendingRes, acceptedRes] = await Promise.all([
        supabase
          .from('shared_accounts')
          .select('id, owner_id, account_id, created_at')
          .eq('recipient_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('shared_accounts')
          .select('id, owner_id, updated_at')
          .eq('recipient_id', userId)
          .eq('status', 'accepted')
          .order('updated_at', { ascending: false })
          .limit(10),
      ]);

      const pendingData = pendingRes.data || [];
      const acceptedData = acceptedRes.data || [];
      onCountChange?.(pendingData.length);

      // Use SECURITY DEFINER RPC to get owner + member names (bypasses RLS)
      const allShareIds = [
        ...pendingData.map((p: any) => p.id),
        ...acceptedData.map((a: any) => a.id),
      ];

      let nameMap: Record<string, { owner_name: string; member_name: string }> = {};
      if (allShareIds.length > 0) {
        const { data: shareInfo } = await supabase.rpc('get_share_info', { p_share_ids: allShareIds });
        (shareInfo ?? []).forEach((row: any) => {
          nameMap[row.share_id] = { owner_name: row.owner_name, member_name: row.member_name };
        });
      }

      setPending(pendingData.map((p: any) => ({
        ...p,
        owner_name: nameMap[p.id]?.owner_name ?? 'Someone',
        member_name: nameMap[p.id]?.member_name ?? 'an account',
      })));
      setAccepted(acceptedData.map((a: any) => ({
        ...a,
        owner_name: nameMap[a.id]?.owner_name ?? 'Someone',
      })));
    } catch (e) {
      console.error('NotificationsDrawer load error:', e);
    } finally {
      setLoading(false);
    }
  }, [session, onCountChange]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function handleAccept(shareId: string) {
    setProcessingId(shareId);
    try {
      await supabase
        .from('shared_accounts')
        .update({ status: 'accepted' })
        .eq('id', shareId);
      await load();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(shareId: string) {
    setProcessingId(shareId);
    try {
      await supabase.from('shared_accounts').delete().eq('id', shareId);
      await load();
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  const hasPending = pending.length > 0;
  const hasAccepted = accepted.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : !hasPending && !hasAccepted ? (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={56} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyDesc}>No pending requests right now.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {/* Pending Requests */}
            {hasPending && (
              <>
                <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
                {pending.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardIconWrap}>
                      <Ionicons name="person-add-outline" size={20} color={COLORS.rose} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>Account Share Request</Text>
                      <Text style={styles.cardDesc}>
                        <Text style={{ fontWeight: '600' }}>{item.owner_name ?? 'Someone'}</Text>
                        {' '}wants to share{' '}
                        <Text style={{ fontWeight: '600' }}>{item.member_name ?? 'an account'}</Text>
                        {' '}with you
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(item.id)}
                          disabled={processingId === item.id}
                        >
                          {processingId === item.id ? (
                            <ActivityIndicator size="small" color={COLORS.textInverse} />
                          ) : (
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.declineBtn}
                          onPress={() => handleDecline(item.id)}
                          disabled={processingId === item.id}
                        >
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Past Activity */}
            {hasAccepted && (
              <>
                <Text style={[styles.sectionLabel, hasPending && { marginTop: SPACING.xl }]}>RECENT ACTIVITY</Text>
                {accepted.map((item) => (
                  <View key={item.id} style={[styles.card, styles.cardMuted]}>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${COLORS.primary}18` }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardDesc}>
                        You accepted access from{' '}
                        <Text style={{ fontWeight: '600' }}>{item.owner_name ?? 'Someone'}</Text>
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(item.updated_at)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { ...FONTS.h3, color: COLORS.textPrimary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyTitle: { ...FONTS.h4, color: COLORS.textPrimary, textAlign: 'center' },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
  list: { padding: SPACING.xl, paddingBottom: 60 },
  sectionLabel: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  card: {
    ...CARD,
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  cardMuted: { backgroundColor: COLORS.surfaceAlt },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.rose}18`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 2 },
  cardDesc: { ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },
  cardDate: { ...FONTS.caption, color: COLORS.textTertiary },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: SPACING.base,
    minWidth: 72,
    alignItems: 'center',
  },
  acceptBtnText: { ...FONTS.bodySmall, color: COLORS.textInverse, fontWeight: '600' },
  declineBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: SPACING.base,
    minWidth: 72,
    alignItems: 'center',
  },
  declineBtnText: { ...FONTS.bodySmall, color: COLORS.textSecondary, fontWeight: '500' },
});
