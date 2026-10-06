import { apiClient } from '../../infrastructure/api/apiClient';

import type { RankingResponse } from './types';

type GetRankingParams = {
    page?: number;
    pageSize?: number;
};

export const getRanking = async ({
    page = 1,
    pageSize = 10,
}: GetRankingParams = {}) => {
    const response = await apiClient.get<RankingResponse>(
        '/ranking',
        {
            params: {
                page,
                pageSize,
            },
        },
    );

    return response.data;
};