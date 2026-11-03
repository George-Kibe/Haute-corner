import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';

export const unstable_settings = {
  anchor: 'sign-in',
  initialRouteName: 'sign-in',
};

// Sign-in screens open as one modal stack over the app, so the email steps can
// go back and forth, and closing it returns to where the person was.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerTitleStyle: { fontFamily: Fonts.extrabold },
      }}>
      <Stack.Screen name="sign-in" options={{ title: '' }} />
      <Stack.Screen name="email-sign-in" options={{ title: 'Sign In with Email' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create Account' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Check Your Email' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="reset-password" options={{ title: 'New Password' }} />
    </Stack>
  );
}
