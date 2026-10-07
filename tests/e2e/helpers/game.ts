import { expect, type Page } from '@playwright/test';

export const startGame = async (page: Page) => {
    await page.goto('/');

    await page
        .getByRole('button', {
            name: 'PLAY',
            exact: true,
        })
        .click();

    await expect(
        page.getByRole('heading', {
            name: 'READY?',
            exact: true,
        }),
    ).toBeVisible({
        timeout: 15_000,
    });

    await page
        .getByRole('button', {
            name: 'START',
            exact: true,
        })
        .click();

    await expect(
        page.getByRole('button', {
            name: 'Pause game',
            exact: true,
        }),
    ).toBeVisible();
};