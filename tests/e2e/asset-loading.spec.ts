import {
    expect,
    test,
    type Page,
} from '@playwright/test';

const openGame = async (
    page: Page,
    path = '/',
) => {
    await page.goto(path);

    await page
        .getByRole('button', {
            name: 'PLAY',
            exact: true,
        })
        .click();
};

test.describe('Game asset loading', () => {
    test('shows the ready state after loading game assets', async ({
        page,
    }) => {
        await openGame(page);

        await expect(
            page.getByRole('heading', {
                name: 'READY?',
                exact: true,
            }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'START',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('shows an error when game assets fail and recovers on retry', async ({
        page,
    }) => {
        await openGame(
            page,
            '/?mockScenario=asset-error',
        );

        await expect(
            page.getByRole('heading', {
                name: 'FAILED TO LOAD',
                exact: true,
            }),
        ).toBeVisible();

        await expect(
            page.getByText(
                'The battle could not be prepared.',
                { exact: true },
            ),
        ).toBeVisible();

        await page.evaluate(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('mockScenario');
            window.history.replaceState(
                null,
                '',
                `${url.pathname}${url.search}${url.hash}`,
            );
        });

        await page
            .getByRole('button', {
                name: 'RETRY',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('heading', {
                name: 'READY?',
                exact: true,
            }),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'START',
                exact: true,
            }),
        ).toBeVisible();
    });
});