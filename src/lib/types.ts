export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  full_name: string;
  dob?: string;
  blood_type?: string;
  photo_url?: string;
  created_at: string;
  health_info?: HealthInfo;
}

export type AllergyBadSeverity = 'Mild' | 'Moderate' | 'Severe';

export interface Allergy {
  name: string;
  severity: AllergyBadSeverity;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Condition {
  name: string;
  notes?: string;
}

export interface Insurance {
  carrier: string;
  policy_number: string;
  group_number: string;
  member_id?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Doctor {
  name: string;
  phone: string;
  address: string;
  specialty?: string;
}

export interface HealthInfo {
  id: string;
  member_id: string;
  allergies: Allergy[];
  medications: Medication[];
  conditions: Condition[];
  insurance: Insurance | null;
  emergency_contacts: EmergencyContact[];
  primary_doctor: Doctor | null;
  notes: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  member_id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  member_id: string;
  title: string;
  datetime: string;
  doctor?: string;
  location?: string;
  notes?: string;
  reminder_set: boolean;
  created_at?: string;
}

export interface ShareLink {
  id: string;
  member_id: string;
  token: string;
  expires_at: string;
  created_by: string;
  revoked: boolean;
  created_at: string;
}

export type RootStackParamList = {
  Landing: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Dashboard: undefined;
  MemberProfile: { memberId: string; memberName: string };
  AddEditMember: { memberId?: string };
  DocumentScanner: { memberId: string; memberName: string };
  Share: { memberId: string; memberName: string };
  Appointments: { memberId?: string; memberName?: string };
  Settings: undefined;
};
