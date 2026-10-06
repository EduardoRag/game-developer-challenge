import { Sprite, Texture } from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

export type ProjectileOwner = 'player' | 'enemy';
export class Projectile {
    public readonly owner: ProjectileOwner;
    public readonly sprite: Sprite;

    private readonly directionX: number;
    private readonly directionY: number;

    constructor(
        texture: Texture,
        directionX: number,
        directionY: number,
        owner: ProjectileOwner,
    ) {
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);

        this.directionX = directionX;
        this.directionY = directionY;
        this.owner = owner;
    }

    public update(deltaTime: number) {
        const distance = GAME_CONFIG.projectile.speed * deltaTime;

        this.sprite.x += this.directionX * distance;
        this.sprite.y += this.directionY * distance;
    }
}