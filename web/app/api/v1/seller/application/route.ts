import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { notFound, ok, parseBody, route } from '@/lib/http';
import { applyToSell, serializeOwnSeller } from '@/lib/sellers';
import { Seller } from '@/models/Seller';
import { applicationBody } from '@/schemas/seller';

export const GET = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  const seller = await Seller.findOne({ userId: user._id }).lean();
  if (!seller) throw notFound();
  return ok(serializeOwnSeller(seller));
});

export const POST = route(async (request) => {
  await dbConnect();
  const user = await requireUser(request);
  const body = await parseBody(applicationBody, request);
  const seller = await applyToSell(user, body);
  return ok(serializeOwnSeller(seller), { status: 201 });
});
