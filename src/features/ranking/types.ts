export type RankingEntry = {
    id: string;
    playerName: string;
    score: number;
    playedAt: string;
};

export type RankingResponse = {
    items: RankingEntry[];
    page: number;
    pageSize: number;
    total: number;
};