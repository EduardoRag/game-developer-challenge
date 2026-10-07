import { expect, test } from '@playwright/test';

import type { } from '../../src/vite-env';

import { startGame } from './helpers/game';

test.describe('Match flow', () => {
    test('persists the last completed match after a page reload', async ({
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

        const storedBeforeReload = await page.evaluate(() => {
            return localStorage.getItem(
                'pirate-battle-last-completed-session',
            );
        });

        expect(storedBeforeReload).not.toBeNull();

        const completedSession = JSON.parse(
            storedBeforeReload!,
        ) as {
            id: string;
            playerName: string;
            score: number;
            duration: number;
            endReason: string;
            config: {
                sessionDuration: number;
                enemySpawnInterval: number;
            };
        };

        expect(completedSession.id).toBeTruthy();
        expect(completedSession.playerName).toBe('Captain Jack');
        expect(completedSession.endReason).toBe('timeUp');

        await page.reload();

        const storedAfterReload = await page.evaluate(() => {
            return localStorage.getItem(
                'pirate-battle-last-completed-session',
            );
        });

        expect(storedAfterReload).not.toBeNull();

        const completedSessionAfterReload = JSON.parse(
            storedAfterReload!,
        );

        expect(completedSessionAfterReload).toEqual(
            completedSession,
        );
    });

    test('does not record an abandoned match', async ({
        page,
    }) => {
        await startGame(page);

        await page.getByRole('button', {
            name: 'Pause game',
            exact: true,
        }).click();

        await expect(
            page.getByRole('dialog'),
        ).toBeVisible();

        await page
            .getByRole('dialog')
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

        const storedSession = await page.evaluate(() => {
            return localStorage.getItem(
                'pirate-battle-last-completed-session',
            );
        });

        const pendingSession = await page.evaluate(() => {
            return localStorage.getItem(
                'pirate-battle-pending-session',
            );
        });

        expect(storedSession).toBeNull();
        expect(pendingSession).toBeNull();
    });
});