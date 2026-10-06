import type { GameSnapshot } from '../types/GameSnapshot';

type GameOverProps = {
    snapshot: GameSnapshot;
    onRestart: () => void;
    onMainMenu: () => void;
};

export const GameOver = ({
    snapshot,
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