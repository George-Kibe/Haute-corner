import CloseIcon from '@expo/material-symbols/close.xml';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { SITE_URL } from '@/constants/site';
import { signedInToast, useCloseAuth } from '@/features/auth/auth-form';
import { signInWithApple, signInWithGoogle } from '@/features/auth/providers';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColors } from '@/hooks/use-colors';

const isIOS = process.env.EXPO_OS === 'ios';

export default function SignInScreen() {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  const closeAuth = useCloseAuth();
  const [busy, setBusy] = useState(false);
  // Shown on the screen, because toasts appear behind modals.
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (isIOS) AppleAuthentication.isAvailableAsync().then(setAppleAvailable, () => setAppleAvailable(false));
  }, []);

  async function run(signIn: () => Promise<boolean>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await signIn()) {
        closeAuth();
        signedInToast();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Toolbar placement="left">
        {/* Android header buttons show only icons. */}
        <Stack.Toolbar.Button accessibilityLabel="Close" icon={isIOS ? undefined : CloseIcon} onPress={closeAuth}>
          <Stack.Toolbar.Label>Close</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={styles.content}>
        <AppText style={styles.title}>Sign in to HauteCorner</AppText>
        <AppText style={[styles.message, { color: colors.muted }]}>
          Browsing never needs an account. Sign in to check out, save items, track your orders and sell.
        </AppText>

        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              dark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={12}
            style={styles.provider}
            onPress={() => run(signInWithApple)}
          />
        ) : null}
        <GoogleSigninButton
          accessibilityLabel="Sign in with Google"
          color={dark ? 'dark' : 'light'}
          disabled={busy}
          size={GoogleSigninButton.Size.Wide}
          style={styles.provider}
          onPress={() => run(signInWithGoogle)}
        />

        <AppText style={[styles.or, { color: colors.muted }]}>or</AppText>
        <Button disabled={busy} label="Continue with email" onPress={() => router.push('/email-sign-in')} />
        <AppText style={[styles.legal, { color: colors.muted }]}>
          New to HauteCorner?{' '}
          <AppText style={[styles.link, { color: colors.primary }]} onPress={() => router.push('/sign-up')}>
            Create an account
          </AppText>
        </AppText>

        <View style={styles.status}>
          {busy ? <ActivityIndicator color={colors.primary} /> : null}
          {error && !busy ? (
            <AppText accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {`Could not sign in. ${error}`}
            </AppText>
          ) : null}
        </View>

        <AppText style={[styles.legal, { color: colors.muted }]}>
          By signing in, you agree to our{' '}
          <AppText style={[styles.link, { color: colors.primary }]} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/terms`)}>
            Terms
          </AppText>{' '}
          and{' '}
          <AppText style={[styles.link, { color: colors.primary }]} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`)}>
            Privacy Policy
          </AppText>
          .
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  provider: {
    width: '100%',
    height: 50,
  },
  or: {
    fontSize: 14,
    textAlign: 'center',
  },
  status: {
    minHeight: 24,
    justifyContent: 'center',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  legal: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
  },
});
