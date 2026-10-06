import { useState } from 'react';
import { MenuPanel } from '../../shared/components/MenuPanel';
import {
    DEFAULT_GAME_OPTIONS,
    GAME_OPTIONS_LIMITS,
    saveGameOptions,
} from './optionsStorage';

import type { GameOptions } from './types';

type OptionsScreenProps = {
    options: GameOptions;
    onSave: (options: GameOptions) => void;
    onBack: () => void;
};

export const OptionsScreen = ({
    options,
    onSave,
    onBack,
}: OptionsScreenProps) => {
    const [sessionDuration, setSessionDuration] = useState(
        options.sessionDuration,
    );
    const [enemySpawnInterval, setEnemySpawnInterval] = useState(
        options.enemySpawnInterval,
    );

    const isSessionDurationValid =
        sessionDuration >= GAME_OPTIONS_LIMITS.sessionDuration.min &&
        sessionDuration <= GAME_OPTIONS_LIMITS.sessionDuration.max;

    const isSpawnIntervalValid =
        enemySpawnInterval >=
        GAME_OPTIONS_LIMITS.enemySpawnInterval.min &&
        enemySpawnInterval <=
        GAME_OPTIONS_LIMITS.enemySpawnInterval.max;

    const isValid =
        isSessionDurationValid && isSpawnIntervalValid;

    const handleSave = () => {
        if (!isValid) {
            return;
        }

        const nextOptions: GameOptions = {
            sessionDuration,
            enemySpawnInterval,
        };

        saveGameOptions(nextOptions);
        onSave(nextOptions);
    };

    const handleReset = () => {
        setSessionDuration(
            DEFAULT_GAME_OPTIONS.sessionDuration,
        );
        setEnemySpawnInterval(
            DEFAULT_GAME_OPTIONS.enemySpawnInterval,
        );
    };

    return (
        <MenuPanel className="options-screen">
            <h1>OPTIONS</h1>

            <div className="options-screen__fields">
                <label className="options-screen__field">
                    <span>GAME SESSION TIME</span>

                    <div className="options-screen__input">
                        <input
                            type="number"
                            min={60}
                            max={180}
                            step={10}
                            value={sessionDuration}
                            onChange={(event) =>
                                setSessionDuration(
                                    Number(event.target.value),
                                )
                            }
                        />

                        <span>SEC</span>
                    </div>

                    <small>60 – 180 seconds</small>
                </label>

                <label className="options-screen__field">
                    <span>ENEMY SPAWN TIME</span>

                    <div className="options-screen__input">
                        <input
                            type="number"
                            min={2}
                            max={15}
                            step={1}
                            value={enemySpawnInterval}
                            onChange={(event) =>
                                setEnemySpawnInterval(
                                    Number(event.target.value),
                                )
                            }
                        />

                        <span>SEC</span>
                    </div>

                    <small>2 – 15 seconds</small>
                </label>
            </div>

            {!isValid && (
                <p
                    className="options-screen__error"
                    role="alert"
                >
                    Enter values within the allowed ranges.
                </p>
            )}

            <div className="options-screen__actions">
                <button
                    type="button"
                    className="menu-button"
                    disabled={!isValid}
                    onClick={handleSave}
                >
                    SAVE
                </button>

                <button
                    type="button"
                    className="options-screen__text-button"
                    onClick={handleReset}
                >
                    RESET DEFAULTS
                </button>

                <button
                    type="button"
                    className="options-screen__text-button"
                    onClick={onBack}
                >
                    BACK
                </button>
            </div>
        </MenuPanel>
    );
};