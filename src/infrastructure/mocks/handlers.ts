import {
    delay,
    http,
    HttpResponse,
} from 'msw';

import type { CreateSessionRequest } from '../api/types';
import { getRankingData, sessions } from './data';
import { getMockScenario } from './scenarios';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const DEFAULT_DELAY = 300;
const HIGH_LATENCY_DELAY = 2500;
const REGISTRATION_TIMEOUT_DELAY = 10000;

const getPagination = (request: Request) => {
    const url = new URL(request.url);

    const page = Math.max(
        1,
        Number(url.searchParams.get('page')) || DEFAULT_PAGE,
    );

    const pageSize = Math.max(
        1,
        Number(url.searchParams.get('pageSize')) ||
        DEFAULT_PAGE_SIZE,
    );

    return { page, pageSize };
};

const paginate = <T>(
    items: T[],
    page: number,
    pageSize: number,
) => {
    const start = (page - 1) * pageSize;

    return items.slice(start, start + pageSize);
};

const applyReadScenario = async () => {
    const scenario = getMockScenario();

    if (scenario === 'latency') {
        await delay(HIGH_LATENCY_DELAY);
        return scenario;
    }

    await delay(DEFAULT_DELAY);

    return scenario;
};

export const handlers = [
    http.post('/api/sessions', async ({ request }) => {
        const data =
            (await request.json()) as CreateSessionRequest;

        const scenario = getMockScenario();

        if (scenario === 'registration-timeout') {
            await delay(REGISTRATION_TIMEOUT_DELAY);

            return HttpResponse.json(
                {
                    message: 'Session registration timed out.',
                },
                {
                    status: 504,
                },
            );
        }

        if (scenario === 'registration-unavailable') {
            await delay(DEFAULT_DELAY);

            return HttpResponse.json(
                {
                    message:
                        'Session registration is temporarily unavailable.',
                },
                {
                    status: 503,
                },
            );
        }

        await delay(DEFAULT_DELAY);

        const existingSession = sessions.find(
            (session) => session.id === data.id,
        );

        if (existingSession) {
            return HttpResponse.json(existingSession, {
                status: 200,
            });
        }

        const session = {
            id: data.id,
            playerName: data.playerName,
            score: data.score,
            duration: data.duration,
            endReason: data.endReason,
            config: data.config,
            playedAt: new Date().toISOString(),
        };

        sessions.unshift(session);

        return HttpResponse.json(session, {
            status: 201,
        });
    }),

    http.get('/api/ranking', async ({ request }) => {
        const { page, pageSize } = getPagination(request);
        const scenario = await applyReadScenario();

        if (scenario === 'network-error') {
            return HttpResponse.error();
        }

        if (scenario === 'server-error') {
            return HttpResponse.json(
                {
                    message: 'Could not load ranking.',
                },
                {
                    status: 500,
                },
            );
        }

        if (scenario === 'empty') {
            return HttpResponse.json({
                items: [],
                page,
                pageSize,
                total: 0,
            });
        }

        const ranking = getRankingData();

        return HttpResponse.json({
            items: paginate(ranking, page, pageSize),
            page,
            pageSize,
            total: ranking.length,
        });
    }),

    http.get('/api/history', async ({ request }) => {
        const { page, pageSize } = getPagination(request);
        const scenario = await applyReadScenario();

        if (scenario === 'network-error') {
            return HttpResponse.error();
        }

        if (scenario === 'server-error') {
            return HttpResponse.json(
                {
                    message: 'Could not load match history.',
                },
                {
                    status: 500,
                },
            );
        }

        if (scenario === 'empty') {
            return HttpResponse.json({
                items: [],
                page,
                pageSize,
                total: 0,
            });
        }

        return HttpResponse.json({
            items: paginate(sessions, page, pageSize),
            page,
            pageSize,
            total: sessions.length,
        });
    }),
];