import { Sprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../config/gameConfig';

export type EnemyType = 'chaser' | 'shooter';

export class Enemy {
    public readonly sprite: Sprite;
    public readonly type: EnemyType;

    private health: number;
    private fireCooldown = 0;
    private contactDamageCooldown = 0;

    constructor(texture: Texture, type: EnemyType) {
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);

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
    }

    public isDead() {
        return this.health <= 0;
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

    public updateContactDamageCooldown(deltaTime: number) {
        this.contactDamageCooldown = Math.max(
            0,
            this.contactDamageCooldown - deltaTime,
        );
    }

    public canDealContactDamage() {
        return this.contactDamageCooldown <= 0;
    }

    public startContactDamageCooldown(duration: number) {
        this.contactDamageCooldown = duration;
    }
}