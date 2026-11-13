import type { QueryFilter } from 'mongoose';
import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ok, parseQuery, route } from '@/lib/http';
import { serializeBuyerOrder } from '@/lib/orders';
import { Order, type OrderAttributes } from '@/models/Order';
import { listOrdersQuery } from '@/schemas/checkout';

// The caller's orders, newest first. Orders still waiting for payment are on
// their purchase instead.
export const GET = route(async (request) => {
  await dbConnect();
  const buyer = await requireUser(request);
  const query = parseQuery(listOrdersQuery, request);

  const filter: QueryFilter<OrderAttributes> = { buyerId: buyer._id, status: { $ne: 'awaiting_payment' } };
  if (query.cursor) filter._id = { $lt: query.cursor };
  const found = await Order.find(filter).sort({ _id: -1 }).limit(query.limit + 1).lean();
  const page = found.slice(0, query.limit);
  const nextCursor = found.length > query.limit ? String(page[page.length - 1]._id) : null;
  return ok(page.map(serializeBuyerOrder), { meta: { nextCursor } });
});
