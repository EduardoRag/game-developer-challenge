import { MenuPanel } from '../../shared/components/MenuPanel';
import {
    GAME_OPTIONS_LIMITS,
    saveGameOptions,
} from './optionsStorage';

import type { GameOptions } from './types';

import { MinusButton } from '../../shared/components/MinusButton';
import { PlusButton } from '../../shared/components/PlusButton';

type OptionsScreenProps = {
    options: GameOptions;
    onSave: (options: GameOptions) => void;
    onBack: () => void;
    backLabel?: string;
};

export const OptionsScreen = ({
    options,
    onSave,
    onBack,
    backLabel = 'MAIN MENU',
}: OptionsScreenProps) => {
    const updateOptions = (nextOptions: GameOptions) => {
        saveGameOptions(nextOptions);
        onSave(nextOptions);
    };

    const decreaseSessionDuration = () => {
        const nextValue = Math.max(
            GAME_OPTIONS_LIMITS.sessionDuration.min,
            options.sessionDuration - 10,
        );

        updateOptions({
            ...options,
            sessionDuration: nextValue,
        });
    };

    const increaseSessionDuration = () => {
        const nextValue = Math.min(
            GAME_OPTIONS_LIMITS.sessionDuration.max,
            options.sessionDuration + 10,
        );

        updateOptions({
            ...options,
            sessionDuration: nextValue,
        });
    };

    const decreaseEnemySpawnInterval = () => {
        const nextValue = Math.max(
            GAME_OPTIONS_LIMITS.enemySpawnInterval.min,
            options.enemySpawnInterval - 1,
        );

        updateOptions({
            ...options,
            enemySpawnInterval: nextValue,
        });
    };

    const increaseEnemySpawnInterval = () => {
        const nextValue = Math.min(
            GAME_OPTIONS_LIMITS.enemySpawnInterval.max,
            options.enemySpawnInterval + 1,
        );

        updateOptions({
            ...options,
            enemySpawnInterval: nextValue,
        });
    };

    return (
        <MenuPanel
            className="options-screen"
            panelClassName="options-screen__panel"
        >
            <h1 className="options-screen__title">
                OPTIONS
            </h1>

            <div className="options-screen__settings">
                <div className="options-screen__setting">
                    <span className="options-screen__label">
                        Game session time
                    </span>

                    <div className="options-screen__control">
                        <MinusButton
                            onClick={decreaseSessionDuration}
                            disabled={
                                options.sessionDuration <=
                                GAME_OPTIONS_LIMITS.sessionDuration.min
                            }
                            ariaLabel="Decrease game session time"
                        />

                        <span className="options-screen__value">
                            {options.sessionDuration} s
                        </span>

                        <PlusButton
                            onClick={increaseSessionDuration}
                            disabled={
                                options.sessionDuration >=
                                GAME_OPTIONS_LIMITS.sessionDuration.max
                            }
                            ariaLabel="Increase game session time"
                        />
                    </div>
                </div>

                <div className="options-screen__setting">
                    <span className="options-screen__label">
                        Enemy spawn time
                    </span>

                    <div className="options-screen__control">
                        <MinusButton
                            onClick={decreaseEnemySpawnInterval}
                            disabled={
                                options.enemySpawnInterval <=
                                GAME_OPTIONS_LIMITS.enemySpawnInterval.min
                            }
                            ariaLabel="Decrease enemy spawn time"
                        />

                        <span className="options-screen__value">
                            {options.enemySpawnInterval} s
                        </span>

                        <PlusButton
                            onClick={increaseEnemySpawnInterval}
                            disabled={
                                options.enemySpawnInterval >=
                                GAME_OPTIONS_LIMITS.enemySpawnInterval.max
                            }
                            ariaLabel="Increase enemy spawn time"
                        />
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="menu-button options-screen__back"
                onClick={onBack}
            >
                {backLabel}
            </button>
        </MenuPanel>
    );
};