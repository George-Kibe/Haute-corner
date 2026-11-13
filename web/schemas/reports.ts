import { z } from 'zod';
import { REPORT_REASONS } from '@/models/Report';

export const reportBody = z.strictObject({
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || undefined)
    .optional(),
});
