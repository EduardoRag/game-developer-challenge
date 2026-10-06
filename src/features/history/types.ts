export type GameHistoryEntry = {
    id: string;
    playerName: string;
    score: number;
    duration: number;
    playedAt: string;
};

export type GameHistoryResponse = {
    items: GameHistoryEntry[];
    page: number;
    pageSize: number;
    total: number;
};