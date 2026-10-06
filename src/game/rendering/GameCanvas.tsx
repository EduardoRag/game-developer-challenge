import { useEffect, useRef } from 'react';

import { Game } from '../core/Game';
import type { GameSnapshot } from '../types/GameSnapshot';

type GameCanvasProps = {
    onSnapshotChange: (snapshot: GameSnapshot) => void;
};

export const GameCanvas = ({
    onSnapshotChange,
}: GameCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const game = new Game(container);

        game.setSnapshotListener(onSnapshotChange);

        void game.initialize();

        return () => {
            game.destroy();
        };
    }, [onSnapshotChange]);

    return <div ref={containerRef} className="game-canvas" />;
};