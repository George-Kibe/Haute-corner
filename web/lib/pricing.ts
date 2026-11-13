import { Types } from 'mongoose';
import type { z } from 'zod';
import { ApiError } from '@/lib/http';
import { COMMISSION_RATE } from '@/lib/settings';
import { Product, type ProductAttributes } from '@/models/Product';
import { Seller, type SellerAttributes } from '@/models/Seller';
import type { quoteBody } from '@/schemas/checkout';

type CartItem = z.output<typeof quoteBody>['items'][number];
type StoredProduct = ProductAttributes & { _id: Types.ObjectId };
type StoredSeller = SellerAttributes & { _id: Types.ObjectId };

export type PricedLine = {
  product: StoredProduct;
  option?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PricedOrder = {
  seller: StoredSeller;
  lines: PricedLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
};

export type PricedCart = { orders: PricedOrder[]; subtotal: number; deliveryTotal: number; total: number };

// The same product and size on two lines becomes one line.
function mergeLines(items: CartItem[]) {
  const merged = new Map<string, CartItem & { indexes: number[] }>();
  items.forEach((item, index) => {
    const key = `${item.productId}:${item.option ?? ''}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.indexes.push(index);
    } else merged.set(key, { ...item, indexes: [index] });
  });
  return [...merged.values()];
}

// Prices a cart from the database alone. Each seller's items become one order
// with that seller's delivery fee. Commission is worked out on the products,
// not the delivery fee, at the current rate; both the rate and what it applies
// to are still to be decided (see DECISIONS.md, open items).
//
// Problems are reported per cart line in `details`: unavailable products and
// stock shortages as 409, and sizes that do not exist as 400.
export async function priceCart(items: CartItem[]): Promise<PricedCart> {
  const lines = mergeLines(items);
  const ids = [...new Set(lines.map((line) => line.productId))].map((id) => new Types.ObjectId(id));
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const sellers = await Seller.find({ _id: { $in: products.map((product) => product.sellerId) } }).lean();
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const sellerById = new Map(sellers.map((seller) => [String(seller._id), seller]));

  const unavailable: Record<string, string> = {};
  const invalid: Record<string, string> = {};
  const report = (target: Record<string, string>, indexes: number[], message: string) => {
    for (const index of indexes) target[`items.${index}`] = message;
  };

  const groups = new Map<string, PricedOrder>();
  for (const line of lines) {
    const product = productById.get(line.productId);
    const seller = product && sellerById.get(String(product.sellerId));
    if (!product || product.status !== 'active' || seller?.status !== 'approved') {
      report(unavailable, line.indexes, 'This product is no longer available');
      continue;
    }
    if (product.options.length > 0 ? !line.option || !product.options.includes(line.option) : line.option) {
      report(invalid, line.indexes, product.options.length ? 'Choose one of the listed sizes' : 'This product has no sizes');
      continue;
    }
    if (line.quantity > product.stock) {
      report(unavailable, line.indexes, product.stock === 0 ? 'Sold out' : `Only ${product.stock} left`);
      continue;
    }

    const key = String(seller._id);
    const group =
      groups.get(key) ??
      ({ seller, lines: [], subtotal: 0, deliveryFee: seller.deliveryFee, total: 0, commissionRate: COMMISSION_RATE, commissionAmount: 0, sellerAmount: 0 } satisfies PricedOrder);
    const lineTotal = product.price * line.quantity;
    group.lines.push({ product, option: line.option, quantity: line.quantity, unitPrice: product.price, lineTotal });
    group.subtotal += lineTotal;
    groups.set(key, group);
  }

  if (Object.keys(invalid).length) throw new ApiError(400, 'validation_failed', 'Some sizes are not valid', invalid);
  if (Object.keys(unavailable).length) {
    throw new ApiError(409, 'conflict', 'Some items in your cart are no longer available', unavailable);
  }

  const orders = [...groups.values()].map((order) => {
    const total = order.subtotal + order.deliveryFee;
    const commissionAmount = Math.round(order.subtotal * order.commissionRate);
    return { ...order, total, commissionAmount, sellerAmount: total - commissionAmount };
  });
  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const deliveryTotal = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
  return { orders, subtotal, deliveryTotal, total: subtotal + deliveryTotal };
}

export function serializeQuote(cart: PricedCart) {
  return {
    currency: 'KES',
    subtotal: cart.subtotal,
    deliveryTotal: cart.deliveryTotal,
    total: cart.total,
    orders: cart.orders.map((order) => ({
      seller: { id: String(order.seller._id), name: order.seller.businessName },
      items: order.lines.map((line) => ({
        productId: String(line.product._id),
        title: line.product.title,
        image: line.product.media.find((item) => item.kind === 'image')?.publicId ?? null,
        option: line.option ?? null,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        stock: line.product.stock,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
    })),
  };
}
