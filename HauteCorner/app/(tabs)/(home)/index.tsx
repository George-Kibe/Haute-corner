import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HeaderActions } from '@/components/header-actions';
import { ProductGrid } from '@/features/products/product-grid';
import { useColors } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export default function HomeScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim(), 300);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeaderActions />
      <Stack.SearchBar
        autoCapitalize="none"
        hideWhenScrolling={false}
        onCancelButtonPress={() => setSearch('')}
        onChangeText={(event) => setSearch(event.nativeEvent.text)}
        onClose={() => setSearch('')}
        placeholder="Search shoes and clothing"
      />
      <ProductGrid
        filters={q ? { q } : {}}
        emptyTitle={q ? `Nothing found for "${q}"` : 'No products yet'}
        emptyMessage={q ? 'Try a different word.' : 'New products from sellers will appear here.'}
      />
    </View>
  );
}
