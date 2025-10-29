import { test, expect } from '@playwright/test';

test('debug signin page', async ({ page }: { page: any }) => {
  console.log('Navigating to signin page...');
  await page.goto('http://localhost:3000/signin');
  console.log('Page loaded');

  // Check if the form elements exist
  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');
  const submitButton = page.locator('button[type="submit"]');

  console.log('Checking form elements...');
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();

  console.log('Form elements found');

  // Try to fill the form
  await emailInput.fill('founder@auditaai.com');
  await passwordInput.fill('Toby60022006!!!');
  console.log('Form filled');

  // Click submit
  await submitButton.click();
  console.log('Submit clicked');

  // Wait for navigation or error
  await page.waitForTimeout(5000);
  console.log('Test completed');
});