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

    public async initialize(
        width: number,
        height: number,
        scale = 1,
    ) {
        this.waterTexture = await Assets.load(
            '/assets/png/default/tiles/tile_73.png',
        );

        this.createOcean(width, height);

        await this.createIsland(width, height, scale);
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

    private async createIsland(
        width: number,
        height: number,
        scale: number,
    ) {
        const underwaterTileNumbers = [
            [10, 11, 12],
            [26, 27, 28],
            [42, 43, 44],
        ];

        const islandTileNumbers = [
            [1, 2, 3],
            [17, 18, 19],
            [33, 34, 35],
        ];

        const islandSize = GAME_CONFIG.world.tileSize * 3 * scale;
        const collisionPadding = 16;
        const arenaPadding = 32;

        const startX = Math.min(
            width * 0.2,
            width - islandSize - arenaPadding,
        );

        const startY = Math.min(
            height * 0.2,
            height - islandSize - arenaPadding,
        );

        this.obstacles.push({
            x: startX + collisionPadding,
            y: startY + collisionPadding,
            width: islandSize - collisionPadding * 2,
            height: islandSize - collisionPadding * 2,
        });

        const renderTiles = async (
            tileNumbers: number[][],
            alpha = 1,
            layerScale = 1,
        ) => {
            const tileSize = GAME_CONFIG.world.tileSize * scale;
            const scaledTileSize = tileSize * layerScale;

            const layerOffset =
                (tileSize * tileNumbers.length -
                    scaledTileSize * tileNumbers.length) /
                2;

            for (let row = 0; row < tileNumbers.length; row++) {
                for (
                    let column = 0;
                    column < tileNumbers[row].length;
                    column++
                ) {
                    const tileNumber = tileNumbers[row][column];

                    const texture = await Assets.load(
                        `/assets/png/default/tiles/tile_${tileNumber}.png`,
                    );

                    const tile = new Sprite(texture);

                    tile.scale.set(scale * layerScale);
                    tile.alpha = alpha;

                    tile.position.set(
                        startX + layerOffset + column * scaledTileSize,
                        startY + layerOffset + row * scaledTileSize,
                    );

                    this.container.addChild(tile);
                }
            }
        };

        await renderTiles(underwaterTileNumbers, 0.95, 1.5);
        await renderTiles(islandTileNumbers);
    }
}