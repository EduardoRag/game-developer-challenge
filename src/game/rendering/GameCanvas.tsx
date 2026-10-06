import { useEffect, useRef } from 'react';

import { Game } from '../core/Game';
import type { GameControlsApi } from '../types/GameControls';
import type { GameSessionConfig } from '../types/GameSessionConfig';
import type { GameSnapshot } from '../types/GameSnapshot';

type GameCanvasProps = {
    config: GameSessionConfig;
    onSnapshotChange: (snapshot: GameSnapshot) => void;
    onGameReady: (controls: GameControlsApi) => void;
};

export const GameCanvas = ({
    config,
    onSnapshotChange,
    onGameReady,
}: GameCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const game = new Game(container, config);

        game.setSnapshotListener(onSnapshotChange);

        onGameReady({
            pause: () => game.pause(),
            resume: () => game.resume(),
            press: (key) => game.pressInput(key),
            release: (key) => game.releaseInput(key),
        });

        void game.initialize();

        return () => {
            game.destroy();
        };
    }, [config, onGameReady, onSnapshotChange]);

    return <div ref={containerRef} className="game-canvas" />;
};