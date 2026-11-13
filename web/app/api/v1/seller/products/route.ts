import { requireSeller } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, parseQuery, route } from '@/lib/http';
import { createListing, listOwnProducts, serializeOwnProduct } from '@/lib/listings';
import { createProductBody, sellerProductsQuery } from '@/schemas/seller';

export const GET = route(async (request) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  const query = parseQuery(sellerProductsQuery, request);
  const { data, nextCursor } = await listOwnProducts(seller, query);
  return ok(data, { meta: { nextCursor } });
});

export const POST = route(async (request) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  const body = await parseBody(createProductBody, request);
  const product = await createListing(seller, body);
  return ok(serializeOwnProduct(product, seller), { status: 201 });
});
