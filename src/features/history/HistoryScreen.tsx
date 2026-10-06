import { MenuPanel } from '../../shared/components/MenuPanel';

import { useHistoryQuery } from './queries';

type HistoryScreenProps = {
    onBack: () => void;
};

export const HistoryScreen = ({
    onBack,
}: HistoryScreenProps) => {
    const historyQuery = useHistoryQuery();

    return (
        <MenuPanel className="data-screen__content">
            <h1>History</h1>

            {historyQuery.isPending && (
                <p>Loading history...</p>
            )}

            {historyQuery.isError && (
                <div className="data-screen__message">
                    <p>Could not load the history.</p>

                    <button
                        type="button"
                        onClick={() => historyQuery.refetch()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {historyQuery.isSuccess &&
                historyQuery.data.items.length === 0 && (
                    <p>No matches played yet.</p>
                )}

            {historyQuery.isSuccess &&
                historyQuery.data.items.length > 0 && (
                    <ul className="history-list">
                        {historyQuery.data.items.map((entry) => (
                            <li
                                key={entry.id}
                                className="history-list__item"
                            >
                                <div>
                                    <strong>{entry.playerName}</strong>

                                    <span>
                                        Score: {entry.score}
                                    </span>
                                </div>

                                <span>
                                    {entry.duration}s
                                </span>
                            </li>
                        ))}
                    </ul>
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