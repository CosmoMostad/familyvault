-- ─────────────────────────────────────────────────────────────────────────────
-- Wren Health — Demo Account Seed Data
--
-- BEFORE RUNNING:
-- 1. Go to Supabase → Authentication → Users → Add User
-- 2. Email: demo@wrenhealth.app | Password: WrenDemo2024!
-- 3. Copy the UUID from the new user row
-- 4. Replace ALL occurrences of <<DEMO_USER_ID>> below with that UUID
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, email)
VALUES ('<<DEMO_USER_ID>>', 'demo@wrenhealth.app')
ON CONFLICT (id) DO NOTHING;

-- ── Family Members ────────────────────────────────────────────────────────────

-- Self
INSERT INTO family_members (id, owner_id, full_name, date_of_birth, relationship, is_self, blood_type)
VALUES (
  gen_random_uuid(),
  '<<DEMO_USER_ID>>',
  'Alex Rivera',
  '1988-07-14',
  'Self',
  true,
  'O+'
);

-- Spouse
INSERT INTO family_members (id, owner_id, full_name, date_of_birth, relationship, is_self, blood_type)
VALUES (
  gen_random_uuid(),
  '<<DEMO_USER_ID>>',
  'Jamie Rivera',
  '1990-03-22',
  'Spouse',
  false,
  'A+'
);

-- Child
INSERT INTO family_members (id, owner_id, full_name, date_of_birth, relationship, is_self, blood_type)
VALUES (
  gen_random_uuid(),
  '<<DEMO_USER_ID>>',
  'Lily Rivera',
  '2019-11-05',
  'Child',
  false,
  'A+'
);

-- Parent
INSERT INTO family_members (id, owner_id, full_name, date_of_birth, relationship, is_self)
VALUES (
  gen_random_uuid(),
  '<<DEMO_USER_ID>>',
  'Maria Rivera',
  '1959-02-18',
  'Parent',
  false
);

-- ── Health Info (for self + spouse) ──────────────────────────────────────────
-- Get member IDs dynamically
DO $$
DECLARE
  self_id   uuid;
  spouse_id uuid;
  child_id  uuid;
BEGIN
  SELECT id INTO self_id   FROM family_members WHERE owner_id = '<<DEMO_USER_ID>>' AND is_self = true;
  SELECT id INTO spouse_id FROM family_members WHERE owner_id = '<<DEMO_USER_ID>>' AND full_name = 'Jamie Rivera';
  SELECT id INTO child_id  FROM family_members WHERE owner_id = '<<DEMO_USER_ID>>' AND full_name = 'Lily Rivera';

  -- Self health info
  INSERT INTO health_info (family_member_id, allergies, medications, conditions, insurance, emergency_contacts, primary_doctor)
  VALUES (
    self_id,
    '["Penicillin", "Tree nuts"]',
    '["Lisinopril 10mg – daily", "Vitamin D3 – daily"]',
    '["Hypertension"]',
    '{"carrier": "Blue Cross Blue Shield", "policy_number": "BCB-8821047", "group_number": "GRP-4420", "member_id": "ARV-001"}',
    '[{"name": "Jamie Rivera", "phone": "206-555-0182", "relationship": "Spouse"}, {"name": "Maria Rivera", "phone": "206-555-0194", "relationship": "Mother"}]',
    '{"name": "Dr. Sarah Chen", "phone": "206-555-0171"}'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- Spouse health info
  INSERT INTO health_info (family_member_id, allergies, medications, conditions, insurance, emergency_contacts, primary_doctor)
  VALUES (
    spouse_id,
    '["Sulfa drugs"]',
    '["Prenatal vitamins – daily"]',
    '[]',
    '{"carrier": "Blue Cross Blue Shield", "policy_number": "BCB-8821048", "group_number": "GRP-4420", "member_id": "ARV-002"}',
    '[{"name": "Alex Rivera", "phone": "206-555-0177", "relationship": "Spouse"}]',
    '{"name": "Dr. Marcus Webb", "phone": "206-555-0163"}'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- Child health info
  INSERT INTO health_info (family_member_id, allergies, medications, conditions, emergency_contacts, primary_doctor)
  VALUES (
    child_id,
    '["Peanuts"]',
    '[]',
    '["Mild asthma"]',
    '[{"name": "Alex Rivera", "phone": "206-555-0177", "relationship": "Parent"}, {"name": "Jamie Rivera", "phone": "206-555-0182", "relationship": "Parent"}]',
    '{"name": "Dr. Nina Patel", "phone": "206-555-0155"}'
  )
  ON CONFLICT (family_member_id) DO NOTHING;
END $$;

-- ── Family Calendar ───────────────────────────────────────────────────────────
INSERT INTO family_calendars (id, title, color, owner_id)
VALUES (
  gen_random_uuid(),
  'Rivera Family',
  '#2D6A4F',
  '<<DEMO_USER_ID>>'
)
ON CONFLICT DO NOTHING;

-- ── Calendar Events ───────────────────────────────────────────────────────────
DO $$
DECLARE
  cal_id uuid;
BEGIN
  SELECT id INTO cal_id FROM family_calendars WHERE owner_id = '<<DEMO_USER_ID>>' LIMIT 1;

  INSERT INTO calendar_events (calendar_id, created_by, title, date_time, location, notes)
  VALUES
    (cal_id, '<<DEMO_USER_ID>>', 'Annual Physical – Alex', now() + interval '12 days', 'Dr. Chen – 1400 Eastlake Ave E, Seattle', 'Fasting required. Lab work included.'),
    (cal_id, '<<DEMO_USER_ID>>', 'Lily – Pediatrician Checkup', now() + interval '5 days', 'Dr. Patel – 900 Madison St, Seattle', 'Bring vaccination records.'),
    (cal_id, '<<DEMO_USER_ID>>', 'Jamie – OB Appointment', now() + interval '21 days', 'Dr. Webb – 550 17th Ave, Seattle', null),
    (cal_id, '<<DEMO_USER_ID>>', 'Flu Shots – Whole Family', now() - interval '45 days', 'QFC Pharmacy – Bellevue', 'All 4 family members done.');
END $$;
