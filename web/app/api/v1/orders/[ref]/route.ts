import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { notFound, ok, route } from '@/lib/http';
import { serializeBuyerOrder } from '@/lib/orders';
import { isRef } from '@/lib/refs';
import { Order } from '@/models/Order';

// One of the caller's orders. Anyone else's is 404.
export const GET = route<RouteContext<'/api/v1/orders/[ref]'>>(async (request, { params }) => {
  const { ref } = await params;
  await dbConnect();
  const buyer = await requireUser(request);
  if (!isRef(ref)) throw notFound();
  const order = await Order.findOne({ ref, buyerId: buyer._id }).lean();
  if (!order) throw notFound();
  return ok(serializeBuyerOrder(order));
});
