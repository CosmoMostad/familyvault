import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../lib/types';
import { COLORS } from '../lib/design';

// Auth
import LandingScreen from '../screens/auth/LandingScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Main
import DashboardScreen from '../screens/main/DashboardScreen';
import MemberProfileScreen from '../screens/main/MemberProfileScreen';
import AddEditMemberScreen from '../screens/main/AddEditMemberScreen';
import DocumentScannerScreen from '../screens/main/DocumentScannerScreen';
import ShareScreen from '../screens/main/ShareScreen';
import AppointmentsScreen from '../screens/main/AppointmentsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, loading, isFirstLaunch } = useAuth();

  if (loading) {
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
        {!session ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          </>
        ) : isFirstLaunch ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
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
              name="Appointments"
              component={AppointmentsScreen}
              options={{ title: 'Appointments' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
