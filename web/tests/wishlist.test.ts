import { Types } from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { DELETE as unsave, PUT as save } from '@/app/api/v1/me/wishlist/[productId]/route';
import { GET as getWishlist, POST as mergeWishlist } from '@/app/api/v1/me/wishlist/route';
import { GET as listProducts } from '@/app/api/v1/products/route';
import { issueAccessToken } from '@/lib/auth';
import { User } from '@/models/User';
import { createProduct, createSeller, get, noParams, params, request, resetDatabase } from './helpers';

let token: string;
let userId: Types.ObjectId;
let productIds: string[];

const savedIds = async () => (await User.findById(userId).lean())!.wishlist.map(String);
const put = (id: string, auth = token) =>
  save(request('PUT', `/api/v1/me/wishlist/${id}`, { token: auth }), params({ productId: id }));
const remove = (id: string) =>
  unsave(request('DELETE', `/api/v1/me/wishlist/${id}`, { token }), params({ productId: id }));
const merge = async (ids: string[]) => {
  const response = await mergeWishlist(request('POST', '/api/v1/me/wishlist', { token, body: { productIds: ids } }), noParams);
  return { status: response.status, body: await response.json() };
};

beforeEach(async () => {
  await resetDatabase();
  const user = await User.create({ email: 'asha@example.com' });
  userId = user._id;
  token = await issueAccessToken(user);
  const seller = await createSeller();
  const products = [];
  for (let index = 0; index < 4; index++) products.push(await createProduct(seller._id, { title: `Product ${index}` }));
  productIds = products.map((product) => String(product._id));
});

describe('saving products', () => {
  it('needs a signed-in user', async () => {
    const response = await getWishlist(request('GET', '/api/v1/me/wishlist'), noParams);

    expect(response.status).toBe(401);
  });

  it('puts the newest save first, and saving again changes nothing', async () => {
    await put(productIds[0]);
    await put(productIds[1]);
    const again = await put(productIds[0]);

    expect(again.status).toBe(204);
    expect(await savedIds()).toEqual([productIds[1], productIds[0]]);
    const response = await getWishlist(request('GET', '/api/v1/me/wishlist', { token }), noParams);
    expect((await response.json()).data).toEqual({ productIds: [productIds[1], productIds[0]] });
  });

  it('removes a product, and removing it again is fine', async () => {
    await put(productIds[0]);

    expect((await remove(productIds[0])).status).toBe(204);
    expect((await remove(productIds[0])).status).toBe(204);
    expect(await savedIds()).toEqual([]);
  });

  it('refuses a product that does not exist or is not on sale', async () => {
    const seller = await createSeller();
    const hidden = await createProduct(seller._id, { status: 'hidden' });

    expect((await put(String(new Types.ObjectId()))).status).toBe(404);
    expect((await put(String(hidden._id))).status).toBe(404);
    expect((await put('not-an-id')).status).toBe(404);
  });

  it('holds at most 200 products', async () => {
    const full = Array.from({ length: 200 }, () => new Types.ObjectId());
    await User.updateOne({ _id: userId }, { $set: { wishlist: full } });

    const response = await put(productIds[0]);

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('wishlist_full');
  });
});

describe('merging likes from before sign-in', () => {
  it('adds new likes first, keeps saved ones, and skips unknown or hidden products', async () => {
    await put(productIds[0]);
    const seller = await createSeller();
    const hidden = await createProduct(seller._id, { status: 'hidden' });
    const unknown = String(new Types.ObjectId());

    const { status, body } = await merge([productIds[2], productIds[0], unknown, String(hidden._id), productIds[1]]);

    expect(status).toBe(200);
    expect(body.data.productIds).toEqual([productIds[2], productIds[1], productIds[0]]);
    expect(await savedIds()).toEqual(body.data.productIds);
  });

  it('refuses IDs that are not valid', async () => {
    const { status } = await merge(['nope']);

    expect(status).toBe(400);
  });
});

describe('GET /products?ids=', () => {
  it('returns the products on sale among the IDs, in one page', async () => {
    const seller = await createSeller();
    const hidden = await createProduct(seller._id, { status: 'hidden' });
    const ids = [productIds[0], productIds[3], String(hidden._id)].join(',');

    const response = await listProducts(get(`/api/v1/products?ids=${ids}`), noParams);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((product: { id: string }) => product.id).sort()).toEqual([productIds[0], productIds[3]].sort());
    expect(body.meta.nextCursor).toBeNull();
  });

  it('refuses a malformed or overlong list', async () => {
    const tooMany = Array.from({ length: 201 }, () => String(new Types.ObjectId())).join(',');

    expect((await listProducts(get('/api/v1/products?ids=abc'), noParams)).status).toBe(400);
    expect((await listProducts(get(`/api/v1/products?ids=${tooMany}`), noParams)).status).toBe(400);
  });
});
