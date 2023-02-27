import React from 'react';
import {View, StyleSheet} from 'react-native';
import ShoppingCartScreen from './src/screens/ShoppingCartScreen';

const App = () => {
  return (
    <View style={styles.container}>
      <ShoppingCartScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
