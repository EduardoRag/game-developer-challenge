import { Sprite, Texture } from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

export class Player {
    public readonly sprite: Sprite;

    private health = GAME_CONFIG.player.maxHealth;

    constructor(texture: Texture) {
        this.sprite = new Sprite(texture);

        this.sprite.anchor.set(0.5);
    }

    public getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y,
        };
    }

    public setPosition(x: number, y: number) {
        this.sprite.position.set(x, y);
    }

    public getHealth() {
        return this.health;
    }

    public getForwardMovement(deltaTime: number) {
        const distance = GAME_CONFIG.player.moveSpeed * deltaTime;
        const direction = this.sprite.rotation + Math.PI / 2;

        return {
            x: Math.cos(direction) * distance,
            y: Math.sin(direction) * distance,
        };
    }

    public getForwardDirection() {
        const direction = this.sprite.rotation + Math.PI / 2;

        return {
            x: Math.cos(direction),
            y: Math.sin(direction),
        };
    }

    public getFrontPosition() {
        const direction = this.getForwardDirection();
        const distanceFromCenter = this.sprite.height / 2;

        return {
            x: this.sprite.x + direction.x * distanceFromCenter,
            y: this.sprite.y + direction.y * distanceFromCenter,
        };
    }

    public move(x: number, y: number) {
        this.sprite.x += x;
        this.sprite.y += y;
    }

    public rotate(direction: number, deltaTime: number) {
        this.sprite.rotation +=
            direction * GAME_CONFIG.player.rotationSpeed * deltaTime;
    }

    public constrainToBounds(width: number, height: number) {
        const halfWidth = this.sprite.width / 2;
        const halfHeight = this.sprite.height / 2;

        this.sprite.x = Math.max(
            halfWidth,
            Math.min(width - halfWidth, this.sprite.x),
        );

        this.sprite.y = Math.max(
            halfHeight,
            Math.min(height - halfHeight, this.sprite.y),
        );
    }

    public getBounds() {
        return this.sprite.getBounds();
    }
}