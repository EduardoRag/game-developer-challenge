export type SessionEndReason =
    | 'timeUp'
    | 'shipDestroyed';

export type SessionConfig = {
    sessionDuration: number;
    enemySpawnInterval: number;
};

export type CreateSessionRequest = {
    id: string;
    playerName: string;
    score: number;
    duration: number;
    endReason: SessionEndReason;
    config: SessionConfig;
};

export type CreateSessionResponse = {
    id: string;
    playerName: string;
    score: number;
    duration: number;
    endReason: SessionEndReason;
    config: SessionConfig;
    playedAt: string;
};