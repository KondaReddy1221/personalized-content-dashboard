import { expect, test } from '@playwright/test';

test('registers, logs in, and accesses the dashboard securely', async ({ page }) => {
  const email = `qa-${Date.now()}@example.com`;

  for (const route of ['/dashboard', '/feed', '/trending', '/favorites', '/settings']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }

  await page.goto('http://localhost:3000/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

  await page.getByRole('link', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

  await page.getByLabel('Full Name').fill('QA User');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Password123');
  await page.getByRole('textbox', { name: 'Confirm Password', exact: true }).fill('Password123');
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page.getByText(/registration successful/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Password123');
  await page.getByRole('button', { name: /^login$/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/personalized overview/i)).toBeVisible();

  await page.getByRole('button', { name: /settings/i }).click();
  await page.getByRole('button', { name: /technology/i }).click();
  await page.getByRole('button', { name: /save preferences/i }).click();

  await page.getByRole('button', { name: /personalized feed/i }).click();
  await page.getByLabel('Search content').fill('AI');
  await expect(page.getByText(/search results/i)).toBeVisible();

  const favoriteButton = page.getByLabel(/favorite/i).first();
  await favoriteButton.click();

  await page.getByRole('button', { name: /favorites/i }).click();
  await expect(page.getByText(/favorite items/i)).toBeVisible();

  await page.getByRole('button', { name: /toggle theme/i }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
