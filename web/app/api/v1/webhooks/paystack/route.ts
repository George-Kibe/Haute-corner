import { createHash } from 'node:crypto';
import { dbConnect } from '@/lib/db';
import { route } from '@/lib/http';
import { refreshPayment } from '@/lib/payments';
import { isValidWebhookSignature } from '@/lib/paystack';
import { Purchase } from '@/models/Purchase';
import { WebhookEvent } from '@/models/WebhookEvent';

const acknowledged = () => new Response(null, { status: 200 });

// Paystack events. The signature proves the sender; the payment is still
// confirmed with a verify call that checks the amount. Repeats are ignored.
export const POST = route(async (request) => {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get('x-paystack-signature'))) {
    return new Response(null, { status: 401 });
  }
  let event: { event?: string; data?: { id?: number | string; reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  await dbConnect();
  const eventId = event.data?.id !== undefined ? `${event.event}:${event.data.id}` : createHash('sha256').update(raw).digest('hex');
  try {
    await WebhookEvent.create({ provider: 'paystack', eventId, type: event.event ?? 'unknown', receivedAt: new Date() });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return acknowledged();
    throw error;
  }

  if (event.event === 'charge.success' && event.data?.reference) {
    const purchase = await Purchase.findOne({ 'payment.providerRef': event.data.reference, 'payment.provider': 'paystack' }).lean();
    if (purchase) await refreshPayment(purchase, { force: true });
  }
  await WebhookEvent.updateOne({ provider: 'paystack', eventId }, { $set: { processedAt: new Date() } });
  return acknowledged();
});
