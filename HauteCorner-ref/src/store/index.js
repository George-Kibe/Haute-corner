import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

import {productsSlice} from './productsSlice';
import {cartSlice} from './cartSlice';
import {apiSlice} from './apiSlice'

const persistProductsConfig = {
  key: 'products',
  storage: AsyncStorage, // Use the storage you imported above
};
const persistCartConfig = {
  key: 'cart',
  storage: AsyncStorage, // Use the storage you imported above
};
const persistApiConfig = {
  key: 'api',
  storage: AsyncStorage, // Use the storage you imported above
};

const persistedProducts = persistReducer(persistProductsConfig, productsSlice.reducer);
const persistedCart = persistReducer(persistCartConfig, cartSlice.reducer);
const persistedAPI = persistReducer(persistApiConfig, apiSlice.reducer);


const store = configureStore({
  reducer: {
    products: persistedProducts,
    cart: persistedCart,
    api: persistedAPI,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // To disable the warning for non-serializable values (which will be handled by redux-persist)
    }).concat(apiSlice.middleware),
});

const persistor = persistStore(store);

export { store, persistor };