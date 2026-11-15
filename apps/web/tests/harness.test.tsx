import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
test('RTL observes accessible labels in the browser environment', () => {
  render(
    <label>
      Fixture name
      <input />
    </label>,
  );
  expect(screen.getByRole('textbox', { name: 'Fixture name' })).toBeVisible();
});
