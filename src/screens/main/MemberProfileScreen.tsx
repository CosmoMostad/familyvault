import React, { useEffect, useState, useCallback } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { FamilyMember, HealthInfo, Document, RootStackParamList } from '../../lib/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MemberProfile'>;
  route: RouteProp<RootStackParamList, 'MemberProfile'>;
};

function Section({
  emoji,
  title,
  children,
  empty,
}: {
  emoji: string;
  title: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.emoji}>{emoji}</Text>
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      {children || (
        <Text style={sectionStyles.empty}>{empty || 'None on file'}</Text>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 20, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1B2A4A' },
  empty: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
});

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const severityColors: Record<string, string> = {
  Mild: '#D1FAE5',
  Moderate: '#FEF3C7',
  Severe: '#FEE2E2',
};
const severityTextColors: Record<string, string> = {
  Mild: '#065F46',
  Moderate: '#92400E',
  Severe: '#991B1B',
};

export default function MemberProfileScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: memberName,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditMember', { memberId })}
          style={{ marginRight: 4 }}
        >
          <Text style={{ color: '#00B4A6', fontSize: 16, fontWeight: '600' }}>Edit</Text>
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
        supabase.from('documents').select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
      ]);

      if (memberRes.data) setMember(memberRes.data);
      if (healthRes.data) setHealthInfo(healthRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Member not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(member.full_name)}</Text>
        </View>
        <Text style={styles.memberName}>{member.full_name}</Text>
        {member.dob && <Text style={styles.memberAge}>{getAge(member.dob)} · Born {formatDate(member.dob)}</Text>}
        {member.blood_type && (
          <View style={styles.bloodTypeBadge}>
            <Text style={styles.bloodTypeText}>🩸 {member.blood_type}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Share', { memberId, memberName });
          }}
        >
          <Text style={styles.actionEmoji}>📤</Text>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Appointments', { memberId, memberName });
          }}
        >
          <Text style={styles.actionEmoji}>📅</Text>
          <Text style={styles.actionLabel}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('DocumentScanner', { memberId, memberName });
          }}
        >
          <Text style={styles.actionEmoji}>📄</Text>
          <Text style={styles.actionLabel}>Documents</Text>
        </TouchableOpacity>
      </View>

      {/* Allergies */}
      <Section emoji="⚠️" title="Allergies" empty="No known allergies">
        {healthInfo?.allergies && healthInfo.allergies.length > 0 ? (
          <View style={styles.chipContainer}>
            {healthInfo.allergies.map((a, i) => (
              <View
                key={i}
                style={[styles.chip, { backgroundColor: severityColors[a.severity] || '#F3F4F6' }]}
              >
                <Text style={[styles.chipText, { color: severityTextColors[a.severity] || '#374151' }]}>
                  {a.name}
                </Text>
                <Text style={[styles.chipSeverity, { color: severityTextColors[a.severity] || '#374151' }]}>
                  {a.severity}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Section>

      {/* Medications */}
      <Section emoji="💊" title="Medications" empty="No medications listed">
        {healthInfo?.medications && healthInfo.medications.length > 0 ? (
          <View style={styles.listItems}>
            {healthInfo.medications.map((m, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{m.name}</Text>
                <Text style={styles.listItemSub}>{m.dosage} · {m.frequency}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Section>

      {/* Conditions */}
      <Section emoji="🏥" title="Medical Conditions" empty="No conditions listed">
        {healthInfo?.conditions && healthInfo.conditions.length > 0 ? (
          <View style={styles.listItems}>
            {healthInfo.conditions.map((c, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{c.name}</Text>
                {c.notes && <Text style={styles.listItemSub}>{c.notes}</Text>}
              </View>
            ))}
          </View>
        ) : null}
      </Section>

      {/* Primary Doctor */}
      <Section emoji="🩺" title="Primary Doctor" empty="No doctor on file">
        {healthInfo?.primary_doctor ? (
          <View>
            <Text style={styles.doctorName}>{healthInfo.primary_doctor.name}</Text>
            {healthInfo.primary_doctor.specialty && (
              <Text style={styles.doctorSub}>{healthInfo.primary_doctor.specialty}</Text>
            )}
            {healthInfo.primary_doctor.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${healthInfo.primary_doctor!.phone}`)}>
                <Text style={styles.doctorPhone}>📞 {healthInfo.primary_doctor.phone}</Text>
              </TouchableOpacity>
            )}
            {healthInfo.primary_doctor.address && (
              <Text style={styles.doctorSub}>📍 {healthInfo.primary_doctor.address}</Text>
            )}
          </View>
        ) : null}
      </Section>

      {/* Insurance */}
      <Section emoji="📋" title="Insurance" empty="No insurance on file">
        {healthInfo?.insurance ? (
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Carrier</Text>
              <Text style={styles.infoValue}>{healthInfo.insurance.carrier}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Policy #</Text>
              <Text style={styles.infoValue}>{healthInfo.insurance.policy_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Group #</Text>
              <Text style={styles.infoValue}>{healthInfo.insurance.group_number}</Text>
            </View>
            {healthInfo.insurance.member_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member ID</Text>
                <Text style={styles.infoValue}>{healthInfo.insurance.member_id}</Text>
              </View>
            )}
          </View>
        ) : null}
      </Section>

      {/* Emergency Contacts */}
      <Section emoji="📞" title="Emergency Contacts" empty="No emergency contacts">
        {healthInfo?.emergency_contacts && healthInfo.emergency_contacts.length > 0 ? (
          <View style={styles.listItems}>
            {healthInfo.emergency_contacts.map((c, i) => (
              <View key={i} style={styles.contactItem}>
                <View style={styles.contactLeft}>
                  <Text style={styles.listItemTitle}>{c.name}</Text>
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationText}>{c.relationship}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </Section>

      {/* Documents preview */}
      {documents.length > 0 && (
        <View style={[sectionStyles.container]}>
          <View style={sectionStyles.header}>
            <Text style={sectionStyles.emoji}>📄</Text>
            <Text style={sectionStyles.title}>Documents</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('DocumentScanner', { memberId, memberName })}
            >
              <Text style={styles.seeAllText}>See All ({documents.length})</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>{documents.length} document{documents.length !== 1 ? 's' : ''} stored</Text>
        </View>
      )}

      {/* Notes */}
      {healthInfo?.notes ? (
        <Section emoji="📝" title="Notes">
          <Text style={styles.notesText}>{healthInfo.notes}</Text>
        </Section>
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  profileHeader: {
    backgroundColor: '#1B2A4A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,180,166,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#00B4A6',
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  memberName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  memberAge: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  bloodTypeBadge: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  bloodTypeText: { color: '#FEE2E2', fontSize: 15, fontWeight: '800' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionEmoji: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipSeverity: { fontSize: 11, opacity: 0.7 },
  listItems: { gap: 10 },
  listItem: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  listItemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  doctorSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  doctorPhone: { fontSize: 14, color: '#00B4A6', fontWeight: '500', marginTop: 4 },
  infoGrid: { gap: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactLeft: { flex: 1 },
  contactPhone: { fontSize: 13, color: '#00B4A6', fontWeight: '500' },
  relationBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  relationText: { fontSize: 11, color: '#1D4ED8', fontWeight: '500' },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  seeAllButton: { marginLeft: 'auto' },
  seeAllText: { fontSize: 13, color: '#00B4A6', fontWeight: '600' },
});
