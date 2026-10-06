export type CreateSessionRequest = {
    playerName: string;
    score: number;
    duration: number;
};

export type CreateSessionResponse = {
    id: string;
    playerName: string;
    score: number;
    duration: number;
    playedAt: string;
};