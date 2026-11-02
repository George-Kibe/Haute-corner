import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useColors() {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
