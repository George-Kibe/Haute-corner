import { Types } from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { GET as getProduct } from '@/app/api/v1/products/[id]/route';
import { GET as listProducts } from '@/app/api/v1/products/route';
import { createProduct, createSeller, get, params, resetDatabase } from './helpers';

const list = async (query = '') => {
  const response = await listProducts(get(`/api/v1/products${query}`), undefined);
  return { response, body: await response.json() };
};

beforeEach(resetDatabase);

describe('GET /products', () => {
  it('returns active products with their seller, newest first', async () => {
    const seller = await createSeller();
    const older = await createProduct(seller._id, { title: 'Older' });
    const newer = await createProduct(seller._id, { title: 'Newer' });

    const { response, body } = await list();

    expect(response.status).toBe(200);
    expect(body.data.map((product: { id: string }) => product.id)).toEqual([String(newer._id), String(older._id)]);
    expect(body.meta).toEqual({ nextCursor: null });
    expect(body.data[0]).toMatchObject({
      title: 'Newer',
      price: 4800,
      currency: 'KES',
      seller: { id: String(seller._id), name: 'Nairobi Soles', deliveryFee: 250 },
    });
  });

  it('allows the CDN to cache public results', async () => {
    const { response } = await list();
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
  });

  it.each(['archived', 'removed', 'hidden'] as const)('leaves out %s products', async (status) => {
    const seller = await createSeller();
    await createProduct(seller._id, { status });

    const { body } = await list();

    expect(body.data).toEqual([]);
  });

  it('leaves out products from sellers who are not approved', async () => {
    const suspended = await createSeller({ status: 'suspended', businessName: 'Suspended' });
    await createProduct(suspended._id);

    const { body } = await list();

    expect(body.data).toEqual([]);
  });

  it('never exposes private seller details', async () => {
    const seller = await createSeller();
    await createProduct(seller._id);

    const { body } = await list();
    const text = JSON.stringify(body);

    expect(text).not.toContain('+254700000001');
    expect(text).not.toContain('+254700000002');
    expect(text).not.toContain('private/id-card');
    expect(text).not.toContain('userId');
  });

  it('filters by type, audience and seller', async () => {
    const first = await createSeller();
    const second = await createSeller({ businessName: 'Kilimani Threads' });
    await createProduct(first._id, { title: 'Boots', type: 'shoes', audience: 'women' });
    await createProduct(first._id, { title: 'Loafers', type: 'shoes', audience: 'men' });
    await createProduct(second._id, { title: 'Dress', type: 'clothing', audience: 'women' });

    const titles = async (query: string) =>
      (await list(query)).body.data.map((product: { title: string }) => product.title);

    expect(await titles('?type=clothing')).toEqual(['Dress']);
    expect(await titles('?audience=men')).toEqual(['Loafers']);
    expect(await titles('?type=shoes&audience=women')).toEqual(['Boots']);
    expect(await titles(`?seller=${second._id}`)).toEqual(['Dress']);
  });

  it('searches titles and descriptions', async () => {
    const seller = await createSeller();
    await createProduct(seller._id, { title: 'Canvas sneakers', description: 'Light everyday shoes.' });
    await createProduct(seller._id, { title: 'Evening dress', description: 'Royal blue silk.' });

    const { body: byTitle } = await list('?q=sneakers');
    const { body: byDescription } = await list('?q=silk');
    const { body: noMatch } = await list('?q=umbrella');

    expect(byTitle.data.map((product: { title: string }) => product.title)).toEqual(['Canvas sneakers']);
    expect(byDescription.data.map((product: { title: string }) => product.title)).toEqual(['Evening dress']);
    expect(noMatch.data).toEqual([]);
  });

  it('pages through every product exactly once', async () => {
    const seller = await createSeller();
    const created = [];
    for (let index = 0; index < 5; index += 1) {
      created.push(String((await createProduct(seller._id, { title: `Item ${index}` }))._id));
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const { body }: { body: { data: { id: string }[]; meta: { nextCursor: string | null } } } = await list(
        `?limit=2${cursor ? `&cursor=${cursor}` : ''}`,
      );
      seen.push(...body.data.map((product) => product.id));
      cursor = body.meta.nextCursor;
      pages += 1;
    } while (cursor);

    expect(pages).toBe(3);
    expect(seen).toEqual([...created].reverse());
  });

  it.each([
    ['?type=hats', 'type'],
    ['?audience=pets', 'audience'],
    ['?limit=0', 'limit'],
    ['?limit=51', 'limit'],
    ['?cursor=not-an-id', 'cursor'],
    ['?seller=not-an-id', 'seller'],
  ])('rejects %s', async (query, field) => {
    const { response, body } = await list(query);

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('validation_failed');
    expect(body.error.details).toHaveProperty(field);
  });

  it('treats query operators as plain text', async () => {
    const seller = await createSeller();
    await createProduct(seller._id);

    const { response, body } = await list(`?q=${encodeURIComponent('{"$ne":null}')}`);

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});

describe('GET /products/{id}', () => {
  const fetchProduct = (id: string) => getProduct(get(`/api/v1/products/${id}`), params({ id }));

  it('returns an active product', async () => {
    const seller = await createSeller();
    const product = await createProduct(seller._id);

    const response = await fetchProduct(String(product._id));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ id: String(product._id), seller: { name: 'Nairobi Soles' } });
    expect(JSON.stringify(body)).not.toContain('+254700000002');
  });

  it.each([
    ['a malformed ID', async () => 'not-an-id'],
    ['an unknown ID', async () => String(new Types.ObjectId())],
    [
      'an archived product',
      async () => String((await createProduct((await createSeller())._id, { status: 'archived' }))._id),
    ],
    [
      'a suspended seller',
      async () => String((await createProduct((await createSeller({ status: 'suspended' }))._id))._id),
    ],
  ])('returns 404 for %s', async (_name, makeId) => {
    const response = await fetchProduct(await makeId());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });
});
