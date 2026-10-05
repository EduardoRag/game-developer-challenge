import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class CollisionSystem {
    public isPlayerCollidingWithObstacle(
        player: Player,
        obstacles: Obstacle[],
    ) {
        const playerBounds = player.getBounds();

        return obstacles.some((obstacle) => {
            return (
                playerBounds.x < obstacle.x + obstacle.width &&
                playerBounds.x + playerBounds.width > obstacle.x &&
                playerBounds.y < obstacle.y + obstacle.height &&
                playerBounds.y + playerBounds.height > obstacle.y
            );
        });
    }

    public isEnemyCollidingWithObstacle(
        enemy: Enemy,
        obstacles: Obstacle[],
    ) {
        const enemyBounds = enemy.getBounds();

        return obstacles.some((obstacle) => {
            return (
                enemyBounds.x < obstacle.x + obstacle.width &&
                enemyBounds.x + enemyBounds.width > obstacle.x &&
                enemyBounds.y < obstacle.y + obstacle.height &&
                enemyBounds.y + enemyBounds.height > obstacle.y
            );
        });
    }

    public isProjectileCollidingWithObstacle(
        projectile: Projectile,
        obstacles: Obstacle[],
    ) {
        const projectileBounds = projectile.sprite.getBounds();

        return obstacles.some((obstacle) => {
            return (
                projectileBounds.x < obstacle.x + obstacle.width &&
                projectileBounds.x + projectileBounds.width > obstacle.x &&
                projectileBounds.y < obstacle.y + obstacle.height &&
                projectileBounds.y + projectileBounds.height > obstacle.y
            );
        });
    }
}