import { requireSeller } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseBody, route } from '@/lib/http';
import { serializeOwnSeller, updateSellerProfile } from '@/lib/sellers';
import { sellerProfileBody } from '@/schemas/seller';

export const GET = route(async (request) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  return ok(serializeOwnSeller(seller));
});

export const PATCH = route(async (request) => {
  await dbConnect();
  const { seller } = await requireSeller(request);
  const changes = await parseBody(sellerProfileBody, request);
  return ok(serializeOwnSeller(await updateSellerProfile(seller, changes)));
});
