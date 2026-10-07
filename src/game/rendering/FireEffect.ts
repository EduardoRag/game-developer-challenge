import {
    AnimatedSprite,
    Assets,
    Container,
    type Texture,
} from 'pixi.js';

const FIRE_TEXTURE_PATHS = [
    '/assets/png/default/effects/fire_1.png',
    '/assets/png/default/effects/fire_2.png',
];

export class FireEffect {
    private static textures: Texture[] | null = null;

    public static async loadTextures() {
        if (this.textures) {
            return;
        }

        this.textures = await Promise.all(
            FIRE_TEXTURE_PATHS.map((path) =>
                Assets.load<Texture>(path),
            ),
        );
    }

    public static create(
        container: Container,
        scale = 1,
    ) {
        if (!this.textures) {
            return null;
        }

        const fire = new AnimatedSprite(this.textures);

        fire.anchor.set(0.5, 1);
        fire.scale.set(scale);

        fire.animationSpeed = 0.08;
        fire.loop = true;
        fire.visible = false;

        container.addChild(fire);

        fire.play();

        return fire;
    }
}