import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

// Accepts 0712 345 678, 712345678, 254712345678 and +254 712 345 678, and
// returns +254712345678. Kenyan mobile numbers start with 7 or 1 after the code.
export const kenyanPhone = z
  .string()
  .trim()
  .transform((value, context) => {
    const match = value.replace(/[\s-]/g, '').match(/^(?:\+?254|0)?([17]\d{8})$/);
    if (!match) {
      context.issues.push({
        code: 'custom',
        message: 'Enter a Kenyan mobile number, such as 0712 345 678',
        input: value,
      });
      return z.NEVER;
    }
    return `+254${match[1]}`;
  });

export const address = z.strictObject({
  line1: z.string().trim().min(1).max(200),
  area: optionalText(100),
  city: z.string().trim().min(1).max(100),
  notes: optionalText(300),
});

// null clears a field. Anything else, such as role, is refused.
export const updateMeBody = z
  .strictObject({
    name: z.string().trim().min(1).max(100).optional(),
    phone: kenyanPhone.nullable().optional(),
    deliveryAddress: address.nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to change');
