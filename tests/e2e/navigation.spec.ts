import { expect, test } from '@playwright/test';

test.describe('Main Menu', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('displays the main menu actions', async ({ page }) => {
        await expect(
            page.getByRole('img', { name: 'Pirate Battle' }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'PLAY', exact: true }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'OPTIONS', exact: true }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'RANKING', exact: true }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'CONTROLS', exact: true }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'MATCH HISTORY',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('opens the options screen', async ({ page }) => {
        await page
            .getByRole('button', { name: 'OPTIONS', exact: true })
            .click();

        await expect(
            page.getByRole('heading', { name: 'OPTIONS' }),
        ).toBeVisible();
    });
});