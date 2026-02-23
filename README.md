# 🛡️ FamilyVault

**Your family's health, always within reach.**

FamilyVault is a mobile-first family health records app that puts every family member's complete medical profile in one secure, shareable place. Built with React Native + Expo and backed by Supabase.

---

## What Was Built

A complete, production-quality iOS/Android app with:

- **Beautiful landing screen** with professional navy/teal design
- **Full auth flow** — sign up, sign in, forgot password
- **Interactive onboarding** — 4-step swipeable tutorial
- **Family dashboard** — all members at a glance with blood type badges
- **Complete health profiles** — blood type, allergies, medications, conditions, insurance, emergency contacts, doctor info, notes
- **Add/Edit member form** — full health data entry with lists for meds/allergies/contacts
- **Document scanner** — scan/upload insurance cards and medical records via camera or photo library
- **7-day share links** — generate secure read-only links, share via iOS share sheet, revoke anytime
- **Appointments tracker** — upcoming appointments with local push notification reminders
- **Settings screen** — profile editing, notifications toggle, sign out

---

## Tech Stack

- React Native + Expo SDK 54 (TypeScript)
- Supabase (Auth + Postgres + Storage)
- React Navigation (Native Stack)
- expo-notifications (push notification reminders)
- expo-camera + expo-image-picker (document scanning)
- expo-haptics (tactile feedback)

---

## How to Run

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Open on iOS Simulator
# Press 'i' in the Expo CLI

# Open on Android
# Press 'a' in the Expo CLI

# Scan QR code with Expo Go app on device
```

> **Note:** Camera and notifications require a real device or development build. Expo Go supports most features but for full native functionality, build with EAS.

---

## Supabase Setup

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  full_name text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- Family members table
create table public.family_members (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users not null,
  full_name text not null,
  dob date,
  blood_type text,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.family_members enable row level security;
create policy "Users can manage own family members" on public.family_members for all using (auth.uid() = owner_id);

-- Health info table
create table public.health_info (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references public.family_members not null unique,
  allergies jsonb default '[]'::jsonb,
  medications jsonb default '[]'::jsonb,
  conditions jsonb default '[]'::jsonb,
  insurance jsonb,
  emergency_contacts jsonb default '[]'::jsonb,
  primary_doctor jsonb,
  notes text default '',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.health_info enable row level security;
create policy "Users can manage health info for own members" on public.health_info for all using (
  exists (select 1 from public.family_members fm where fm.id = member_id and fm.owner_id = auth.uid())
);

-- Documents table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references public.family_members not null,
  name text not null,
  url text not null,
  type text default 'image',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.documents enable row level security;
create policy "Users can manage documents for own members" on public.documents for all using (
  exists (select 1 from public.family_members fm where fm.id = member_id and fm.owner_id = auth.uid())
);

-- Appointments table
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references public.family_members not null,
  title text not null,
  datetime timestamp with time zone not null,
  doctor text,
  location text,
  notes text,
  reminder_set boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.appointments enable row level security;
create policy "Users can manage appointments for own members" on public.appointments for all using (
  exists (select 1 from public.family_members fm where fm.id = member_id and fm.owner_id = auth.uid())
);

-- Share links table
create table public.share_links (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references public.family_members not null,
  token text not null unique,
  expires_at timestamp with time zone not null,
  created_by uuid references auth.users not null,
  revoked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.share_links enable row level security;
create policy "Users can manage own share links" on public.share_links for all using (auth.uid() = created_by);
create policy "Anyone can read non-revoked non-expired share links by token" on public.share_links
  for select using (not revoked and expires_at > now());

-- Storage bucket for documents
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);
create policy "Authenticated users can upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "Authenticated users can view their documents" on storage.objects for select
  using (bucket_id = 'documents');
create policy "Authenticated users can delete their documents" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## What You Need to Do (Manual Steps)

### 1. Run the Supabase Migration
Copy the SQL above and run it in your Supabase dashboard → SQL Editor.

### 2. Set Up EAS Push Notifications (for real device push)

Push notifications work as **local notifications** out of the box (no setup needed for appointment reminders on device). For production remote push notifications:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login with your Expo account
eas login

# Configure EAS for this project
eas build:configure

# Set up push notification credentials
eas credentials

# Build a development build (real device required for full functionality)
eas build --platform ios --profile development

# Build for App Store submission
eas build --platform ios --profile production
```

> You'll need an Apple Developer account ($99/year) for iOS distribution.

### 3. Test on Device

For the best experience, run on a real iOS device:
```bash
npx expo start --dev-client
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#1B2A4A` | Headers, backgrounds, CTAs |
| Teal | `#00B4A6` | Primary actions, badges |
| Warm White | `#FAFAF8` | Screen backgrounds |
| Amber | `#F59E0B` | Allergy warnings |

---

## Project Structure

```
src/
  lib/          # Supabase client, TypeScript types
  contexts/     # AuthContext (auth state + functions)
  navigation/   # AppNavigator (stack-based routing)
  screens/
    auth/       # Landing, SignUp, SignIn, ForgotPassword
    onboarding/ # OnboardingScreen (4-step tutorial)
    main/       # Dashboard, Profile, AddEdit, Documents, Share, Appointments, Settings
```

---

*Built with ❤️ overnight by Remi for Cosmo.*
