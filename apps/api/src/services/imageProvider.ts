export interface ImageInputs {
  original: Uint8Array;
  full: Uint8Array;
  card: Uint8Array;
  thumb: Uint8Array;
}
export interface DecodedImage {
  width: number;
  height: number;
  bytes: Uint8Array;
}
export interface VerifiedImages {
  original: { mime: string; width: number; height: number };
  full: DecodedImage;
  card: DecodedImage;
  thumb: DecodedImage;
}
export type ImageValidator = (input: ImageInputs) => Promise<VerifiedImages>;
export class InvalidImage extends Error {}
