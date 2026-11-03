import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { useColors } from '@/hooks/use-colors';

// Jetpack Compose has no built-in placeholder, so Android draws the profile's
// grouped rows with skeleton blocks.
const SECTIONS = [1, 2, 2];

export function ProfileSkeleton() {
  const colors = useColors();

  return (
    <View
      accessible
      accessibilityLabel="Loading your profile"
      accessibilityRole="progressbar"
      style={[styles.container, { backgroundColor: colors.background }]}>
      {SECTIONS.map((rows, section) => (
        <View key={section} style={styles.section}>
          <Skeleton style={styles.heading} />
          <View style={[styles.group, { backgroundColor: colors.surface }]}>
            {Array.from({ length: rows }, (_, row) => (
              <View key={row} style={styles.row}>
                <Skeleton style={styles.title} />
                <Skeleton style={styles.subtitle} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  heading: {
    width: 90,
    height: 14,
  },
  group: {
    borderRadius: 20,
    paddingVertical: 4,
  },
  row: {
    padding: 16,
    gap: 8,
  },
  title: {
    width: '55%',
    height: 16,
  },
  subtitle: {
    width: '35%',
    height: 12,
  },
});
