import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { noContent, notFound, route } from '@/lib/http';
import { isObjectId } from '@/lib/validation';
import { removeProduct, saveProduct } from '@/lib/wishlist';

type Context = RouteContext<'/api/v1/me/wishlist/[productId]'>;

export const PUT = route<Context>(async (request, { params }) => {
  const { productId } = await params;
  await dbConnect();
  const user = await requireUser(request);
  if (!isObjectId(productId)) throw notFound();

  await saveProduct(user._id, productId);
  return noContent();
});

export const DELETE = route<Context>(async (request, { params }) => {
  const { productId } = await params;
  await dbConnect();
  const user = await requireUser(request);
  if (!isObjectId(productId)) throw notFound();

  await removeProduct(user._id, productId);
  return noContent();
});
