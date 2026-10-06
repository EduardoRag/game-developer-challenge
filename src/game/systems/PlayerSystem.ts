import { Player } from '../entities/Player';
import { InputManager } from '../input/InputManager';
import { CollisionSystem } from './CollisionSystem';

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class PlayerSystem {
    public updateMovement(
        player: Player,
        input: InputManager,
        collisionSystem: CollisionSystem,
        obstacles: Obstacle[],
        arenaWidth: number,
        arenaHeight: number,
        deltaTime: number,
    ) {
        if (input.isPressed('KeyA', 'ArrowLeft')) {
            player.rotate(-1, deltaTime);
        }

        if (input.isPressed('KeyD', 'ArrowRight')) {
            player.rotate(1, deltaTime);
        }

        if (input.isPressed('KeyW', 'ArrowUp')) {
            const movement = player.getForwardMovement(deltaTime);

            player.move(movement.x, 0);

            if (
                collisionSystem.isPlayerCollidingWithObstacle(
                    player,
                    obstacles,
                )
            ) {
                player.move(-movement.x, 0);
            }

            player.move(0, movement.y);

            if (
                collisionSystem.isPlayerCollidingWithObstacle(
                    player,
                    obstacles,
                )
            ) {
                player.move(0, -movement.y);
            }
        }

        player.constrainToBounds(arenaWidth, arenaHeight);
    }
}