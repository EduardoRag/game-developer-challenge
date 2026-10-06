import { useQuery } from '@tanstack/react-query';

import { getHistory } from './api';

export const historyKeys = {
    all: ['history'] as const,
    list: (page: number, pageSize: number) =>
        [...historyKeys.all, page, pageSize] as const,
};

export const useHistoryQuery = (
    page = 1,
    pageSize = 10,
) => {
    return useQuery({
        queryKey: historyKeys.list(page, pageSize),
        queryFn: () => getHistory({ page, pageSize }),
    });
};