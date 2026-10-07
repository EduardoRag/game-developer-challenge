import type { GameSnapshot } from '../types/GameSnapshot';

type GameOverProps = {
    snapshot: GameSnapshot;
    isRegistering: boolean;
    isRegistered: boolean;
    hasRegistrationError: boolean;
    onRetryRegistration: () => void;
    onRestart: () => void;
    onMainMenu: () => void;
};

export const GameOver = ({
    snapshot,
    isRegistering,
    isRegistered,
    hasRegistrationError,
    onRetryRegistration,
    onRestart,
    onMainMenu,
}: GameOverProps) => {
    const minutes = Math.floor(snapshot.elapsedTime / 60);
    const seconds = snapshot.elapsedTime % 60;

    const formattedTime = `${minutes
        .toString()
        .padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;

    const resultReason = snapshot.endReason === 'timeUp'
        ? 'TIME UP'
        : 'SHIP DESTROYED';

    return (
        <div
            className="game-over"
            role="dialog"
            aria-labelledby="game-over-title"
        >
            <div className="game-over__panel">
                <img
                    className="game-over__panel-background"
                    src="/assets/png/default/ui/menu/panel_menu.png"
                    alt=""
                />

                <div className="game-over__content">
                    <h1 id="game-over-title">
                        BATTLE COMPLETE
                    </h1>

                    <strong className="game-over__score">
                        {snapshot.score}
                    </strong>

                    <p className="game-over__summary">
                        POINTS · {formattedTime} · {resultReason}
                    </p>

                    <div
                        className="game-over__registration"
                        aria-live="polite"
                    >
                        {isRegistering && <p>Saving battle result...</p>}

                        {isRegistered && <p>Battle result saved.</p>}

                        {hasRegistrationError && (
                            <>
                                <p>Could not save the battle result.</p>

                                <button
                                    type="button"
                                    className="menu-button"
                                    onClick={onRetryRegistration}
                                >
                                    TRY AGAIN
                                </button>
                            </>
                        )}
                    </div>

                    <div className="game-over__actions">
                        <button
                            type="button"
                            className="menu-button"
                            onClick={onRestart}
                        >
                            PLAY AGAIN
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            onClick={onMainMenu}
                        >
                            MAIN MENU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};