import type { OrderStatus } from '@/features/cart/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: 'Waiting for payment',
  paid: 'Paid, waiting for the seller',
  confirmed: 'Confirmed by the seller',
  dispatched: 'On its way',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed: 'Problem raised',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const formatOrderDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
