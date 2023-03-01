import React from 'react';
import {StatusBar} from 'react-native';
import MainNavigator from './src/navigation';
import {Provider} from 'react-redux';
import {store} from './src/store';

const App = () => {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <MainNavigator />
    </Provider>
  );
};

export default App;
