import { useEffect, useRef } from 'react';

import { Game } from '../core/Game';

export const GameCanvas = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const game = new Game(container);

        void game.initialize();

        return () => {
            game.destroy();
        };
    }, []);

    return <div ref={containerRef} className="game-canvas" />;
};