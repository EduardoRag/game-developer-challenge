import {
    expect,
    test,
    type Page,
} from '@playwright/test';

const PENDING_SESSION_KEY =
    'pirate-battle-pending-session';

const LAST_COMPLETED_SESSION_KEY =
    'pirate-battle-last-completed-session';

const pendingSession = {
    id: 'e2e-pending-session',
    playerName: 'Captain Jack',
    score: 42,
    duration: 30,
    endReason: 'timeUp',
    config: {
        sessionDuration: 60,
        enemySpawnInterval: 5,
    },
};

const storePendingSession = async (
    page: Page,
) => {
    await page.goto('/');

    await page.evaluate(
        ({ key, session }) => {
            localStorage.setItem(
                key,
                JSON.stringify(session),
            );
        },
        {
            key: PENDING_SESSION_KEY,
            session: pendingSession,
        },
    );
};

test.describe('Session persistence', () => {
    test('retries a pending session after page reload and clears it after success', async ({
        page,
    }) => {
        await storePendingSession(page);

        await page.reload();

        await expect
            .poll(async () =>
                page.evaluate(
                    (key) =>
                        localStorage.getItem(key),
                    PENDING_SESSION_KEY,
                ),
            )
            .toBeNull();

        const storedResult =
            await page.evaluate(
                (key) =>
                    localStorage.getItem(key),
                LAST_COMPLETED_SESSION_KEY,
            );

        expect(storedResult).not.toBeNull();

        const parsedResult = JSON.parse(
            storedResult!,
        ) as {
            id: string;
            score: number;
        };

        expect(parsedResult.id).toBe(
            pendingSession.id,
        );
        expect(parsedResult.score).toBe(
            pendingSession.score,
        );
    });

    test('keeps a pending session when registration is unavailable', async ({
        page,
    }) => {
        await page.goto(
            '/?mockScenario=registration-unavailable',
        );

        await page.evaluate(
            ({ key, session }) => {
                localStorage.setItem(
                    key,
                    JSON.stringify(session),
                );
            },
            {
                key: PENDING_SESSION_KEY,
                session: pendingSession,
            },
        );

        await page.reload();

        await expect
            .poll(async () =>
                page.evaluate(
                    (key) =>
                        localStorage.getItem(key),
                    PENDING_SESSION_KEY,
                ),
            )
            .not.toBeNull();

        const storedResult =
            await page.evaluate(
                (key) =>
                    localStorage.getItem(key),
                LAST_COMPLETED_SESSION_KEY,
            );

        expect(storedResult).toBeNull();
    });
});