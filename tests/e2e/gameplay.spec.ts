import {
    expect,
    test,
    type Page,
} from '@playwright/test';

import type { } from '../../src/vite-env';

const startGame = async (page: Page) => {
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

test.describe('Gameplay', () => {
    test('starts a battle using the real game flow', async ({
        page,
    }) => {
        await startGame(page);

        await expect(
            page.locator('.game-canvas canvas'),
        ).toBeVisible();

        await expect(
            page.locator('.hud'),
        ).toBeVisible();
    });

    test('exposes the real simulation state for E2E assertions', async ({
        page,
    }) => {
        await startGame(page);

        const snapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(snapshot).toBeTruthy();

        expect(snapshot?.player.health).toBeGreaterThan(0);
        expect(snapshot?.player.health).toBeLessThanOrEqual(100);
        expect(snapshot?.player.x).toBeGreaterThan(0);
        expect(snapshot?.player.y).toBeGreaterThan(0);

        expect(snapshot?.arena.width).toBeGreaterThan(0);
        expect(snapshot?.arena.height).toBeGreaterThan(0);

        expect(snapshot?.enemies).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'chaser',
                }),
                expect.objectContaining({
                    type: 'shooter',
                }),
            ]),
        );

        expect(snapshot?.gameState).toBe('playing');
        expect(snapshot?.score).toBe(0);
    });

    test('moves the player with keyboard controls and keeps it inside the arena', async ({
        page,
    }) => {
        await startGame(page);

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(2_500);
        await page.keyboard.up('ArrowUp');

        const finalSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(finalSnapshot).toBeTruthy();

        const initialPlayer = initialSnapshot!.player;
        const finalPlayer = finalSnapshot!.player;

        const distanceMoved = Math.hypot(
            finalPlayer.x - initialPlayer.x,
            finalPlayer.y - initialPlayer.y,
        );

        expect(distanceMoved).toBeGreaterThan(0);

        const halfWidth = finalPlayer.width / 2;
        const halfHeight = finalPlayer.height / 2;

        expect(finalPlayer.x).toBeGreaterThanOrEqual(halfWidth);
        expect(finalPlayer.x).toBeLessThanOrEqual(
            finalSnapshot!.arena.width - halfWidth,
        );

        expect(finalPlayer.y).toBeGreaterThanOrEqual(halfHeight);
        expect(finalPlayer.y).toBeLessThanOrEqual(
            finalSnapshot!.arena.height - halfHeight,
        );
    });

    test('prevents the player from crossing the island', async ({
        page,
    }) => {
        await startGame(page);

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();
        expect(initialSnapshot!.obstacles.length).toBeGreaterThan(0);

        const obstacle = initialSnapshot!.obstacles[0];

        const targetX = obstacle.x + obstacle.width / 2;
        const targetY = obstacle.y + obstacle.height / 2;

        const deltaX = targetX - initialSnapshot!.player.x;
        const deltaY = targetY - initialSnapshot!.player.y;

        const targetRotation =
            Math.atan2(deltaY, deltaX) - Math.PI / 2;

        const normalizeAngle = (angle: number) =>
            Math.atan2(Math.sin(angle), Math.cos(angle));

        for (let attempt = 0; attempt < 30; attempt++) {
            const snapshot = await page.evaluate(() => {
                return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
            });

            expect(snapshot).toBeTruthy();

            const difference = normalizeAngle(
                targetRotation - snapshot!.player.rotation,
            );

            if (Math.abs(difference) < 0.12) {
                break;
            }

            const rotationKey =
                difference > 0 ? 'ArrowRight' : 'ArrowLeft';

            await page.keyboard.down(rotationKey);
            await page.waitForTimeout(30);
            await page.keyboard.up(rotationKey);
        }

        const alignedSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(alignedSnapshot).toBeTruthy();

        const alignmentDifference = normalizeAngle(
            targetRotation - alignedSnapshot!.player.rotation,
        );

        expect(Math.abs(alignmentDifference)).toBeLessThan(0.2);

        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(2_500);
        await page.keyboard.up('ArrowUp');

        const finalSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(finalSnapshot).toBeTruthy();

        const player = finalSnapshot!.player;

        const playerLeft = player.x - player.width / 2;
        const playerRight = player.x + player.width / 2;
        const playerTop = player.y - player.height / 2;
        const playerBottom = player.y + player.height / 2;

        const intersectsIsland =
            playerLeft < obstacle.x + obstacle.width &&
            playerRight > obstacle.x &&
            playerTop < obstacle.y + obstacle.height &&
            playerBottom > obstacle.y;

        expect(intersectsIsland).toBe(false);

        const distanceToIsland = Math.hypot(
            player.x - targetX,
            player.y - targetY,
        );

        const initialDistanceToIsland = Math.hypot(
            initialSnapshot!.player.x - targetX,
            initialSnapshot!.player.y - targetY,
        );

        expect(distanceToIsland).toBeLessThan(
            initialDistanceToIsland,
        );
    });

    test('respects the front cannon cooldown', async ({
        page,
    }) => {
        await startGame(page);

        const beforeShot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(beforeShot).toBeTruthy();

        await page.keyboard.press('Space');

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.projectiles.player;
            })
            .toBe(1);

        await page.keyboard.press('Space');

        const duringCooldown = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(duringCooldown).toBeTruthy();
        expect(duringCooldown!.projectiles.player).toBe(1);
    });

    test('supports touch controls and simultaneous input', async ({
        page,
    }, testInfo) => {
        test.skip(
            testInfo.project.name !== 'mobile-chromium',
            'Touch controls are tested on the mobile project.',
        );

        await startGame(page);

        const moveForward = page.getByRole('button', {
            name: 'Move forward',
            exact: true,
        });

        const fireFront = page.getByRole('button', {
            name: 'Fire front cannon',
            exact: true,
        });

        await expect(moveForward).toBeVisible();
        await expect(fireFront).toBeVisible();

        await moveForward.dispatchEvent('pointerdown', {
            pointerType: 'touch',
            isPrimary: true,
        });

        await fireFront.dispatchEvent('pointerdown', {
            pointerType: 'touch',
            isPrimary: false,
        });

        await fireFront.dispatchEvent('pointerup', {
            pointerType: 'touch',
            isPrimary: false,
        });

        await page.waitForTimeout(200);

        await moveForward.dispatchEvent('pointerup', {
            pointerType: 'touch',
            isPrimary: true,
        });

        await expect(
            page.locator('.game-canvas canvas'),
        ).toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'Pause game',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('pauses and resumes the game', async ({
        page,
    }) => {
        await startGame(page);

        await page
            .getByRole('button', {
                name: 'Pause game',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('dialog', {
                name: 'PAUSED',
            }),
        ).toBeVisible();

        await page
            .getByRole('button', {
                name: 'RESUME',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('dialog', {
                name: 'PAUSED',
            }),
        ).not.toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'Pause game',
                exact: true,
            }),
        ).toBeVisible();
    });

    test('pauses automatically when the window loses focus', async ({
        page,
    }) => {
        await startGame(page);

        await page.evaluate(() => {
            window.dispatchEvent(new Event('blur'));
        });

        await expect(
            page.getByRole('dialog', {
                name: 'PAUSED',
            }),
        ).toBeVisible();

        await page
            .getByRole('button', {
                name: 'RESUME',
                exact: true,
            })
            .click();

        await expect(
            page.getByRole('dialog', {
                name: 'PAUSED',
            }),
        ).not.toBeVisible();

        await expect(
            page.getByRole('button', {
                name: 'Pause game',
                exact: true,
            }),
        ).toBeVisible();
    });
});