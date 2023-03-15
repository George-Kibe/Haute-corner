import React from 'react';
import {StatusBar} from 'react-native';
import HomeStack from './src/navigation/HomeStack';
import BottomTabsNavigator from './src/navigation/BottomTabsNavigator';
import Toast from 'react-native-toast-message';
import {Provider} from 'react-redux';
import {store} from './src/store';

const App = () => {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <BottomTabsNavigator />
      <Toast />
    </Provider>
  );
};

export default App;
