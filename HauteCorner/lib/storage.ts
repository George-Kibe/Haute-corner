import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// Fast local storage for data that is not secret, such as likes and the cart.
// Tokens live in expo-secure-store instead.
export const storage = createMMKV({ id: 'hautecorner' });

// Lets Zustand's persist middleware save to MMKV.
export const zustandStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => {
    storage.remove(key);
  },
};
