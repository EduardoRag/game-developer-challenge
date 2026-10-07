import {
    expect,
    test,
} from '@playwright/test';

test.describe('MSW API scenarios', () => {
    test('supports variable and out-of-order response latency', async ({
        page,
    }) => {
        await page.goto(
            '/?mockScenario=variable-latency',
        );

        await expect(
            page.getByRole('button', {
                name: 'RANKING',
                exact: true,
            }),
        ).toBeVisible();

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

        const result = await page.evaluate(async () => {
            const completionOrder: number[] = [];

            const requestPage = async (
                pageNumber: number,
            ) => {
                const response = await fetch(
                    `/api/ranking?page=${pageNumber}&pageSize=5`,
                );

                if (!response.ok) {
                    throw new Error(
                        `Ranking request failed with status ${response.status}`,
                    );
                }

                const data = (await response.json()) as {
                    page: number;
                };

                completionOrder.push(data.page);

                return data;
            };

            const [pageOne, pageTwo] =
                await Promise.all([
                    requestPage(1),
                    requestPage(2),
                ]);

            return {
                completionOrder,
                pageOne: pageOne.page,
                pageTwo: pageTwo.page,
            };
        });

        expect(result.pageOne).toBe(1);
        expect(result.pageTwo).toBe(2);

        expect(result.completionOrder).toEqual([
            2,
            1,
        ]);
    });
});