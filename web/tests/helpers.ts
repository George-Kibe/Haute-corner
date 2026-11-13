import { Types } from 'mongoose';
import { vi } from 'vitest';
import { issueAccessToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { LedgerEntry } from '@/models/LedgerEntry';
import { Order } from '@/models/Order';
import { Purchase } from '@/models/Purchase';
import { Report } from '@/models/Report';
import { WebhookEvent } from '@/models/WebhookEvent';
import { Product, type ProductAttributes } from '@/models/Product';
import { Seller, type SellerAttributes } from '@/models/Seller';
import { sentEmails } from '@/lib/mail';
import { EmailCode } from '@/models/EmailCode';
import { RateLimit } from '@/models/RateLimit';
import { Session } from '@/models/Session';
import { User } from '@/models/User';

export async function resetDatabase() {
  await dbConnect();
  const models = [Product, Seller, User, Session, EmailCode, RateLimit, AuditLog, Report, Purchase, Order, LedgerEntry, WebhookEvent];
  for (const model of models) {
    await (model as typeof Product).init();
    // Through the driver, because the ledger refuses deletes through Mongoose.
    await (model as typeof Product).collection.deleteMany({});
  }
  sentEmails.length = 0;
}

// The code in the last email sent to an address.
export function lastCodeSentTo(email: string) {
  const message = sentEmails.findLast((sent) => sent.to === email);
  return message?.subject.match(/^(\d{6}) /)?.[1];
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
    documents: [{ kind: 'national_id', publicId: 'hautecorner/applications/u1/id', format: 'jpg' }],
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

// A signed-in user and their access token.
export async function createUser(overrides: Record<string, unknown> = {}) {
  const user = await User.create({ email: `user${new Types.ObjectId()}@example.com`, name: 'Asha Otieno', ...overrides });
  return { user, token: await issueAccessToken(user) };
}

// An approved seller with an account that can sign in.
export async function createSellerAccount(overrides: Partial<SellerAttributes> = {}) {
  const { user, token } = await createUser();
  const seller = await createSeller({ userId: user._id, ...overrides });
  return { user, seller, token };
}

type FakeAsset = { resourceType?: 'image' | 'video'; type?: string; format?: string; bytes?: number; width?: number; height?: number; duration?: number };

// Stands in for Cloudinary's Admin API. Assets not listed are 404.
export function fakeCloudinary(assets: Record<string, FakeAsset>) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const match = url.pathname.match(/^\/v1_1\/[^/]+\/resources\/(image|video)\/(upload|private)\/(.+)$/);
    const publicId = match ? decodeURIComponent(match[3]) : '';
    const asset = assets[publicId];
    if (!match || !asset || (asset.resourceType ?? 'image') !== match[1] || (asset.type ?? 'upload') !== match[2]) {
      return Response.json({ error: { message: 'Not found' } }, { status: 404 });
    }
    return Response.json({
      public_id: publicId,
      resource_type: match[1],
      type: match[2],
      format: asset.format ?? (match[1] === 'video' ? 'mp4' : 'jpg'),
      bytes: asset.bytes ?? 1000,
      width: asset.width ?? 1200,
      height: asset.height ?? 1200,
      ...(match[1] === 'video' && { duration: asset.duration ?? 12 }),
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
