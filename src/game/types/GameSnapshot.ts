export type GameState =
    | 'playing'
    | 'paused'
    | 'gameOver';

export type GameSnapshot = {
    health: number;
    maxHealth: number;
    score: number;
    timeRemaining: number;
    gameState: GameState;
};