import {
    AnimatedSprite,
    Assets,
    Container,
    type Texture,
} from 'pixi.js';

const EXPLOSION_TEXTURE_PATHS = [
    '/assets/png/default/effects/explosion_1.png',
    '/assets/png/default/effects/explosion_2.png',
    '/assets/png/default/effects/explosion_3.png',
];

export class ExplosionEffect {
    private static textures: Texture[] | null = null;

    public static async loadTextures() {
        if (this.textures) {
            return;
        }

        this.textures = await Promise.all(
            EXPLOSION_TEXTURE_PATHS.map((path) =>
                Assets.load<Texture>(path),
            ),
        );
    }

    public static play(
        container: Container,
        x: number,
        y: number,
        scale = 1,
    ) {
        if (!this.textures) {
            return;
        }

        const explosion = new AnimatedSprite(this.textures);

        explosion.anchor.set(0.5);
        explosion.position.set(x, y);
        explosion.scale.set(scale);

        explosion.animationSpeed = 0.18;
        explosion.loop = false;

        explosion.onComplete = () => {
            explosion.removeFromParent();
            explosion.destroy();
        };

        container.addChild(explosion);

        explosion.play();
    }
}