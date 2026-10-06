import { Projectile } from '../entities/Projectile';

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
}