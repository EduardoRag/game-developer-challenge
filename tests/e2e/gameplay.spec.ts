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
        expect(beforeShot!.weapon.frontCooldown).toBe(0);

        await page.keyboard.press('Space');

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.weapon.frontCooldown ?? 0;
            })
            .toBeGreaterThan(0);

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setWeaponCooldownsFrozen(
                true,
            );
        });

        const frozenSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(frozenSnapshot).toBeTruthy();
        expect(
            frozenSnapshot!.weapon.frontCooldown,
        ).toBeGreaterThan(0);

        const frozenCooldown =
            frozenSnapshot!.weapon.frontCooldown;

        await page.keyboard.press('Space');

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.weapon.frontCooldown;
            })
            .toBe(frozenCooldown);
    });

    test('spawns enemies at a safe distance from the player and obstacles', async ({
        page,
    }) => {
        await page.goto('/');

        await page.getByRole('button', { name: 'OPTIONS' }).click();

        const decreaseSpawnTimeButton = page.getByRole('button', {
            name: 'Decrease enemy spawn time',
        });

        while (await decreaseSpawnTimeButton.isEnabled()) {
            await decreaseSpawnTimeButton.click();
        }

        await page.getByRole('button', { name: 'MAIN MENU' }).click();

        await page.getByRole('button', { name: 'PLAY' }).click();

        await expect(
            page.getByRole('button', { name: 'START' }),
        ).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: 'START' }).click();

        await expect(
            page.getByRole('button', { name: 'Pause game' }),
        ).toBeVisible();

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setEnemiesFrozen(true);
        });

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        const initialEnemyCount = initialSnapshot!.enemies.length;

        await expect
            .poll(
                async () => {
                    const snapshot = await page.evaluate(() => {
                        return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                    });

                    return snapshot?.enemies.length;
                },
                {
                    timeout: 5_000,
                },
            )
            .toBeGreaterThan(initialEnemyCount);

        const snapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(snapshot).toBeTruthy();

        const spawnedEnemies = snapshot!.enemies.slice(
            initialEnemyCount,
        );

        expect(spawnedEnemies.length).toBeGreaterThan(0);

        for (const enemy of spawnedEnemies) {
            const distanceFromPlayer = Math.hypot(
                enemy.x - snapshot!.player.x,
                enemy.y - snapshot!.player.y,
            );

            expect(distanceFromPlayer).toBeGreaterThanOrEqual(250);

            for (const obstacle of snapshot!.obstacles) {
                const insideObstacleSafetyArea =
                    enemy.x >= obstacle.x - 40 &&
                    enemy.x <=
                    obstacle.x + obstacle.width + 40 &&
                    enemy.y >= obstacle.y - 40 &&
                    enemy.y <=
                    obstacle.y + obstacle.height + 40;

                expect(insideObstacleSafetyArea).toBe(false);
            }
        }
    });

    test('shooter attacks the player from range', async ({
        page,
    }) => {
        await startGame(page);

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        const shooterIndex = initialSnapshot!.enemies.findIndex(
            (enemy) => enemy.type === 'shooter',
        );

        expect(shooterIndex).toBeGreaterThanOrEqual(0);

        const player = initialSnapshot!.player;
        const initialHealth = player.health;

        const preferredDistance = 300;
        const arenaMargin = 50;

        const availableSpace = {
            right:
                initialSnapshot!.arena.width -
                player.x -
                arenaMargin,
            left: player.x - arenaMargin,
            down:
                initialSnapshot!.arena.height -
                player.y -
                arenaMargin,
            up: player.y - arenaMargin,
        };

        const direction = Object.entries(availableSpace).reduce(
            (best, current) =>
                current[1] > best[1] ? current : best,
        );

        expect(direction[1]).toBeGreaterThanOrEqual(220);

        const shooterDistance = Math.min(
            preferredDistance,
            direction[1],
        );

        const shooterPosition = {
            x: player.x,
            y: player.y,
        };

        switch (direction[0]) {
            case 'right':
                shooterPosition.x += shooterDistance;
                break;
            case 'left':
                shooterPosition.x -= shooterDistance;
                break;
            case 'down':
                shooterPosition.y += shooterDistance;
                break;
            case 'up':
                shooterPosition.y -= shooterDistance;
                break;
        }

        await page.evaluate(
            ({ index, x, y }) => {
                window.__PIRATE_BATTLE_E2E__?.setEnemyPosition(
                    index,
                    x,
                    y,
                );
            },
            {
                index: shooterIndex,
                x: shooterPosition.x,
                y: shooterPosition.y,
            },
        );

        await expect
            .poll(
                async () => {
                    const snapshot = await page.evaluate(() => {
                        return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                    });

                    return snapshot?.player.health;
                },
                {
                    timeout: 5_000,
                },
            )
            .toBeLessThan(initialHealth);
    });

    test('ends the match when the session time runs out', async ({
        page,
    }) => {
        await startGame(page);

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setTimeRemaining(0.1);
        });

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.gameState;
            })
            .toBe('gameOver');

        const snapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(snapshot).toBeTruthy();
        expect(snapshot!.endReason).toBe('timeUp');
        expect(snapshot!.timeRemaining).toBe(0);
    });

    test('ends the match when the player ship is destroyed', async ({
        page,
    }) => {
        await startGame(page);

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        await page.getByRole('button', {
            name: 'Pause game',
        }).click();

        await expect(
            page.getByRole('button', {
                name: 'Resume game',
            }),
        ).toBeVisible();

        const pausedSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(pausedSnapshot).toBeTruthy();
        expect(pausedSnapshot!.player.health).toBeGreaterThan(15);

        await page.evaluate((health) => {
            window.__PIRATE_BATTLE_E2E__?.damagePlayer(
                health - 15,
            );
        }, pausedSnapshot!.player.health);

        const preparedSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(preparedSnapshot).toBeTruthy();
        expect(preparedSnapshot!.player.health).toBe(15);

        const shooterIndex = initialSnapshot!.enemies.findIndex(
            (enemy) => enemy.type === 'shooter',
        );

        expect(shooterIndex).toBeGreaterThanOrEqual(0);

        const player = initialSnapshot!.player;

        const availableSpace = {
            right: initialSnapshot!.arena.width - player.x - 50,
            left: player.x - 50,
            down: initialSnapshot!.arena.height - player.y - 50,
            up: player.y - 50,
        };

        const direction = Object.entries(availableSpace).reduce(
            (best, current) =>
                current[1] > best[1] ? current : best,
        );

        expect(direction[1]).toBeGreaterThanOrEqual(220);

        const distance = Math.min(300, direction[1]);

        const shooterPosition = {
            x: player.x,
            y: player.y,
        };

        switch (direction[0]) {
            case 'right':
                shooterPosition.x += distance;
                break;
            case 'left':
                shooterPosition.x -= distance;
                break;
            case 'down':
                shooterPosition.y += distance;
                break;
            case 'up':
                shooterPosition.y -= distance;
                break;
        }

        await page.evaluate(
            ({ index, x, y }) => {
                window.__PIRATE_BATTLE_E2E__?.setEnemyPosition(
                    index,
                    x,
                    y,
                );
            },
            {
                index: shooterIndex,
                x: shooterPosition.x,
                y: shooterPosition.y,
            },
        );

        await page.getByRole('dialog').getByRole('button', {
            name: 'RESUME',
        }).click();

        await expect
            .poll(
                async () => {
                    const snapshot = await page.evaluate(() => {
                        return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                    });

                    return snapshot?.gameState;
                },
                {
                    timeout: 5_000,
                },
            )
            .toBe('gameOver');

        const finalSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(finalSnapshot).toBeTruthy();
        expect(finalSnapshot!.player.health).toBe(0);
        expect(finalSnapshot!.endReason).toBe('shipDestroyed');
    });

    test('chaser pursues the player and deals contact damage without awarding score', async ({
        page,
    }) => {
        await startGame(page);

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        const chaserIndex = initialSnapshot!.enemies.findIndex(
            (enemy) => enemy.type === 'chaser',
        );

        expect(chaserIndex).toBeGreaterThanOrEqual(0);

        const player = initialSnapshot!.player;
        const initialScore = initialSnapshot!.score;
        const initialHealth = initialSnapshot!.player.health;

        await page.evaluate(
            ({ index, x, y }) => {
                window.__PIRATE_BATTLE_E2E__?.setEnemyPosition(
                    index,
                    x,
                    y,
                );
            },
            {
                index: chaserIndex,
                x: player.x,
                y: player.y + 150,
            },
        );

        const positionedSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(positionedSnapshot).toBeTruthy();

        const positionedChaser =
            positionedSnapshot!.enemies[chaserIndex];

        const initialDistance = Math.hypot(
            positionedChaser.x - player.x,
            positionedChaser.y - player.y,
        );

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                const chaser = snapshot?.enemies.find(
                    (enemy) => enemy.type === 'chaser',
                );

                if (!snapshot || !chaser) {
                    return 0;
                }

                return Math.hypot(
                    chaser.x - snapshot.player.x,
                    chaser.y - snapshot.player.y,
                );
            })
            .toBeLessThan(initialDistance);

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.player.health;
            })
            .toBeLessThan(initialHealth);

        const finalSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(finalSnapshot).toBeTruthy();
        expect(finalSnapshot!.score).toBe(initialScore);
    });

    test('damages and destroys an enemy awarding exactly one point', async ({
        page,
    }) => {
        await startGame(page);

        await page.evaluate(() => {
            window.__PIRATE_BATTLE_E2E__?.setEnemiesFrozen(true);
        });

        const initialSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(initialSnapshot).toBeTruthy();

        const shooterIndex = initialSnapshot!.enemies.findIndex(
            (enemy) => enemy.type === 'shooter',
        );

        expect(shooterIndex).toBeGreaterThanOrEqual(0);

        const player = initialSnapshot!.player;
        const initialScore = initialSnapshot!.score;

        await page.evaluate(
            ({ index, x, y }) => {
                window.__PIRATE_BATTLE_E2E__?.setEnemyPosition(
                    index,
                    x,
                    y,
                );
            },
            {
                index: shooterIndex,
                x: player.x,
                y: player.y + 150,
            },
        );

        const getShooterHealth = async () => {
            return page.evaluate(() => {
                const snapshot =
                    window.__PIRATE_BATTLE_E2E__?.getSnapshot();

                return snapshot?.enemies.find(
                    (enemy) => enemy.type === 'shooter',
                )?.health;
            });
        };

        expect(await getShooterHealth()).toBe(50);

        const expectedHealthAfterShots = [35, 20, 5];

        for (const expectedHealth of expectedHealthAfterShots) {
            await page.keyboard.press('Space');

            await expect
                .poll(getShooterHealth)
                .toBe(expectedHealth);

            await page.waitForTimeout(750);
        }

        await page.keyboard.press('Space');

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.enemies.some(
                    (enemy) => enemy.type === 'shooter',
                );
            })
            .toBe(false);

        await expect
            .poll(async () => {
                const snapshot = await page.evaluate(() => {
                    return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
                });

                return snapshot?.score;
            })
            .toBe(initialScore + 1);

        await page.waitForTimeout(250);

        const finalSnapshot = await page.evaluate(() => {
            return window.__PIRATE_BATTLE_E2E__?.getSnapshot();
        });

        expect(finalSnapshot).toBeTruthy();
        expect(finalSnapshot!.score).toBe(initialScore + 1);
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