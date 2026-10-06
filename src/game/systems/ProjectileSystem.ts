import { Projectile } from '../entities/Projectile';

export class ProjectileSystem {
    private readonly projectiles: Projectile[] = [];

    public getProjectiles() {
        return this.projectiles;
    }

    public add(projectile: Projectile) {
        this.projectiles.push(projectile);
    }

    public remove(index: number) {
        this.projectiles.splice(index, 1);
    }

    public update(deltaTime: number) {
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }
    }
}