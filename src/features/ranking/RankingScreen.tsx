import { useState } from 'react';

import { MenuPanel } from '../../shared/components/MenuPanel';
import { Pagination } from '../../shared/components/Pagination';

import { useRankingQuery } from './queries';

type RankingScreenProps = {
    onBack: () => void;
    onHistory: () => void;
};

const PAGE_SIZE = 5;

export const RankingScreen = ({
    onBack,
    onHistory,
}: RankingScreenProps) => {
    const [page, setPage] = useState(1);

    const rankingQuery = useRankingQuery(page, PAGE_SIZE);

    const totalPages = rankingQuery.data
        ? Math.max(
            1,
            Math.ceil(
                rankingQuery.data.total / PAGE_SIZE,
            ),
        )
        : 1;

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
                    <>
                        <div className="ranking-table">
                            <div
                                className="ranking-table__header"
                                aria-hidden="true"
                            >
                                <span>RANK</span>
                                <span>CAPTAIN</span>
                                <span>POINTS</span>
                            </div>

                            <ul className="ranking-list">
                                {rankingQuery.data.items.map((entry, index) => {
                                    const position =
                                        (page - 1) * PAGE_SIZE + index + 1;

                                    const isCurrentPlayer =
                                        entry.playerName === 'Captain Jack';

                                    return (
                                        <li
                                            key={entry.id}
                                            className={`ranking-list__item ${isCurrentPlayer
                                                    ? 'ranking-list__item--current'
                                                    : ''
                                                }`}
                                        >
                                            <span className="ranking-list__position">
                                                {position.toString().padStart(2, '0')}
                                            </span>

                                            <span className="ranking-list__captain">
                                                {entry.playerName}

                                                {isCurrentPlayer && (
                                                    <span className="ranking-list__you">
                                                        YOU
                                                    </span>
                                                )}
                                            </span>

                                            <strong>{entry.score}</strong>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </>
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