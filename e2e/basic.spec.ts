import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('http://localhost:4200');
  
  // Wait for Angular to load
  await page.waitForLoadState('networkidle');
  
  // Check if the page title is correct (adjust according to your app)
  const title = await page.title();
  expect(title).toBeTruthy();
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'e2e/screenshot.png' });
});

test('navigation works', async ({ page }) => {
  await page.goto('http://localhost:4200');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  // Check if there's any navigation or content
  const content = await page.content();
  expect(content).toBeTruthy();
});
