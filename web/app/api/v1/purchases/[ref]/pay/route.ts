import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { notFound, ok, parseBody, route } from '@/lib/http';
import { serializePurchase } from '@/lib/orders';
import { startPayment } from '@/lib/payments';
import { isRef } from '@/lib/refs';
import { Order } from '@/models/Order';
import { Purchase } from '@/models/Purchase';
import { payAgainBody } from '@/schemas/checkout';

// Tries payment again while the items are still held, optionally with a
// different method or M-Pesa number.
export const POST = route<RouteContext<'/api/v1/purchases/[ref]/pay'>>(async (request, { params }) => {
  const { ref } = await params;
  await dbConnect();
  const buyer = await requireUser(request);
  const { payment } = await parseBody(payAgainBody, request);
  if (!isRef(ref)) throw notFound();

  const purchase = await Purchase.findOne({ ref, buyerId: buyer._id }).lean();
  if (!purchase) throw notFound();
  const updated = await startPayment(purchase, buyer, payment);
  const orders = await Order.find({ purchaseId: purchase._id }).sort({ _id: 1 }).lean();
  return ok(serializePurchase(updated, orders));
});
