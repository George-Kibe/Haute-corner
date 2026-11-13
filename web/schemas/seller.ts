import { z } from 'zod';
import { objectId } from '@/lib/validation';
import { MAX_IMAGES_PER_PRODUCT, MAX_VIDEOS_PER_PRODUCT } from '@/lib/settings';
import { AUDIENCES, PRODUCT_TYPES } from '@/models/Product';
import { DOCUMENT_KINDS } from '@/models/Seller';
import { kenyanPhone } from '@/schemas/me';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

export const uploadSignBody = z.strictObject({
  kind: z.enum(['image', 'video', 'document']),
});

const shopFields = {
  businessName: z.string().trim().min(2, 'Enter your business name').max(80),
  phone: kenyanPhone,
  payoutMpesaNumber: kenyanPhone,
  deliveryFee: z.number().int().min(0).max(10000),
  deliveryAreas: z.string().trim().min(2, 'Say where you deliver').max(300),
  returnsNote: optionalText(500),
};

export const applicationBody = z.strictObject({
  ...shopFields,
  documents: z
    .array(z.strictObject({ kind: z.enum(DOCUMENT_KINDS), publicId: z.string().min(1).max(300) }))
    .min(1, 'Add a photo of your ID')
    .max(5),
});

// null clears the returns note. Anything else, such as status, is refused.
export const sellerProfileBody = z
  .strictObject({
    ...shopFields,
    returnsNote: shopFields.returnsNote.nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to change');

const mediaItem = z.strictObject({ kind: z.enum(['image', 'video']), publicId: z.string().min(1).max(300) });

const media = z
  .array(mediaItem)
  .max(MAX_IMAGES_PER_PRODUCT + MAX_VIDEOS_PER_PRODUCT)
  .refine((items) => items.some((item) => item.kind === 'image'), 'Add at least one photo')
  .refine(
    (items) => items.filter((item) => item.kind === 'image').length <= MAX_IMAGES_PER_PRODUCT,
    `Add up to ${MAX_IMAGES_PER_PRODUCT} photos`,
  )
  .refine(
    (items) => items.filter((item) => item.kind === 'video').length <= MAX_VIDEOS_PER_PRODUCT,
    `Add up to ${MAX_VIDEOS_PER_PRODUCT} video`,
  )
  .refine((items) => new Set(items.map((item) => item.publicId)).size === items.length, 'Each file can be added once');

const productFields = {
  title: z.string().trim().min(3, 'Give it a title of at least 3 characters').max(120),
  description: z.string().trim().min(10, 'Describe it in at least 10 characters').max(3000),
  type: z.enum(PRODUCT_TYPES),
  audience: z.enum(AUDIENCES),
  price: z.number().int().min(1).max(1_000_000),
  stock: z.number().int().min(0).max(10_000),
  options: z
    .array(z.string().trim().min(1).max(20))
    .max(30)
    .refine((items) => new Set(items.map((item) => item.toLowerCase())).size === items.length, 'Sizes must differ')
    .default([]),
  media,
};

export const createProductBody = z.strictObject(productFields);

// A seller can archive a listing or put it back on sale, but never set
// removed or hidden, which belong to admins and seller status.
export const updateProductBody = z
  .strictObject({ ...productFields, options: productFields.options.unwrap(), status: z.enum(['active', 'archived']) })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to change');

export const sellerProductsQuery = z.object({
  status: z.enum(['active', 'archived', 'removed', 'hidden']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: objectId.optional(),
});
