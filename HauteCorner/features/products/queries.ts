import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { Product, ProductFilters } from '@/features/products/types';
import { apiGet } from '@/lib/api-client';

const PAGE_SIZE = 20;

export function useProducts(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam, signal }) =>
      apiGet<Product[]>('/products', {
        query: { ...filters, limit: PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async ({ signal }) => (await apiGet<Product>(`/products/${id}`, { signal })).data,
  });
}

// Products by ID, as for the wish list. Only products still for sale come back.
export function useProductsByIds(ids: string[]) {
  // Sorted for the key, so reordering likes does not refetch.
  const sorted = [...ids].sort();
  return useQuery({
    queryKey: ['products', 'ids', sorted],
    queryFn: async ({ signal }) =>
      (await apiGet<Product[]>('/products', { query: { ids: sorted.join(',') }, signal })).data,
    enabled: ids.length > 0,
    placeholderData: (previous) => previous,
  });
}
