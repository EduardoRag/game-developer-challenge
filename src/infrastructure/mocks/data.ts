import type { GameHistoryEntry } from '../../features/history/types';
import type { RankingEntry } from '../../features/ranking/types';

export const sessions: GameHistoryEntry[] = [
	{
		id: 'session-1',
		playerName: 'Anne',
		score: 1250,
		duration: 120,
		playedAt: '2026-10-05T18:30:00.000Z',
	},
	{
		id: 'session-2',
		playerName: 'Blackbeard',
		score: 900,
		duration: 98,
		playedAt: '2026-10-05T17:15:00.000Z',
	},
	{
		id: 'session-3',
		playerName: 'Calico Jack',
		score: 650,
		duration: 76,
		playedAt: '2026-10-05T16:00:00.000Z',
	},
];

export const getRankingData = (): RankingEntry[] =>
	sessions
		.map(({ id, playerName, score, playedAt }) => ({
			id,
			playerName,
			score,
			playedAt,
		}))
		.sort((first, second) => second.score - first.score);