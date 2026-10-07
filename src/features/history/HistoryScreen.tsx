import { useState } from 'react';

import { MenuPanel } from '../../shared/components/MenuPanel';

import { useHistoryQuery } from './queries';

import { Pagination } from '../../shared/components/Pagination';

type HistoryScreenProps = {
    onBack: () => void;
    onRanking: () => void;
};

const PAGE_SIZE = 5;

const formatDate = (playedAt: string) => {
    const date = new Date(playedAt);

    const day = date
        .getDate()
        .toString()
        .padStart(2, '0');

    const month = date
        .toLocaleString('en-US', {
            month: 'short',
        })
        .toUpperCase();

    const hours = date
        .getHours()
        .toString()
        .padStart(2, '0');

    const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, '0');

    return `${day} ${month} · ${hours}:${minutes}`;
};

const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return `${minutes
        .toString()
        .padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
};

export const HistoryScreen = ({
    onBack,
    onRanking,
}: HistoryScreenProps) => {
    const [page, setPage] = useState(1);

    const historyQuery = useHistoryQuery(page, PAGE_SIZE);

    const totalPages = historyQuery.data
        ? Math.max(
            1,
            Math.ceil(
                historyQuery.data.total / PAGE_SIZE,
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
                    className="data-screen__tab"
                    onClick={onRanking}
                >
                    RANKING
                </button>

                <button
                    type="button"
                    className="data-screen__tab data-screen__tab--active"
                    aria-current="page"
                >
                    MATCH HISTORY
                </button>
            </div>

            {historyQuery.isPending && (
                <p>Loading history...</p>
            )}

            {historyQuery.isError && (
                <div className="data-screen__message">
                    <p>Could not load the history.</p>

                    <button
                        type="button"
                        className="menu-button"
                        onClick={() =>
                            historyQuery.refetch()
                        }
                    >
                        TRY AGAIN
                    </button>
                </div>
            )}

            {historyQuery.isSuccess &&
                historyQuery.data.items.length === 0 && (
                    <p>No matches played yet.</p>
                )}

            {historyQuery.isSuccess &&
                historyQuery.data.items.length > 0 && (
                    <>
                        <div className="history-table">
                            <div
                                className="history-table__header"
                                aria-hidden="true"
                            >
                                <span>DATE</span>
                                <span>POINTS</span>
                                <span>DURATION</span>
                                <span>RESULT</span>
                            </div>

                            <ul className="history-list">
                                {historyQuery.data.items.map(
                                    (entry) => (
                                        <li
                                            key={entry.id}
                                            className="history-list__item"
                                        >
                                            <span>
                                                {formatDate(
                                                    entry.playedAt,
                                                )}
                                            </span>

                                            <strong>
                                                {entry.score}
                                            </strong>

                                            <span>
                                                {formatDuration(
                                                    entry.duration,
                                                )}
                                            </span>

                                            <span>
                                                {entry.endReason ===
                                                    'timeUp'
                                                    ? 'TIME UP'
                                                    : 'DEFEATED'}
                                            </span>
                                        </li>
                                    ),
                                )}
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