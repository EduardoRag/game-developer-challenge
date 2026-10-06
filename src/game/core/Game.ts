import { Application, Assets, Texture } from 'pixi.js';
import { WorldRenderer } from '../rendering/WorldRenderer';

import { GAME_CONFIG } from '../config/gameConfig';

import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

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

        await this.createChaser(
            this.app.screen.width * 0.75,
            this.app.screen.height * 0.5,
        );

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

                console.log(
                    'Player health:',
                    this.player.getHealth(),
                );
            }
        }

        this.weaponSystem.update(deltaTime);

        this.chaserContactCooldown = Math.max(
            0,
            this.chaserContactCooldown - deltaTime,
        );

        if (this.input.isPressed('KeyA', 'ArrowLeft')) {
            this.player.rotate(-1, deltaTime);
        }

        if (this.input.isPressed('KeyD', 'ArrowRight')) {
            this.player.rotate(1, deltaTime);
        }

        if (this.input.isPressed('KeyW', 'ArrowUp')) {
            const movement = this.player.getForwardMovement(deltaTime);

            this.player.move(movement.x, 0);

            if (
                this.collisionSystem.isPlayerCollidingWithObstacle(
                    this.player,
                    this.world.obstacles,
                )
            ) {
                this.player.move(-movement.x, 0);
            }

            this.player.move(0, movement.y);

            if (
                this.collisionSystem.isPlayerCollidingWithObstacle(
                    this.player,
                    this.world.obstacles,
                )
            ) {
                this.player.move(0, -movement.y);
            }
        }

        this.player.constrainToBounds(
            this.app.screen.width,
            this.app.screen.height,
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

            const hitEnemy = enemies.find((enemy) =>
                this.collisionSystem.isProjectileCollidingWithEnemy(
                    projectile,
                    enemy,
                ),
            );

            if (hitEnemy) {
                hitEnemy.takeDamage(GAME_CONFIG.projectile.damage);

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

    private async createChaser(x: number, y: number) {
        const texture = await Assets.load(
            '/assets/png/default/ships/ship_2.png',
        );

        if (this.destroyed) {
            return;
        }

        const chaser = new Enemy(texture, 'chaser');

        chaser.setPosition(x, y);

        this.enemySystem.add(chaser);
        this.app.stage.addChild(chaser.sprite);
    }

    private destroyApplication() {
        this.app.destroy(true, {
            children: true,
            texture: false,
            textureSource: false,
        });
    }
}