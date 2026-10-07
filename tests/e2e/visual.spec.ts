import { expect, test } from '@playwright/test';

test.describe('Visual regression', () => {
    test('main menu matches the visual reference', async ({
        page,
    }) => {
        await page.goto('/');

        await expect(
            page.getByRole('button', {
                name: 'PLAY',
                exact: true,
            }),
        ).toBeVisible();

        await expect(page).toHaveScreenshot(
            'main-menu.png',
            {
                animations: 'disabled',
            },
        );
    });

    test('ranking matches the visual reference', async ({
        page,
    }) => {
        await page.goto('/');

        await page
            .getByRole('button', {
                name: 'RANKING',
                exact: true,
            })
            .click();

        await expect(
            page.getByText('Anne', {
                exact: true,
            }),
        ).toBeVisible();

        await expect(page).toHaveScreenshot(
            'ranking.png',
            {
                animations: 'disabled',
            },
        );
    });
});