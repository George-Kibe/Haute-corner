import { unstable_rethrow } from 'next/navigation';
import type { z } from 'zod';

export const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = () => new ApiError(404, 'not_found', 'Not found');

type OkOptions = {
  meta?: Record<string, unknown>;
  status?: number;
  cache?: string;
};

export function ok(data: unknown, { meta, status = 200, cache = 'no-store' }: OkOptions = {}) {
  return Response.json(meta ? { data, meta } : { data }, {
    status,
    headers: { 'Cache-Control': cache },
  });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
  headers: Record<string, string> = {},
) {
  return Response.json(
    { error: details ? { code, message, details } : { code, message } },
    { status, headers: { ...headers, 'Cache-Control': 'no-store' } },
  );
}

// Vercel sets x-real-ip to the address that connected. Many Kenyan mobile users
// share one address through their carrier, so limits per address stay generous.
export function clientIp(request: Request) {
  return (
    request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  );
}

export function route<Context = unknown>(
  handler: (request: Request, context: Context) => Promise<Response>,
) {
  return async (request: Request, context: Context) => {
    // Reading the request keeps every API route at request time. With Cache
    // Components, a handler that finishes without touching it can be prerendered
    // during the build, freezing its response. This stays outside the try block
    // so that Next's bail-out signal is not swallowed.
    void request.url;

    try {
      return await handler(request, context);
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof ApiError) {
        return fail(error.status, error.code, error.message, error.details, error.headers);
      }
      console.error('Unhandled API error', error);
      return fail(500, 'internal_error', 'Something went wrong');
    }
  };
}

export const noContent = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

function validate<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const details: Record<string, string> = {};
  for (const issue of result.error.issues) {
    details[issue.path.join('.') || 'body'] ??= issue.message;
  }
  throw new ApiError(400, 'validation_failed', 'The request is not valid', details);
}

export function parseQuery<Schema extends z.ZodType>(schema: Schema, request: Request): z.output<Schema> {
  return validate(schema, Object.fromEntries(new URL(request.url).searchParams));
}

export async function parseBody<Schema extends z.ZodType>(schema: Schema, request: Request): Promise<z.output<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'validation_failed', 'The request body must be JSON');
  }
  return validate(schema, body);
}
