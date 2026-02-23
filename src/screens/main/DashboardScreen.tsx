import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember, RootStackParamList } from '../../lib/types';

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
  return `${age}y`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function BloodTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  return (
    <View style={styles.bloodBadge}>
      <Text style={styles.bloodBadgeText}>{type}</Text>
    </View>
  );
}

function MemberCard({
  member,
  onPress,
  onDelete,
}: {
  member: FamilyMember;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>{member.full_name}</Text>
          {member.blood_type && <BloodTypeBadge type={member.blood_type} />}
        </View>
        {member.dob && (
          <Text style={styles.memberAge}>Age {getAge(member.dob)}</Text>
        )}
        {member.health_info?.conditions && member.health_info.conditions.length > 0 && (
          <Text style={styles.memberCondition} numberOfLines={1}>
            {member.health_info.conditions[0].name}
          </Text>
        )}
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }: Props) {
  const { profile, signOut } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`*, health_info(*)`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
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
      `Are you sure you want to remove ${member.full_name} from your vault? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { error } = await supabase
              .from('family_members')
              .delete()
              .eq('id', member.id);
            if (!error) fetchMembers();
          },
        },
      ]
    );
  }

  function handleAddMember() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddEditMember', {});
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B2A4A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Family</Text>
          {profile && <Text style={styles.headerSub}>{profile.full_name}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

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
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={members.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMembers();
            }}
            tintColor="#00B4A6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>Your Family Vault is Empty</Text>
            <Text style={styles.emptyDesc}>
              Add your first family member to start keeping their health records organized and ready.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddMember}>
              <Text style={styles.emptyButtonText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      {members.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddMember} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' },
  header: {
    backgroundColor: '#1B2A4A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  settingsButton: { padding: 8 },
  settingsIcon: { fontSize: 22 },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: { marginRight: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  memberAge: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  memberCondition: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bloodBadgeText: { fontSize: 11, fontWeight: '700', color: '#B91C1C' },
  cardRight: { marginLeft: 8 },
  chevron: { fontSize: 24, color: '#D1D5DB', fontWeight: '300' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00B4A6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1B2A4A', textAlign: 'center', marginBottom: 10 },
  emptyDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyButton: {
    backgroundColor: '#00B4A6',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
