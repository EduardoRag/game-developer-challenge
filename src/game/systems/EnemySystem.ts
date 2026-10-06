import { GAME_CONFIG } from '../config/gameConfig';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class EnemySystem {
    private readonly enemies: Enemy[] = [];

    public getEnemies() {
        return this.enemies;
    }

    public add(enemy: Enemy) {
        this.enemies.push(enemy);
    }

    public updateChaser(
        enemy: Enemy,
        player: Player,
        deltaTime: number,
    ) {
        const playerPosition = player.getPosition();

        enemy.faceTarget(
            playerPosition.x,
            playerPosition.y,
        );

        enemy.moveForward(
            deltaTime,
            GAME_CONFIG.enemy.chaser.moveSpeed,
        );
    }

    public removeDeadEnemies() {
        const removedEnemies: Enemy[] = [];

        for (let index = this.enemies.length - 1; index >= 0; index--) {
            const enemy = this.enemies[index];

            if (!enemy.isDead()) {
                continue;
            }

            this.enemies.splice(index, 1);
            removedEnemies.push(enemy);
        }

        return removedEnemies;
    }
}