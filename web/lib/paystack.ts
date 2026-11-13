import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError } from '@/lib/http';
import { site } from '@/lib/site';

// Paystack cards, on Paystack's hosted page so card numbers never reach us.
// https://paystack.com/docs/payments/accept-payments/
// Reaching the callback page proves nothing; only a verified webhook or a
// verify call confirms payment, and the amount must match.

const BASE_URL = 'https://api.paystack.co';

export const paystackConfigured = () => !!process.env.PAYSTACK_SECRET_KEY;

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new ApiError(503, 'service_unavailable', 'Card payments are not available right now');
  return key;
}

const unavailable = () => new ApiError(503, 'service_unavailable', 'Card payments are not reachable right now. Try again shortly');

// Amounts go to Paystack in cents, and come back the same way.
export const toSubunits = (shillings: number) => shillings * 100;

async function call<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; body: { status?: boolean; message?: string; data?: T } }> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw unavailable();
  }
  if (response.status >= 500) throw unavailable();
  return { ok: response.ok, body: await response.json().catch(() => ({})) };
}

// Starts a card payment and returns Paystack's page for the customer.
export async function initializeTransaction({
  amount,
  email,
  reference,
  purchaseRef,
}: {
  amount: number;
  email: string;
  reference: string;
  purchaseRef: string;
}) {
  const { ok, body } = await call<{ authorization_url: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      amount: toSubunits(amount),
      currency: 'KES',
      email,
      reference,
      channels: ['card'],
      callback_url: `${site.url}/pay/return?ref=${purchaseRef}`,
      metadata: { purchaseRef },
    }),
  });
  if (!ok || !body.data?.authorization_url) {
    throw new ApiError(502, 'payment_failed', body.message ?? 'The card payment could not be started. Try again');
  }
  return { authorizationUrl: body.data.authorization_url, reference: body.data.reference };
}

export type PaystackStatus = { state: 'paid'; amount: number; currency: string } | { state: 'pending' } | { state: 'failed'; reason: string };

// Asks Paystack for the real outcome of a transaction.
export async function verifyTransaction(reference: string): Promise<PaystackStatus> {
  const { ok, body } = await call<{ status: string; amount: number; currency: string; gateway_response?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  if (!ok || !body.data) return { state: 'pending' };
  const { status, amount, currency, gateway_response: gatewayResponse } = body.data;
  if (status === 'success') return { state: 'paid', amount, currency };
  if (status === 'failed' || status === 'reversed' || status === 'abandoned') {
    return { state: 'failed', reason: gatewayResponse || 'The card payment did not go through' };
  }
  return { state: 'pending' };
}

// Paystack signs each webhook with an HMAC SHA512 of the raw body.
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const expected = createHmac('sha512', key).update(rawBody).digest('hex');
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
