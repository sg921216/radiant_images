import { renderToString } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import { Header } from '../app/components/Header';
test('prerendered menu waits for hydration, then opens once and supports keyboard dismissal', async () => {
  const html = renderToString(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.querySelector('button')?.disabled).toBe(true);
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
  const menu = screen.getByRole('button', { name: 'Menu' });
  expect(menu).toBeEnabled();
  const user = userEvent.setup();
  await user.click(menu);
  expect(menu).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Escape}');
  expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(menu).toHaveFocus();
});
