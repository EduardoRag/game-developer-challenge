import { MenuPanel } from '../../shared/components/MenuPanel';

import { useRankingQuery } from './queries';

type RankingScreenProps = {
    onBack: () => void;
    onHistory: () => void;
};

export const RankingScreen = ({
    onBack,
    onHistory,
}: RankingScreenProps) => {
    const rankingQuery = useRankingQuery();

    return (
        <MenuPanel
            className="data-screen__content"
            panelClassName="data-screen__panel"
        >
            <h1>CAPTAIN'S LOG</h1>

            <div
                className="data-screen__tabs"
                role="navigation"
                aria-label="Captain's log sections"
            >
                <button
                    type="button"
                    className="data-screen__tab data-screen__tab--active"
                    aria-current="page"
                >
                    RANKING
                </button>

                <button
                    type="button"
                    className="data-screen__tab"
                    onClick={onHistory}
                >
                    MATCH HISTORY
                </button>
            </div>

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
                MAIN MENU
            </button>
        </MenuPanel>
    );
};