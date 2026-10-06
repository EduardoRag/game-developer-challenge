import { delay, http, HttpResponse } from 'msw';

import type { CreateSessionRequest } from '../api/types';
import { getRankingData, sessions } from './data';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

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

export const handlers = [
    http.post('/api/sessions', async ({ request }) => {
        const data =
            (await request.json()) as CreateSessionRequest;

        await delay(300);

        const session = {
            id: crypto.randomUUID(),
            playerName: data.playerName,
            score: data.score,
            duration: data.duration,
            playedAt: new Date().toISOString(),
        };

        sessions.unshift(session);

        return HttpResponse.json(session, {
            status: 201,
        });
    }),

    http.get('/api/ranking', async ({ request }) => {
        const { page, pageSize } = getPagination(request);

        await delay(300);

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

        await delay(300);

        return HttpResponse.json({
            items: paginate(sessions, page, pageSize),
            page,
            pageSize,
            total: sessions.length,
        });
    }),
];