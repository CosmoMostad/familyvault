import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../lib/types';
import { COLORS, FONTS } from '../lib/design';
import { supabase } from '../lib/supabase';

// Auth
import LandingScreen from '../screens/auth/LandingScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import SetupSelfScreen from '../screens/onboarding/SetupSelfScreen';

// Main tabs
import FamilyScreen from '../screens/main/FamilyScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import SharedScreen from '../screens/main/SharedScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Stack screens
import MemberProfileScreen from '../screens/main/MemberProfileScreen';
import AddEditMemberScreen from '../screens/main/AddEditMemberScreen';
import DocumentScannerScreen from '../screens/main/DocumentScannerScreen';
import ShareScreen from '../screens/main/ShareScreen';
import ShareAccountScreen from '../screens/main/ShareAccountScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const ONBOARDING_KEY = 'wrenhealth_onboarding_seen';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [selfChecked, setSelfChecked] = useState(false);
  const [hasSelf, setHasSelf] = useState(false);

  // Load onboarding flag
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingSeen(!!val);
    });
  }, []);

  // When session appears, check if user has a self account
  useEffect(() => {
    if (!session?.user) {
      setSelfChecked(false);
      setHasSelf(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('family_members')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_self', true)
          .limit(1);
        setHasSelf(!!(data && data.length > 0));
      } catch {
        setHasSelf(false);
      } finally {
        setSelfChecked(true);
      }
    })();
  }, [session]);

  const isReady = !loading && onboardingSeen !== null && (!session || selfChecked);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
          // Step 1: App intro onboarding (before any auth)
          <Stack.Screen
            name="Onboarding"
            options={{ headerShown: false }}
          >
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
          // Step 2: Auth (after onboarding)
          <>
            <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Step 3: Main app
          <>
            {/* If user has no self-account yet, show setup prompt first */}
            {!hasSelf ? (
              <Stack.Screen
                name="SetupSelf"
                options={{ headerShown: false }}
              >
                {(props) => (
                  <SetupSelfScreen
                    {...props}
                    navigation={{
                      ...props.navigation,
                      navigate: (screen: any, params?: any) => {
                        if (screen === 'MainTabs') {
                          setHasSelf(true); // skip setup on next load
                        }
                        props.navigation.navigate(screen, params);
                      },
                    }}
                  />
                )}
              </Stack.Screen>
            ) : null}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
