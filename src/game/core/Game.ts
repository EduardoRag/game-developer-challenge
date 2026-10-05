import { Application, Assets } from 'pixi.js';
import { Player } from '../entities/Player';
import { InputManager } from '../input/InputManager';

export class Game {
    private readonly app: Application;
    private readonly container: HTMLDivElement;
    private readonly input = new InputManager();

    private player: Player | null = null;

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

        await this.createPlayer();

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

        if (this.input.isPressed('KeyW', 'ArrowUp')) {
            this.player.moveForward(deltaTime);
        }

        if (this.input.isPressed('KeyA', 'ArrowLeft')) {
            this.player.rotate(-1, deltaTime);
        }

        if (this.input.isPressed('KeyD', 'ArrowRight')) {
            this.player.rotate(1, deltaTime);
        }

        this.player.constrainToBounds(
            this.app.screen.width,
            this.app.screen.height,
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
}