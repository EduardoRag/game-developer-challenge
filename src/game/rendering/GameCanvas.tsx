import { useEffect, useRef } from 'react';

import { Game } from '../core/Game';
import type { GameControlsApi } from '../types/GameControls';
import type { GameSessionConfig } from '../types/GameSessionConfig';
import type { GameSnapshot } from '../types/GameSnapshot';

type GameCanvasProps = {
    config: GameSessionConfig;
    onSnapshotChange: (snapshot: GameSnapshot) => void;
    onGameReady: (controls: GameControlsApi) => void;
    onLoadingChange: (isLoading: boolean) => void;
    onLoadError: (hasError: boolean) => void;
};

export const GameCanvas = ({
    config,
    onSnapshotChange,
    onGameReady,
    onLoadingChange,
    onLoadError,
}: GameCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const game = new Game(container, config);

        game.setSnapshotListener(onSnapshotChange);

        let cancelled = false;

        onLoadingChange(true);
        onLoadError(false);

        void game
            .initialize()
            .then(() => {
                if (cancelled) {
                    return;
                }

                onGameReady({
                    start: () => game.start(),
                    pause: () => game.pause(),
                    resume: () => game.resume(),
                    press: (key) => game.pressInput(key),
                    release: (key) => game.releaseInput(key),
                });

                onLoadingChange(false);
            })
            .catch((error: unknown) => {
                if (cancelled) {
                    return;
                }

                console.error(
                    'Failed to initialize game:',
                    error,
                );

                onLoadingChange(false);
                onLoadError(true);
            });

        return () => {
            cancelled = true;
            game.destroy();
        };
    }, [
        config,
        onGameReady,
        onSnapshotChange,
        onLoadingChange,
        onLoadError,
    ]);

    return <div ref={containerRef} className="game-canvas" />;
};