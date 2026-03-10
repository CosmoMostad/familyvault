import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, Platform, StyleSheet } from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../lib/types';
import { COLORS, FONTS } from '../lib/design';

// Auth
import LandingScreen from '../screens/auth/LandingScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ConfirmEmailScreen from '../screens/auth/ConfirmEmailScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Main tabs
import FamilyScreen from '../screens/main/FamilyScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import SharedScreen from '../screens/main/SharedScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Stack screens
import SetupSelfScreen from '../screens/main/SetupSelfScreen';
import MemberProfileScreen from '../screens/main/MemberProfileScreen';
import AddEditMemberScreen from '../screens/main/AddEditMemberScreen';
import DocumentScannerScreen from '../screens/main/DocumentScannerScreen';
import ShareScreen from '../screens/main/ShareScreen';
import ShareAccountScreen from '../screens/main/ShareAccountScreen';
import AppointmentsScreen from '../screens/main/AppointmentsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const ONBOARDING_KEY = 'wrenhealth_onboarding_seen';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(9,13,11,0.94)',
          borderTopColor: 'rgba(255,255,255,0.07)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#52B788',
        tabBarInactiveTintColor: '#F2FAF5',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Family: { active: 'people', inactive: 'people-outline' },
            Calendar: { active: 'calendar', inactive: 'calendar-outline' },
            Shared: { active: 'share-social', inactive: 'share-social-outline' },
            Settings: { active: 'settings', inactive: 'settings-outline' },
          };
          const icon = icons[route.name];
          if (!icon) return null;
          return <Ionicons name={focused ? icon.active : icon.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Family" component={FamilyScreen} options={{ tabBarLabel: 'My Accounts' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarLabel: 'Calendar' }} />
      <Tab.Screen name="Shared" component={SharedScreen} options={{ tabBarLabel: 'Shared With Me' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

const navigationRef = React.createRef<any>();

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [hasSelf, setHasSelf] = useState<boolean | null>(null);

  // No deep link auth handling needed — password reset and email confirmation
  // are both handled on the web (wrenhealth.app/reset-password, wrenhealth.app/confirmed)

  // Load onboarding flag
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingSeen(!!val);
    });
  }, []);

  // Check if user has a self member record
  useEffect(() => {
    if (!session?.user?.id) {
      setHasSelf(null);
      return;
    }
    supabase
      .from('family_members')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', session.user.id)
      .eq('is_self', true)
      .then(({ count }) => {
        setHasSelf((count ?? 0) > 0);
      });
  }, [session?.user?.id]);

  const isReady = !loading && onboardingSeen !== null && (!session || hasSelf !== null);

  if (!isReady) {
    return (
      <View style={splashStyles.container}>
        <Svg width={80} height={80} viewBox="0 0 20 20">
          <Path d="M6 15 Q3 11 5 7 Q5.5 10.5 7.5 12.5Z" fill="white" />
          <Ellipse cx="11.5" cy="14" rx="5.5" ry="3.8" fill="white" />
          <Circle cx="15.5" cy="10" r="3.2" fill="white" />
          <Path d="M18.2,9.2 L20,10 L18.2,10.8Z" fill="white" />
          <Circle cx="16.5" cy="9" r="0.55" fill="rgba(0,0,0,0.35)" />
        </Svg>
        <Text style={splashStyles.brand}>Wren Health</Text>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ marginTop: 48 }} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        {!onboardingSeen ? (
          // Step 1: App intro onboarding
          <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={async () => {
                  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
                  setOnboardingSeen(true);
                }}
              />
            )}
          </Stack.Screen>
        ) : !session ? (
          // Step 2: Auth screens
          <>
            <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ConfirmEmail" component={ConfirmEmailScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Step 3: Authenticated — SetupSelf first if no self record, else MainTabs
          <>
            {!hasSelf && (
              <Stack.Screen name="SetupSelf" options={{ headerShown: false }}>
                {(props) => (
                  <SetupSelfScreen
                    {...props}
                    onSetupComplete={() => setHasSelf(true)}
                  />
                )}
              </Stack.Screen>
            )}
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="MemberProfile"
              component={MemberProfileScreen}
              options={{ headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="AddEditMember"
              component={AddEditMemberScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="DocumentScanner"
              component={DocumentScannerScreen}
              options={{ title: 'Documents' }}
            />
            <Stack.Screen
              name="Share"
              component={ShareScreen}
              options={{ title: 'Share Profile' }}
            />
            <Stack.Screen
              name="ShareAccount"
              component={ShareAccountScreen}
              options={{ title: 'Share Account', headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="Appointments"
              component={AppointmentsScreen}
              options={{ headerBackTitle: 'Back' }}
            />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  brand: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.5,
  },
});
