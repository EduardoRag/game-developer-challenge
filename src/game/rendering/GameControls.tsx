import type { GameControlsApi } from '../types/GameControls';
import { GameControlButton } from './GameControlButton';

type GameControlsProps = {
    controls: GameControlsApi;
    isPaused: boolean;
};

const CONTROL_ASSET_PATH = '/assets/png/default/ui/controls';

export const GameControls = ({
    controls,
    isPaused,
}: GameControlsProps) => {
    const createInputHandlers = (key: string) => ({
        onPointerDown: () => controls.press(key),
        onPointerUp: () => controls.release(key),
    });

    return (
        <div className="game-controls">
            <div className="game-controls__pause">
                <GameControlButton
                    icon={`${CONTROL_ASSET_PATH}/${isPaused ? 'icon_play.png' : 'icon_pause.png'}`}
                    label={isPaused ? 'Resume game' : 'Pause game'}
                    onClick={isPaused ? controls.resume : controls.pause}
                />
            </div>

            {!isPaused && (
                <>
                    <div className="game-controls__movement">
                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_turn_left.png`}
                            label="Turn left"
                            {...createInputHandlers('ArrowLeft')}
                        />

                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_forward.png`}
                            label="Move forward"
                            {...createInputHandlers('ArrowUp')}
                        />

                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_turn_right.png`}
                            label="Turn right"
                            {...createInputHandlers('ArrowRight')}
                        />
                    </div>

                    <div className="game-controls__attacks">
                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_fire_left.png`}
                            label="Fire left broadside"
                            {...createInputHandlers('KeyQ')}
                        />

                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_fire_front.png`}
                            label="Fire front cannon"
                            {...createInputHandlers('Space')}
                        />

                        <GameControlButton
                            icon={`${CONTROL_ASSET_PATH}/icon_fire_right.png`}
                            label="Fire right broadside"
                            {...createInputHandlers('KeyE')}
                        />
                    </div>
                </>
            )}
        </div>
    );
};