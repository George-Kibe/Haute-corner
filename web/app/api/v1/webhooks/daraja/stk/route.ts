import { isValidCallbackToken, parseStkCallback } from '@/lib/daraja';
import { dbConnect } from '@/lib/db';
import { route } from '@/lib/http';
import { refreshPayment } from '@/lib/payments';
import { Purchase } from '@/models/Purchase';
import { WebhookEvent } from '@/models/WebhookEvent';

// Safaricom expects this answer to every callback.
const accepted = () => Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });

// M-Pesa Express results. Callbacks are not signed, so the URL carries a
// secret token, and the outcome is always confirmed with a status query.
export const POST = route(async (request) => {
  if (!isValidCallbackToken(new URL(request.url).searchParams.get('token'))) return new Response(null, { status: 401 });
  const callback = parseStkCallback(await request.json().catch(() => null));
  if (!callback) return accepted();

  await dbConnect();
  const eventId = `stk:${callback.checkoutRequestId}`;
  try {
    await WebhookEvent.create({ provider: 'daraja', eventId, type: `stk:${callback.resultCode}`, receivedAt: new Date() });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return accepted();
    throw error;
  }

  const purchase = await Purchase.findOne({ 'payment.providerRef': callback.checkoutRequestId, 'payment.provider': 'daraja' }).lean();
  if (purchase) await refreshPayment(purchase, { force: true, receipt: callback.resultCode === '0' ? callback.receipt : undefined });
  await WebhookEvent.updateOne({ provider: 'daraja', eventId }, { $set: { processedAt: new Date() } });
  return accepted();
});
