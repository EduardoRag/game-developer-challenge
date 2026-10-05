import { Sprite, Texture } from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

export class Player {
    public readonly sprite: Sprite;

    private health = GAME_CONFIG.player.maxHealth;

    constructor(texture: Texture) {
        this.sprite = new Sprite(texture);

        this.sprite.anchor.set(0.5);
    }

    public setPosition(x: number, y: number) {
        this.sprite.position.set(x, y);
    }

    public getHealth() {
        return this.health;
    }

    public moveForward(deltaTime: number) {
        const distance = GAME_CONFIG.player.moveSpeed * deltaTime;
        const direction = this.sprite.rotation + Math.PI / 2;

        this.sprite.x += Math.cos(direction) * distance;
        this.sprite.y += Math.sin(direction) * distance;
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
}