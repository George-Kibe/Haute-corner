import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { notFound, ok, route } from '@/lib/http';
import { serializePurchase } from '@/lib/orders';
import { expireReservations, refreshPayment } from '@/lib/payments';
import { isRef } from '@/lib/refs';
import { Order } from '@/models/Order';
import { Purchase } from '@/models/Purchase';

// The app polls this after asking for payment. Each call may check with the
// provider, at most every few seconds, so a lost callback does not leave the
// buyer waiting.
export const GET = route<RouteContext<'/api/v1/purchases/[ref]'>>(async (request, { params }) => {
  const { ref } = await params;
  await dbConnect();
  const buyer = await requireUser(request);
  if (!isRef(ref)) throw notFound();

  const found = await Purchase.findOne({ ref, buyerId: buyer._id }).lean();
  if (!found) throw notFound();
  let purchase = await refreshPayment(found);
  if (purchase.payment.status !== 'paid' && purchase.reservedUntil < new Date()) {
    await expireReservations({ limit: 5 });
    purchase = (await Purchase.findById(purchase._id).lean())!;
  }
  const orders = await Order.find({ purchaseId: purchase._id }).sort({ _id: 1 }).lean();
  return ok(serializePurchase(purchase, orders));
});
