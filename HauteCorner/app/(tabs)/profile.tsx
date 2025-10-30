import { StyleSheet, Text, View } from 'react-native';
import { HelloWave } from '@/components/hello-wave';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <HelloWave />
      <Text>Profile Screen!</Text>
      <Text>Under Construction!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
