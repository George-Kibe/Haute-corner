import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID');

export const isObjectId = (value: string) => objectId.safeParse(value).success;
