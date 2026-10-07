import { Assets, type Container, type Texture } from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

import { Enemy, type EnemyType } from '../entities/Enemy';
import { Player } from '../entities/Player';

import { Projectile } from '../entities/Projectile';
import { CollisionSystem } from './CollisionSystem';
import { ProjectileSystem } from './ProjectileSystem';

import { EnemyHealthBar } from '../rendering/EnemyHealthBar';
import { ShipDamageEffect } from '../rendering/ShipDamageEffect';

export class EnemySystem {
    private readonly enemies: Enemy[] = [];
    private readonly healthBars = new Map<Enemy, EnemyHealthBar>();
    private readonly damageEffects = new Map<Enemy, ShipDamageEffect>();

    public async create(
        type: EnemyType,
        x: number,
        y: number,
        scale = 1,
    ) {
        const texturePath =
            type === 'chaser'
                ? '/assets/png/default/ships/ship_2.png'
                : '/assets/png/default/ships/ship_3.png';

        const texture = await Assets.load(texturePath);

        const enemy = new Enemy(texture, type, scale);

        enemy.setPosition(x, y);

        this.add(enemy);

        const healthBar = await EnemyHealthBar.create(enemy);

        this.healthBars.set(enemy, healthBar);

        return enemy;
    }

    public getEnemies() {
        return this.enemies;
    }

    public createDamageEffect(
        enemy: Enemy,
        container: Container,
        scale = 1,
    ) {
        const effect = new ShipDamageEffect(container, scale);

        this.damageEffects.set(enemy, effect);
    }

    public add(enemy: Enemy) {
        this.enemies.push(enemy);
    }

    private updateChaser(
        enemy: Enemy,
        player: Player,
        deltaTime: number,
    ) {
        const playerPosition = player.getPosition();

        enemy.faceTarget(
            playerPosition.x,
            playerPosition.y,
        );

        enemy.moveForward(
            deltaTime,
            GAME_CONFIG.enemy.chaser.moveSpeed,
        );
    }

    private updateShooter(
        enemy: Enemy,
        player: Player,
        deltaTime: number,
    ) {
        enemy.updateFireCooldown(deltaTime);

        const playerPosition = player.getPosition();
        const enemyPosition = enemy.getPosition();

        const distanceToPlayer = Math.hypot(
            playerPosition.x - enemyPosition.x,
            playerPosition.y - enemyPosition.y,
        );

        enemy.faceTarget(playerPosition.x, playerPosition.y);

        if (
            distanceToPlayer >
            GAME_CONFIG.enemy.shooter.preferredDistance
        ) {
            enemy.moveForward(
                deltaTime,
                GAME_CONFIG.enemy.shooter.moveSpeed,
            );

            return (
                distanceToPlayer <= GAME_CONFIG.enemy.shooter.fireRange &&
                enemy.canFire()
            );
        }

        if (
            distanceToPlayer <
            GAME_CONFIG.enemy.shooter.minDistance
        ) {
            enemy.moveForward(
                deltaTime,
                -GAME_CONFIG.enemy.shooter.moveSpeed,
            );
        }

        return (
            distanceToPlayer <= GAME_CONFIG.enemy.shooter.fireRange &&
            enemy.canFire()
        );
    }

    private fireAtPlayer(
        enemy: Enemy,
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        const enemyPosition = enemy.getPosition();
        const playerPosition = player.getPosition();

        const deltaX = playerPosition.x - enemyPosition.x;
        const deltaY = playerPosition.y - enemyPosition.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance === 0) {
            return null;
        }

        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        const projectile = new Projectile(
            projectileTexture,
            directionX,
            directionY,
            'enemy',
        );

        const spawnDistance = enemy.sprite.height / 2;

        projectile.sprite.position.set(
            enemyPosition.x + directionX * spawnDistance,
            enemyPosition.y + directionY * spawnDistance,
        );

        projectileSystem.add(projectile);

        enemy.startFireCooldown(
            GAME_CONFIG.enemy.shooter.fireCooldown,
        );

        return projectile;
    }

    public updateChaserBehavior(
        enemy: Enemy,
        player: Player,
        collisionSystem: CollisionSystem,
        obstacles: {
            x: number;
            y: number;
            width: number;
            height: number;
        }[],
        deltaTime: number,
    ) {
        const previousPosition = enemy.getPosition();

        this.updateChaser(enemy, player, deltaTime);

        if (
            collisionSystem.isEnemyCollidingWithObstacle(
                enemy,
                obstacles,
            )
        ) {
            enemy.setPosition(
                previousPosition.x,
                previousPosition.y,
            );
        }
    }

    public updateShooterBehavior(
        enemy: Enemy,
        player: Player,
        collisionSystem: CollisionSystem,
        obstacles: {
            x: number;
            y: number;
            width: number;
            height: number;
        }[],
        deltaTime: number,
    ) {
        const previousPosition = enemy.getPosition();

        const canFire = this.updateShooter(
            enemy,
            player,
            deltaTime,
        );

        if (
            collisionSystem.isEnemyCollidingWithObstacle(
                enemy,
                obstacles,
            )
        ) {
            enemy.setPosition(
                previousPosition.x,
                previousPosition.y,
            );
        }

        return canFire;
    }

    public update(
        player: Player,
        collisionSystem: CollisionSystem,
        obstacles: {
            x: number;
            y: number;
            width: number;
            height: number;
        }[],
        deltaTime: number,
    ) {
        const shootersReadyToFire: Enemy[] = [];

        for (const enemy of this.enemies) {
            switch (enemy.type) {
                case 'chaser':
                    this.updateChaserBehavior(
                        enemy,
                        player,
                        collisionSystem,
                        obstacles,
                        deltaTime,
                    );
                    break;

                case 'shooter': {
                    const canFire = this.updateShooterBehavior(
                        enemy,
                        player,
                        collisionSystem,
                        obstacles,
                        deltaTime,
                    );

                    if (canFire) {
                        shootersReadyToFire.push(enemy);
                    }

                    break;
                }
            }
        }

        for (const enemy of this.enemies) {
            this.healthBars.get(enemy)?.update();

            const damageEffect = this.damageEffects.get(enemy);

            if (damageEffect) {
                const position = enemy.getPosition();

                damageEffect.update(
                    position.x,
                    position.y,
                    enemy.getHealthPercentage(),
                );
            }
        }

        return shootersReadyToFire;
    }

    public destroyEnemy(enemy: Enemy) {
        const index = this.enemies.indexOf(enemy);

        if (index === -1) {
            return;
        }

        const healthBar = this.healthBars.get(enemy);

        healthBar?.destroy();
        this.healthBars.delete(enemy);

        const damageEffect = this.damageEffects.get(enemy);

        damageEffect?.destroy();
        this.damageEffects.delete(enemy);

        enemy.sprite.removeFromParent();
        enemy.sprite.destroy();

        this.enemies.splice(index, 1);
    }

    public destroyDeadEnemies() {
        let destroyedCount = 0;

        for (let index = this.enemies.length - 1; index >= 0; index--) {
            const enemy = this.enemies[index];

            if (!enemy.isDead()) {
                continue;
            }

            this.destroyEnemy(enemy);
            destroyedCount++;
        }

        return destroyedCount;
    }

    public fireShooters(
        shooters: Enemy[],
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        const projectiles: Projectile[] = [];

        for (const shooter of shooters) {
            const projectile = this.fireAtPlayer(
                shooter,
                player,
                projectileTexture,
                projectileSystem,
            );

            if (projectile) {
                projectiles.push(projectile);
            }
        }

        return projectiles;
    }

    public getHealthBar(enemy: Enemy) {
        return this.healthBars.get(enemy);
    }
}