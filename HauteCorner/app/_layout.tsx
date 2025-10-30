import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import {Provider as ReduxProvider} from 'react-redux';
import {store, persistor} from '@/store';
import { PersistGate } from 'redux-persist/integration/react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ReduxProvider store={store}>
        <PersistGate persistor={persistor}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(stack)" options={{ headerShown: false }} />
          </Stack>
          <Toast />
        </PersistGate>
      </ReduxProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
