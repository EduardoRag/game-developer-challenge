type Position = {
    x: number;
    y: number;
};

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class SpawnSystem {
    private readonly enemySpawnInterval: number;
    private enemySpawnCooldown: number;
    private spawningEnemy = false;

    constructor(enemySpawnInterval: number) {
        this.enemySpawnInterval = enemySpawnInterval;
        this.enemySpawnCooldown = enemySpawnInterval;
    }

    public isPositionSafeFromPlayer(
        position: Position,
        playerPosition: Position,
        minDistance: number,
    ) {
        const distance = Math.hypot(
            position.x - playerPosition.x,
            position.y - playerPosition.y,
        );

        return distance >= minDistance;
    }

    public isPositionSafeFromObstacles(
        position: Position,
        obstacles: Obstacle[],
        padding: number,
    ) {
        return obstacles.every((obstacle) => {
            return (
                position.x < obstacle.x - padding ||
                position.x > obstacle.x + obstacle.width + padding ||
                position.y < obstacle.y - padding ||
                position.y > obstacle.y + obstacle.height + padding
            );
        });
    }

    public findSafePosition(
        width: number,
        height: number,
        playerPosition: Position,
        obstacles: Obstacle[],
    ) {
        const margin = 50;
        const minPlayerDistance = 250;
        const obstaclePadding = 40;
        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = {
                x: margin + Math.random() * (width - margin * 2),
                y: margin + Math.random() * (height - margin * 2),
            };

            const safeFromPlayer = this.isPositionSafeFromPlayer(
                position,
                playerPosition,
                minPlayerDistance,
            );

            const safeFromObstacles = this.isPositionSafeFromObstacles(
                position,
                obstacles,
                obstaclePadding,
            );

            if (safeFromPlayer && safeFromObstacles) {
                return position;
            }
        }

        return null;
    }

    public update(deltaTime: number) {
        this.enemySpawnCooldown = Math.max(
            0,
            this.enemySpawnCooldown - deltaTime,
        );
    }

    public canSpawnEnemy() {
        return this.enemySpawnCooldown <= 0;
    }

    public resetEnemySpawnCooldown() {
        this.enemySpawnCooldown = this.enemySpawnInterval;
    }

    public isSpawningEnemy() {
        return this.spawningEnemy;
    }

    public startEnemySpawn() {
        this.spawningEnemy = true;
    }

    public finishEnemySpawn() {
        this.spawningEnemy = false;
    }
}