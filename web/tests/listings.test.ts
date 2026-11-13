import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE as archive, GET as getOwn, PATCH as patch } from '@/app/api/v1/seller/products/[id]/route';
import { GET as listOwn, POST as create } from '@/app/api/v1/seller/products/route';
import { GET as listPublic } from '@/app/api/v1/products/route';
import { Product } from '@/models/Product';
import { createProduct, createSellerAccount, fakeCloudinary, get, noParams, params, request, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterEach(() => vi.unstubAllGlobals());

const json = async (response: Response) => ({ status: response.status, body: await response.json().catch(() => null) });
const folder = (sellerId: unknown) => `hautecorner/sellers/${sellerId}/products`;

function listing(sellerId: unknown, overrides: Record<string, unknown> = {}) {
  return {
    title: 'Canvas high-tops',
    description: 'Hand-stitched canvas with a rubber sole.',
    type: 'shoes',
    audience: 'unisex',
    price: 3500,
    stock: 4,
    options: ['40', '41', '42'],
    media: [
      { kind: 'image', publicId: `${folder(sellerId)}/front` },
      { kind: 'video', publicId: `${folder(sellerId)}/turn` },
    ],
    ...overrides,
  };
}

const post = (token: string, body: unknown) => create(request('POST', '/api/v1/seller/products', { token, body }), noParams);
const update = (token: string, id: string, body: unknown) =>
  patch(request('PATCH', `/api/v1/seller/products/${id}`, { token, body }), params({ id }));

describe('POST /seller/products', () => {
  it('creates a listing with media details read from Cloudinary, not from the app', async () => {
    const { seller, token } = await createSellerAccount();
    fakeCloudinary({
      [`${folder(seller._id)}/front`]: { width: 1600, height: 2000 },
      [`${folder(seller._id)}/turn`]: { resourceType: 'video', duration: 21.6, width: 720, height: 1280 },
    });

    const { status, body } = await json(await post(token, listing(seller._id)));

    expect(status).toBe(201);
    expect(body.data).toMatchObject({ title: 'Canvas high-tops', price: 3500, status: 'active', removedReason: null });
    expect(body.data.media).toEqual([
      { kind: 'image', publicId: `${folder(seller._id)}/front`, width: 1600, height: 2000 },
      { kind: 'video', publicId: `${folder(seller._id)}/turn`, width: 720, height: 1280, durationSeconds: 22 },
    ]);
    const shown = await json(await listPublic(get('/api/v1/products'), noParams));
    expect(shown.body.data.map((product: { id: string }) => product.id)).toEqual([body.data.id]);
  });

  it('refuses a video over 30 seconds or 100 MB', async () => {
    const { seller, token } = await createSellerAccount();
    const assets = { [`${folder(seller._id)}/front`]: {} };

    fakeCloudinary({ ...assets, [`${folder(seller._id)}/turn`]: { resourceType: 'video', duration: 31 } });
    const long = await json(await post(token, listing(seller._id)));
    expect(long.status).toBe(400);
    expect(long.body.error.details.media).toBe('The video must be 30 seconds or shorter');

    fakeCloudinary({ ...assets, [`${folder(seller._id)}/turn`]: { resourceType: 'video', duration: 10, bytes: 100_000_001 } });
    expect((await post(token, listing(seller._id))).status).toBe(400);
    expect(await Product.countDocuments()).toBe(0);
  });

  it('refuses media from another seller’s folder, or that was never uploaded', async () => {
    const { seller, token } = await createSellerAccount();
    const other = await createSellerAccount();
    fakeCloudinary({ [`${folder(other.seller._id)}/front`]: {} });

    const foreign = listing(seller._id, { media: [{ kind: 'image', publicId: `${folder(other.seller._id)}/front` }] });
    const missing = listing(seller._id, { media: [{ kind: 'image', publicId: `${folder(seller._id)}/never` }] });

    expect((await post(token, foreign)).status).toBe(400);
    expect((await post(token, missing)).status).toBe(400);
  });

  it('needs a photo, and allows at most one video and ten photos', async () => {
    const { seller, token } = await createSellerAccount();
    const video = (name: string) => ({ kind: 'video', publicId: `${folder(seller._id)}/${name}` });
    const image = (name: string) => ({ kind: 'image', publicId: `${folder(seller._id)}/${name}` });

    expect((await post(token, listing(seller._id, { media: [video('a')] }))).status).toBe(400);
    expect((await post(token, listing(seller._id, { media: [image('a'), video('b'), video('c')] }))).status).toBe(400);
    const eleven = Array.from({ length: 11 }, (_, index) => image(String(index)));
    expect((await post(token, listing(seller._id, { media: eleven }))).status).toBe(400);
  });

  it('ignores nothing it was sent: unknown fields such as status or sellerId are refused', async () => {
    const { seller, token } = await createSellerAccount();
    const other = await createSellerAccount();

    expect((await post(token, listing(seller._id, { status: 'removed' }))).status).toBe(400);
    expect((await post(token, listing(seller._id, { sellerId: String(other.seller._id) }))).status).toBe(400);
  });

  it('is only for approved sellers', async () => {
    const pending = await createSellerAccount({ status: 'applied' });
    expect((await post(pending.token, listing(pending.seller._id))).status).toBe(403);
  });
});

describe('a seller’s own listings', () => {
  it('lists only the seller’s products, including archived and removed ones', async () => {
    const { seller, token } = await createSellerAccount();
    const other = await createSellerAccount();
    const mine = await createProduct(seller._id);
    const archived = await createProduct(seller._id, { status: 'archived' });
    const removed = await createProduct(seller._id, { status: 'removed', removedReason: 'Counterfeit' });
    await createProduct(other.seller._id);

    const { body } = await json(await listOwn(request('GET', '/api/v1/seller/products', { token }), noParams));

    expect(body.data.map((product: { id: string }) => product.id)).toEqual([removed, archived, mine].map((product) => String(product._id)));
    expect(body.data[0].removedReason).toBe('Counterfeit');
  });

  it('cannot read, change or archive another seller’s product', async () => {
    const { token } = await createSellerAccount();
    const other = await createSellerAccount();
    const theirs = await createProduct(other.seller._id);
    const id = String(theirs._id);

    expect((await getOwn(request('GET', `/api/v1/seller/products/${id}`, { token }), params({ id }))).status).toBe(404);
    expect((await update(token, id, { price: 1 })).status).toBe(404);
    expect((await archive(request('DELETE', `/api/v1/seller/products/${id}`, { token }), params({ id }))).status).toBe(404);
    expect((await Product.findById(id).lean())!).toMatchObject({ price: 4800, status: 'active' });
  });

  it('edits fields and keeps media checked earlier without asking Cloudinary again', async () => {
    const { seller, token } = await createSellerAccount();
    const product = await createProduct(seller._id, { media: [{ kind: 'image', publicId: `${folder(seller._id)}/old`, width: 10, height: 10 }] });
    const fetchMock = fakeCloudinary({ [`${folder(seller._id)}/new`]: { width: 800, height: 600 } });

    const { status, body } = await json(
      await update(token, String(product._id), {
        price: 4200,
        media: [
          { kind: 'image', publicId: `${folder(seller._id)}/new` },
          { kind: 'image', publicId: `${folder(seller._id)}/old` },
        ],
      }),
    );

    expect(status).toBe(200);
    expect(body.data.price).toBe(4200);
    expect(body.data.media.map((item: { width: number }) => item.width)).toEqual([800, 10]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('archives and restores a listing, but cannot touch one an admin removed', async () => {
    const { seller, token } = await createSellerAccount();
    const product = await createProduct(seller._id);
    const removed = await createProduct(seller._id, { status: 'removed', removedReason: 'Fake' });
    const id = String(product._id);

    const archived = await archive(request('DELETE', `/api/v1/seller/products/${id}`, { token }), params({ id }));
    expect(archived.status).toBe(204);
    expect((await Product.findById(id).lean())!.status).toBe('archived');

    expect((await json(await update(token, id, { status: 'active' }))).body.data.status).toBe('active');
    expect((await update(token, String(removed._id), { status: 'active' })).status).toBe(409);
    expect((await update(token, id, { status: 'removed' })).status).toBe(400);
    expect((await update(token, id, { status: 'hidden' })).status).toBe(400);
  });

  it('returns 404 for an unknown or malformed ID', async () => {
    const { token } = await createSellerAccount();
    const unknown = String(new Types.ObjectId());
    expect((await update(token, unknown, { price: 1 })).status).toBe(404);
    expect((await update(token, 'nope', { price: 1 })).status).toBe(404);
  });
});
