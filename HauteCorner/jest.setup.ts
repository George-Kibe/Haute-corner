// MMKV needs its native module, so tests keep storage in memory.
jest.mock('@/lib/storage', () => {
  const memory = new Map<string, string | boolean | number>();
  return {
    storage: {
      getString: (key: string) => memory.get(key) as string | undefined,
      getBoolean: (key: string) => memory.get(key) as boolean | undefined,
      set: (key: string, value: string | boolean | number) => memory.set(key, value),
      remove: (key: string) => memory.delete(key),
      clearAll: () => memory.clear(),
    },
    zustandStorage: {
      getItem: (key: string) => (memory.get(key) as string | undefined) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  };
});
