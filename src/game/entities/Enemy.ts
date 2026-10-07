import { Sprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../config/gameConfig';

export type EnemyType = 'chaser' | 'shooter';

export class Enemy {
    public readonly sprite: Sprite;
    public readonly type: EnemyType;
    public readonly sunkTexture: Texture;

    private readonly damagedTexture: Texture;
    private readonly criticalTexture: Texture;

    private health: number;
    private fireCooldown = 0;

    constructor(
        normalTexture: Texture,
        damagedTexture: Texture,
        criticalTexture: Texture,
        sunkTexture: Texture,
        type: EnemyType,
        scale = 1,
    ) {
        this.sprite = new Sprite(normalTexture);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(scale);

        this.damagedTexture = damagedTexture;
        this.criticalTexture = criticalTexture;
        this.sunkTexture = sunkTexture;
        this.type = type;

        this.health = this.getMaxHealth();
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

    public faceTarget(targetX: number, targetY: number) {
        const deltaX = targetX - this.sprite.x;
        const deltaY = targetY - this.sprite.y;

        this.sprite.rotation =
            Math.atan2(deltaY, deltaX) - Math.PI / 2;
    }

    public moveForward(deltaTime: number, speed: number) {
        const direction = this.sprite.rotation + Math.PI / 2;
        const distance = speed * deltaTime;

        this.sprite.x += Math.cos(direction) * distance;
        this.sprite.y += Math.sin(direction) * distance;
    }

    public getBounds() {
        return this.sprite.getBounds();
    }

    public takeDamage(damage: number) {
        this.health = Math.max(0, this.health - damage);
        this.updateDamageTexture();
    }

    private updateDamageTexture() {
        const healthPercentage = this.getHealthPercentage();

        if (healthPercentage <= 0.3) {
            this.sprite.texture = this.criticalTexture;
            return;
        }

        if (healthPercentage <= 0.6) {
            this.sprite.texture = this.damagedTexture;
        }
    }

    public isDead() {
        return this.health <= 0;
    }

    public getHealth() {
        return this.health;
    }

    public getHealthPercentage() {
        return this.health / this.getMaxHealth();
    }

    private getMaxHealth() {
        switch (this.type) {
            case 'chaser':
                return GAME_CONFIG.enemy.chaser.maxHealth;

            case 'shooter':
                return GAME_CONFIG.enemy.shooter.maxHealth;
        }
    }

    public updateFireCooldown(deltaTime: number) {
        this.fireCooldown = Math.max(
            0,
            this.fireCooldown - deltaTime,
        );
    }

    public canFire() {
        return this.fireCooldown <= 0;
    }

    public startFireCooldown(duration: number) {
        this.fireCooldown = duration;
    }
}