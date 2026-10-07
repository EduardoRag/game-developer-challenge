import { expect, test } from '@playwright/test';

test.describe('Captain\'s Log', () => {
    test('displays ranking data', async ({ page }) => {
        await page.goto('/');

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await expect(
            page.getByRole('heading', { name: 'CAPTAIN\'S LOG' }),
        ).toBeVisible();

        await expect(page.getByText('Anne')).toBeVisible();
        await expect(page.getByText('Blackbeard')).toBeVisible();
        await expect(page.getByText('Calico Jack')).toBeVisible();
    });

    test('switches between ranking and match history', async ({
        page,
    }) => {
        await page.goto('/');

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await page
            .getByRole('button', {
                name: 'MATCH HISTORY',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('button', {
                name: 'MATCH HISTORY',
                exact: true,
            }),
        ).toHaveAttribute('aria-current', 'page');

        await expect(page.getByText('TIME UP')).toBeVisible();

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await expect(
            page.getByRole('button', {
                name: 'RANKING',
                exact: true,
            }),
        ).toHaveAttribute('aria-current', 'page');
    });

    test('displays empty ranking state', async ({ page }) => {
        await page.goto('/?mockScenario=empty');

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await expect(
            page.getByText('No scores yet.'),
        ).toBeVisible();
    });

    test('displays empty history state', async ({ page }) => {
        await page.goto('/?mockScenario=empty');

        await page
            .getByRole('button', {
                name: 'MATCH HISTORY',
                exact: true,
            })
            .click();

        await expect(
            page.getByText('No matches played yet.'),
        ).toBeVisible();
    });

    test('displays ranking error and allows retry', async ({
        page,
    }) => {
        await page.goto('/?mockScenario=server-error');

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await expect(
            page.getByText('Could not load the ranking.'),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'Try Again',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('displays history error and allows retry', async ({
        page,
    }) => {
        await page.goto('/?mockScenario=server-error');

        await page
            .getByRole('button', {
                name: 'MATCH HISTORY',
                exact: true,
            })
            .click();

        await expect(
            page.getByText('Could not load the history.'),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'TRY AGAIN',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('returns to the main menu from ranking', async ({
        page,
    }) => {
        await page.goto('/');

        await page
            .getByRole('button', { name: 'RANKING', exact: true })
            .click();

        await page
            .getByRole('button', {
                name: 'MAIN MENU',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('button', {
                name: 'PLAY',
                exact: true,
            }),
        ).toBeVisible();
    });
});