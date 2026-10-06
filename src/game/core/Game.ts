import { Application, Assets, Texture } from 'pixi.js';
import { WorldRenderer } from '../rendering/WorldRenderer';

import { GAME_CONFIG } from '../config/gameConfig';

import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

import type { EnemyType } from '../entities/Enemy';
import { InputManager } from '../input/InputManager';

type GameState = 'playing' | 'gameOver';

export class Game {
    private readonly app: Application;
    private readonly container: HTMLDivElement;
    private gameState: GameState = 'playing';

    private readonly world = new WorldRenderer();
    private readonly input = new InputManager();
    private readonly collisionSystem = new CollisionSystem();
    private readonly weaponSystem = new WeaponSystem();
    private readonly enemySystem = new EnemySystem();
    private readonly spawnSystem = new SpawnSystem();
    private readonly playerSystem = new PlayerSystem();

    private chaserContactCooldown = 0;

    private player: Player | null = null;

    private projectileTexture: Texture | null = null;
    private readonly projectileSystem = new ProjectileSystem();

    private initialized = false;
    private destroyed = false;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.app = new Application();
    }

    public async initialize() {
        await this.app.init({
            background: '#1b7895',
            resizeTo: this.container,
            antialias: true,
        });

        this.initialized = true;

        if (this.destroyed) {
            this.destroyApplication();
            return;
        }

        this.container.appendChild(this.app.canvas);

        await this.world.initialize(
            this.app.screen.width,
            this.app.screen.height,
        );

        if (this.destroyed) {
            return;
        }

        this.app.stage.addChild(this.world.container);

        await this.createPlayer();

        if (this.destroyed) {
            return;
        }

        await this.spawnEnemy('chaser');

        if (this.destroyed) {
            return;
        }

        await this.spawnEnemy('shooter');

        if (this.destroyed) {
            return;
        }

        this.projectileTexture = await Assets.load(
            '/assets/png/default/ship_parts/cannon_ball.png',
        );

        if (this.destroyed) {
            return;
        }

        this.input.start();
        this.app.ticker.add(this.handleTick);
    }

    public destroy() {
        this.destroyed = true;

        this.input.stop();

        if (this.initialized) {
            this.app.ticker.remove(this.handleTick);
            this.destroyApplication();
        }
    }

    private readonly handleTick = () => {
        const deltaTime = this.app.ticker.deltaMS / 1000;

        this.update(deltaTime);
    };

    private update(deltaTime: number) {
        if (!this.player) {
            return;
        }

        if (this.gameState !== 'playing') {
            this.input.clearFrameState();
            return;
        }

        const enemies = this.enemySystem.getEnemies();

        for (const enemy of enemies) {
            if (enemy.type === 'chaser') {
                const previousPosition = enemy.getPosition();

                this.enemySystem.updateChaser(
                    enemy,
                    this.player,
                    deltaTime,
                );

                if (
                    this.collisionSystem.isEnemyCollidingWithObstacle(
                        enemy,
                        this.world.obstacles,
                    )
                ) {
                    enemy.setPosition(
                        previousPosition.x,
                        previousPosition.y,
                    );
                }

                if (
                    this.collisionSystem.isEnemyCollidingWithPlayer(
                        enemy,
                        this.player,
                    ) &&
                    this.chaserContactCooldown <= 0
                ) {
                    this.player.takeDamage(
                        GAME_CONFIG.enemy.chaser.contactDamage,
                    );

                    this.chaserContactCooldown =
                        GAME_CONFIG.enemy.chaser.contactDamageCooldown;
                }
            }

            if (enemy.type === 'shooter') {
                const previousPosition = enemy.getPosition();

                const canFire = this.enemySystem.updateShooter(
                    enemy,
                    this.player,
                    deltaTime,
                );

                if (
                    this.collisionSystem.isEnemyCollidingWithObstacle(
                        enemy,
                        this.world.obstacles,
                    )
                ) {
                    enemy.setPosition(
                        previousPosition.x,
                        previousPosition.y,
                    );
                }

                if (canFire && this.projectileTexture) {
                    const projectile = this.enemySystem.fireAtPlayer(
                        enemy,
                        this.player,
                        this.projectileTexture,
                        this.projectileSystem,
                    );

                    if (projectile) {
                        this.app.stage.addChild(projectile.sprite);
                    }
                }
            }

        }

        this.weaponSystem.update(deltaTime);

        this.chaserContactCooldown = Math.max(
            0,
            this.chaserContactCooldown - deltaTime,
        );

        this.playerSystem.updateMovement(
            this.player,
            this.input,
            this.collisionSystem,
            this.world.obstacles,
            this.app.screen.width,
            this.app.screen.height,
            deltaTime,
        );

        if (
            this.input.wasPressed('Space') &&
            this.weaponSystem.canFireFront() &&
            this.projectileTexture
        ) {
            const projectile = this.weaponSystem.fireFront(
                this.player,
                this.projectileTexture,
                this.projectileSystem,
            );

            this.app.stage.addChild(projectile.sprite);
            this.weaponSystem.startFrontCooldown();
        }

        if (
            this.input.wasPressed('KeyQ') &&
            this.weaponSystem.canFireLeftBroadside() &&
            this.projectileTexture
        ) {
            const projectiles = this.weaponSystem.fireLeftBroadside(
                this.player,
                this.projectileTexture,
                this.projectileSystem,
            );

            for (const projectile of projectiles) {
                this.app.stage.addChild(projectile.sprite);
            }

            this.weaponSystem.startLeftBroadsideCooldown();
        }

        if (
            this.input.wasPressed('KeyE') &&
            this.weaponSystem.canFireRightBroadside() &&
            this.projectileTexture
        ) {
            const projectiles = this.weaponSystem.fireRightBroadside(
                this.player,
                this.projectileTexture,
                this.projectileSystem,
            );

            for (const projectile of projectiles) {
                this.app.stage.addChild(projectile.sprite);
            }

            this.weaponSystem.startRightBroadsideCooldown();
        }

        this.projectileSystem.update(deltaTime);

        const projectiles = this.projectileSystem.getProjectiles();

        for (let index = projectiles.length - 1; index >= 0; index--) {
            const projectile = projectiles[index];

            if (projectile.owner === 'player') {
                const hitEnemy = enemies.find((enemy) =>
                    this.collisionSystem.isProjectileCollidingWithEnemy(
                        projectile,
                        enemy,
                    ),
                );

                if (hitEnemy) {
                    hitEnemy.takeDamage(GAME_CONFIG.projectile.playerDamage);

                    this.app.stage.removeChild(projectile.sprite);
                    projectile.sprite.destroy();
                    this.projectileSystem.remove(index);

                    continue;
                }
            }

            if (
                projectile.owner === 'enemy' &&
                this.collisionSystem.isProjectileCollidingWithPlayer(
                    projectile,
                    this.player,
                )
            ) {
                this.player.takeDamage(GAME_CONFIG.projectile.enemyDamage);

                this.app.stage.removeChild(projectile.sprite);
                projectile.sprite.destroy();
                this.projectileSystem.remove(index);

                continue;
            }

            if (
                this.isProjectileOutsideArena(projectile) ||
                this.collisionSystem.isProjectileCollidingWithObstacle(
                    projectile,
                    this.world.obstacles,
                )
            ) {
                this.app.stage.removeChild(projectile.sprite);
                projectile.sprite.destroy();

                this.projectileSystem.remove(index);
            }
        }

        const deadEnemies = this.enemySystem.removeDeadEnemies();

        for (const enemy of deadEnemies) {
            this.app.stage.removeChild(enemy.sprite);
            enemy.sprite.destroy();
        }

        if (this.player.isDead()) {
            this.gameState = 'gameOver';
        }

        this.input.clearFrameState();
    }

    private isProjectileOutsideArena(projectile: Projectile) {
        const { x, y } = projectile.sprite;

        return (
            x < 0 ||
            x > this.app.screen.width ||
            y < 0 ||
            y > this.app.screen.height
        );
    }

    private async createPlayer() {
        const texture = await Assets.load(
            '/assets/png/default/ships/ship_1.png',
        );

        if (this.destroyed) {
            return;
        }

        this.player = new Player(texture);

        this.player.setPosition(
            this.app.screen.width / 2,
            this.app.screen.height / 2,
        );

        this.app.stage.addChild(this.player.sprite);
    }

    private destroyApplication() {
        this.app.destroy(true, {
            children: true,
            texture: false,
            textureSource: false,
        });
    }

    private async spawnEnemy(type: EnemyType) {
        if (!this.player) {
            return;
        }

        const position = this.spawnSystem.findSafePosition(
            this.app.screen.width,
            this.app.screen.height,
            this.player.getPosition(),
            this.world.obstacles,
        );

        if (!position) {
            return;
        }

        const enemy = await this.enemySystem.create(
            type,
            position.x,
            position.y,
        );

        if (this.destroyed) {
            enemy.sprite.destroy();
            return;
        }

        this.app.stage.addChild(enemy.sprite);
    }
}