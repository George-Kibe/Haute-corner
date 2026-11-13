import { keepPreviousData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import type { CheckoutRequest, Order, PaymentChoice, Purchase, Quote } from '@/features/cart/types';
import { authRequest, useSession } from '@/features/auth/session';
import { queryClient } from '@/lib/query-client';

type CartItems = CheckoutRequest['items'];

// Server prices for the cart. Problems come back per cart line, as
// details["items.<index>"] on the error.
export function useQuote(items: CartItems) {
  const signedIn = useSession((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: ['quote', items],
    queryFn: async ({ signal }) => (await authRequest<Quote>('/checkout/quote', { method: 'POST', body: { items }, signal })).data,
    enabled: signedIn && items.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export const purchaseQueryKey = (ref: string) => ['purchase', ref] as const;

// One key per checkout attempt, so a retried request cannot charge twice.
export const newIdempotencyKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export function useCheckout() {
  return useMutation({
    mutationFn: async ({ request, idempotencyKey }: { request: CheckoutRequest; idempotencyKey: string }) =>
      (await authRequest<Purchase>('/checkout', { method: 'POST', body: request, headers: { 'Idempotency-Key': idempotencyKey } })).data,
    onSuccess: (purchase) => queryClient.setQueryData(purchaseQueryKey(purchase.ref), purchase),
  });
}

// Polls while the payment is pending, every few seconds.
export function usePurchase(ref: string, poll: boolean) {
  return useQuery({
    queryKey: purchaseQueryKey(ref),
    queryFn: async ({ signal }) => (await authRequest<Purchase>(`/purchases/${ref}`, { signal })).data,
    refetchInterval: (query) => (poll && query.state.data?.payment.status === 'pending' ? 3000 : false),
  });
}

export function usePayAgain(ref: string) {
  return useMutation({
    mutationFn: async (payment?: PaymentChoice) =>
      (await authRequest<Purchase>(`/purchases/${ref}/pay`, { method: 'POST', body: payment ? { payment } : {} })).data,
    onSuccess: (purchase) => queryClient.setQueryData(purchaseQueryKey(ref), purchase),
  });
}

export function useOrders() {
  const signedIn = useSession((state) => state.status === 'signedIn');
  return useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: async ({ pageParam, signal }) => authRequest<Order[]>('/orders', { query: { limit: 20, cursor: pageParam }, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta?.nextCursor ?? undefined,
    enabled: signedIn,
  });
}

export function useOrder(ref: string) {
  return useQuery({
    queryKey: ['order', ref],
    queryFn: async ({ signal }) => (await authRequest<Order>(`/orders/${ref}`, { signal })).data,
  });
}
