import { apiClient } from '../../infrastructure/api/apiClient';

import type { GameHistoryResponse } from './types';

type GetHistoryParams = {
    page?: number;
    pageSize?: number;
};

export const getHistory = async ({
    page = 1,
    pageSize = 10,
}: GetHistoryParams = {}) => {
    const response =
        await apiClient.get<GameHistoryResponse>(
            '/history',
            {
                params: {
                    page,
                    pageSize,
                },
            },
        );

    return response.data;
};