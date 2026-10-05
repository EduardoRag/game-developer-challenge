import {
    Assets,
    Container,
    Sprite,
    Texture,
    TilingSprite,
} from 'pixi.js';

import { GAME_CONFIG } from '../config/gameConfig';

export class WorldRenderer {
    public readonly container = new Container();

    public readonly obstacles: {
        x: number;
        y: number;
        width: number;
        height: number;
    }[] = [];

    private waterTexture: Texture | null = null;

    public async initialize(width: number, height: number) {
        this.waterTexture = await Assets.load(
            '/assets/png/default/tiles/tile_73.png',
        );

        this.createOcean(width, height);

        await this.createIsland();
    }

    private createOcean(width: number, height: number) {
        if (!this.waterTexture) {
            return;
        }

        const ocean = new TilingSprite({
            texture: this.waterTexture,
            width,
            height,
        });

        this.container.addChild(ocean);
    }

    private async createIsland() {
        const tileNumbers = [
            [1, 2, 3],
            [17, 18, 19],
            [33, 34, 35],
        ];

        const startX = 200;
        const startY = 200;

        const islandSize = GAME_CONFIG.world.tileSize * 3;
        const collisionPadding = 16;

        this.obstacles.push({
            x: startX + collisionPadding,
            y: startY + collisionPadding,
            width: islandSize - collisionPadding * 2,
            height: islandSize - collisionPadding * 2,
        });

        for (let row = 0; row < tileNumbers.length; row++) {
            for (let column = 0; column < tileNumbers[row].length; column++) {
                const tileNumber = tileNumbers[row][column];

                const texture = await Assets.load(
                    `/assets/png/default/tiles/tile_${tileNumber}.png`,
                );

                const tile = new Sprite(texture);

                tile.position.set(
                    startX + column * texture.width,
                    startY + row * texture.height,
                );

                this.container.addChild(tile);
            }
        }
    }
}