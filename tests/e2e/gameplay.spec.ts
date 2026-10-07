import {
    expect,
    test,
    type Page,
} from '@playwright/test';

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
    ).toBeVisible();

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

    test('accepts keyboard gameplay controls', async ({
        page,
    }) => {
        await startGame(page);

        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(200);
        await page.keyboard.up('ArrowUp');

        await page.keyboard.press('Space');

        await expect(
            page.locator('.game-canvas canvas'),
        ).toBeVisible();
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
});