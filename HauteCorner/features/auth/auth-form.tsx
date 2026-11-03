import { Text } from '@expo/ui';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';

// Sign-in screens share one modal stack. Closing it returns to where the
// person was, such as the cart.
export function useCloseAuth() {
  const navigation = useNavigation();
  return useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);
}

export const signedInToast = () => Toast.show({ type: 'success', text1: 'You are signed in' });

export type FormErrors = { message?: string; fields: Record<string, string> };

// Field messages from the API go under their field, and anything else above the form.
export function toFormErrors(error: unknown): FormErrors {
  if (error instanceof ApiError) {
    if (error.code === 'validation_failed' && error.details) return { fields: error.details };
    return { message: error.message, fields: {} };
  }
  return { message: error instanceof Error ? error.message : 'Something went wrong. Please try again', fields: {} };
}

export function ErrorText({ children }: { children?: string }) {
  const colors = useColors();
  return children ? <Text textStyle={{ color: colors.danger }}>{children}</Text> : null;
}

// Seconds left before another code may be sent.
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}
