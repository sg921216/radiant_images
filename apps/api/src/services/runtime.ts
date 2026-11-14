import type { ImageValidator } from './imageProvider';
import { validateCloudflareImages } from './cloudflareImages';
export interface Runtime {
  now: () => Date;
  fetch: typeof fetch;
  validateImages?: ImageValidator;
}
export const productionRuntime: Runtime = {
  now: () => new Date(),
  fetch: (input, init) => fetch(input, init),
  validateImages: validateCloudflareImages,
};
