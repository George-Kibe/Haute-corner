import { StyleSheet, View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { useColors } from '@/hooks/use-colors';

export default function ProfileScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StateMessage title="Your profile is on the way" message="Sign-in and account settings are coming soon." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
