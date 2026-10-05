import { Application, Assets, Texture } from 'pixi.js';
import { WorldRenderer } from '../rendering/WorldRenderer';


import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

import { InputManager } from '../input/InputManager';

export class Game {
    private readonly app: Application;
    private readonly container: HTMLDivElement;

    private readonly world = new WorldRenderer();
    private readonly input = new InputManager();

    private player: Player | null = null;
    private projectileTexture: Texture | null = null;
    private readonly projectiles: Projectile[] = [];

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

        if (this.input.isPressed('KeyA', 'ArrowLeft')) {
            this.player.rotate(-1, deltaTime);
        }

        if (this.input.isPressed('KeyD', 'ArrowRight')) {
            this.player.rotate(1, deltaTime);
        }

        if (this.input.isPressed('KeyW', 'ArrowUp')) {
            const movement = this.player.getForwardMovement(deltaTime);

            this.player.move(movement.x, 0);

            if (this.isPlayerCollidingWithObstacle()) {
                this.player.move(-movement.x, 0);
            }

            this.player.move(0, movement.y);

            if (this.isPlayerCollidingWithObstacle()) {
                this.player.move(0, -movement.y);
            }
        }

        this.player.constrainToBounds(
            this.app.screen.width,
            this.app.screen.height,
        );

        if (this.input.wasPressed('Space')) {
            this.fireFrontCannon();
        }

        for (let index = this.projectiles.length - 1; index >= 0; index--) {
            const projectile = this.projectiles[index];

            projectile.update(deltaTime);

            if (
                this.isProjectileOutsideArena(projectile) ||
                this.isProjectileCollidingWithObstacle(projectile)
            ) {
                this.app.stage.removeChild(projectile.sprite);
                projectile.sprite.destroy();

                this.projectiles.splice(index, 1);
            }
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

        this.projectiles.push(projectile);
        this.app.stage.addChild(projectile.sprite);
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

    private isProjectileCollidingWithObstacle(projectile: Projectile) {
        const projectileBounds = projectile.sprite.getBounds();

        return this.world.obstacles.some((obstacle) => {
            return (
                projectileBounds.x < obstacle.x + obstacle.width &&
                projectileBounds.x + projectileBounds.width > obstacle.x &&
                projectileBounds.y < obstacle.y + obstacle.height &&
                projectileBounds.y + projectileBounds.height > obstacle.y
            );
        });
    }

    private isPlayerCollidingWithObstacle() {
        if (!this.player) {
            return false;
        }

        const playerBounds = this.player.getBounds();

        return this.world.obstacles.some((obstacle) => {
            return (
                playerBounds.x < obstacle.x + obstacle.width &&
                playerBounds.x + playerBounds.width > obstacle.x &&
                playerBounds.y < obstacle.y + obstacle.height &&
                playerBounds.y + playerBounds.height > obstacle.y
            );
        });
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
}