import type { GameOptions } from './types';

const STORAGE_KEY = 'pirate-battle-options';

export const GAME_OPTIONS_LIMITS = {
    sessionDuration: {
        min: 60,
        max: 180,
    },
    enemySpawnInterval: {
        min: 2,
        max: 15,
    },
} as const;

export const DEFAULT_GAME_OPTIONS: GameOptions = {
    sessionDuration: 120,
    enemySpawnInterval: 5,
};

const isValidSessionDuration = (value: unknown): value is number => {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= GAME_OPTIONS_LIMITS.sessionDuration.min &&
        value <= GAME_OPTIONS_LIMITS.sessionDuration.max
    );
};

const isValidEnemySpawnInterval = (
    value: unknown,
): value is number => {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= GAME_OPTIONS_LIMITS.enemySpawnInterval.min &&
        value <= GAME_OPTIONS_LIMITS.enemySpawnInterval.max
    );
};

export const loadGameOptions = (): GameOptions => {
    const storedOptions = localStorage.getItem(STORAGE_KEY);

    if (!storedOptions) {
        return { ...DEFAULT_GAME_OPTIONS };
    }

    try {
        const parsedOptions = JSON.parse(
            storedOptions,
        ) as Partial<GameOptions>;

        return {
            sessionDuration: isValidSessionDuration(
                parsedOptions.sessionDuration,
            )
                ? parsedOptions.sessionDuration
                : DEFAULT_GAME_OPTIONS.sessionDuration,

            enemySpawnInterval: isValidEnemySpawnInterval(
                parsedOptions.enemySpawnInterval,
            )
                ? parsedOptions.enemySpawnInterval
                : DEFAULT_GAME_OPTIONS.enemySpawnInterval,
        };
    } catch {
        return { ...DEFAULT_GAME_OPTIONS };
    }
};

export const saveGameOptions = (
    options: GameOptions,
): void => {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(options),
    );
};