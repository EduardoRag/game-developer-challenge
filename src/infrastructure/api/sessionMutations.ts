import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { historyKeys } from '../../features/history/queries';
import { rankingKeys } from '../../features/ranking/queries';

import { createSession } from './sessionApi';

export const useCreateSessionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSession,

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: rankingKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: historyKeys.all,
                }),
            ]);
        },
    });
};