import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';
import NotificationsDrawer from '../../components/NotificationsDrawer';

function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MemberCard({
  member,
  onPress,
  onLongPress,
}: {
  member: FamilyMember;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const age = getAge(member.dob);
  const conditions = member.health_info?.conditions ?? [];
  const firstCondition = conditions[0]?.name;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {member.photo_url ? (
        <Image source={{ uri: member.photo_url }} style={styles.avatarPhoto} />
      ) : (
        <View style={[styles.avatar, member.is_self && styles.avatarSelf]}>
          <Text style={[styles.avatarText, member.is_self && styles.avatarTextSelf]}>
            {getInitials(member.full_name)}
          </Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{member.full_name}</Text>
          {member.is_self && (
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>Me</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          {member.relationship && (
            <Text style={styles.cardMetaText}>{member.relationship}</Text>
          )}
          {member.relationship && age ? <Text style={styles.metaDot}>·</Text> : null}
          {age ? <Text style={styles.cardMetaText}>{age} yrs</Text> : null}
          {(member as any).blood_type ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{(member as any).blood_type}</Text>
              </View>
            </>
          ) : null}
        </View>
        {firstCondition ? (
          <Text style={styles.conditionText} numberOfLines={1}>{firstCondition}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

export default function FamilyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);

  async function fetchData() {
    try {
      const [membersRes, notifRes] = await Promise.all([
        supabase
          .from('family_members')
          .select('*, health_info(*)')
          .eq('owner_id', session?.user?.id)
          .order('is_self', { ascending: false })
          .order('created_at', { ascending: true }),
        session?.user
          ? supabase
              .from('shared_accounts')
              .select('id', { count: 'exact', head: true })
              .eq('recipient_id', session.user.id)
              .eq('status', 'pending')
          : Promise.resolve({ count: 0, error: null }),
      ]);

      if (membersRes.error) throw membersRes.error;
      setMembers(membersRes.data || []);
      setPendingCount(notifRes.count ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [session])
  );

  async function handleDelete(member: FamilyMember) {
    Alert.alert(
      'Remove Account',
      `Remove ${member.full_name} from Wren Health? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await supabase.from('family_members').delete().eq('id', member.id);
            fetchData();
          },
        },
      ]
    );
  }

  function handleThreeDot() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDotMenu(true);
  }

  function sortByName() {
    setMembers((prev) => {
      const self = prev.filter((m) => m.is_self);
      const others = [...prev.filter((m) => !m.is_self)].sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
      );
      return [...self, ...others];
    });
    setShowDotMenu(false);
  }

  function sortByAge() {
    setMembers((prev) => {
      const self = prev.filter((m) => m.is_self);
      const others = [...prev.filter((m) => !m.is_self)].sort((a, b) => {
        const ageA = a.dob ? new Date(a.dob).getTime() : 0;
        const ageB = b.dob ? new Date(b.dob).getTime() : 0;
        return ageA - ageB;
      });
      return [...self, ...others];
    });
    setShowDotMenu(false);
  }

  function handleAddFamily() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddEditMember', {});
  }

  const selfMember = members.find((m) => m.is_self);
  const familyMembers = members.filter((m) => !m.is_self);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Accounts</Text>
          <View style={styles.headerActions}>
            {/* Bell icon with badge */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setNotifVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingCount > 9 ? '9+' : String(pendingCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* 3-dot menu */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleThreeDot}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* MY HEALTH section */}
        <Text style={styles.sectionLabel}>MY HEALTH</Text>
        {selfMember ? (
          <MemberCard
            member={selfMember}
            onPress={() =>
              navigation.navigate('MemberProfile', {
                memberId: selfMember.id,
                memberName: selfMember.full_name,
              })
            }
            onLongPress={() => handleDelete(selfMember)}
          />
        ) : null}

        {/* FAMILY MEMBERS section */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>FAMILY MEMBERS</Text>

        {familyMembers.length === 0 ? (
          <Text style={styles.emptyFamilyText}>No family members added yet</Text>
        ) : (
          familyMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onPress={() =>
                navigation.navigate('MemberProfile', {
                  memberId: member.id,
                  memberName: member.full_name,
                })
              }
              onLongPress={() => handleDelete(member)}
            />
          ))
        )}

        {/* Add Family Member button */}
        <TouchableOpacity
          style={styles.addFamilyBtn}
          onPress={handleAddFamily}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.addFamilyBtnText}>Add Family Member</Text>
        </TouchableOpacity>
      </ScrollView>

      <NotificationsDrawer
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onCountChange={(count) => setPendingCount(count)}
      />

      {/* ── Three-dot dropdown menu ── */}
      <Modal
        visible={showDotMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDotMenu(false)}
      >
        <Pressable style={dotMenu.backdrop} onPress={() => setShowDotMenu(false)}>
          <View style={dotMenu.menu}>
            <TouchableOpacity style={dotMenu.item} onPress={sortByName} activeOpacity={0.7}>
              <Ionicons name="text-outline" size={16} color={COLORS.textPrimary} />
              <Text style={dotMenu.itemText}>Sort by Name</Text>
            </TouchableOpacity>
            <View style={dotMenu.divider} />
            <TouchableOpacity style={dotMenu.item} onPress={sortByAge} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textPrimary} />
              <Text style={dotMenu.itemText}>Sort by Age</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
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
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarSelf: { backgroundColor: COLORS.primary },
  avatarPhoto: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
  avatarTextSelf: { color: COLORS.textInverse },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  cardName: { ...FONTS.h4, color: COLORS.textPrimary },
  selfBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  selfBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textInverse },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 },
  cardMetaText: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  metaDot: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  bloodBadge: {
    backgroundColor: COLORS.roseLight ?? `${COLORS.rose}20`, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  bloodBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.rose },
  conditionText: { ...FONTS.bodySmall, color: COLORS.textSecondary },

  // Family section
  emptyFamilyText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  addFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    height: 50,
    marginTop: SPACING.md,
  },
  addFamilyBtnText: {
    ...FONTS.h4,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

const dotMenu = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 96,
    right: SPACING.xl,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
    minWidth: 180,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
  },
  itemText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
});
