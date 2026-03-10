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
import { COLORS, FONTS, SPACING } from '../../lib/design';
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
  const age = getAge(share.member_dob);
  const metaParts: string[] = [];
  if (share.member_relationship) metaParts.push(share.member_relationship);
  if (age) metaParts.push(age);
  if (share.member_blood_type) metaParts.push(share.member_blood_type);
  const meta = metaParts.join(' · ');
  const canEdit = share.access_level === 'edit';
  return (
    <TouchableOpacity style={{backgroundColor:'rgba(255,255,255,0.06)',borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.09)',padding:16,marginBottom:12,overflow:'hidden'}} activeOpacity={0.8} onPress={()=>navigation.navigate('MemberProfile',{memberId:share.account_id,memberName:share.member_name})}>
      <View style={{flexDirection:'row',alignItems:'flex-start',gap:14}}>
        {share.member_photo?(
          <Image source={{uri:share.member_photo}} style={{width:64,height:64,borderRadius:32,borderWidth:2,borderColor:'rgba(82,183,136,0.25)'}}/>
        ):(
          <LinearGradient colors={['rgba(82,183,136,0.30)','rgba(45,106,79,0.20)']} style={{width:64,height:64,borderRadius:32,borderWidth:2,borderColor:'rgba(82,183,136,0.25)',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:22,fontWeight:'800',color:'#52B788'}}>{getInitials(share.member_name)}</Text>
          </LinearGradient>
        )}
        <View style={{flex:1}}>
          <Text style={{fontSize:17,fontWeight:'800',color:'#EDF7F1',letterSpacing:-0.3,marginBottom:4}}>{share.member_name}</Text>
          {meta?<Text style={{fontSize:13,color:'rgba(237,247,241,0.55)',marginBottom:6}}>{meta}</Text>:null}
          <View style={{backgroundColor:canEdit?'rgba(82,183,136,0.12)':'rgba(255,255,255,0.07)',borderRadius:8,paddingHorizontal:8,paddingVertical:3,alignSelf:'flex-start'}}>
            <Text style={{fontSize:11,fontWeight:'700',color:canEdit?'#52B788':'rgba(237,247,241,0.60)'}}>{canEdit?'Editor':'Viewer'}</Text>
          </View>
        </View>
      </View>
      <View style={{borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.06)',paddingTop:10,marginTop:10,flexDirection:'row',alignItems:'center',gap:5}}>
        <Ionicons name='person-circle-outline' size={13} color='rgba(237,247,241,0.35)'/>
        <Text style={{fontSize:12,color:'rgba(237,247,241,0.35)',fontWeight:'500'}}>Shared by {share.owner_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SharedScreen() {
  const { user } = useAuth();
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient colors={['#090D0B', '#0D1810', '#090D0B']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(82,183,136,0.15)', 'rgba(82,183,136,0.04)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shared With Me</Text>
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
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} size="large" />
      ) : shares.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyWrap} showsVerticalScrollIndicator={false}>

          {pendingCount > 0 && (
            <TouchableOpacity style={styles.pendingBanner} onPress={() => setNotifVisible(true)} activeOpacity={0.8}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>{pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.amber} />
            </TouchableOpacity>
          )}

          <View style={styles.emptyIcon}>
            <Ionicons name="share-social-outline" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nothing shared yet</Text>
          <Text style={styles.emptyDesc}>
            When someone shares a health account with your email, it'll show up here after you accept.
          </Text>

          {/* How it works */}
          <View style={styles.howToCard}>
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            {[
              { icon: 'mail-outline', text: 'Someone shares a health account with your email' },
              { icon: 'notifications-outline', text: 'Tap the bell icon above to review and accept' },
              { icon: 'people-outline', text: 'Accepted accounts appear here for easy access' },
            ].map(({ icon, text }, i) => (
              <View key={i} style={styles.howToRow}>
                <View style={{width:24,height:24,borderRadius:12,backgroundColor:'rgba(82,183,136,0.15)',alignItems:'center',justifyContent:'center'}}>
                  <Text style={{fontSize:12,fontWeight:'800',color:'#52B788'}}>{i+1}</Text>
                </View>
                <Text style={styles.howToText}>{text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pendingCount > 0 && (
            <TouchableOpacity style={styles.pendingBanner} onPress={() => setNotifVisible(true)} activeOpacity={0.8}>
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>{pendingCount} pending request{pendingCount > 1 ? 's' : ''} — tap to review</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.amber} />
            </TouchableOpacity>
          )}
          <Text style={[styles.sectionLabel, { marginBottom: SPACING.md }]}>
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
  root: { flex: 1, backgroundColor: '#090D0B' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#F2FAF5', letterSpacing: -0.6 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#E53E3E', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2, borderWidth: 1.5, borderColor: '#090D0B',
  },
  badgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(237,247,241,0.40)',
    letterSpacing: 1.4, textTransform: 'uppercase',
  },

  // ── Cards ──
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base, paddingBottom: 100 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    marginBottom: SPACING.sm, overflow: 'hidden',
    shadowColor: 'rgba(82,183,136,0.2)',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 6,
  },
  cardAccent: { height: 1, backgroundColor: 'rgba(82,183,136,0.35)' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.base },
  avatar: { width: 52, height: 52, borderRadius: 26, flexShrink: 0 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#F2FAF5', marginBottom: 2, letterSpacing: -0.2 },
  cardMeta: { fontSize: 13, color: 'rgba(242,250,245,0.80)', marginBottom: 2 },
  sharedBy: { fontSize: 12, color: 'rgba(242,250,245,0.55)', fontWeight: '500' },
  accessBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeView: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  badgeEdit: { backgroundColor: 'rgba(82,183,136,0.15)', borderWidth: 1, borderColor: 'rgba(82,183,136,0.3)' },
  accessBadgeText: { fontSize: 11, fontWeight: '700' },
  badgeViewText: { color: 'rgba(242,250,245,0.80)' },
  badgeEditText: { color: COLORS.primary },

  // ── Pending banner ──
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(242,166,90,0.12)',
    borderRadius: 14, padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(242,166,90,0.25)',
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber, flexShrink: 0 },
  pendingText: { fontSize: 13, color: COLORS.amber, fontWeight: '600', flex: 1 },

  // ── Empty state ──
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xxl, paddingBottom: 100 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(82,183,136,0.12)',
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#F2FAF5', textAlign: 'center', marginBottom: SPACING.sm, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 15, color: 'rgba(242,250,245,0.80)', textAlign: 'center', lineHeight: 23, marginBottom: SPACING.xxl },

  howToCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.base, gap: SPACING.md,
  },
  howToRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  howToNum: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(82,183,136,0.12)',
    borderWidth: 1, borderColor: 'rgba(82,183,136,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howToText: { fontSize: 14, color: 'rgba(242,250,245,0.80)', flex: 1, lineHeight: 20 },
});
