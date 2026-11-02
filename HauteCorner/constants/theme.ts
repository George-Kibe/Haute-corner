export const Colors = {
  light: {
    text: '#0F1B33',
    muted: '#55607A',
    background: '#FFFFFF',
    surface: '#F6F9FE',
    tint: '#E6EEFB',
    border: '#D9E3F4',
    primary: '#0E4BB4',
    onPrimary: '#FFFFFF',
    danger: '#B3261E',
  },
  dark: {
    text: '#F2F5FB',
    muted: '#A3AEC5',
    background: '#0B1220',
    surface: '#131C2E',
    tint: '#1C2B49',
    border: '#2A3753',
    primary: '#7DA7F7',
    onPrimary: '#0B1220',
    danger: '#F2B8B5',
  },
};

export type ColorPalette = typeof Colors.light;

export const Fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};
