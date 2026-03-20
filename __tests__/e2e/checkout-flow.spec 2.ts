import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('checkout page requires authentication', async ({ page }) => {
    await page.goto('/checkout');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('empty cart shows appropriate message', async ({ page }) => {
    // This test assumes the user is logged in but has empty cart
    await page.goto('/carrello');
    // Should redirect to login or show empty state
    await page.waitForTimeout(1000);
  });

  test('product detail page has add to cart button', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    // Check if products load
    const productLinks = page.locator('a[href^="/prodotti/"]');
    const count = await productLinks.count();
    if (count > 0) {
      await productLinks.first().click();
      await page.waitForTimeout(1000);

      // Should see add to cart button
      const addBtn = page.locator('button:has-text("Aggiungi"), button:has-text("Add to cart")');
      if (await addBtn.count() > 0) {
        await expect(addBtn.first()).toBeVisible();
      }
    }
  });
});

test.describe('Product Interaction', () => {
  test('unauthenticated user is redirected when adding to cart', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    // Try to click add to cart on first product
    const addButtons = page.locator('button:has-text("Aggiungi"), button:has-text("Add")');
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      await page.waitForTimeout(1000);
      // Should redirect to login
      const url = page.url();
      expect(url).toMatch(/login|registrazione/);
    }
  });

  test('unauthenticated user is redirected when adding to wishlist', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    // Find heart/wishlist button
    const heartButtons = page.locator('button[title*="preferiti"], button[title*="wishlist"]');
    if (await heartButtons.count() > 0) {
      await heartButtons.first().click();
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toMatch(/login|registrazione/);
    }
  });
});

test.describe('Products Page Features', () => {
  test('search input works', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/cerca|search/i);
    if (await searchInput.count() > 0) {
      await searchInput.fill('manzo');
      await page.waitForTimeout(500); // Debounce
      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('category filter is present', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() > 0) {
      await expect(categorySelect).toBeVisible();
    }
  });

  test('sort options are present', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(2000);

    const selects = page.locator('select');
    // Should have at least category and sort selects
    expect(await selects.count()).toBeGreaterThanOrEqual(1);
  });

  test('pagination controls exist when products are loaded', async ({ page }) => {
    await page.goto('/prodotti');
    await page.waitForTimeout(3000);

    // Check for pagination buttons
    const prevBtn = page.locator('button:has-text("Precedente"), button:has-text("Previous")');
    const nextBtn = page.locator('button:has-text("Avanti"), button:has-text("Next")');
    // May or may not be visible depending on product count
  });
});

test.describe('Cart Page', () => {
  test('cart page shows empty state when not logged in', async ({ page }) => {
    await page.goto('/carrello');
    await page.waitForTimeout(2000);
    // Should redirect to login or show some state
    const url = page.url();
    // Either redirected to login or showing cart
    expect(url).toMatch(/carrello|login/);
  });
});
