import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';
import NotificationsDrawer from '../../components/NotificationsDrawer';

// ─── Layout constants ──────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const H_PAD = 20;
const GRID_GAP = 12;
const CARD_W = (SCREEN_W - H_PAD * 2 - GRID_GAP) / 2;
const ORDER_KEY = 'wrenhealth_family_order_v2';

// ─── Types ─────────────────────────────────────────────────────────────────────
type AddCard = { id: '__add__' };
type GridItem = FamilyMember | AddCard;

function isAddCard(item: GridItem): item is AddCard {
  return (item as AddCard).id === '__add__';
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseDob(dob: string): Date {
  return new Date(dob.includes('T') ? dob : dob + 'T12:00:00');
}

function getAge(dob?: string): string {
  if (!dob) return '';
  const birth = parseDob(dob);
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

function formatDob(dob?: string): string {
  if (!dob) return '';
  return parseDob(dob).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Hero Card (self) ──────────────────────────────────────────────────────────
function HeroCard({
  member,
  onPress,
}: {
  member: FamilyMember;
  onPress: (member: FamilyMember, ref: React.RefObject<View>) => void;
}) {
  const cardRef = useRef<View>(null);
  const age = getAge(member.dob);
  const dobFormatted = member.dob
    ? parseDob(member.dob).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <TouchableOpacity
      ref={cardRef}
      style={hero.card}
      onPress={() => onPress(member, cardRef as any)}
      activeOpacity={0.92}
    >
      {/* soft radial glow behind avatar */}
      <View style={hero.glowBlob} />

      {member.photo_url ? (
        <Image source={{ uri: member.photo_url }} style={hero.photo} />
      ) : (
        <View style={hero.avatar}>
          <Text style={hero.avatarText}>{getInitials(member.full_name)}</Text>
        </View>
      )}

      <View style={hero.info}>
        <Text style={hero.name}>{member.full_name}</Text>
        {dobFormatted ? (
          <Text style={hero.dob}>
            {dobFormatted}
            {age ? `  ·  ${age}` : ''}
          </Text>
        ) : null}
        <View style={hero.tagRow}>
          <View style={hero.tagSelf}>
            <Text style={hero.tagSelfText}>My Profile</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="rgba(45,106,79,0.25)" />
    </TouchableOpacity>
  );
}

// ─── Grid Card (family member) ─────────────────────────────────────────────────
function GridCard({
  member,
  drag,
  isActive,
  onPress,
}: {
  member: FamilyMember;
  drag: () => void;
  isActive: boolean;
  onPress: (member: FamilyMember, ref: React.RefObject<View>) => void;
}) {
  const cardRef = useRef<View>(null);

  return (
    <ScaleDecorator activeScale={1.06}>
      <View ref={cardRef} style={[grid.card, isActive && grid.cardActive]}>
        <TouchableOpacity
          onPress={() => onPress(member, cardRef as any)}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          activeOpacity={0.88}
          style={grid.inner}
          delayLongPress={250}
        >
          {/* glimmer in top-right corner */}
          <View style={grid.glimmer} />

          {member.photo_url ? (
            <Image source={{ uri: member.photo_url }} style={grid.photo} />
          ) : (
            <View style={grid.avatar}>
              <Text style={grid.avatarText}>{getInitials(member.full_name)}</Text>
            </View>
          )}

          <Text style={grid.name} numberOfLines={2}>
            {member.full_name}
          </Text>
          {member.dob ? (
            <Text style={grid.dob} numberOfLines={1}>
              {formatDob(member.dob)}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );
}

// ─── Add Card ──────────────────────────────────────────────────────────────────
function AddMemberCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={grid.addCard} onPress={onPress} activeOpacity={0.75}>
      <View style={grid.addCircle}>
        <Ionicons name="add" size={22} color={COLORS.primary} />
      </View>
      <Text style={grid.addLabel}>{'Add Family\nMember'}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function FamilyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);

  // Overlay expand animation
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayColor, setOverlayColor] = useState(COLORS.primary);
  const [cardLayout, setCardLayout] = useState({ x: 0, y: 0, w: CARD_W, h: 140 });
  const expandAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({
    left: interpolate(expandAnim.value, [0, 1], [cardLayout.x, 0]),
    top: interpolate(expandAnim.value, [0, 1], [cardLayout.y, 0]),
    width: interpolate(expandAnim.value, [0, 1], [cardLayout.w, SCREEN_W]),
    height: interpolate(expandAnim.value, [0, 1], [cardLayout.h, SCREEN_H]),
    borderRadius: interpolate(expandAnim.value, [0, 1], [20, 0]),
    opacity: interpolate(expandAnim.value, [0, 0.06, 0.85, 1], [0, 1, 1, 0]),
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  // ── Data fetching ────────────────────────────────────────────────────────────
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

      const raw = membersRes.data || [];
      const self = raw.filter((m) => m.is_self);
      let family = raw.filter((m) => !m.is_self);

      // Restore saved order
      try {
        const saved = await AsyncStorage.getItem(ORDER_KEY);
        if (saved) {
          const order: string[] = JSON.parse(saved);
          const ordered = order
            .map((id) => family.find((m) => m.id === id))
            .filter(Boolean) as FamilyMember[];
          const rest = family.filter((m) => !order.includes(m.id));
          family = [...ordered, ...rest];
        }
      } catch {}

      setMembers([...self, ...family]);
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

  // ── Card tap: spin-and-expand animation ──────────────────────────────────────
  function handleCardPress(member: FamilyMember, ref: React.RefObject<View>) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    (ref.current as any)?.measureInWindow((x: number, y: number, w: number, h: number) => {
      setCardLayout({ x, y, w, h });
      setOverlayColor(member.is_self ? COLORS.primary : '#40916C');
      setOverlayVisible(true);
      expandAnim.value = 0;
      rotateAnim.value = 0;

      expandAnim.value = withTiming(1, {
        duration: 540,
        easing: Easing.inOut(Easing.cubic),
      });
      rotateAnim.value = withTiming(360, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });

      setTimeout(() => {
        navigation.navigate('MemberProfile', {
          memberId: member.id,
          memberName: member.full_name,
        });
        // Reset after navigation is underway
        setTimeout(() => {
          setOverlayVisible(false);
          expandAnim.value = 0;
          rotateAnim.value = 0;
        }, 80);
      }, 490);
    });
  }

  // ── Drag end: persist new order ──────────────────────────────────────────────
  async function persistOrder(family: FamilyMember[]) {
    try {
      await AsyncStorage.setItem(ORDER_KEY, JSON.stringify(family.map((m) => m.id)));
    } catch {}
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const selfMember = members.find((m) => m.is_self);
  const familyMembers = members.filter((m) => !m.is_self);
  const gridData: GridItem[] = [...familyMembers, { id: '__add__' }];

  // ── List header: hero card + section labels ──────────────────────────────────
  const ListHeader = (
    <View style={{ paddingTop: 4 }}>
      <Text style={styles.sectionLabel}>MY HEALTH</Text>
      {selfMember ? (
        <HeroCard member={selfMember} onPress={handleCardPress} />
      ) : null}
      <Text style={[styles.sectionLabel, { marginTop: SPACING.xl, marginBottom: SPACING.sm }]}>
        FAMILY MEMBERS
      </Text>
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient
          colors={['rgba(45,106,79,0.09)', '#FAF7F4']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(45,106,79,0.10)', 'rgba(45,106,79,0.03)', '#FAF7F4']}
        locations={[0, 0.3, 0.65]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Accounts</Text>
          <View style={styles.headerActions}>
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
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDotMenu(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Draggable grid */}
      <DraggableFlatList<GridItem>
        data={gridData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor={COLORS.primary}
          />
        }
        onDragEnd={({ data }) => {
          const newFamily = data.filter((d): d is FamilyMember => !isAddCard(d));
          setMembers([...(selfMember ? [selfMember] : []), ...newFamily]);
          persistOrder(newFamily);
        }}
        renderItem={({ item, drag, isActive }: RenderItemParams<GridItem>) => {
          if (isAddCard(item)) {
            return (
              <AddMemberCard
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('AddEditMember', {});
                }}
              />
            );
          }
          return (
            <GridCard
              member={item as FamilyMember}
              drag={drag}
              isActive={isActive}
              onPress={handleCardPress}
            />
          );
        }}
      />

      {/* Spin-and-expand overlay */}
      {overlayVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.expandOverlay, { backgroundColor: overlayColor }, overlayStyle]}
        />
      )}

      {/* Notifications drawer */}
      <NotificationsDrawer
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onCountChange={(count) => setPendingCount(count)}
      />

      {/* 3-dot dropdown */}
      <Modal
        visible={showDotMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDotMenu(false)}
      >
        <Pressable style={dotMenu.backdrop} onPress={() => setShowDotMenu(false)}>
          <View style={dotMenu.menu}>
            <TouchableOpacity
              style={dotMenu.item}
              activeOpacity={0.7}
              onPress={() => {
                const self = members.filter((m) => m.is_self);
                const sorted = [...members.filter((m) => !m.is_self)].sort((a, b) =>
                  a.full_name.localeCompare(b.full_name)
                );
                setMembers([...self, ...sorted]);
                persistOrder(sorted);
                setShowDotMenu(false);
              }}
            >
              <Ionicons name="text-outline" size={16} color={COLORS.textPrimary} />
              <Text style={dotMenu.itemText}>Sort by Name</Text>
            </TouchableOpacity>
            <View style={dotMenu.divider} />
            <TouchableOpacity
              style={dotMenu.item}
              activeOpacity={0.7}
              onPress={() => {
                const self = members.filter((m) => m.is_self);
                const sorted = [...members.filter((m) => !m.is_self)].sort((a, b) => {
                  const tA = a.dob ? new Date(a.dob).getTime() : 0;
                  const tB = b.dob ? new Date(b.dob).getTime() : 0;
                  return tA - tB;
                });
                setMembers([...self, ...sorted]);
                persistOrder(sorted);
                setShowDotMenu(false);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.textPrimary} />
              <Text style={dotMenu.itemText}>Sort by Age</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  safeHeader: { backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2E1F',
    letterSpacing: -0.6,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,106,79,0.08)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9E8D',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    paddingLeft: 2,
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 110,
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  expandOverlay: {
    position: 'absolute',
    zIndex: 999,
  },
});

// ─── Hero card styles ──────────────────────────────────────────────────────────
const hero = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(45,106,79,0.10)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 4,
    overflow: 'hidden',
    // shadow
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 3,
  },
  glowBlob: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(45,106,79,0.07)',
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  info: { flex: 1 },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1F',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  dob: {
    fontSize: 13,
    color: '#5A7A62',
    fontWeight: '500',
    marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', gap: 6 },
  tagSelf: {
    backgroundColor: 'rgba(45,106,79,0.10)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagSelfText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

// ─── Grid card styles ──────────────────────────────────────────────────────────
const grid = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45,106,79,0.08)',
    overflow: 'hidden',
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  cardActive: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
    borderColor: 'rgba(45,106,79,0.20)',
  },
  inner: {
    padding: 14,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  glimmer: {
    position: 'absolute',
    top: -18,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45,106,79,0.045)',
  },
  photo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(45,106,79,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1F',
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: 17,
  },
  dob: {
    fontSize: 11,
    color: '#8A9E8D',
    fontWeight: '500',
    textAlign: 'center',
  },
  addCard: {
    width: CARD_W,
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(45,106,79,0.22)',
    backgroundColor: 'rgba(45,106,79,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,106,79,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 17,
  },
});

// ─── 3-dot menu styles ─────────────────────────────────────────────────────────
const dotMenu = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    top: 96,
    right: H_PAD,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
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
