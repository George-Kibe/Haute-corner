import React from 'react';
import {StatusBar} from 'react-native';
import MainNavigator from './src/navigation';
import Toast from 'react-native-toast-message';
import {Provider} from 'react-redux';
import {store} from './src/store';

const App = () => {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <MainNavigator />
      <Toast />
    </Provider>
  );
};

export default App;
