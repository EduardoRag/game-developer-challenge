import type { EnemyType } from '../entities/Enemy';
import type { GameEndReason, GameState } from './GameSnapshot';

export type GameDebugSnapshot = {
    player: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        health: number;
    };
    enemies: Array<{
        type: EnemyType;
        x: number;
        y: number;
        health: number;
    }>;
    score: number;
    timeRemaining: number;
    elapsedTime: number;
    gameState: GameState;
    endReason: GameEndReason | null;
    arena: {
        width: number;
        height: number;
    };
    obstacles: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    projectiles: {
        player: number;
        enemy: number;
        items: Array<{
            owner: 'player' | 'enemy';
            x: number;
            y: number;
        }>;
    };
};