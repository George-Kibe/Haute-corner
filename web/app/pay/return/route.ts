import { isRef } from '@/lib/refs';

// Paystack sends the browser here after the card page. It proves nothing about
// payment; it only returns the buyer to the app, which then asks the API.
export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get('ref') ?? '';
  const target = isRef(ref) ? `hautecorner://purchase/${ref}` : 'hautecorner://';
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } });
}
