import type { QueryFilter } from 'mongoose';
import { dbConnect } from '@/lib/db';
import { ok, parseQuery, PUBLIC_CACHE, route } from '@/lib/http';
import { serializeProduct } from '@/lib/serializers';
import { Product, type ProductAttributes } from '@/models/Product';
import { Seller } from '@/models/Seller';
import { listProductsQuery } from '@/schemas/products';

export const GET = route(async (request) => {
  const query = parseQuery(listProductsQuery, request);
  await dbConnect();

  const filter: QueryFilter<ProductAttributes> = { status: 'active' };
  if (query.type) filter.type = query.type;
  if (query.audience) filter.audience = query.audience;
  if (query.seller) filter.sellerId = query.seller;
  if (query.q) filter.$text = { $search: query.q };
  if (query.cursor) filter._id = { $lt: query.cursor };
  // A list of IDs comes back whole, without pages.
  const limit = query.ids ? query.ids.length : query.limit;
  if (query.ids) filter._id = { $in: query.ids };

  const found = await Product.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const page = found.slice(0, limit);
  const nextCursor = found.length > limit ? String(page[page.length - 1]._id) : null;

  const sellers = await Seller.find({
    _id: { $in: page.map((product) => product.sellerId) },
    status: 'approved',
  }).lean();
  const sellerById = new Map(sellers.map((seller) => [String(seller._id), seller]));

  const data = page.flatMap((product) => {
    const seller = sellerById.get(String(product.sellerId));
    return seller ? [serializeProduct(product, seller)] : [];
  });

  return ok(data, { meta: { nextCursor }, cache: PUBLIC_CACHE });
});
