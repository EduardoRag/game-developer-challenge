import { MenuPanel } from '../../shared/components/MenuPanel';

import { useRankingQuery } from './queries';

type RankingScreenProps = {
    onBack: () => void;
};

export const RankingScreen = ({
    onBack,
}: RankingScreenProps) => {
    const rankingQuery = useRankingQuery();

    return (
        <MenuPanel className="data-screen__content">
            <h1>Ranking</h1>

            {rankingQuery.isPending && (
                <p>Loading ranking...</p>
            )}

            {rankingQuery.isError && (
                <div className="data-screen__message">
                    <p>Could not load the ranking.</p>

                    <button
                        type="button"
                        onClick={() => rankingQuery.refetch()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {rankingQuery.isSuccess &&
                rankingQuery.data.items.length === 0 && (
                    <p>No scores yet.</p>
                )}

            {rankingQuery.isSuccess &&
                rankingQuery.data.items.length > 0 && (
                    <ol className="ranking-list">
                        {rankingQuery.data.items.map((entry) => (
                            <li
                                key={entry.id}
                                className="ranking-list__item"
                            >
                                <span>{entry.playerName}</span>
                                <strong>{entry.score}</strong>
                            </li>
                        ))}
                    </ol>
                )}

            <button
                type="button"
                className="menu-button data-screen__back"
                onClick={onBack}
            >
                Back
            </button>
        </MenuPanel>
    );
};