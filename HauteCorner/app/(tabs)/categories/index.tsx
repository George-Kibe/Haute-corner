import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HeaderActions } from '@/components/header-actions';
import { ProductGrid } from '@/features/products/product-grid';
import type { Audience, ProductType } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';

const TYPES: { label: string; value?: ProductType }[] = [
  { label: 'All' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Clothing', value: 'clothing' },
];

const AUDIENCES: { label: string; value?: Audience }[] = [
  { label: 'Everyone' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Kids', value: 'children' },
  { label: 'Unisex', value: 'unisex' },
];

export default function CategoriesScreen() {
  const colors = useColors();
  const [typeIndex, setTypeIndex] = useState(0);
  const [audienceIndex, setAudienceIndex] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeaderActions />
      <ProductGrid
        filters={{ type: TYPES[typeIndex].value, audience: AUDIENCES[audienceIndex].value }}
        emptyTitle="Nothing here yet"
        emptyMessage="Try a different category."
        header={
          <View style={styles.filters}>
            <SegmentedControl
              accessibilityLabel="Product type"
              onChange={(event) => setTypeIndex(event.nativeEvent.selectedSegmentIndex)}
              selectedIndex={typeIndex}
              values={TYPES.map((option) => option.label)}
            />
            <SegmentedControl
              accessibilityLabel="Shopping for"
              onChange={(event) => setAudienceIndex(event.nativeEvent.selectedSegmentIndex)}
              selectedIndex={audienceIndex}
              values={AUDIENCES.map((option) => option.label)}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
});
