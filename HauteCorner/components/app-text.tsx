import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

function fontFamilyFor(weight: TextStyle['fontWeight']) {
  switch (String(weight)) {
    case '500':
    case '600':
      return Fonts.semibold;
    case '700':
    case 'bold':
      return Fonts.bold;
    case '800':
      return Fonts.extrabold;
    case '900':
      return Fonts.black;
    default:
      return Fonts.regular;
  }
}

// Text in Nunito. Custom fonts carry their own weight, so fontWeight picks the
// matching font file and is then cleared, as Android would otherwise fall back.
export function AppText({ style, ...props }: TextProps) {
  const colors = useColors();
  const weight = StyleSheet.flatten(style)?.fontWeight;

  return (
    <Text
      {...props}
      style={[{ color: colors.text }, style, { fontFamily: fontFamilyFor(weight), fontWeight: 'normal' }]}
    />
  );
}
