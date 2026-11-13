import { requireUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { ApiError, ok, parseBody, route } from '@/lib/http';
import { serializePurchase } from '@/lib/orders';
import { createPurchase, startPayment } from '@/lib/payments';
import { LIMITS, rateLimit } from '@/lib/rate-limit';
import { Order } from '@/models/Order';
import { checkoutBody, idempotencyKey } from '@/schemas/checkout';

// Creates the purchase and its orders, reserves stock and starts payment.
// Repeating it with the same Idempotency-Key returns the same purchase.
export const POST = route(async (request) => {
  await dbConnect();
  const buyer = await requireUser(request);
  const key = idempotencyKey.safeParse(request.headers.get('idempotency-key') ?? undefined);
  if (!key.success) throw new ApiError(400, 'validation_failed', key.error.issues[0].message);
  const body = await parseBody(checkoutBody, request);
  await rateLimit('checkouts:user', String(buyer._id), LIMITS.checkoutsPerUser);

  const { purchase: createdPurchase, created } = await createPurchase(buyer, body, key.data);
  const purchase = created ? await startPayment(createdPurchase, buyer) : createdPurchase;
  const orders = await Order.find({ purchaseId: purchase._id }).sort({ _id: 1 }).lean();
  return ok(serializePurchase(purchase, orders), { status: created ? 201 : 200 });
});
