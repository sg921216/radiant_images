import { z } from 'zod';
// Configure before schema construction; CSP must never need unsafe-eval.
z.config({ jitless: true });
export { z };
