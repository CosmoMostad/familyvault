import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../lib/types';

// Auth screens
import LandingScreen from '../screens/auth/LandingScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Main screens
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B2A4A' }}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1B2A4A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#FAFAF8' },
        }}
      >
        {!session ? (
          // Auth flow
          <>
            <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          </>
        ) : isFirstLaunch ? (
          // Onboarding flow
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="MemberProfile"
              component={MemberProfileScreen}
              options={{
                title: '',
                headerStyle: { backgroundColor: '#1B2A4A' },
                headerTintColor: '#FFFFFF',
              }}
            />
            <Stack.Screen
              name="AddEditMember"
              component={AddEditMemberScreen}
              options={{
                title: 'Add Member',
                presentation: 'modal',
              }}
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
              options={{ title: 'Settings' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
