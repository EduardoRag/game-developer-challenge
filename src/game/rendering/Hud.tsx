import type { GameSnapshot } from '../types/GameSnapshot';

type HudProps = {
    snapshot: GameSnapshot;
};

export const Hud = ({ snapshot }: HudProps) => {
    const healthPercentage = Math.max(
        0,
        Math.min(
            100,
            (snapshot.health / snapshot.maxHealth) * 100,
        ),
    );

    const minutes = Math.floor(snapshot.timeRemaining / 60);
    const seconds = snapshot.timeRemaining % 60;

    const formattedTime = `${minutes}:${seconds
        .toString()
        .padStart(2, '0')}`;

    return (
        <div className="hud">
            <div className="player-health">
                <img
                    className="player-health__heart"
                    src="/assets/png/default/ui/hud/icon_heart.png"
                    alt=""
                />

                <div className="player-health__bar">
                    <div
                        className="player-health__fill"
                        style={{
                            width: `${healthPercentage}%`,
                        }}
                    />

                    <img
                        className="player-health__frame"
                        src="/assets/png/default/ui/hud/health_frame.png"
                        alt=""
                    />

                    <span className="player-health__text">
                        {snapshot.health} / {snapshot.maxHealth}
                    </span>
                </div>
            </div>

            <div className="score-counter">
                <img
                    className="score-counter__panel"
                    src="/assets/png/default/ui/hud/counter_panel.png"
                    alt=""
                />

                <div className="score-counter__content">
                    <img
                        className="score-counter__icon"
                        src="/assets/png/default/ui/hud/icon_score.png"
                        alt=""
                    />

                    <span className="score-counter__value">
                        {snapshot.score}
                    </span>
                </div>
            </div>

            <div className="time-counter">
                <img
                    className="time-counter__panel"
                    src="/assets/png/default/ui/hud/counter_panel.png"
                    alt=""
                />

                <div className="time-counter__content">
                    <img
                        className="time-counter__icon"
                        src="/assets/png/default/ui/hud/icon_time.png"
                        alt=""
                    />

                    <span className="time-counter__value">
                        {formattedTime}
                    </span>
                </div>
            </div>
        </div>
    );
};