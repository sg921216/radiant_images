export const SHOOT_TYPES = ['maternity', 'newborn', 'family'] as const;
export const GALLERY_TAGS = [...SHOOT_TYPES, 'general'] as const;
export const LIMITS = {
  jsonBytes: 65536,
  uploadBytes: 16777216,
  originalBytes: 10485760,
  originalAxis: 16384,
  originalPixels: 40000000,
  galleryImages: 60,
  publicationSeconds: 60,
} as const;
export const IMAGE_VARIANTS = {
  full: { edge: 2000, bytes: 2097152 },
  card: { edge: 800, bytes: 1048576 },
  thumb: { edge: 320, bytes: 262144 },
} as const;
