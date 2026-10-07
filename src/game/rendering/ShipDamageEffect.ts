import { Container, type AnimatedSprite } from 'pixi.js';

import { FireEffect } from './FireEffect';

export class ShipDamageEffect {
    private readonly fire: AnimatedSprite | null;

    constructor(
        container: Container,
        scale = 1,
    ) {
        this.fire = FireEffect.create(container, scale);
    }

    public update(
        x: number,
        y: number,
        healthPercentage: number,
    ) {
        if (!this.fire) {
            return;
        }

        this.fire.position.set(x, y);

        if (healthPercentage > 0.6) {
            this.fire.visible = false;
            return;
        }

        this.fire.visible = true;

        if (healthPercentage > 0.3) {
            this.fire.alpha = 0.65;
            return;
        }

        this.fire.alpha = 1;
    }

    public destroy() {
        if (!this.fire) {
            return;
        }

        this.fire.removeFromParent();
        this.fire.destroy();
    }
}