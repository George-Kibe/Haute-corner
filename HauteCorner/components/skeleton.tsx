import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';

// A placeholder block shaped like the content that is loading. Neither
// platform offers a native one for React Native views, so this is custom. It
// pulses gently, and stays still when the system asks for reduced motion.
// Native forms use SwiftUI's redacted modifier on iOS instead.
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.45, { duration: 850 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ backgroundColor: colors.tint, borderRadius: 8 }, style, animated]} />;
}
