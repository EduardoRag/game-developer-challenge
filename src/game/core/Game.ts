import { Application, Assets, Sprite, Texture } from 'pixi.js';

import { ExplosionEffect } from '../rendering/ExplosionEffect';
import { FireEffect } from '../rendering/FireEffect';
import { ShipDamageEffect } from '../rendering/ShipDamageEffect';
import { WorldRenderer } from '../rendering/WorldRenderer';

import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

import { AudioManager } from '../audio/AudioManager';

import { Player } from '../entities/Player';

import { GAME_CONFIG } from '../config/gameConfig';

import { Enemy, type EnemyType } from '../entities/Enemy';
import type { GameSessionConfig } from '../types/GameSessionConfig';
import type { GameEndReason, GameSnapshot, GameState } from '../types/GameSnapshot';

import { InputManager } from '../input/InputManager';

import type { GameDebugSnapshot } from '../types/GameDebugSnapshot';


export class Game {
    private readonly app: Application;
    private readonly container: HTMLDivElement;
    private gameState: GameState = 'playing';

    private onSnapshotChange?: (snapshot: GameSnapshot) => void;

    private score = 0;
    private timeRemaining: number;
    private elapsedTime = 0;
    private endReason: GameEndReason | null = null;
    private gameplayScale = 1;

    private readonly world = new WorldRenderer();
    private readonly input = new InputManager();
    private readonly collisionSystem = new CollisionSystem();
    private readonly weaponSystem = new WeaponSystem();
    private readonly enemySystem = new EnemySystem();
    private readonly spawnSystem: SpawnSystem;
    private readonly playerSystem = new PlayerSystem();
    private readonly combatSystem = new CombatSystem();
    private readonly projectileSystem = new ProjectileSystem();
    private readonly audio = new AudioManager();

    private player: Player | null = null;
    private playerDamageEffect: ShipDamageEffect | null = null;

    private projectileTexture: Texture | null = null;

    private lastSnapshot: GameSnapshot | null = null;

    private initialized = false;
    private destroyed = false;
    private started = false;

    private debugFreezeEnemies = false;
    private debugFreezeWeaponCooldowns = false;

    constructor(
        container: HTMLDivElement,
        config: GameSessionConfig,
    ) {
        this.container = container;
        this.timeRemaining = config.sessionDuration;

        this.spawnSystem = new SpawnSystem(
            config.enemySpawnInterval,
        );

        this.app = new Application();
    }

    public async initialize() {
        await this.app.init({
            background: '#1b7895',
            resizeTo: this.container,
            antialias: true,
        });

        this.initialized = true;

        if (this.destroyed) {
            this.destroyApplication();
            return;
        }

        this.container.appendChild(this.app.canvas);

        const gameplayScale = this.app.screen.height <= GAME_CONFIG.responsive.mobileLandscapeMaxHeight
            ? GAME_CONFIG.responsive.mobileLandscapeScale
            : 1;

        this.gameplayScale = gameplayScale;
        this.weaponSystem.setGameplayScale(gameplayScale);

        await this.world.initialize(
            this.app.screen.width,
            this.app.screen.height,
            gameplayScale,
        );

        if (this.destroyed) {
            return;
        }

        this.app.stage.addChild(this.world.container);

        await this.createPlayer(gameplayScale);

        if (this.destroyed) {
            return;
        }

        await this.spawnEnemy('chaser');

        if (this.destroyed) {
            return;
        }

        await this.spawnEnemy('shooter');

        if (this.destroyed) {
            return;
        }

        this.projectileTexture = await Assets.load(
            '/assets/png/default/ship_parts/cannon_ball.png',
        );

        if (this.destroyed) {
            return;
        }

        await ExplosionEffect.loadTextures();

        if (this.destroyed) {
            return;
        }

        await FireEffect.loadTextures();

        if (this.destroyed) {
            return;
        }

        this.playerDamageEffect = new ShipDamageEffect(
            this.app.stage,
            this.gameplayScale,
        );

        this.emitSnapshot();
    }

    public start() {
        if (
            this.destroyed ||
            !this.initialized ||
            !this.player ||
            this.started
        ) {
            return;
        }

        this.started = true;

        this.input.start();

        window.addEventListener(
            'blur',
            this.handleWindowBlur,
        );

        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );

        this.audio.play('gameStart', 0.7);
        this.audio.startAmbience();

        this.app.ticker.add(this.handleTick);
    }

    public destroy() {
        this.destroyed = true;

        this.input.stop();

        this.audio.destroy();

        this.playerDamageEffect?.destroy();
        this.playerDamageEffect = null;

        window.removeEventListener(
            'blur',
            this.handleWindowBlur,
        );

        document.removeEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );

        if (this.initialized) {
            this.app.ticker.remove(this.handleTick);
            this.destroyApplication();
        }
    }

    private readonly handleTick = () => {
        const deltaTime = this.app.ticker.deltaMS / 1000;

        this.update(deltaTime);
    };

    private update(deltaTime: number) {
        if (!this.player) {
            return;
        }

        if (
            this.gameState === 'playing' &&
            this.input.wasPressed('Escape')
        ) {
            this.pause();
            return;
        }

        if (this.gameState !== 'playing') {
            this.input.clearFrameState();
            return;
        }

        this.updateTimer(deltaTime);

        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);

        this.destroyDeadEnemies();
        this.updatePlayerDamageEffect();

        if (this.player.isDead()) {
            const position = this.player.getPosition();

            ExplosionEffect.play(
                this.app.stage,
                position.x,
                position.y,
                this.gameplayScale,
            );

            this.audio.play('shipSinking', 0.75);

            this.endGame('shipDestroyed');
        } else if (this.timeRemaining <= 0) {
            this.endGame('timeUp');
        }

        this.emitSnapshot();

        this.input.clearFrameState();
    }

    private updatePlayer(deltaTime: number) {
        if (!this.player) {
            return;
        }

        if (!this.debugFreezeWeaponCooldowns) {
            this.weaponSystem.update(deltaTime);
        }

        this.playerSystem.updateMovement(
            this.player,
            this.input,
            this.collisionSystem,
            this.world.obstacles,
            this.app.screen.width,
            this.app.screen.height,
            deltaTime,
        );

        if (!this.projectileTexture) {
            return;
        }

        const projectiles = this.weaponSystem.handlePlayerInput(
            this.player,
            this.input,
            this.projectileTexture,
            this.projectileSystem,
        );

        if (projectiles.length === 1) {
            this.audio.play('cannonFire', 0.55);
        } else if (projectiles.length === 3) {
            this.audio.play('cannonBroadside', 0.65);
        }

        for (const projectile of projectiles) {
            this.app.stage.addChild(projectile.sprite);

            ExplosionEffect.play(
                this.app.stage,
                projectile.sprite.x,
                projectile.sprite.y,
                this.gameplayScale * 0.2,
            );
        }
    }

    private updateEnemies(deltaTime: number) {
        if (!this.player) {
            return;
        }

        this.spawnSystem.update(deltaTime);

        if (this.spawnSystem.canSpawnEnemy()) {
            const enemyType: EnemyType =
                Math.random() < 0.5 ? 'chaser' : 'shooter';

            void this.spawnEnemy(enemyType);

            this.spawnSystem.resetEnemySpawnCooldown();
        }

        const enemies = this.enemySystem.getEnemies();

        const shootersReadyToFire = this.debugFreezeEnemies
            ? []
            : this.enemySystem.update(
                this.player,
                this.collisionSystem,
                this.world.obstacles,
                deltaTime,
            );

        const collidedChasers = this.combatSystem.resolveChaserContacts(
            enemies,
            this.player,
            this.collisionSystem,
        );

        if (collidedChasers.length > 0) {
            this.audio.play('shipCollision', 0.65);
        }

        for (const chaser of collidedChasers) {
            const position = chaser.getPosition();

            this.createEnemyWreck(chaser);

            ExplosionEffect.play(
                this.app.stage,
                position.x,
                position.y,
                this.gameplayScale,
            );

            this.enemySystem.destroyEnemy(chaser);
        }

        if (!this.projectileTexture) {
            return;
        }

        const projectiles = this.enemySystem.fireShooters(
            shootersReadyToFire,
            this.player,
            this.projectileTexture,
            this.projectileSystem,
        );

        for (const projectile of projectiles) {
            this.app.stage.addChild(projectile.sprite);

            ExplosionEffect.play(
                this.app.stage,
                projectile.sprite.x,
                projectile.sprite.y,
                this.gameplayScale * 0.2,
            );
        }
    }

    private updateProjectiles(deltaTime: number) {
        if (!this.player) {
            return;
        }

        this.projectileSystem.update(deltaTime);

        const enemies = this.enemySystem.getEnemies();

        const impacts = this.combatSystem.resolveProjectileHits(
            this.player,
            enemies,
            this.projectileSystem,
            this.collisionSystem,
        );

        if (impacts.length > 0) {
            this.audio.play('shipWoodHit', 0.5);
        }

        for (const impact of impacts) {
            ExplosionEffect.play(
                this.app.stage,
                impact.x,
                impact.y,
                this.gameplayScale * 0.35,
            );
        }

        this.projectileSystem.removeInvalidProjectiles(
            this.app.screen.width,
            this.app.screen.height,
            this.world.obstacles,
            this.collisionSystem,
        );
    }

    private createEnemyWreck(enemy: Enemy) {
        const position = enemy.getPosition();

        const wreck = new Sprite(enemy.sunkTexture);

        wreck.anchor.set(0.5);
        wreck.position.set(position.x, position.y);
        wreck.rotation = enemy.sprite.rotation;
        wreck.scale.copyFrom(enemy.sprite.scale);

        this.app.stage.addChild(wreck);

        window.setTimeout(() => {
            if (wreck.destroyed) {
                return;
            }

            wreck.removeFromParent();
            wreck.destroy();
        }, 2000);
    }

    private destroyDeadEnemies() {
        const deadEnemies = this.enemySystem
            .getEnemies()
            .filter((enemy) => enemy.isDead());

        for (const enemy of deadEnemies) {
            const position = enemy.getPosition();

            this.createEnemyWreck(enemy);

            ExplosionEffect.play(
                this.app.stage,
                position.x,
                position.y,
                this.gameplayScale,
            );

            this.enemySystem.destroyEnemy(enemy);
        }

        if (deadEnemies.length > 0) {
            this.audio.play('shipExplosion', 0.7);
            this.audio.play('scorePoint', 0.55);
        }

        this.score += deadEnemies.length;
    }

    private async createPlayer(scale: number) {
        const [
            normalTexture,
            damagedTexture,
            criticalTexture,
            sunkTexture,
        ] = await Promise.all([
            Assets.load<Texture>(
                '/assets/png/default/ships/ship_2.png',
            ),
            Assets.load<Texture>(
                '/assets/png/default/ships/ship_8.png',
            ),
            Assets.load<Texture>(
                '/assets/png/default/ships/ship_14.png',
            ),
            Assets.load<Texture>(
                '/assets/png/default/ships/ship_20.png',
            ),
        ]);

        if (this.destroyed) {
            return;
        }

        this.player = new Player(
            normalTexture,
            damagedTexture,
            criticalTexture,
            sunkTexture,
            scale,
        );

        this.player.setPosition(
            this.app.screen.width / 2,
            this.app.screen.height / 2,
        );

        this.app.stage.addChild(this.player.sprite);
    }

    private destroyApplication() {
        this.app.destroy(true, {
            children: true,
            texture: false,
            textureSource: false,
        });
    }

    private async spawnEnemy(type: EnemyType) {
        if (!this.player || this.spawnSystem.isSpawningEnemy()) {
            return;
        }

        this.spawnSystem.startEnemySpawn();

        try {
            const position = this.spawnSystem.findSafePosition(
                this.app.screen.width,
                this.app.screen.height,
                this.player.getPosition(),
                this.world.obstacles,
            );

            if (!position) {
                return;
            }

            const enemy = await this.enemySystem.create(
                type,
                position.x,
                position.y,
                this.gameplayScale,
            );

            if (this.destroyed) {
                enemy.sprite.destroy();
                return;
            }

            this.app.stage.addChild(enemy.sprite);

            this.enemySystem.createDamageEffect(
                enemy,
                this.app.stage,
                this.gameplayScale,
            );

            const healthBar = this.enemySystem.getHealthBar(enemy);

            if (healthBar) {
                this.app.stage.addChild(healthBar.container);
            }
        } finally {
            this.spawnSystem.finishEnemySpawn();
        }
    }

    public setEnemyPositionForDebug(
        index: number,
        x: number,
        y: number,
    ) {
        if (!import.meta.env.DEV) {
            return;
        }

        const enemy = this.enemySystem.getEnemies()[index];

        if (!enemy) {
            return;
        }

        enemy.setPosition(x, y);
    }

    public setEnemiesFrozenForDebug(frozen: boolean) {
        if (!import.meta.env.DEV) {
            return;
        }

        this.debugFreezeEnemies = frozen;
    }

    public setWeaponCooldownsFrozenForDebug(frozen: boolean) {
        if (!import.meta.env.DEV) return;

        this.debugFreezeWeaponCooldowns = frozen;
    }

    public setTimeRemainingForDebug(timeRemaining: number) {
        if (!import.meta.env.DEV) {
            return;
        }

        this.timeRemaining = Math.max(0, timeRemaining);
    }

    public damagePlayerForDebug(damage: number) {
        if (!import.meta.env.DEV || !this.player) {
            return;
        }

        this.player.takeDamage(Math.max(0, damage));
    }

    public getDebugSnapshot(): GameDebugSnapshot | null {
        if (!this.player || !this.initialized || this.destroyed) {
            return null;
        }

        return {
            player: {
                ...this.player.getPosition(),
                width: this.player.sprite.width,
                height: this.player.sprite.height,
                rotation: this.player.sprite.rotation,
                health: this.player.getHealth(),
            },
            enemies: this.enemySystem.getEnemies().map((enemy) => ({
                type: enemy.type,
                ...enemy.getPosition(),
                health: enemy.getHealth(),
            })),
            score: this.score,
            timeRemaining: this.timeRemaining,
            elapsedTime: this.elapsedTime,
            gameState: this.gameState,
            endReason: this.endReason,
            arena: {
                width: this.app.screen.width,
                height: this.app.screen.height,
            },
            obstacles: this.world.obstacles.map((obstacle) => ({
                ...obstacle,
            })),
            weapon: {
                frontCooldown:
                    this.weaponSystem.getFrontCooldown(),
            },
            projectiles: {
                player: this.projectileSystem
                    .getProjectiles()
                    .filter((projectile) => projectile.owner === 'player').length,
                enemy: this.projectileSystem
                    .getProjectiles()
                    .filter((projectile) => projectile.owner === 'enemy').length,
                items: this.projectileSystem.getProjectiles().map((projectile) => ({
                    owner: projectile.owner,
                    x: projectile.sprite.x,
                    y: projectile.sprite.y,
                })),
            },
        };
    }

    public setSnapshotListener(
        listener: (snapshot: GameSnapshot) => void,
    ) {
        this.onSnapshotChange = listener;
    }

    private emitSnapshot() {
        if (!this.player) {
            return;
        }

        const snapshot: GameSnapshot = {
            health: this.player.getHealth(),
            maxHealth: GAME_CONFIG.player.maxHealth,
            score: this.score,
            timeRemaining: Math.ceil(this.timeRemaining),
            elapsedTime: Math.floor(this.elapsedTime),
            gameState: this.gameState,
            endReason: this.endReason,
        };

        if (
            this.lastSnapshot &&
            this.lastSnapshot.health === snapshot.health &&
            this.lastSnapshot.maxHealth === snapshot.maxHealth &&
            this.lastSnapshot.score === snapshot.score &&
            this.lastSnapshot.timeRemaining === snapshot.timeRemaining &&
            this.lastSnapshot.elapsedTime === snapshot.elapsedTime &&
            this.lastSnapshot.gameState === snapshot.gameState &&
            this.lastSnapshot.endReason === snapshot.endReason
        ) {
            return;
        }

        this.lastSnapshot = snapshot;
        this.onSnapshotChange?.(snapshot);
    }

    private endGame(reason: GameEndReason) {
        if (this.gameState === 'gameOver') {
            return;
        }

        this.endReason = reason;
        this.gameState = 'gameOver';

        this.audio.stopAmbience();

        if (reason === 'timeUp') {
            this.audio.play('gameComplete', 0.75);
        } else {
            this.audio.play('gameOver', 0.75);
        }
    }

    private updateTimer(deltaTime: number) {
        const elapsedDelta = Math.min(
            deltaTime,
            this.timeRemaining,
        );

        this.elapsedTime += elapsedDelta;

        this.timeRemaining = Math.max(
            0,
            this.timeRemaining - deltaTime,
        );
    }

    public pause() {
        if (this.gameState !== 'playing') {
            return;
        }

        this.gameState = 'paused';
        this.input.clear();

        this.audio.pauseAmbience();
        this.audio.play('gamePause', 0.6);

        this.emitSnapshot();
    }

    public resume() {
        if (this.gameState !== 'paused') {
            return;
        }

        this.gameState = 'playing';
        this.input.clear();

        this.audio.play('gameResume', 0.6);
        this.audio.resumeAmbience();

        this.emitSnapshot();
    }

    public pressInput(key: string) {
        if (this.gameState !== 'playing') {
            return;
        }

        this.input.press(key);
    }

    public releaseInput(key: string) {
        this.input.release(key);
    }

    private readonly handleWindowBlur = () => {
        this.pause();
    };

    private readonly handleVisibilityChange = () => {
        if (document.hidden) {
            this.pause();
        }
    };

    private updatePlayerDamageEffect() {
        if (!this.player || !this.playerDamageEffect) {
            return;
        }

        const position = this.player.getPosition();

        this.playerDamageEffect.update(
            position.x,
            position.y,
            this.player.getHealth() / GAME_CONFIG.player.maxHealth,
        );
    }
}