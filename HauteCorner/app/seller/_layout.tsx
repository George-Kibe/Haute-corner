import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';

// Seller forms open as one modal stack over the Sell tab.
export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: false,
        headerTitleStyle: { fontFamily: Fonts.extrabold },
      }}>
      <Stack.Screen name="apply" options={{ title: 'Apply to Sell' }} />
      <Stack.Screen name="listing" options={{ title: 'Listing' }} />
      <Stack.Screen name="shop" options={{ title: 'Shop Settings' }} />
    </Stack>
  );
}
