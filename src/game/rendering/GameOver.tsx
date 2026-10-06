import type { GameSnapshot } from '../types/GameSnapshot';

type GameOverProps = {
    snapshot: GameSnapshot;
    onRestart: () => void;
};

export const GameOver = ({
    snapshot,
    onRestart,
}: GameOverProps) => {
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
                    <h1 id="game-over-title">Game Over</h1>

                    <p className="game-over__score">
                        Score: {snapshot.score}
                    </p>

                    <button
                        className="game-over__restart"
                        type="button"
                        onClick={onRestart}
                    >
                        <span>Play Again</span>
                    </button>
                </div>
            </div>
        </div>
    );
};