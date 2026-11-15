import type { z } from 'zod';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
export class ApiFault extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
    public retryable?: boolean,
  ) {
    super(message);
  }
}
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) fields[issue.path.join('.') || 'form'] = issue.message;
  throw new ApiFault(400, 'validation_failed', 'Please check the highlighted fields.', fields);
}
export async function jsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new ApiFault(400, 'validation_failed', 'Send a JSON request.');
  try {
    return await request.json();
  } catch {
    throw new ApiFault(400, 'validation_failed', 'The request could not be read.');
  }
}
