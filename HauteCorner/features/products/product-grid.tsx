import { FlashList } from '@shopify/flash-list';
import { useMemo, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateMessage } from '@/components/state-message';
import { ProductCard } from '@/features/products/product-card';
import { useProducts } from '@/features/products/queries';
import { ProductGridSkeleton } from '@/features/products/skeletons';
import type { Product, ProductFilters } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';

const MIN_CARD_WIDTH = 180;
const MAX_COLUMNS = 5;

type ProductGridViewProps = {
  products: Product[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyMessage?: string;
  header?: ReactElement | null;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

// There is no native product grid, so this composes FlashList. The list always
// renders, because iOS only adjusts insets for the transparent header on a
// scroll view, and swapping it out would make the header jump.
export function ProductGridView({
  products,
  isPending,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  header,
  onEndReached,
  isFetchingMore,
  refreshing,
  onRefresh,
}: ProductGridViewProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Windows can be any size on iOS 27 and on iPad, so columns follow the width.
  const usableWidth = width - insets.left - insets.right - 16;
  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.floor(usableWidth / MIN_CARD_WIDTH)));
  const cardWidth = usableWidth / columns;

  const emptyState = isPending ? (
    <ProductGridSkeleton cardWidth={cardWidth} columns={columns} />
  ) : error ? (
    <StateMessage title="We couldn't load products" message={error.message} actionLabel="Try again" onAction={onRetry} />
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
      ListFooterComponent={isFetchingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
      ListHeaderComponent={header}
      key={columns}
      numColumns={columns}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      renderItem={({ item }) => <ProductCard imageWidth={cardWidth} product={item} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

type ProductGridProps = {
  filters: ProductFilters;
  emptyTitle: string;
  emptyMessage?: string;
  header?: ReactElement;
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 16,
  },
  footer: {
    marginVertical: 16,
  },
});

// The catalogue, a page at a time.
export function ProductGrid({ filters, emptyTitle, emptyMessage, header }: ProductGridProps) {
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isRefetching, refetch } =
    useProducts(filters);
  const products = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <ProductGridView
      emptyMessage={emptyMessage}
      emptyTitle={emptyTitle}
      error={error}
      header={header}
      isFetchingMore={isFetchingNextPage}
      isPending={isPending}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onRefresh={() => refetch()}
      onRetry={() => refetch()}
      products={products}
      refreshing={isRefetching && !isFetchingNextPage}
    />
  );
}
