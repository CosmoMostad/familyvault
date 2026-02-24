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
  Image,
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
      {/* Avatar */}
      {member.photo_url ? (
        <Image source={{ uri: member.photo_url }} style={styles.avatarPhoto} />
      ) : (
        <View style={[styles.avatar, member.is_self && styles.avatarSelf]}>
          <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
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
          {age ? <Text style={styles.cardMetaText}>{age} years old</Text> : null}
          {member.blood_type ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{member.blood_type}</Text>
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
  const { profile } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, health_info(*)')
        .order('is_self', { ascending: false }) // Self first
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
      'Remove Account',
      `Remove ${member.full_name} from Rosemary? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await supabase.from('family_members').delete().eq('id', member.id);
            fetchMembers();
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Family</Text>
            {profile && <Text style={styles.headerSub}>{profile.full_name}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={styles.addBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
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
        contentContainerStyle={members.length === 0 ? styles.emptyWrapper : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={52} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Add your family</Text>
            <Text style={styles.emptyDesc}>
              Create health accounts for each family member. Start with yourself.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={COLORS.textInverse} />
              <Text style={styles.emptyButtonText}>Add First Account</Text>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  headerSub: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
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
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarSelf: { backgroundColor: COLORS.primary },
  avatarPhoto: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarText: { ...FONTS.h4, color: COLORS.primary, fontWeight: '700' },
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
    backgroundColor: COLORS.roseLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  bloodBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.rose },
  conditionText: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl, paddingTop: 80,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h3, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  emptyDesc: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },
  emptyButton: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 52,
    paddingHorizontal: SPACING.xl, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  emptyButtonText: { color: COLORS.textInverse, ...FONTS.h4, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 16, right: SPACING.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
