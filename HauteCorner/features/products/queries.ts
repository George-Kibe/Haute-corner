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
