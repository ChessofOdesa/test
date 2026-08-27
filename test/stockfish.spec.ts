import { test, expect } from '@playwright/test';

test('Stockfish analysis on Analysis page', async ({ page }) => {
  // Navigate to Analysis page on local dev server
  await page.goto('http://localhost:8083/analysis', { waitUntil: 'networkidle' });

  // Ensure the PGN/FEN textarea is present
  await page.waitForSelector('textarea[placeholder="Вставте PGN або FEN..."]', { timeout: 10000 });

  // Click the Stockfish analyze button
  const btn = page.locator('button', { hasText: 'Аналізувати Stockfish' });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();

  // Wait for either a bestmove line or some engine output to appear
  await page.waitForSelector('text=Stockfish best', { timeout: 20000 });

  // Capture displayed bestmove and engine output
  const best = await page.locator('div:has-text("Stockfish best")').textContent();
  const output = await page.locator('pre').first().textContent();

  console.log('Stockfish best:', best);
  console.log('Engine output snippet:', output ? output.slice(0, 500) : '');

  expect(best).toBeTruthy();
});
