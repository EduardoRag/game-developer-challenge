import { Assets, type Texture } from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

import { Enemy, type EnemyType } from '../entities/Enemy';
import { Player } from '../entities/Player';

import { Projectile } from '../entities/Projectile';
import { ProjectileSystem } from './ProjectileSystem';


export class EnemySystem {
    private readonly enemies: Enemy[] = [];

    public async create(
        type: EnemyType,
        x: number,
        y: number,
    ) {
        const texturePath =
            type === 'chaser'
                ? '/assets/png/default/ships/ship_2.png'
                : '/assets/png/default/ships/ship_3.png';

        const texture = await Assets.load(texturePath);

        const enemy = new Enemy(texture, type);

        enemy.setPosition(x, y);

        this.add(enemy);

        return enemy;
    }

    public getEnemies() {
        return this.enemies;
    }

    public add(enemy: Enemy) {
        this.enemies.push(enemy);
    }

    public updateChaser(
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

    public updateShooter(
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

    public removeDeadEnemies() {
        const removedEnemies: Enemy[] = [];

        for (let index = this.enemies.length - 1; index >= 0; index--) {
            const enemy = this.enemies[index];

            if (!enemy.isDead()) {
                continue;
            }

            this.enemies.splice(index, 1);
            removedEnemies.push(enemy);
        }

        return removedEnemies;
    }

    public fireAtPlayer(
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
}