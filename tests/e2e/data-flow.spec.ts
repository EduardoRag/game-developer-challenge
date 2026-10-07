import { expect, test } from '@playwright/test';

import type { } from '../../src/vite-env';

import { startGame } from './helpers/game';

test.describe('Ranking and history integration', () => {
    test('registered match appears in ranking and match history', async ({
        page,
    }) => {
        await startGame(page);

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setTimeRemaining(0.1);
        });

        await expect
            .poll(async () => {
                return page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot()
                        ?.gameState;
                });
            })
            .toBe('gameOver');

        await expect(
            page.getByText('Battle result saved.', {
                exact: true,
            }),
        ).toBeVisible();

        await page.getByRole('button', {
            name: 'MAIN MENU',
            exact: true,
        }).click();

        await page.getByRole('button', {
            name: 'RANKING',
            exact: true,
        }).click();

        await expect(
            page.locator('.ranking-list__captain').filter({
                hasText: 'Captain Jack',
            }),
        ).toBeVisible();

        await page.getByRole('button', {
            name: 'MATCH HISTORY',
            exact: true,
        }).click();

        await expect(
            page.locator('.history-list__item--current'),
        ).toBeVisible();
    });

    test('navigates through ranking pages', async ({ page }) => {
        await page.goto('/');

        await expect(
            page.getByRole('button', {
                name: 'PLAY',
                exact: true,
            }),
        ).toBeVisible();

        for (let index = 1; index <= 3; index += 1) {
            const status = await page.evaluate(async (sessionIndex) => {
                const response = await fetch('/api/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: `pagination-session-${sessionIndex}`,
                        playerName: `Pagination Captain ${sessionIndex}`,
                        score: 100 - sessionIndex,
                        duration: 60,
                        endReason: 'timeUp',
                        config: {
                            sessionDuration: 60,
                            enemySpawnInterval: 5,
                        },
                    }),
                });

                return response.status;
            }, index);

            expect(status).toBe(201);
        }

        await page.getByRole('button', {
            name: 'RANKING',
            exact: true,
        }).click();

        await expect(
            page.getByText('PAGE 1 OF 2', {
                exact: true,
            }),
        ).toBeVisible();

        const previousButton = page.getByRole('button', {
            name: 'Previous page',
        });

        const nextButton = page.getByRole('button', {
            name: 'Next page',
        });

        await expect(previousButton).toBeDisabled();
        await expect(nextButton).toBeEnabled();

        await nextButton.click();

        await expect(
            page.getByText('PAGE 2 OF 2', {
                exact: true,
            }),
        ).toBeVisible();

        await expect(previousButton).toBeEnabled();
        await expect(nextButton).toBeDisabled();

        await previousButton.click();

        await expect(
            page.getByText('PAGE 1 OF 2', {
                exact: true,
            }),
        ).toBeVisible();
    });

    test('retries a timed out registration without duplicating the match', async ({
        page,
    }) => {
        await page.goto('/?mockScenario=registration-timeout');

        await page.getByRole('button', {
            name: 'PLAY',
            exact: true,
        }).click();

        await expect(
            page.getByRole('heading', {
                name: 'READY?',
                exact: true,
            }),
        ).toBeVisible({
            timeout: 15_000,
        });

        await page.getByRole('button', {
            name: 'START',
            exact: true,
        }).click();

        await expect(
            page.getByRole('button', {
                name: 'Pause game',
                exact: true,
            }),
        ).toBeVisible();

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setTimeRemaining(0.1);
        });

        await expect(
            page.getByRole('heading', {
                name: 'BATTLE COMPLETE',
                exact: true,
            }),
        ).toBeVisible();

        await expect(
            page.getByText('Could not save the battle result.', {
                exact: true,
            }),
        ).toBeVisible({
            timeout: 7_000,
        });

        const pendingBeforeRetry = await page.evaluate(() =>
            localStorage.getItem('pirate-battle-pending-session'),
        );

        expect(pendingBeforeRetry).not.toBeNull();

        const pendingSession = JSON.parse(pendingBeforeRetry!) as {
            id: string;
        };

        expect(pendingSession.id).toBeTruthy();

        await page.evaluate(() => {
            window.history.replaceState(
                null,
                '',
                '/?mockScenario=success',
            );
        });

        await page.getByRole('button', {
            name: 'TRY AGAIN',
            exact: true,
        }).click();

        await expect(
            page.getByText('Battle result saved.', {
                exact: true,
            }),
        ).toBeVisible({
            timeout: 5_000,
        });

        const pendingAfterRetry = await page.evaluate(() =>
            localStorage.getItem('pirate-battle-pending-session'),
        );

        expect(pendingAfterRetry).toBeNull();

        await page.getByRole('button', {
            name: 'MAIN MENU',
            exact: true,
        }).click();

        await page.getByRole('button', {
            name: 'MATCH HISTORY',
            exact: true,
        }).click();

        const currentPlayerMatches = page.locator(
            '.history-list__item--current',
        );

        await expect(currentPlayerMatches).toHaveCount(1);
    });
});