export type GameState =
    | 'playing'
    | 'paused'
    | 'gameOver';

export type GameEndReason =
    | 'timeUp'
    | 'shipDestroyed';

export type GameSnapshot = {
    health: number;
    maxHealth: number;
    score: number;
    timeRemaining: number;
    elapsedTime: number;
    gameState: GameState;
    endReason: GameEndReason | null;
};