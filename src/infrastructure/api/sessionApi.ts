import { apiClient } from './apiClient';
import type {
    CreateSessionRequest,
    CreateSessionResponse,
} from './types';

export const createSession = async (
    data: CreateSessionRequest,
) => {
    const response =
        await apiClient.post<CreateSessionResponse>(
            '/sessions',
            data,
        );

    return response.data;
};