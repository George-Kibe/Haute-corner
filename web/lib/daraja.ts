import { ApiError } from '@/lib/http';
import { site } from '@/lib/site';

// Safaricom Daraja: M-Pesa Express (STK Push) and its status query.
// Sandbox: https://developer.safaricom.co.ke. The callback carries no
// signature, so it is only a hint: payment is confirmed with a status query.

type DarajaConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackToken: string;
  transactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
};

export function darajaConfigured() {
  return ['DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET', 'DARAJA_SHORTCODE', 'DARAJA_PASSKEY', 'DARAJA_CALLBACK_TOKEN'].every(
    (name) => process.env[name],
  );
}

function config(): DarajaConfig {
  if (!darajaConfigured()) throw new ApiError(503, 'service_unavailable', 'M-Pesa payments are not available right now');
  return {
    baseUrl: process.env.DARAJA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
    consumerKey: process.env.DARAJA_CONSUMER_KEY!,
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
    shortcode: process.env.DARAJA_SHORTCODE!,
    passkey: process.env.DARAJA_PASSKEY!,
    callbackToken: process.env.DARAJA_CALLBACK_TOKEN!,
    transactionType: process.env.DARAJA_TRANSACTION_TYPE === 'CustomerBuyGoodsOnline' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
  };
}

const unavailable = () => new ApiError(503, 'service_unavailable', 'M-Pesa is not reachable right now. Try again shortly');

let token: { value: string; expiresAt: number } | undefined;

async function accessToken(settings: DarajaConfig) {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const basic = Buffer.from(`${settings.consumerKey}:${settings.consumerSecret}`).toString('base64');
  let response: Response;
  try {
    response = await fetch(`${settings.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basic}` },
      cache: 'no-store',
    });
  } catch {
    throw unavailable();
  }
  if (!response.ok) throw unavailable();
  const body = (await response.json()) as { access_token: string; expires_in: string | number };
  token = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in) * 1000 };
  return token.value;
}

export function resetDarajaToken() {
  token = undefined;
}

// Daraja wants the time in Nairobi as yyyyMMddHHmmss.
export function darajaTimestamp(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

const password = (settings: DarajaConfig, timestamp: string) =>
  Buffer.from(`${settings.shortcode}${settings.passkey}${timestamp}`).toString('base64');

// +254712345678 becomes 254712345678.
const msisdn = (phone: string) => phone.replace(/^\+/, '');

export const stkCallbackUrl = (settings = config()) =>
  `${site.url}/api/v1/webhooks/daraja/stk?token=${encodeURIComponent(settings.callbackToken)}`;

export function isValidCallbackToken(value: string | null) {
  const expected = process.env.DARAJA_CALLBACK_TOKEN;
  if (!expected || !value || value.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < value.length; index++) difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

async function post<T>(path: string, body: unknown, settings: DarajaConfig): Promise<{ ok: boolean; body: T }> {
  const bearer = await accessToken(settings);
  let response: Response;
  try {
    response = await fetch(`${settings.baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw unavailable();
  }
  if (response.status === 401) resetDarajaToken();
  const parsed = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, body: parsed };
}

// Sends the PIN prompt to the customer's phone. Returns the CheckoutRequestID
// that the callback and status query refer to.
export async function stkPush({ amount, phone, reference }: { amount: number; phone: string; reference: string }) {
  const settings = config();
  const timestamp = darajaTimestamp();
  const { ok, body } = await post<{
    ResponseCode?: string;
    CheckoutRequestID?: string;
    errorMessage?: string;
  }>(
    '/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: settings.shortcode,
      Password: password(settings, timestamp),
      Timestamp: timestamp,
      TransactionType: settings.transactionType,
      Amount: amount,
      PartyA: msisdn(phone),
      PartyB: settings.shortcode,
      PhoneNumber: msisdn(phone),
      CallBackURL: stkCallbackUrl(settings),
      AccountReference: reference.slice(0, 12),
      TransactionDesc: 'HauteCorner',
    },
    settings,
  );
  if (!ok || body.ResponseCode !== '0' || !body.CheckoutRequestID) {
    throw new ApiError(502, 'payment_failed', body.errorMessage ?? 'M-Pesa could not send the payment request. Try again');
  }
  return { checkoutRequestId: body.CheckoutRequestID };
}

export type StkStatus = { state: 'paid' } | { state: 'pending' } | { state: 'failed'; reason: string };

// Result codes Safaricom documents for STK Push.
const FAILURE_REASONS: Record<string, string> = {
  '1': 'Your M-Pesa balance was not enough',
  '1032': 'The payment was cancelled on the phone',
  '1037': 'The phone could not be reached, or the request timed out',
  '2001': 'The M-Pesa PIN was wrong',
  '1025': 'M-Pesa could not send the prompt. Try again',
  '1019': 'The payment request expired',
};

// Asks Safaricom for the real outcome of a payment request.
export async function stkQuery(checkoutRequestId: string): Promise<StkStatus> {
  const settings = config();
  const timestamp = darajaTimestamp();
  const { body } = await post<{ ResultCode?: string | number; ResultDesc?: string; errorCode?: string }>(
    '/mpesa/stkpushquery/v1/query',
    { BusinessShortCode: settings.shortcode, Password: password(settings, timestamp), Timestamp: timestamp, CheckoutRequestID: checkoutRequestId },
    settings,
  );
  // Still waiting for the customer: Daraja answers with an error code instead of a result.
  if (body.ResultCode === undefined) return { state: 'pending' };
  const code = String(body.ResultCode);
  if (code === '0') return { state: 'paid' };
  return { state: 'failed', reason: FAILURE_REASONS[code] ?? body.ResultDesc ?? 'The M-Pesa payment did not go through' };
}

export type StkCallback = {
  checkoutRequestId: string;
  resultCode: string;
  receipt?: string;
  amount?: number;
};

// Reads the callback body. Returns null if it is not an STK callback.
export function parseStkCallback(body: unknown): StkCallback | null {
  const callback = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!callback || typeof callback.CheckoutRequestID !== 'string') return null;
  const items = ((callback.CallbackMetadata as { Item?: { Name: string; Value?: unknown }[] })?.Item ?? []).filter(Boolean);
  const value = (name: string) => items.find((item) => item.Name === name)?.Value;
  return {
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: String(callback.ResultCode),
    receipt: typeof value('MpesaReceiptNumber') === 'string' ? (value('MpesaReceiptNumber') as string) : undefined,
    amount: typeof value('Amount') === 'number' ? (value('Amount') as number) : undefined,
  };
}
