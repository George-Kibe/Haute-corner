import { addToCart, clearCart, groupBySeller, lineKey, removeLines, setQuantity, toCartItems, useCart } from '@/features/cart/store';
import type { Product } from '@/features/products/types';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    title: 'Boots',
    description: 'Leather',
    type: 'shoes',
    audience: 'women',
    price: 4800,
    currency: 'KES',
    media: [{ kind: 'image', publicId: 'boots' }],
    options: ['39', '40'],
    stock: 2,
    status: 'active',
    seller: { id: 's1', name: 'Nairobi Soles', deliveryFee: 250 },
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

const lines = () => useCart.getState().lines;

beforeEach(clearCart);

describe('the cart', () => {
  it('keeps each size as its own line, and adds to a line already there', () => {
    addToCart(product(), '39');
    addToCart(product(), '39');
    addToCart(product(), '40');

    expect(lines().map((line) => [line.key, line.quantity])).toEqual([
      ['p1:39', 2],
      ['p1:40', 1],
    ]);
    expect(lines()[0]).toMatchObject({ image: 'boots', sellerName: 'Nairobi Soles', deliveryFee: 250 });
  });

  it('stops at the stock shown on the product', () => {
    expect(addToCart(product({ stock: 1 }), '39')).toBe(true);
    expect(addToCart(product({ stock: 1 }), '39')).toBe(false);
    expect(addToCart(product({ id: 'p2', stock: 0, options: [] }))).toBe(false);
    expect(lines()).toHaveLength(1);
  });

  it('changes and removes lines', () => {
    addToCart(product(), '39');
    addToCart(product({ id: 'p2', options: [] }));

    setQuantity(lineKey('p1', '39'), 3);
    expect(lines()[0].quantity).toBe(3);
    setQuantity(lineKey('p1', '39'), 0);
    expect(lines().map((line) => line.key)).toEqual(['p2:']);
    removeLines(['p2:']);
    expect(lines()).toEqual([]);
  });

  it('groups by seller in the order they were added, and sends only IDs, sizes and quantities', () => {
    addToCart(product({ id: 'a', options: [] }));
    addToCart(product({ id: 'b', options: [], seller: { id: 's2', name: 'Kilimani Threads', deliveryFee: 300 } }));
    addToCart(product({ id: 'c' }), '40');

    expect(groupBySeller(lines()).map((group) => [group.sellerName, group.lines.map((line) => line.productId)])).toEqual([
      ['Nairobi Soles', ['a', 'c']],
      ['Kilimani Threads', ['b']],
    ]);
    expect(toCartItems(lines())).toEqual([
      { productId: 'a', quantity: 1 },
      { productId: 'b', quantity: 1 },
      { productId: 'c', quantity: 1, option: '40' },
    ]);
  });
});
