import { useCallback, useRef, useState } from 'react';

import { GameCanvas } from './game/rendering/GameCanvas';
import { GameOver } from './game/rendering/GameOver';
import { Hud } from './game/rendering/Hud';

import { GAME_CONFIG } from './game/config/gameConfig';
import type { GameSnapshot } from './game/types/GameSnapshot';

import { MainMenu } from './app/MainMenu';
import type { AppScreen } from './app/types';

import { RankingScreen } from './features/ranking/RankingScreen';

import { HistoryScreen } from './features/history/HistoryScreen';

import { useCreateSessionMutation } from './infrastructure/api/sessionMutations';

import { OptionsScreen } from './features/options/OptionsScreen';
import { loadGameOptions } from './features/options/optionsStorage';
import type { GameOptions } from './features/options/types';

import { PauseOverlay } from './game/rendering/PauseOverlay';

import { GameControls } from './game/rendering/GameControls';
import type { GameControlsApi } from './game/types/GameControls';

const INITIAL_SNAPSHOT: GameSnapshot = {
  health: 100,
  maxHealth: 100,
  score: 0,
  timeRemaining: GAME_CONFIG.session.duration,
  gameState: 'playing',
  elapsedTime: 0,
  endReason: null,
};

const App = () => {
  const createSessionMutation = useCreateSessionMutation();

  const [screen, setScreen] = useState<AppScreen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const [snapshot, setSnapshot] =
    useState<GameSnapshot>(INITIAL_SNAPSHOT);
  const [isPauseOptionsOpen, setIsPauseOptionsOpen] =
    useState(false);

  const gameControlsRef = useRef<GameControlsApi | null>(null);

  const [gameControls, setGameControls] = useState<GameControlsApi | null>(null);

  const [gameOptions, setGameOptions] = useState<GameOptions>(() =>
    loadGameOptions(),
  );

  const [sessionConfig, setSessionConfig] =
    useState<GameOptions>(() => loadGameOptions());

  const handleSnapshotChange = useCallback(
    (nextSnapshot: GameSnapshot) => {
      setSnapshot(nextSnapshot);
    },
    [],
  );

  const handlePlay = () => {
    setIsPauseOptionsOpen(false);
    setGameControls(null);
    gameControlsRef.current = null;

    setSessionConfig({ ...gameOptions });

    setIsPauseOptionsOpen(false);
    setSessionConfig({ ...gameOptions });

    setSnapshot({
      ...INITIAL_SNAPSHOT,
      timeRemaining: gameOptions.sessionDuration,
    });

    setGameKey((currentKey) => currentKey + 1);
    setScreen('game');
  };

  const handleRanking = () => {
    setScreen('ranking');
  };

  const handleHistory = () => {
    setScreen('history');
  };

  const handleRestart = () => {
    setIsPauseOptionsOpen(false);
    setGameControls(null);
    gameControlsRef.current = null;

    createSessionMutation.reset();

    setIsPauseOptionsOpen(false);
    createSessionMutation.reset();

    setSnapshot({
      ...INITIAL_SNAPSHOT,
      timeRemaining: sessionConfig.sessionDuration,
    });

    setGameKey((currentKey) => currentKey + 1);
  };

  const handleMainMenu = () => {
    setIsPauseOptionsOpen(false);
    setGameControls(null);
    gameControlsRef.current = null;

    setSnapshot(INITIAL_SNAPSHOT);

    createSessionMutation.reset();

    setScreen('menu');
  };

  const handleOptions = () => {
    setScreen('options');
  };

  const handleSaveOptions = (options: GameOptions) => {
    setGameOptions(options);
  };

  const handleGameReady = useCallback((controls: GameControlsApi) => {
    gameControlsRef.current = controls;
    setGameControls(controls);
  }, []);

  if (screen === 'menu') {
    return (
      <MainMenu
        onPlay={handlePlay}
        onOptions={handleOptions}
        onRanking={handleRanking}
        onHistory={handleHistory}
      />
    );
  }

  if (screen === 'ranking') {
    return (
      <RankingScreen
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'options') {
    return (
      <OptionsScreen
        options={gameOptions}
        onSave={handleSaveOptions}
        onBack={() => setScreen('menu')}
      />
    );
  }

  return (
    <>
      <GameCanvas
        key={gameKey}
        config={sessionConfig}
        onSnapshotChange={handleSnapshotChange}
        onGameReady={handleGameReady}
      />

      <Hud snapshot={snapshot} />

      {snapshot.gameState !== 'gameOver' && gameControls && (
        <GameControls
          controls={gameControls}
          isPaused={snapshot.gameState === 'paused'}
        />
      )}

      {snapshot.gameState === 'paused' &&
        !isPauseOptionsOpen && (
          <PauseOverlay
            onResume={() => gameControlsRef.current?.resume()}
            onOptions={() => setIsPauseOptionsOpen(true)}
            onMainMenu={handleMainMenu}
          />
        )}

      {snapshot.gameState === 'paused' &&
        isPauseOptionsOpen && (
          <div className="pause-options-overlay">
            <OptionsScreen
              options={gameOptions}
              onSave={handleSaveOptions}
              onBack={() =>
                setIsPauseOptionsOpen(false)
              }
              backLabel="BACK"
            />
          </div>
        )}

      {snapshot.gameState === 'gameOver' && (
        <GameOver
          snapshot={snapshot}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </>
  );
};

export default App;