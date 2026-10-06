export type GameState = 'playing' | 'gameOver';

export type GameSnapshot = {
    health: number;
    maxHealth: number;
    score: number;
    timeRemaining: number;
    gameState: GameState;
};