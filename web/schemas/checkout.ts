import { z } from 'zod';
import { objectId } from '@/lib/validation';
import { address, kenyanPhone } from '@/schemas/me';

const cartItem = z.strictObject({
  productId: objectId,
  option: z.string().trim().min(1).max(20).optional(),
  quantity: z.number().int().min(1).max(20),
});

// Only products, sizes and quantities. Prices, fees and totals from the app
// are refused, because the server works them out.
export const quoteBody = z.strictObject({
  items: z.array(cartItem).min(1, 'Your cart is empty').max(50),
});

const payment = z.discriminatedUnion('method', [
  z.strictObject({ method: z.literal('mpesa'), phone: kenyanPhone }),
  z.strictObject({ method: z.literal('card') }),
]);

export const checkoutBody = z.strictObject({
  items: quoteBody.shape.items,
  contact: z.strictObject({ name: z.string().trim().min(1, 'Enter your name').max(100), phone: kenyanPhone }),
  deliveryAddress: address,
  payment,
});

export const payAgainBody = z.strictObject({ payment: payment.optional() });

export const idempotencyKey = z
  .string({ error: 'Send an Idempotency-Key header' })
  .trim()
  .min(8, 'The Idempotency-Key header must be 8 to 100 characters')
  .max(100, 'The Idempotency-Key header must be 8 to 100 characters');

export const listOrdersQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: objectId.optional(),
});
