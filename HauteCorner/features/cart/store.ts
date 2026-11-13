import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { firstImage, type Product } from '@/features/products/types';
import { zustandStorage } from '@/lib/storage';

// The same limit as the server, per line.
export const MAX_QUANTITY = 20;

// One product and size in the cart, with what was shown when it was added.
// Prices here are only for display; checkout prices everything on the server.
export type CartLine = {
  key: string;
  productId: string;
  option?: string;
  quantity: number;
  title: string;
  price: number;
  image?: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  deliveryFee: number;
};

type CartState = { lines: CartLine[] };

export const lineKey = (productId: string, option?: string) => `${productId}:${option ?? ''}`;

// Kept on the device, so the cart survives restarts and works signed out.
export const useCart = create<CartState>()(
  persist(() => ({ lines: [] as CartLine[] }), {
    name: 'cart',
    storage: createJSONStorage(() => zustandStorage),
  }),
);

const maxFor = (stock: number) => Math.max(0, Math.min(stock, MAX_QUANTITY));

// Adds one, or one more. Returns false if no more are in stock.
export function addToCart(product: Product, option?: string) {
  const key = lineKey(product.id, option);
  const { lines } = useCart.getState();
  const existing = lines.find((line) => line.key === key);
  const limit = maxFor(product.stock);
  if ((existing?.quantity ?? 0) >= limit) return false;

  const line: CartLine = {
    key,
    productId: product.id,
    option,
    quantity: (existing?.quantity ?? 0) + 1,
    title: product.title,
    price: product.price,
    image: firstImage(product)?.publicId,
    stock: product.stock,
    sellerId: product.seller.id,
    sellerName: product.seller.name,
    deliveryFee: product.seller.deliveryFee,
  };
  useCart.setState({ lines: existing ? lines.map((item) => (item.key === key ? line : item)) : [...lines, line] });
  return true;
}

export function setQuantity(key: string, quantity: number) {
  const { lines } = useCart.getState();
  useCart.setState({
    lines:
      quantity <= 0
        ? lines.filter((line) => line.key !== key)
        : lines.map((line) => (line.key === key ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY) } : line)),
  });
}

export function removeLines(keys: string[]) {
  const remove = new Set(keys);
  useCart.setState({ lines: useCart.getState().lines.filter((line) => !remove.has(line.key)) });
}

export const clearCart = () => useCart.setState({ lines: [] });

export const useCartCount = () => useCart((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));

// Lines grouped by seller, in the order sellers were first added.
export function groupBySeller(lines: CartLine[]) {
  const groups = new Map<string, { sellerId: string; sellerName: string; deliveryFee: number; lines: CartLine[] }>();
  for (const line of lines) {
    const group = groups.get(line.sellerId) ?? { sellerId: line.sellerId, sellerName: line.sellerName, deliveryFee: line.deliveryFee, lines: [] };
    group.lines.push(line);
    groups.set(line.sellerId, group);
  }
  return [...groups.values()];
}

export const toCartItems = (lines: CartLine[]) =>
  lines.map((line) => ({ productId: line.productId, quantity: line.quantity, ...(line.option ? { option: line.option } : {}) }));
