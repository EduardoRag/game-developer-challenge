import { Application, Assets, Texture } from 'pixi.js';
import { WorldRenderer } from '../rendering/WorldRenderer';

import { GAME_CONFIG } from '../config/gameConfig';

import { CollisionSystem } from '../systems/CollisionSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';

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

    private frontCannonCooldown = 0;
    private leftCannonCooldown = 0;
    private rightCannonCooldown = 0;

    private chaserContactCooldown = 0;

    private player: Player | null = null;
    private readonly enemies: Enemy[] = [];

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

        for (const enemy of this.enemies) {
            const playerPosition = this.player.getPosition();

            enemy.faceTarget(
                playerPosition.x,
                playerPosition.y,
            );

            const previousPosition = enemy.getPosition();

            enemy.moveForward(
                deltaTime,
                GAME_CONFIG.enemy.chaser.moveSpeed,
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

        this.frontCannonCooldown = Math.max(
            0,
            this.frontCannonCooldown - deltaTime,
        );

        this.leftCannonCooldown = Math.max(
            0,
            this.leftCannonCooldown - deltaTime,
        );

        this.rightCannonCooldown = Math.max(
            0,
            this.rightCannonCooldown - deltaTime,
        );

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
            this.frontCannonCooldown <= 0
        ) {
            this.fireFrontCannon();

            this.frontCannonCooldown =
                GAME_CONFIG.player.fireCooldown.front;
        }

        if (
            this.input.wasPressed('KeyQ') &&
            this.leftCannonCooldown <= 0
        ) {
            this.fireLeftCannon();

            this.leftCannonCooldown =
                GAME_CONFIG.player.fireCooldown.broadside;
        }

        if (
            this.input.wasPressed('KeyE') &&
            this.rightCannonCooldown <= 0
        ) {
            this.fireRightCannon();

            this.rightCannonCooldown =
                GAME_CONFIG.player.fireCooldown.broadside;
        }

        this.projectileSystem.update(deltaTime);

        const projectiles = this.projectileSystem.getProjectiles();

        for (let index = projectiles.length - 1; index >= 0; index--) {
            const projectile = projectiles[index];

            const hitEnemy = this.enemies.find((enemy) =>
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

        for (let index = this.enemies.length - 1; index >= 0; index--) {
            const enemy = this.enemies[index];

            if (!enemy.isDead()) {
                continue;
            }

            this.app.stage.removeChild(enemy.sprite);
            enemy.sprite.destroy();

            this.enemies.splice(index, 1);
        }

        this.input.clearFrameState();
    }

    private fireFrontCannon() {
        if (!this.player || !this.projectileTexture) {
            return;
        }

        const position = this.player.getFrontPosition();
        const direction = this.player.getForwardDirection();

        const projectile = new Projectile(
            this.projectileTexture,
            direction.x,
            direction.y,
        );

        projectile.sprite.position.set(position.x, position.y);

        this.projectileSystem.add(projectile);
        this.app.stage.addChild(projectile.sprite);
    }

    private fireLeftCannon() {
        if (!this.player) {
            return;
        }

        this.fireBroadside(
            this.player.getLeftPosition(),
            this.player.getLeftDirection(),
        );
    }

    private fireRightCannon() {
        if (!this.player) {
            return;
        }

        this.fireBroadside(
            this.player.getRightPosition(),
            this.player.getRightDirection(),
        );
    }

    private fireBroadside(
        position: { x: number; y: number },
        direction: { x: number; y: number },
    ) {
        if (!this.projectileTexture || !this.player) {
            return;
        }

        const forwardDirection = this.player.getForwardDirection();

        const spacing = 20;
        const spread = 0.2;

        const shots = [
            { offset: -spacing, spread: -spread },
            { offset: 0, spread: 0 },
            { offset: spacing, spread },
        ];

        for (const shot of shots) {
            const directionX =
                direction.x + forwardDirection.x * shot.spread;

            const directionY =
                direction.y + forwardDirection.y * shot.spread;

            const length = Math.hypot(directionX, directionY);

            const projectile = new Projectile(
                this.projectileTexture,
                directionX / length,
                directionY / length,
            );

            projectile.sprite.position.set(
                position.x + forwardDirection.x * shot.offset,
                position.y + forwardDirection.y * shot.offset,
            );

            this.projectileSystem.add(projectile);
            this.app.stage.addChild(projectile.sprite);
        }
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

        this.enemies.push(chaser);
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