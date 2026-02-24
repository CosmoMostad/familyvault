import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

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
}: {
  member: FamilyMember;
  onPress: () => void;
}) {
  const age = getAge(member.dob);
  const conditions = member.health_info?.conditions ?? [];
  const firstCondition = conditions[0]?.name;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{member.full_name}</Text>
        <View style={styles.cardMeta}>
          {age ? <Text style={styles.cardMetaText}>{age} years old</Text> : null}
          {age && member.blood_type ? <Text style={styles.metaDot}>·</Text> : null}
          {member.blood_type ? (
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>{member.blood_type}</Text>
            </View>
          ) : null}
        </View>
        {firstCondition ? (
          <Text style={styles.conditionText} numberOfLines={1}>{firstCondition}</Text>
        ) : (
          <Text style={styles.noConditionText}>No conditions on file</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, health_info(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [])
  );

  async function handleDelete(member: FamilyMember) {
    Alert.alert(
      'Remove Member',
      `Remove ${member.full_name} from Rosemary? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { error } = await supabase.from('family_members').delete().eq('id', member.id);
            if (!error) fetchMembers();
          },
        },
      ]
    );
  }

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddEditMember', {});
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Your Family</Text>
            {profile && (
              <Text style={styles.headerSub}>{profile.full_name}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPress={() =>
              navigation.navigate('MemberProfile', {
                memberId: item.id,
                memberName: item.full_name,
              })
            }
          />
        )}
        contentContainerStyle={
          members.length === 0 ? styles.emptyWrapper : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMembers();
            }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={52} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Add your first family member</Text>
            <Text style={styles.emptyDesc}>
              Store health records, medications, allergies, and more — all in one place.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={COLORS.textInverse} />
              <Text style={styles.emptyButtonText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {members.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={COLORS.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.lg,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  headerSub: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 100, gap: SPACING.sm },
  emptyWrapper: { flex: 1 },
  card: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cardMetaText: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  metaDot: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  bloodBadge: {
    backgroundColor: COLORS.roseLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bloodBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.rose },
  conditionText: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  noConditionText: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyButtonText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
