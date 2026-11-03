import { Types } from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Product, type ProductAttributes } from '@/models/Product';
import { Seller, type SellerAttributes } from '@/models/Seller';
import { Session } from '@/models/Session';
import { User } from '@/models/User';

export async function resetDatabase() {
  await dbConnect();
  await Promise.all([Product.init(), Seller.init(), User.init(), Session.init()]);
  await Promise.all([Product.deleteMany({}), Seller.deleteMany({}), User.deleteMany({}), Session.deleteMany({})]);
}

export function createSeller(overrides: Partial<SellerAttributes> = {}) {
  return Seller.create({
    userId: new Types.ObjectId(),
    status: 'approved',
    businessName: 'Nairobi Soles',
    phone: '+254700000001',
    payoutMpesaNumber: '+254700000002',
    deliveryFee: 250,
    deliveryAreas: 'Nairobi',
    documents: [{ kind: 'id', publicId: 'private/id-card' }],
    ...overrides,
  });
}

export function createProduct(sellerId: Types.ObjectId, overrides: Partial<ProductAttributes> = {}) {
  return Product.create({
    sellerId,
    title: 'Leather ankle boots',
    description: 'Hand-finished leather boots.',
    type: 'shoes',
    audience: 'women',
    price: 4800,
    media: [{ kind: 'image', publicId: 'samples/shoe' }],
    options: ['38', '39'],
    stock: 5,
    ...overrides,
  });
}

export const get = (path: string) => new Request(`http://localhost${path}`);

export const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

export function request(method: string, path: string, { body, token }: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export const noParams = { params: Promise.resolve({}) };
