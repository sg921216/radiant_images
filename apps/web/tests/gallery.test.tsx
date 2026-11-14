import { expect, test, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryEditor } from '../app/routes/admin/gallery';
vi.mock('../app/lib/images', () => ({ prepareImage: vi.fn(async () => new FormData()) }));
afterEach(() => vi.unstubAllGlobals());
test('gallery requires descriptive alt text and keeps the upload draft after publication failure', async () => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === 'POST'
      ? Response.json(
          {
            error: {
              code: 'unavailable',
              message: 'Validation is unavailable. No image was published.',
            },
          },
          { status: 500 },
        )
      : Response.json([]),
  );
  vi.stubGlobal('fetch', fetcher);
  render(<GalleryEditor />);
  const user = userEvent.setup();
  await screen.findByText('0 of 60 images');
  await user.upload(
    screen.getByLabelText('Photo'),
    new File(['image'], 'photo.png', { type: 'image/png' }),
  );
  await user.click(screen.getByRole('button', { name: 'Upload photo' }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  await user.type(
    screen.getByLabelText('Photo description (alt text)'),
    'A family walking together',
  );
  await user.click(screen.getByRole('button', { name: 'Upload photo' }));
  await screen.findByText(/Validation is unavailable/);
  expect(screen.getByLabelText('Photo description (alt text)')).toHaveValue(
    'A family walking together',
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
});
