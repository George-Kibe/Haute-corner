import { dbConnect } from '@/lib/db';
import { notFound, ok, PUBLIC_CACHE, route } from '@/lib/http';
import { serializeSeller } from '@/lib/serializers';
import { isObjectId } from '@/lib/validation';
import { Seller } from '@/models/Seller';

export const GET = route<RouteContext<'/api/v1/sellers/[id]'>>(async (_request, { params }) => {
  const { id } = await params;
  if (!isObjectId(id)) throw notFound();

  await dbConnect();
  const seller = await Seller.findOne({ _id: id, status: 'approved' }).lean();
  if (!seller) throw notFound();

  return ok(serializeSeller(seller), { cache: PUBLIC_CACHE });
});
