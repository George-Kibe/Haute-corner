import React from 'react';
import {StatusBar, Text} from 'react-native';
import BottomTabsNavigator from './src/navigation/BottomTabsNavigator';
import Toast from 'react-native-toast-message';
import {Provider as ReduxProvider} from 'react-redux';
import {store, persistor} from './src/store';
import { PersistGate } from 'redux-persist/integration/react';
const App = () => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<Text>Loading...</Text>} persistor={persistor}>
        <StatusBar style="auto" />
        <BottomTabsNavigator />
        <Toast />
      </PersistGate>
    </ReduxProvider>
  );
};

export default App;
