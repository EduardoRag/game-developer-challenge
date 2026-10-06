import { Application, Assets, Texture } from 'pixi.js';
import { WorldRenderer } from '../rendering/WorldRenderer';

import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

import { Player } from '../entities/Player';

import { GAME_CONFIG } from '../config/gameConfig';

import type { EnemyType } from '../entities/Enemy';
import type { GameSessionConfig } from '../types/GameSessionConfig';
import type { GameEndReason, GameSnapshot, GameState } from '../types/GameSnapshot';

import { InputManager } from '../input/InputManager';


export class Game {
    private readonly app: Application;
    private readonly container: HTMLDivElement;
    private gameState: GameState = 'playing';

    private onSnapshotChange?: (snapshot: GameSnapshot) => void;

    private score = 0;
    private timeRemaining: number;
    private elapsedTime = 0;
    private endReason: GameEndReason | null = null;

    private readonly world = new WorldRenderer();
    private readonly input = new InputManager();
    private readonly collisionSystem = new CollisionSystem();
    private readonly weaponSystem = new WeaponSystem();
    private readonly enemySystem = new EnemySystem();
    private readonly spawnSystem: SpawnSystem;
    private readonly playerSystem = new PlayerSystem();
    private readonly combatSystem = new CombatSystem();
    private readonly projectileSystem = new ProjectileSystem();

    private player: Player | null = null;

    private projectileTexture: Texture | null = null;

    private lastSnapshot: GameSnapshot | null = null;

    private initialized = false;
    private destroyed = false;

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

        await this.world.initialize(
            this.app.screen.width,
            this.app.screen.height,
        );

        if (this.destroyed) {
            return;
        }

        this.app.stage.addChild(this.world.container);

        await this.createPlayer();

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

        this.emitSnapshot();

        this.input.start();

        window.addEventListener(
            'blur',
            this.handleWindowBlur,
        );

        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange,
        );

        this.app.ticker.add(this.handleTick);
    }

    public destroy() {
        this.destroyed = true;

        this.input.stop();

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

        if (this.player.isDead()) {
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

        this.weaponSystem.update(deltaTime);

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

        for (const projectile of projectiles) {
            this.app.stage.addChild(projectile.sprite);
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

        const shootersReadyToFire = this.enemySystem.update(
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

        for (const chaser of collidedChasers) {
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
        }
    }

    private updateProjectiles(deltaTime: number) {
        if (!this.player) {
            return;
        }

        this.projectileSystem.update(deltaTime);

        const enemies = this.enemySystem.getEnemies();

        this.combatSystem.resolveProjectileHits(
            this.player,
            enemies,
            this.projectileSystem,
            this.collisionSystem,
        );

        this.projectileSystem.removeInvalidProjectiles(
            this.app.screen.width,
            this.app.screen.height,
            this.world.obstacles,
            this.collisionSystem,
        );
    }

    private destroyDeadEnemies() {
        const destroyedCount =
            this.enemySystem.destroyDeadEnemies();

        this.score += destroyedCount;
    }

    private async createPlayer() {
        const texture = await Assets.load(
            '/assets/png/default/ships/ship_1.png',
        );

        if (this.destroyed) {
            return;
        }

        this.player = new Player(texture);

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
            );

            if (this.destroyed) {
                enemy.sprite.destroy();
                return;
            }

            this.app.stage.addChild(enemy.sprite);

            const healthBar = this.enemySystem.getHealthBar(enemy);

            if (healthBar) {
                this.app.stage.addChild(healthBar.container);
            }
        } finally {
            this.spawnSystem.finishEnemySpawn();
        }
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
        this.emitSnapshot();
    }

    public resume() {
        if (this.gameState !== 'paused') {
            return;
        }

        this.gameState = 'playing';
        this.input.clear();
        this.emitSnapshot();
    }

    private readonly handleWindowBlur = () => {
        this.pause();
    };

    private readonly handleVisibilityChange = () => {
        if (document.hidden) {
            this.pause();
        }
    };
}