import { useQuery } from '@tanstack/react-query';

import { getRanking } from './api';

export const rankingKeys = {
    all: ['ranking'] as const,
    list: (page: number, pageSize: number) =>
        [...rankingKeys.all, page, pageSize] as const,
};

export const useRankingQuery = (
    page = 1,
    pageSize = 10,
) => {
    return useQuery({
        queryKey: rankingKeys.list(page, pageSize),
        queryFn: () => getRanking({ page, pageSize }),
    });
};