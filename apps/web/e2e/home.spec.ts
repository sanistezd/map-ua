import { expect, test } from '@playwright/test';

test('renders the localized starter', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Nest modular monolith',
  );
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page).toHaveURL(/\/uk$/);
});
