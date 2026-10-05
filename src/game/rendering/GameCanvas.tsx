import { Application, Assets, Sprite } from 'pixi.js';
import { useEffect, useRef } from 'react';

export const GameCanvas = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const app = new Application();

        let isCancelled = false;
        let isInitialized = false;

        const initialize = async () => {
            await app.init({
                background: '#1b7895',
                resizeTo: container,
                antialias: true,
            });

            isInitialized = true;

            if (isCancelled) {
                app.destroy(true);
                return;
            }

            container.appendChild(app.canvas);

            const texture = await Assets.load(
                '/assets/png/default/ships/ship_1.png',
            );

            if (isCancelled) {
                return;
            }

            const ship = new Sprite(texture);

            ship.anchor.set(0.5);
            ship.position.set(
                app.screen.width / 2,
                app.screen.height / 2,
            );

            app.stage.addChild(ship);
        };

        void initialize();

        return () => {
            isCancelled = true;

            if (isInitialized) {
                app.destroy(true, {
                    children: true,
                    texture: false,
                    textureSource: false,
                });
            }
        };
    }, []);

    return <div ref={containerRef} className="game-canvas" />;
};