import {
    Assets,
    Container,
    Sprite,
    Texture,
} from 'pixi.js';

import { Enemy } from '../entities/Enemy';

export class EnemyHealthBar {
    public readonly container = new Container();

    private readonly enemy: Enemy;
    private readonly frame: Sprite;
    private readonly fill: Sprite;

    private static frameTexture: Texture | null = null;
    private static greenFillTexture: Texture | null = null;
    private static redFillTexture: Texture | null = null;

    private constructor(
        enemy: Enemy,
        frameTexture: Texture,
        greenFillTexture: Texture,
    ) {
        this.enemy = enemy;

        this.frame = new Sprite(frameTexture);
        this.fill = new Sprite(greenFillTexture);

        this.container.addChild(this.frame, this.fill);

        this.update();
    }

    public static async create(enemy: Enemy) {
        const [
            frameTexture,
            greenFillTexture,
            redFillTexture,
        ] = await Promise.all([
            this.frameTexture ??
            Assets.load(
                '/assets/png/default/ui/hud/enemy_health_frame.png',
            ),
            this.greenFillTexture ??
            Assets.load(
                '/assets/png/default/ui/hud/enemy_health_fill_green.png',
            ),
            this.redFillTexture ??
            Assets.load(
                '/assets/png/default/ui/hud/enemy_health_fill_red.png',
            ),
        ]);

        this.frameTexture = frameTexture;
        this.greenFillTexture = greenFillTexture;
        this.redFillTexture = redFillTexture;

        return new EnemyHealthBar(
            enemy,
            frameTexture,
            greenFillTexture,
        );
    }

    public update() {
        const healthPercentage = Math.max(
            0,
            Math.min(1, this.enemy.getHealthPercentage()),
        );

        this.container.position.set(
            this.enemy.sprite.x - 40,
            this.enemy.sprite.y -
            this.enemy.sprite.height / 2 -
            20,
        );

        this.container.scale.set(0.5);

        this.fill.texture =
            healthPercentage > 0.5
                ? EnemyHealthBar.greenFillTexture!
                : EnemyHealthBar.redFillTexture!;

        this.fill.width = 160 * healthPercentage;
    }

    public destroy() {
        this.container.removeFromParent();
        this.container.destroy({
            children: true,
        });
    }
}