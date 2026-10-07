import { expect, test } from '@playwright/test';
import type { } from '../../src/vite-env';

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

    test('game arena matches the visual reference', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            let seed = 123456789;

            Math.random = () => {
                seed = (seed * 16807) % 2147483647;

                return (seed - 1) / 2147483646;
            };
        });

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

        await page.evaluate(() => {
            const game = window.__PIRATE_BATTLE_E2E__;

            if (!game) {
                throw new Error('E2E game controls are not available.');
            }

            game.setEnemiesFrozen(true);
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

        await page.getByRole('button', {
            name: 'Pause game',
            exact: true,
        }).click();

        await expect(
            page.getByRole('dialog'),
        ).toBeVisible();

        await expect(page).toHaveScreenshot(
            'game-arena.png',
            {
                animations: 'disabled',
            },
        );
    });

    test('battle result matches the visual reference', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            let seed = 123456789;

            Math.random = () => {
                seed = (seed * 16807) % 2147483647;

                return (seed - 1) / 2147483646;
            };
        });

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

        await page.evaluate(() => {
            const game = window.__PIRATE_BATTLE_E2E__;

            if (!game) {
                throw new Error('E2E game controls are not available.');
            }

            game.setEnemiesFrozen(true);
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

        await page.evaluate(() => {
            const game = window.__PIRATE_BATTLE_E2E__;

            if (!game) {
                throw new Error('E2E game controls are not available.');
            }

            game.setTimeRemaining(0.1);
        });

        await expect(
            page.getByRole('heading', {
                name: 'BATTLE COMPLETE',
                exact: true,
            }),
        ).toBeVisible();

        await expect(
            page.getByText('Battle result saved.', {
                exact: true,
            }),
        ).toBeVisible();

        await expect(page).toHaveScreenshot(
            'battle-result.png',
            {
                animations: 'disabled',
            },
        );
    });
});