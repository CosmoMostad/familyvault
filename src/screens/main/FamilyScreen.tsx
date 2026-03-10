/**
 * FamilyScreen — My Accounts tab
 * 2026 redesign: hero card for self, draggable 2-col grid for family,
 * spin-to-fill tap transition into MemberProfile.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FamilyMember, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING } from '../../lib/design';
import NotificationsDrawer from '../../components/NotificationsDrawer';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const H_PAD = 20;
const GRID_GAP = 12;
const CARD_W = (SCREEN_W - H_PAD * 2 - GRID_GAP) / 2;
const CARD_H = 152;
const ROW_H = CARD_H + GRID_GAP;
const ORDER_KEY = 'wrenhealth_family_order';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDob(dob: string): Date {
  return new Date(dob.includes('T') ? dob : dob + 'T12:00:00');
}

function getAge(dob?: string): string {
  if (!dob) return '';
  const b = parseDob(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age} yrs`;
}

function formatDob(dob?: string): string {
  if (!dob) return '';
  return parseDob(dob).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function cardCol(index: number) { return index % 2; }
function cardRow(index: number) { return Math.floor(index / 2); }
function cardX(index: number) { return cardCol(index) * (CARD_W + GRID_GAP); }
function cardY(index: number) { return cardRow(index) * ROW_H; }

async function saveOrder(ids: string[]) {
  await AsyncStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}

async function loadOrder(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(ORDER_KEY);
  return raw ? JSON.parse(raw) : [];
}

function applyOrder(members: FamilyMember[], order: string[]): FamilyMember[] {
  if (!order.length) return members;
  const map = new Map(members.map((m) => [m.id, m]));
  const sorted = order.map((id) => map.get(id)).filter(Boolean) as FamilyMember[];
  const rest = members.filter((m) => !order.includes(m.id));
  return [...sorted, ...rest];
}

// ─── SortableCard ─────────────────────────────────────────────────────────────

interface SortableCardProps {
  member: FamilyMember;
  index: number;
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, absX: number, absY: number) => void;
  onDragEnd: (id: string) => void;
  onTap: (member: FamilyMember, ref: React.RefObject<View>) => void;
  onDelete: (member: FamilyMember) => void;
}

function SortableCard({
  member,
  index,
  isDropTarget,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTap,
  onDelete,
}: SortableCardProps) {
  const cardRef = useRef<View>(null);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  // Animate to new position when index changes (order swap)
  const posX = useSharedValue(cardX(index));
  const posY = useSharedValue(cardY(index));

  useEffect(() => {
    if (!isDragging.value) {
      posX.value = withSpring(cardX(index), { damping: 18, stiffness: 200 });
      posY.value = withSpring(cardY(index), { damping: 18, stiffness: 200 });
    }
  }, [index]);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      scale.value = withSpring(1.06, { damping: 12, stiffness: 300 });
      zIdx.value = 50;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(onDragStart)(member.id);
    })
    .onUpdate((e) => {
      'worklet';
      tx.value = e.translationX;
      ty.value = e.translationY;
      runOnJS(onDragMove)(member.id, e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      tx.value = withSpring(0, { damping: 20, stiffness: 300 });
      ty.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 250 });
      zIdx.value = withTiming(1, { duration: 300 });
      runOnJS(onDragEnd)(member.id);
    });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: posX.value + tx.value,
    top: posY.value + ty.value,
    width: CARD_W,
    height: CARD_H,
    transform: [{ scale: scale.value }],
    zIndex: zIdx.value,
    opacity: opacity.value,
    shadowOpacity: interpolate(scale.value, [1, 1.06], [0.06, 0.22]),
  }));

  const dobFormatted = formatDob(member.dob);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        ref={cardRef as any}
        style={[styles.gridCard, animStyle, isDropTarget && styles.gridCardTarget]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onTap(member, cardRef as React.RefObject<View>)}
          onLongPress={() => onDelete(member)}
          delayLongPress={700}
          style={styles.gridCardInner}
        >
          {member.photo_url ? (
            <Image source={{ uri: member.photo_url }} style={styles.gridPhoto} />
          ) : (
            <View style={styles.gridAvatar}>
              <Text style={styles.gridAvatarText}>{getInitials(member.full_name)}</Text>
            </View>
          )}
          <Text style={styles.gridName} numberOfLines={2}>
            {member.full_name}
          </Text>
          {dobFormatted ? (
            <Text style={styles.gridDob}>{dobFormatted}</Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({
  member,
  onPress,
}: {
  member: FamilyMember;
  onPress: (m: FamilyMember, ref: React.RefObject<View>) => void;
}) {
  const ref = useRef<View>(null);
  const age = getAge(member.dob);
  const dob = formatDob(member.dob);

  return (
    <TouchableOpacity
      ref={ref as any}
      activeOpacity={0.9}
      onPress={() => onPress(member, ref as React.RefObject<View>)}
      style={styles.heroCard}
    >
      <LinearGradient
        colors={['rgba(45,106,79,0.07)', 'rgba(45,106,79,0.01)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.heroGlow} pointerEvents="none" />
      <View style={styles.heroInner}>
        {member.photo_url ? (
          <Image source={{ uri: member.photo_url }} style={styles.heroPhoto} />
        ) : (
          <LinearGradient colors={[COLORS.primary, '#40916C']} style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{getInitials(member.full_name)}</Text>
          </LinearGradient>
        )}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName} numberOfLines={1}>{member.full_name}</Text>
          {dob ? (
            <Text style={styles.heroDob}>{dob}{age ? `  ·  ${age}` : ''}</Text>
          ) : null}
          <View style={styles.heroTagRow}>
            <View style={styles.tagSelf}>
              <Text style={styles.tagSelfText}>My Profile</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Expand Overlay ───────────────────────────────────────────────────────────

function ExpandOverlay({
  member,
  layout,
  onDone,
}: {
  member: FamilyMember;
  layout: { x: number; y: number; w: number; h: number };
  onDone: () => void;
}) {
  const expand = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    expand.value = withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) });
    rotate.value = withTiming(360, { duration: 480, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(() => runOnJS(onDone)(), 480);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    left: interpolate(expand.value, [0, 1], [layout.x, 0]),
    top: interpolate(expand.value, [0, 1], [layout.y, 0]),
    width: interpolate(expand.value, [0, 1], [layout.w, SCREEN_W]),
    height: interpolate(expand.value, [0, 1], [layout.h, SCREEN_H]),
    borderRadius: interpolate(expand.value, [0, 1], [20, 0]),
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.overlay, animStyle]}>
      <View style={styles.overlayContent}>
        {member.photo_url ? (
          <Image source={{ uri: member.photo_url }} style={styles.overlayPhoto} />
        ) : (
          <View style={styles.overlayAvatar}>
            <Text style={styles.overlayAvatarText}>{getInitials(member.full_name)}</Text>
          </View>
        )}
        <Text style={styles.overlayName}>{member.full_name}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FamilyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuth();

  const [selfMember, setSelfMember] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);

  // Drag-to-reorder state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Stored card positions for hit-testing during drag
  const cardPositions = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(new Map());

  // Expand overlay
  const [expandingMember, setExpandingMember] = useState<FamilyMember | null>(null);
  const [expandLayout, setExpandLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── Fetch ──
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
      const fetched = membersRes.data || [];
      const order = await loadOrder();
      setSelfMember(fetched.find((m) => m.is_self) ?? null);
      setFamilyMembers(applyOrder(fetched.filter((m) => !m.is_self), order));
      setPendingCount(notifRes.count ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { fetchData(); }, [session]));

  // ── Measure card positions at drag start ──
  function handleDragStart(id: string) {
    setDraggingId(id);
    // Snapshot positions of all family cards for hit-testing
    familyMembers.forEach((m, i) => {
      const x = cardX(i);
      const y = cardY(i);
      cardPositions.current.set(m.id, { x, y, w: CARD_W, h: CARD_H });
    });
  }

  // ── During drag: find which card the finger is over ──
  function handleDragMove(id: string, absX: number, absY: number) {
    let nearest: string | null = null;
    let nearestDist = Infinity;
    cardPositions.current.forEach((pos, cardId) => {
      if (cardId === id) return;
      // Center of card in absolute coords (approximate — grid starts ~170px from top)
      const cx = pos.x + pos.w / 2;
      const cy = pos.y + pos.h / 2;
      const dist = Math.sqrt(
        Math.pow(absX - (H_PAD + cx), 2) + Math.pow(absY - cy, 2)
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = cardId;
      }
    });
    if (nearest !== dropTargetId) {
      setDropTargetId(nearest);
      if (nearest) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // ── Drag end: execute swap ──
  function handleDragEnd(id: string) {
    if (dropTargetId && dropTargetId !== id) {
      setFamilyMembers((prev) => {
        const arr = [...prev];
        const fromIdx = arr.findIndex((m) => m.id === id);
        const toIdx = arr.findIndex((m) => m.id === dropTargetId);
        if (fromIdx !== -1 && toIdx !== -1) {
          [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
          saveOrder(arr.map((m) => m.id));
        }
        return arr;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDraggingId(null);
    setDropTargetId(null);
  }

  // ── Card tap → spin-to-fill → navigate ──
  function handleCardTap(member: FamilyMember, ref: React.RefObject<View>) {
    if (draggingId) return; // Don't navigate during drag
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (ref.current as any)?.measureInWindow((x: number, y: number, w: number, h: number) => {
      setExpandLayout({ x, y, w, h });
      setExpandingMember(member);
    });
  }

  function handleOverlayDone() {
    if (!expandingMember) return;
    const m = expandingMember;
    setExpandingMember(null);
    setExpandLayout(null);
    navigation.navigate('MemberProfile', { memberId: m.id, memberName: m.full_name });
  }

  async function handleDelete(member: FamilyMember) {
    Alert.alert(
      'Remove Account',
      `Remove ${member.full_name}? This cannot be undone.`,
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

  // ── Grid height ──
  const numItems = familyMembers.length + 1; // +1 for Add card
  const numRows = Math.ceil(numItems / 2);
  const gridHeight = numRows * ROW_H - GRID_GAP;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradient background */}
      <LinearGradient colors={['#090D0B', '#0D1810', '#090D0B']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(82,183,136,0.18)', 'rgba(82,183,136,0.06)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView>
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
                  <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : String(pendingCount)}</Text>
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

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MY HEALTH — hero card */}
        <Text style={styles.sectionLabel}>MY HEALTH</Text>
        {selfMember && <HeroCard member={selfMember} onPress={handleCardTap} />}

        {/* FAMILY MEMBERS — drag grid */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>FAMILY MEMBERS</Text>

        {/* Absolute-positioned grid so each card can animate independently */}
        <View style={[styles.gridContainer, { height: gridHeight }]}>

          {/* Family member cards */}
          {familyMembers.map((member, i) => (
            <SortableCard
              key={member.id}
              member={member}
              index={i}
              isDropTarget={dropTargetId === member.id}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onTap={handleCardTap}
              onDelete={handleDelete}
            />
          ))}

          {/* Add card — always in the next available slot */}
          <TouchableOpacity
            style={[
              styles.addCard,
              {
                position: 'absolute',
                left: cardX(familyMembers.length),
                top: cardY(familyMembers.length),
                width: CARD_W,
                height: CARD_H,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('AddEditMember', {});
            }}
            activeOpacity={0.7}
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.addLabel}>Add Family{'\n'}Member</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Spin-to-fill overlay */}
      {expandingMember && expandLayout && (
        <ExpandOverlay
          member={expandingMember}
          layout={expandLayout}
          onDone={handleOverlayDone}
        />
      )}

      <NotificationsDrawer
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onCountChange={(count) => setPendingCount(count)}
      />

      {/* 3-dot menu */}
      <Modal visible={showDotMenu} transparent animationType="fade" onRequestClose={() => setShowDotMenu(false)}>
        <Pressable style={dotMenu.backdrop} onPress={() => setShowDotMenu(false)}>
          <View style={dotMenu.menu}>
            <TouchableOpacity
              style={dotMenu.item}
              onPress={() => {
                setFamilyMembers((p) => {
                  const arr = [...p].sort((a, b) => a.full_name.localeCompare(b.full_name));
                  saveOrder(arr.map((m) => m.id));
                  return arr;
                });
                setShowDotMenu(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="text-outline" size={16} color={COLORS.textPrimary} />
              <Text style={dotMenu.itemText}>Sort by Name</Text>
            </TouchableOpacity>
            <View style={dotMenu.divider} />
            <TouchableOpacity
              style={dotMenu.item}
              onPress={() => {
                setFamilyMembers((p) => {
                  const arr = [...p].sort((a, b) => {
                    const at = a.dob ? new Date(a.dob).getTime() : 0;
                    const bt = b.dob ? new Date(b.dob).getTime() : 0;
                    return at - bt;
                  });
                  saveOrder(arr.map((m) => m.id));
                  return arr;
                });
                setShowDotMenu(false);
              }}
              activeOpacity={0.7}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090D0B' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090D0B' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: H_PAD, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#E53E3E', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2, borderWidth: 1.5, borderColor: '#090D0B',
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },

  scrollContent: { paddingHorizontal: H_PAD, paddingBottom: 120 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(237,247,241,0.40)',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: SPACING.sm, paddingLeft: 2,
  },

  // ── Hero card ──
  heroCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden', marginBottom: SPACING.lg,
    shadowColor: 'rgba(82,183,136,0.35)', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 24, elevation: 8,
  },
  heroGlow: {
    position: 'absolute', top: -40, right: -40, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(82,183,136,0.08)',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  heroAvatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 10,
  },
  heroPhoto: { width: 72, height: 72, borderRadius: 36, flexShrink: 0 },
  heroAvatarText: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '700', color: '#F2FAF5', letterSpacing: -0.4, marginBottom: 4 },
  heroDob: { fontSize: 13, color: 'rgba(242,250,245,0.80)', fontWeight: '500', marginBottom: 8 },
  heroTagRow: { flexDirection: 'row' },
  tagSelf: {
    backgroundColor: 'rgba(82,183,136,0.15)', paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.3)',
  },
  tagSelfText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // ── Grid ──
  gridContainer: { width: '100%', position: 'relative' },

  gridCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: 'rgba(82,183,136,0.2)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
    overflow: 'hidden',
  },
  gridCardTarget: {
    borderColor: COLORS.primary, borderWidth: 1.5,
    shadowColor: COLORS.primary, shadowOpacity: 1, shadowRadius: 24,
  },
  gridCardInner: {
    flex: 1, padding: 14, alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  gridAvatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(82,183,136,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.2)',
  },
  gridPhoto: { width: 58, height: 58, borderRadius: 29 },
  gridAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  gridName: {
    fontSize: 14, fontWeight: '700', color: '#F2FAF5',
    textAlign: 'center', letterSpacing: -0.2, lineHeight: 18,
  },
  gridDob: { fontSize: 11, color: 'rgba(242,250,245,0.72)', fontWeight: '500', textAlign: 'center' },

  // ── Add card ──
  addCard: {
    borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(82,183,136,0.22)', backgroundColor: 'rgba(82,183,136,0.04)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(82,183,136,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  addLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary, textAlign: 'center', lineHeight: 16 },

  // ── Expand overlay ──
  overlay: {
    position: 'absolute', zIndex: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  overlayContent: { alignItems: 'center', gap: 16 },
  overlayPhoto: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  overlayAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  overlayAvatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  overlayName: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.4 },
});

const dotMenu = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute', top: 92, right: H_PAD,
    backgroundColor: '#111A14', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
    minWidth: 180, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.base, paddingHorizontal: SPACING.base,
  },
  itemText: { fontSize: 15, color: '#F2FAF5', fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: SPACING.sm },
});
