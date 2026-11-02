import { Stack } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type TabStackProps = {
  title: string;
  brandTitle?: boolean;
  // Screens without a list that adjusts its own insets need an opaque header on iOS 26+.
  opaqueHeader?: boolean;
};

// Native tabs have no header of their own, so each tab nests a native stack.
export function TabStack({ title, brandTitle, opaqueHeader }: TabStackProps) {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        title,
        headerTransparent: opaqueHeader ? false : undefined,
        headerTitleStyle: {
          fontFamily: brandTitle ? Fonts.black : Fonts.extrabold,
          color: brandTitle ? colors.primary : colors.text,
        },
      }}
    />
  );
}
