import { useMutation, useQuery } from '@tanstack/react-query';

import { authRequest, meQueryKey, useSession } from '@/features/auth/session';
import type { Application, ListingFields, OwnProduct, OwnSeller, ProductStatus, ShopFields } from '@/features/seller/types';
import { ApiError } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

export const sellerQueryKey = ['seller'] as const;
export const ownProductsQueryKey = ['seller', 'products'] as const;

// The user's shop, or null if they have not applied.
export function useOwnSeller() {
  const signedIn = useSession((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: sellerQueryKey,
    queryFn: async ({ signal }) => {
      try {
        return (await authRequest<OwnSeller>('/seller/application', { signal })).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: signedIn,
  });
}

function shopChanged(seller: OwnSeller) {
  queryClient.setQueryData(sellerQueryKey, seller);
  queryClient.invalidateQueries({ queryKey: meQueryKey });
}

export function useApplyToSell() {
  return useMutation({
    mutationFn: async (application: Application) =>
      (await authRequest<OwnSeller>('/seller/application', { method: 'POST', body: application })).data,
    onSuccess: shopChanged,
  });
}

export function useUpdateShop() {
  return useMutation({
    mutationFn: async (changes: Partial<ShopFields> & { returnsNote?: string | null }) =>
      (await authRequest<OwnSeller>('/seller/profile', { method: 'PATCH', body: changes })).data,
    onSuccess: shopChanged,
  });
}

// Up to 50 of the seller's own listings, newest first, in every status.
export function useOwnProducts(enabled: boolean) {
  return useQuery({
    queryKey: ownProductsQueryKey,
    queryFn: async ({ signal }) => (await authRequest<OwnProduct[]>('/seller/products', { query: { limit: 50 }, signal })).data,
    enabled,
  });
}

export function useOwnProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['seller', 'products', id],
    queryFn: async ({ signal }) => (await authRequest<OwnProduct>(`/seller/products/${id}`, { signal })).data,
    enabled: !!id,
  });
}

// Listings change what shoppers see too, so the public lists refresh.
function listingsChanged(product?: OwnProduct) {
  queryClient.invalidateQueries({ queryKey: ownProductsQueryKey });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  if (product) {
    queryClient.setQueryData(['seller', 'products', product.id], product);
    queryClient.invalidateQueries({ queryKey: ['product', product.id] });
  }
}

export function useSaveListing() {
  return useMutation({
    mutationFn: async ({ id, fields }: { id?: string; fields: Partial<ListingFields> & { status?: ProductStatus } }) =>
      id
        ? (await authRequest<OwnProduct>(`/seller/products/${id}`, { method: 'PATCH', body: fields })).data
        : (await authRequest<OwnProduct>('/seller/products', { method: 'POST', body: fields })).data,
    onSuccess: listingsChanged,
  });
}

export function useArchiveListing() {
  return useMutation({
    mutationFn: async (id: string) => {
      await authRequest(`/seller/products/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => listingsChanged(),
  });
}
