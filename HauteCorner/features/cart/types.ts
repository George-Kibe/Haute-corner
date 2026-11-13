import type { Address } from '@/features/auth/types';

export type Quote = {
  currency: 'KES';
  subtotal: number;
  deliveryTotal: number;
  total: number;
  orders: {
    seller: { id: string; name: string };
    items: { productId: string; title: string; image: string | null; option: string | null; unitPrice: number; quantity: number; lineTotal: number; stock: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
  }[];
};

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

export type Order = {
  ref: string;
  status: OrderStatus;
  seller: { id: string; name: string };
  items: { productId: string; title: string; image: string; option: string | null; unitPrice: number; quantity: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  contact: { name: string; phone: string };
  deliveryAddress: Address;
  statusHistory: { status: OrderStatus; at: string; note: string | null }[];
  createdAt: string;
};

export type PaymentChoice = { method: 'mpesa'; phone: string } | { method: 'card' };

export type Purchase = {
  ref: string;
  total: number;
  currency: 'KES';
  payment: {
    method: 'mpesa' | 'card';
    status: 'pending' | 'paid' | 'failed' | 'expired';
    phone: string | null;
    authorizationUrl: string | null;
    failureReason: string | null;
    receipt: string | null;
    paidAt: string | null;
  };
  reservedUntil: string;
  orders: Order[];
  createdAt: string;
};

export type CheckoutRequest = {
  items: { productId: string; option?: string; quantity: number }[];
  contact: { name: string; phone: string };
  deliveryAddress: { line1: string; area?: string; city: string; notes?: string };
  payment: PaymentChoice;
};
