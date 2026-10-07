/// <reference types="vite/client" />

import type { GameDebugSnapshot } from './game/types/GameDebugSnapshot';

declare global {
    interface Window {
        __PIRATE_BATTLE_E2E__?: {
            getSnapshot: () => GameDebugSnapshot | null;
            setEnemyPosition: (
                index: number,
                x: number,
                y: number,
            ) => void;
            setEnemiesFrozen: (frozen: boolean) => void;
            setTimeRemaining: (timeRemaining: number) => void;
            damagePlayer: (damage: number) => void;
            setWeaponCooldownsFrozen: (frozen: boolean) => void;
        };
    }
}

export { };

