import { Projectile } from '../entities/Projectile';

import { CollisionSystem } from './CollisionSystem';

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class ProjectileSystem {
    private readonly projectiles: Projectile[] = [];

    public getProjectiles() {
        return this.projectiles;
    }

    public add(projectile: Projectile) {
        this.projectiles.push(projectile);
    }

    public update(deltaTime: number) {
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }
    }

    public destroy(index: number) {
        const projectile = this.projectiles[index];

        if (!projectile) {
            return;
        }

        projectile.sprite.removeFromParent();
        projectile.sprite.destroy();

        this.projectiles.splice(index, 1);
    }

    public removeInvalidProjectiles(
        arenaWidth: number,
        arenaHeight: number,
        obstacles: Obstacle[],
        collisionSystem: CollisionSystem,
    ) {
        for (
            let index = this.projectiles.length - 1;
            index >= 0;
            index--
        ) {
            const projectile = this.projectiles[index];
            const { x, y } = projectile.sprite;

            const outsideArena =
                x < 0 ||
                x > arenaWidth ||
                y < 0 ||
                y > arenaHeight;

            const hitObstacle =
                collisionSystem.isProjectileCollidingWithObstacle(
                    projectile,
                    obstacles,
                );

            if (outsideArena || hitObstacle) {
                this.destroy(index);
            }
        }
    }
}