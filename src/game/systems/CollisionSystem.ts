import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

type Rectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type Obstacle = Rectangle;

export class CollisionSystem {
    private intersects(a: Rectangle, b: Rectangle) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    public isPlayerCollidingWithObstacle(
        player: Player,
        obstacles: Obstacle[],
    ) {
        const playerBounds = player.getBounds();

        return obstacles.some((obstacle) =>
            this.intersects(playerBounds, obstacle),
        );
    }

    public isEnemyCollidingWithObstacle(
        enemy: Enemy,
        obstacles: Obstacle[],
    ) {
        const enemyBounds = enemy.getBounds();

        return obstacles.some((obstacle) =>
            this.intersects(enemyBounds, obstacle),
        );
    }

    public isProjectileCollidingWithObstacle(
        projectile: Projectile,
        obstacles: Obstacle[],
    ) {
        const projectileBounds = projectile.sprite.getBounds();

        return obstacles.some((obstacle) =>
            this.intersects(projectileBounds, obstacle),
        );
    }

    public isProjectileCollidingWithEnemy(
        projectile: Projectile,
        enemy: Enemy,
    ) {
        return this.intersects(
            projectile.sprite.getBounds(),
            enemy.getBounds(),
        );
    }

    public isEnemyCollidingWithPlayer(
        enemy: Enemy,
        player: Player,
    ) {
        return this.intersects(
            enemy.getBounds(),
            player.getBounds(),
        );
    }
}