import type {
    SessionConfig,
    SessionEndReason,
} from '../../infrastructure/api/types';

export type GameHistoryEntry = {
    id: string;
    playerName: string;
    score: number;
    duration: number;
    endReason: SessionEndReason;
    config: SessionConfig;
    playedAt: string;
};

export type GameHistoryResponse = {
    items: GameHistoryEntry[];
    page: number;
    pageSize: number;
    total: number;
};