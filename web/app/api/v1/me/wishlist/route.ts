import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { mergeProducts, wishlistIds } from '@/lib/wishlist';
import { mergeWishlistBody } from '@/schemas/wishlist';

// The saved product IDs, newest first. The app loads the products themselves
// from GET /products?ids=, which works signed in or not.
export const GET = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  return ok({ productIds: await wishlistIds(user._id) });
});

// Merges likes made on the device before signing in, and returns the whole list.
export const POST = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  const { productIds } = await parseBody(mergeWishlistBody, request);
  return ok({ productIds: await mergeProducts(user._id, productIds) });
});
