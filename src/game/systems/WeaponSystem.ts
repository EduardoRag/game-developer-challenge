import { GAME_CONFIG } from '../config/gameConfig';

import type { Texture } from 'pixi.js';

import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import type { InputManager } from '../input/InputManager';
import { ProjectileSystem } from './ProjectileSystem';

export class WeaponSystem {
    private frontCooldown = 0;
    private leftBroadsideCooldown = 0;
    private rightBroadsideCooldown = 0;

    public update(deltaTime: number) {
        this.frontCooldown = Math.max(
            0,
            this.frontCooldown - deltaTime,
        );

        this.leftBroadsideCooldown = Math.max(
            0,
            this.leftBroadsideCooldown - deltaTime,
        );

        this.rightBroadsideCooldown = Math.max(
            0,
            this.rightBroadsideCooldown - deltaTime,
        );
    }

    public canFireFront() {
        return this.frontCooldown <= 0;
    }

    public canFireLeftBroadside() {
        return this.leftBroadsideCooldown <= 0;
    }

    public canFireRightBroadside() {
        return this.rightBroadsideCooldown <= 0;
    }

    public startFrontCooldown() {
        this.frontCooldown =
            GAME_CONFIG.player.fireCooldown.front;
    }

    public startLeftBroadsideCooldown() {
        this.leftBroadsideCooldown =
            GAME_CONFIG.player.fireCooldown.broadside;
    }

    public startRightBroadsideCooldown() {
        this.rightBroadsideCooldown =
            GAME_CONFIG.player.fireCooldown.broadside;
    }

    public fireFront(
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        const position = player.getFrontPosition();
        const direction = player.getForwardDirection();

        const projectile = new Projectile(
            projectileTexture,
            direction.x,
            direction.y,
            'player',
        );

        projectile.sprite.position.set(position.x, position.y);

        projectileSystem.add(projectile);

        return projectile;
    }

    private fireBroadside(
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
        position: { x: number; y: number },
        direction: { x: number; y: number },
    ) {
        const forwardDirection = player.getForwardDirection();

        const spacing = 20;
        const spread = 0.2;

        const shots = [
            { offset: -spacing, spread: -spread },
            { offset: 0, spread: 0 },
            { offset: spacing, spread },
        ];

        const projectiles: Projectile[] = [];

        for (const shot of shots) {
            const directionX =
                direction.x + forwardDirection.x * shot.spread;

            const directionY =
                direction.y + forwardDirection.y * shot.spread;

            const length = Math.hypot(directionX, directionY);

            const projectile = new Projectile(
                projectileTexture,
                directionX / length,
                directionY / length,
                'player',
            );

            projectile.sprite.position.set(
                position.x + forwardDirection.x * shot.offset,
                position.y + forwardDirection.y * shot.offset,
            );

            projectileSystem.add(projectile);
            projectiles.push(projectile);
        }

        return projectiles;
    }

    public fireLeftBroadside(
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        return this.fireBroadside(
            player,
            projectileTexture,
            projectileSystem,
            player.getLeftPosition(),
            player.getLeftDirection(),
        );
    }

    public fireRightBroadside(
        player: Player,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        return this.fireBroadside(
            player,
            projectileTexture,
            projectileSystem,
            player.getRightPosition(),
            player.getRightDirection(),
        );
    }

    public handlePlayerInput(
        player: Player,
        input: InputManager,
        projectileTexture: Texture,
        projectileSystem: ProjectileSystem,
    ) {
        const projectiles: Projectile[] = [];

        if (
            input.wasPressed('Space') &&
            this.canFireFront()
        ) {
            const projectile = this.fireFront(
                player,
                projectileTexture,
                projectileSystem,
            );

            projectiles.push(projectile);
            this.startFrontCooldown();
        }

        if (
            input.wasPressed('KeyQ') &&
            this.canFireLeftBroadside()
        ) {
            const broadsideProjectiles = this.fireLeftBroadside(
                player,
                projectileTexture,
                projectileSystem,
            );

            projectiles.push(...broadsideProjectiles);
            this.startLeftBroadsideCooldown();
        }

        if (
            input.wasPressed('KeyE') &&
            this.canFireRightBroadside()
        ) {
            const broadsideProjectiles = this.fireRightBroadside(
                player,
                projectileTexture,
                projectileSystem,
            );

            projectiles.push(...broadsideProjectiles);
            this.startRightBroadsideCooldown();
        }

        return projectiles;
    }
}