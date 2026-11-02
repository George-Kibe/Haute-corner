import { z } from 'zod';
import { objectId } from '@/lib/validation';
import { AUDIENCES, PRODUCT_TYPES } from '@/models/Product';

export const listProductsQuery = z.object({
  type: z.enum(PRODUCT_TYPES).optional(),
  audience: z.enum(AUDIENCES).optional(),
  seller: objectId.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: objectId.optional(),
});
