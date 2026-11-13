import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { restoreSession } from '@/features/auth/session';
import { startWishlistSync } from '@/features/wishlist/sync';
import { queryClient } from '@/lib/query-client';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    // Listen first, so restoring a session also refreshes the wish list.
    const stopWishlistSync = startWishlistSync();
    restoreSession();
    return stopWishlistSync;
  }, []);

  if (!ready) return null;

  const dark = colorScheme === 'dark';
  const colors = dark ? Colors.dark : Colors.light;
  const baseTheme = dark ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontFamily: Fonts.extrabold },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="products/[id]" options={{ title: 'Product Details' }} />
          <Stack.Screen name="shopping-cart" options={{ title: 'My Cart', headerTransparent: false }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout', headerTransparent: false }} />
          <Stack.Screen name="purchase/[ref]" options={{ title: 'Payment', headerTransparent: false }} />
          <Stack.Screen name="orders/index" options={{ title: 'My Orders', headerTransparent: false }} />
          <Stack.Screen name="orders/[ref]" options={{ title: 'Order', headerTransparent: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="seller" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="report/[id]" options={{ title: 'Report Listing', presentation: 'modal', headerTransparent: false }} />
          <Stack.Screen
            name="edit-profile"
            options={{ title: 'Edit Profile', presentation: 'modal', headerTransparent: false }}
          />
        </Stack>
        <Toast bottomOffset={110} position="bottom" />
      </QueryClientProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
