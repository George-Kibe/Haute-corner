import { requireSeller } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { noContent, ok, parseBody, route } from '@/lib/http';
import { archiveListing, findOwnProduct, serializeOwnProduct, updateListing } from '@/lib/listings';
import { updateProductBody } from '@/schemas/seller';

type Context = RouteContext<'/api/v1/seller/products/[id]'>;

export const GET = route<Context>(async (request, { params }) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  const product = await findOwnProduct(seller, (await params).id);
  return ok(serializeOwnProduct(product, seller));
});

export const PATCH = route<Context>(async (request, { params }) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  const changes = await parseBody(updateProductBody, request);
  const product = await updateListing(seller, (await params).id, changes);
  return ok(serializeOwnProduct(product, seller));
});

// Archives the listing. Past orders keep their own copy of it.
export const DELETE = route<Context>(async (request, { params }) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  await archiveListing(seller, (await params).id);
  return noContent();
});
