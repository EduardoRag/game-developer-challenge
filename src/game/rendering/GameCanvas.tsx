import { useEffect, useRef } from 'react';

import { Game } from '../core/Game';
import type { GameSessionConfig } from '../types/GameSessionConfig';
import type { GameSnapshot } from '../types/GameSnapshot';

type GameCanvasProps = {
    config: GameSessionConfig;
    onSnapshotChange: (snapshot: GameSnapshot) => void;
};

export const GameCanvas = ({
    config,
    onSnapshotChange,
}: GameCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const game = new Game(container, config);

        game.setSnapshotListener(onSnapshotChange);

        void game.initialize();

        return () => {
            game.destroy();
        };
    }, [config, onSnapshotChange]);

    return <div ref={containerRef} className="game-canvas" />;
};