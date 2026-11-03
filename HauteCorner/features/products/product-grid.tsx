import { FlashList } from '@shopify/flash-list';
import { useMemo, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateMessage } from '@/components/state-message';
import { ProductCard } from '@/features/products/product-card';
import { useProducts } from '@/features/products/queries';
import type { ProductFilters } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';

const MIN_CARD_WIDTH = 180;
const MAX_COLUMNS = 5;

type ProductGridProps = {
  filters: ProductFilters;
  emptyTitle: string;
  emptyMessage?: string;
  header?: ReactElement;
};

// There is no native product grid, so this composes FlashList. The list always
// renders, because iOS only adjusts insets for the transparent header on a
// scroll view, and swapping it out would make the header jump.
export function ProductGrid({ filters, emptyTitle, emptyMessage, header }: ProductGridProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Windows can be any size on iOS 27 and on iPad, so columns follow the width.
  const usableWidth = width - insets.left - insets.right;
  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.floor(usableWidth / MIN_CARD_WIDTH)));
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isRefetching, refetch } =
    useProducts(filters);

  const products = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const emptyState = isPending ? (
    <View style={styles.loading}>
      <ActivityIndicator accessibilityLabel="Loading products" color={colors.primary} />
    </View>
  ) : error ? (
    <StateMessage
      title="We couldn't load products"
      message={error.message}
      actionLabel="Try again"
      onAction={() => refetch()}
    />
  ) : (
    <StateMessage title={emptyTitle} message={emptyMessage} />
  );

  return (
    <FlashList
      contentContainerStyle={{ ...styles.content, paddingLeft: 8 + insets.left, paddingRight: 8 + insets.right }}
      contentInsetAdjustmentBehavior="automatic"
      data={products}
      keyExtractor={(product) => product.id}
      ListEmptyComponent={emptyState}
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
      }
      ListHeaderComponent={header}
      key={columns}
      numColumns={columns}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      onRefresh={() => refetch()}
      refreshing={isRefetching && !isFetchingNextPage}
      renderItem={({ item }) => <ProductCard imageWidth={usableWidth / columns} product={item} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 16,
  },
  footer: {
    marginVertical: 16,
  },
});
