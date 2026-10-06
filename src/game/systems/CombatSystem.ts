import { GAME_CONFIG } from '../config/gameConfig';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { CollisionSystem } from './CollisionSystem';
import { ProjectileSystem } from './ProjectileSystem';

export class CombatSystem {
    public resolveProjectileHits(
        player: Player,
        enemies: Enemy[],
        projectileSystem: ProjectileSystem,
        collisionSystem: CollisionSystem,
    ) {
        const projectiles = projectileSystem.getProjectiles();

        for (
            let index = projectiles.length - 1;
            index >= 0;
            index--
        ) {
            const projectile = projectiles[index];

            if (projectile.owner === 'player') {
                const hitEnemy = enemies.find((enemy) =>
                    collisionSystem.isProjectileCollidingWithEnemy(
                        projectile,
                        enemy,
                    ),
                );

                if (hitEnemy) {
                    hitEnemy.takeDamage(
                        GAME_CONFIG.projectile.playerDamage,
                    );

                    projectileSystem.destroy(index);
                }

                continue;
            }

            if (
                projectile.owner === 'enemy' &&
                collisionSystem.isProjectileCollidingWithPlayer(
                    projectile,
                    player,
                )
            ) {
                player.takeDamage(
                    GAME_CONFIG.projectile.enemyDamage,
                );

                projectileSystem.destroy(index);
            }
        }
    }

    private resolveChaserContactDamage(
        enemy: Enemy,
        player: Player,
        collisionSystem: CollisionSystem,
        deltaTime: number,
    ) {
        enemy.updateContactDamageCooldown(deltaTime);

        if (
            !collisionSystem.isEnemyCollidingWithPlayer(
                enemy,
                player,
            ) ||
            !enemy.canDealContactDamage()
        ) {
            return;
        }

        player.takeDamage(
            GAME_CONFIG.enemy.chaser.contactDamage,
        );

        enemy.startContactDamageCooldown(
            GAME_CONFIG.enemy.chaser.contactDamageCooldown,
        );
    }

    public resolveChaserContacts(
        enemies: Enemy[],
        player: Player,
        collisionSystem: CollisionSystem,
        deltaTime: number,
    ) {
        for (const enemy of enemies) {
            if (enemy.type !== 'chaser') {
                continue;
            }

            this.resolveChaserContactDamage(
                enemy,
                player,
                collisionSystem,
                deltaTime,
            );
        }
    }
}