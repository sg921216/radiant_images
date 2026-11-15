import { afterEach, expect, test, vi } from 'vitest';
import { startPublicBootstrap } from '../app/lib/bootstrapScript';

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.querySelectorAll('link[rel=preload]').forEach((link) => link.remove());
  window.__radiantBootstrap = undefined;
});

test('the first service photograph starts before hydration with the gallery responsive sizes', async () => {
  const gallery = [
    {
      id: 'second',
      tag: 'family',
      sortOrder: 2,
      width: 1333,
      height: 2000,
      urls: {
        thumb: 'https://api.example.invalid/images/second/thumb.webp',
        card: 'https://api.example.invalid/images/second/card.webp',
        full: 'https://api.example.invalid/images/second/full.webp',
      },
    },
    {
      id: 'first',
      tag: 'family',
      sortOrder: 1,
      width: 1333,
      height: 2000,
      urls: {
        thumb: 'https://api.example.invalid/images/first/thumb.webp',
        card: 'https://api.example.invalid/images/first/card.webp',
        full: 'https://api.example.invalid/images/first/full.webp',
      },
    },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ gallery })),
  );
  startPublicBootstrap('https://api.example.invalid', '/family');
  await window.__radiantBootstrap;
  const link = document.head.querySelector('link[rel=preload]') as HTMLLinkElement;
  expect(link).not.toBeNull();
  expect(link.href).toBe(gallery[1]!.urls.card);
  expect(link.getAttribute('imagesrcset')).toContain('213w');
  expect(link.getAttribute('imagesizes')).toContain('90vw');
  expect(link.getAttribute('fetchpriority')).toBe('high');
});

test('non-service pages do not preload an offscreen portfolio photograph', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ gallery: [] })),
  );
  startPublicBootstrap('https://api.example.invalid', '/contact');
  await window.__radiantBootstrap;
  expect(document.head.querySelector('link[rel=preload]')).toBeNull();
});
