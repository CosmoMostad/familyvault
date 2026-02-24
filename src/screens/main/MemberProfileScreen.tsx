import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { FamilyMember, HealthInfo, Document, RootStackParamList } from '../../lib/types';
import { COLORS, FONTS, SPACING, CARD } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MemberProfile'>;
  route: RouteProp<RootStackParamList, 'MemberProfile'>;
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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

function SectionCard({
  iconName,
  iconColor,
  title,
  emptyText,
  children,
  action,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  emptyText: string;
  children?: React.ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.header}>
        <View style={[sectionStyles.iconBg, { backgroundColor: `${iconColor}18` }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} style={sectionStyles.action}>
            <Text style={sectionStyles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children ?? <Text style={sectionStyles.empty}>{emptyText}</Text>}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    ...CARD,
    padding: SPACING.base,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1 },
  action: { paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { ...FONTS.caption, color: COLORS.primaryLight, fontWeight: '600' },
  empty: { ...FONTS.bodySmall, color: COLORS.textTertiary, fontStyle: 'italic' },
});

export default function MemberProfileScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: memberName,
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.textPrimary,
      headerShadowVisible: false,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditMember', { memberId })}
          style={{ paddingHorizontal: 4 }}
        >
          <Text style={{ color: COLORS.primary, ...FONTS.body, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [memberName]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [memberId])
  );

  async function fetchData() {
    setLoading(true);
    try {
      const [memberRes, healthRes, docsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('id', memberId).single(),
        supabase.from('health_info').select('*').eq('member_id', memberId).single(),
        supabase
          .from('documents')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false }),
      ]);
      if (memberRes.data) setMember(memberRes.data);
      if (healthRes.data) setHealthInfo(healthRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loading}>
        <Text style={FONTS.body}>Member not found.</Text>
      </View>
    );
  }

  const severityBg: Record<string, string> = {
    Mild: COLORS.primaryMuted,
    Moderate: COLORS.amberLight,
    Severe: COLORS.roseLight,
  };
  const severityText: Record<string, string> = {
    Mild: COLORS.primary,
    Moderate: COLORS.amber,
    Severe: COLORS.rose,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{getInitials(member.full_name)}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{member.full_name}</Text>
          {member.dob && <Text style={styles.heroAge}>{getAge(member.dob)}</Text>}
          {member.blood_type && (
            <View style={styles.bloodBadge}>
              <Ionicons name="water" size={12} color={COLORS.rose} />
              <Text style={styles.bloodText}>{member.blood_type}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionRow}>
        {[
          { icon: 'share-outline' as const, label: 'Share', onPress: () => navigation.navigate('Share', { memberId, memberName }) },
          { icon: 'calendar-outline' as const, label: 'Appointments', onPress: () => navigation.navigate('Appointments', { memberId, memberName }) },
          { icon: 'document-text-outline' as const, label: 'Documents', onPress: () => navigation.navigate('DocumentScanner', { memberId, memberName }) },
        ].map((a, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              a.onPress();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconBg}>
              <Ionicons name={a.icon} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Allergies */}
      <SectionCard
        iconName="warning-outline"
        iconColor={COLORS.amber}
        title="Allergies"
        emptyText="No known allergies"
      >
        {healthInfo?.allergies?.length ? (
          <View style={styles.chips}>
            {healthInfo.allergies.map((a, i) => (
              <View
                key={i}
                style={[styles.chip, { backgroundColor: severityBg[a.severity] || COLORS.surfaceAlt }]}
              >
                <Text style={[styles.chipText, { color: severityText[a.severity] || COLORS.textSecondary }]}>
                  {a.name}
                </Text>
                <Text style={[styles.chipSeverity, { color: severityText[a.severity] || COLORS.textTertiary }]}>
                  {a.severity}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      {/* Medications */}
      <SectionCard
        iconName="medkit-outline"
        iconColor={COLORS.primary}
        title="Medications"
        emptyText="No medications listed"
      >
        {healthInfo?.medications?.length ? (
          <View style={styles.listStack}>
            {healthInfo.medications.map((m, i) => (
              <View key={i} style={[styles.listRow, i < healthInfo.medications.length - 1 && styles.listRowBorder]}>
                <Text style={styles.listRowTitle}>{m.name}</Text>
                <Text style={styles.listRowSub}>{m.dosage} · {m.frequency}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      {/* Conditions */}
      <SectionCard
        iconName="fitness-outline"
        iconColor={COLORS.rose}
        title="Medical Conditions"
        emptyText="No conditions listed"
      >
        {healthInfo?.conditions?.length ? (
          <View style={styles.listStack}>
            {healthInfo.conditions.map((c, i) => (
              <View key={i} style={[styles.listRow, i < healthInfo.conditions.length - 1 && styles.listRowBorder]}>
                <Text style={styles.listRowTitle}>{c.name}</Text>
                {c.notes && <Text style={styles.listRowSub}>{c.notes}</Text>}
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      {/* Insurance */}
      <SectionCard
        iconName="shield-checkmark-outline"
        iconColor={COLORS.primaryLight}
        title="Insurance"
        emptyText="No insurance on file"
      >
        {healthInfo?.insurance ? (
          <View style={styles.infoGrid}>
            {[
              { label: 'Carrier', value: healthInfo.insurance.carrier },
              { label: 'Policy #', value: healthInfo.insurance.policy_number },
              { label: 'Group #', value: healthInfo.insurance.group_number },
              { label: 'Member ID', value: healthInfo.insurance.member_id },
            ]
              .filter((r) => r.value)
              .map((r, i) => (
                <View key={i} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{r.label}</Text>
                  <Text style={styles.infoValue}>{r.value}</Text>
                </View>
              ))}
          </View>
        ) : null}
      </SectionCard>

      {/* Emergency Contacts */}
      <SectionCard
        iconName="call-outline"
        iconColor={COLORS.rose}
        title="Emergency Contacts"
        emptyText="No emergency contacts"
      >
        {healthInfo?.emergency_contacts?.length ? (
          <View style={styles.listStack}>
            {healthInfo.emergency_contacts.map((c, i) => (
              <View key={i} style={[styles.contactRow, i < healthInfo.emergency_contacts.length - 1 && styles.listRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{c.name}</Text>
                  <Text style={styles.listRowSub}>{c.relationship}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${c.phone}`)}
                  style={styles.callBtn}
                >
                  <Ionicons name="call" size={15} color={COLORS.primary} />
                  <Text style={styles.callText}>{c.phone}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      {/* Primary Doctor */}
      <SectionCard
        iconName="person-outline"
        iconColor={COLORS.primary}
        title="Primary Doctor"
        emptyText="No doctor on file"
      >
        {healthInfo?.primary_doctor ? (
          <View>
            <Text style={styles.listRowTitle}>{healthInfo.primary_doctor.name}</Text>
            {healthInfo.primary_doctor.specialty && (
              <Text style={styles.listRowSub}>{healthInfo.primary_doctor.specialty}</Text>
            )}
            {healthInfo.primary_doctor.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${healthInfo.primary_doctor!.phone}`)}
                style={[styles.callBtn, { marginTop: SPACING.sm }]}
              >
                <Ionicons name="call-outline" size={15} color={COLORS.primary} />
                <Text style={styles.callText}>{healthInfo.primary_doctor.phone}</Text>
              </TouchableOpacity>
            )}
            {healthInfo.primary_doctor.address && (
              <View style={[styles.callBtn, { marginTop: SPACING.xs }]}>
                <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
                <Text style={[styles.callText, { color: COLORS.textSecondary }]}>{healthInfo.primary_doctor.address}</Text>
              </View>
            )}
          </View>
        ) : null}
      </SectionCard>

      {/* Documents */}
      {documents.length > 0 && (
        <SectionCard
          iconName="document-text-outline"
          iconColor={COLORS.primary}
          title="Documents"
          emptyText=""
          action={{
            label: `See All (${documents.length})`,
            onPress: () => navigation.navigate('DocumentScanner', { memberId, memberName }),
          }}
        >
          <Text style={styles.listRowSub}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} stored securely
          </Text>
        </SectionCard>
      )}

      {/* Notes */}
      {healthInfo?.notes ? (
        <SectionCard
          iconName="create-outline"
          iconColor={COLORS.textSecondary}
          title="Notes"
          emptyText=""
        >
          <Text style={[styles.listRowSub, { lineHeight: 21 }]}>{healthInfo.notes}</Text>
        </SectionCard>
      ) : null}

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: SPACING.base, paddingBottom: SPACING.xl },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.xl,
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.base,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroAvatarText: { ...FONTS.h2, color: COLORS.textInverse, fontWeight: '800' },
  heroInfo: { flex: 1 },
  heroName: { ...FONTS.h3, color: COLORS.textInverse, marginBottom: 4 },
  heroAge: { ...FONTS.bodySmall, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.roseLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  bloodText: { fontSize: 13, fontWeight: '700', color: COLORS.rose },
  actionRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    ...CARD,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionLabel: { ...FONTS.caption, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipSeverity: { fontSize: 11, opacity: 0.8 },
  listStack: { gap: SPACING.sm },
  listRow: { paddingBottom: SPACING.sm },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.sm,
  },
  listRowTitle: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '600' },
  listRowSub: { ...FONTS.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
  infoGrid: { gap: SPACING.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary },
  infoValue: { ...FONTS.bodySmall, color: COLORS.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  callText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },
});
