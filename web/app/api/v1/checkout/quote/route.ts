import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { priceCart, serializeQuote } from '@/lib/pricing';
import { quoteBody } from '@/schemas/checkout';

// Prices a cart with no side effects: nothing is reserved or created.
export const POST = route(async (request) => {
  await dbConnect();
  await requireUser(request);
  const { items } = await parseBody(quoteBody, request);
  return ok(serializeQuote(await priceCart(items)));
});
