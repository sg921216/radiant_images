import { DurableObject } from 'cloudflare:workers';
import { assertJpegComplete } from '@radiant/shared/jpeg';

// Per-portfolio CPU admission: synchronous calls serialize expensive scan checks.
// No image bytes, decisions, or counters are persisted or retained between calls.
export class JpegValidator extends DurableObject {
  validate(bytes: Uint8Array): boolean {
    try {
      if (!(bytes instanceof Uint8Array)) return false;
      assertJpegComplete(bytes);
      return true;
    } catch {
      return false;
    }
  }
}
