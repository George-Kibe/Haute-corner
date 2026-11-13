import type { Types } from 'mongoose';
import type { OrderAttributes } from '@/models/Order';
import type { PurchaseAttributes } from '@/models/Purchase';
import type { Address } from '@/models/User';

type StoredOrder = OrderAttributes & { _id: Types.ObjectId };
type StoredPurchase = PurchaseAttributes & { _id: Types.ObjectId };

const serializeAddress = (address: Address) => ({
  line1: address.line1,
  area: address.area ?? null,
  city: address.city,
  notes: address.notes ?? null,
});

// What a buyer sees of one order. Commission and seller amounts stay private.
export function serializeBuyerOrder(order: StoredOrder) {
  return {
    ref: order.ref,
    status: order.status,
    seller: { id: String(order.sellerId), name: order.sellerName },
    items: order.items.map((item) => ({
      productId: String(item.productId),
      title: item.title,
      image: item.image,
      option: item.option ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    contact: order.contact,
    deliveryAddress: serializeAddress(order.deliveryAddress),
    statusHistory: order.statusHistory.map((entry) => ({ status: entry.status, at: entry.at.toISOString(), note: entry.note ?? null })),
    createdAt: order.createdAt.toISOString(),
  };
}

export function serializePurchase(purchase: StoredPurchase, orders: StoredOrder[]) {
  const { payment } = purchase;
  return {
    ref: purchase.ref,
    total: purchase.total,
    currency: 'KES',
    payment: {
      method: payment.method,
      status: payment.status,
      phone: payment.phone ?? null,
      // Only useful while the card payment can still be made.
      authorizationUrl: payment.status === 'pending' ? (payment.authorizationUrl ?? null) : null,
      failureReason: payment.failureReason ?? null,
      receipt: payment.receipt ?? null,
      paidAt: payment.paidAt?.toISOString() ?? null,
    },
    reservedUntil: purchase.reservedUntil.toISOString(),
    orders: orders.map(serializeBuyerOrder),
    createdAt: purchase.createdAt.toISOString(),
  };
}
