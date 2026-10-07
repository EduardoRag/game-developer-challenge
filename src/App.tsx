import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  loadPendingSession,
  saveLastCompletedSession,
  savePendingSession,
} from './features/history/sessionStorage';

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
import type { CreateSessionRequest } from './infrastructure/api/types';

import { PauseOverlay } from './game/rendering/PauseOverlay';

import { GameControls } from './game/rendering/GameControls';
import type { GameControlsApi } from './game/types/GameControls';

import { ControlsScreen } from './features/controls/ControlsScreen';

const jungleGamingLogo = (
  <img
    className="jungle-gaming-logo"
    src="/assets/logo_jungle_gaming.svg"
    alt="Jungle Gaming"
  />
);

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
  const { mutate: createSession } = createSessionMutation;

  const [screen, setScreen] = useState<AppScreen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);
  const [isPauseOptionsOpen, setIsPauseOptionsOpen] = useState(false);

  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameLoadError, setGameLoadError] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);

  const gameControlsRef = useRef<GameControlsApi | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const submittedMatchIdRef = useRef<string | null>(null);
  const sessionRequestRef = useRef<CreateSessionRequest | null>(null);

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

  useEffect(() => {
    if (
      snapshot.gameState !== 'gameOver' ||
      !snapshot.endReason
    ) {
      return;
    }

    const matchId = matchIdRef.current;

    if (
      !matchId ||
      submittedMatchIdRef.current === matchId
    ) {
      return;
    }

    const sessionRequest: CreateSessionRequest = {
      id: matchId,
      playerName: 'Captain Jack',
      score: snapshot.score,
      duration: Math.round(snapshot.elapsedTime),
      endReason: snapshot.endReason,
      config: {
        sessionDuration: sessionConfig.sessionDuration,
        enemySpawnInterval:
          sessionConfig.enemySpawnInterval,
      },
    };

    submittedMatchIdRef.current = matchId;
    sessionRequestRef.current = sessionRequest;

    saveLastCompletedSession(sessionRequest);
    savePendingSession(sessionRequest);
    createSession(sessionRequest);
  }, [
    snapshot.gameState,
    snapshot.endReason,
    snapshot.score,
    snapshot.elapsedTime,
    sessionConfig,
    createSession,
  ]);

  useEffect(() => {
    const pendingSession = loadPendingSession();

    if (!pendingSession) {
      return;
    }

    sessionRequestRef.current = pendingSession;
    createSession(pendingSession);
  }, [createSession]);

  const handleRetryRegistration = () => {
    const sessionRequest = sessionRequestRef.current;

    if (!sessionRequest) {
      return;
    }

    createSessionMutation.mutate(sessionRequest);
  };

  const handlePlay = () => {
    matchIdRef.current = crypto.randomUUID();
    submittedMatchIdRef.current = null;
    sessionRequestRef.current = null;

    createSessionMutation.reset();

    setIsPauseOptionsOpen(false);
    setGameControls(null);
    gameControlsRef.current = null;

    setIsGameLoading(true);
    setGameLoadError(false);
    setHasGameStarted(false);

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

  const handleControls = () => {
    setScreen('controls');
  };

  const handleRestart = () => {
    matchIdRef.current = crypto.randomUUID();
    submittedMatchIdRef.current = null;
    sessionRequestRef.current = null;

    setIsPauseOptionsOpen(false);
    setGameControls(null);
    gameControlsRef.current = null;

    setIsGameLoading(true);
    setGameLoadError(false);
    setHasGameStarted(false);

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

    matchIdRef.current = null;
    submittedMatchIdRef.current = null;
    sessionRequestRef.current = null;

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
      <>
        <MainMenu
          onPlay={handlePlay}
          onOptions={handleOptions}
          onRanking={handleRanking}
          onHistory={handleHistory}
          onControls={handleControls}
        />

        {jungleGamingLogo}
      </>
    );
  }

  if (screen === 'ranking') {
    return (
      <RankingScreen
        onBack={() => setScreen('menu')}
        onHistory={() => setScreen('history')}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        onBack={() => setScreen('menu')}
        onRanking={() => setScreen('ranking')}
      />
    );
  }

  if (screen === 'controls') {
    return (
      <ControlsScreen
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
      {jungleGamingLogo}

      <GameCanvas
        key={gameKey}
        config={sessionConfig}
        onSnapshotChange={handleSnapshotChange}
        onGameReady={handleGameReady}
        onLoadingChange={setIsGameLoading}
        onLoadError={setGameLoadError}
      />

      {isGameLoading && (
        <div className="game-loading">
          <div className="game-loading__content">
            <h1>PREPARING THE BATTLE</h1>
            <p>Loading ships and islands...</p>
          </div>
        </div>
      )}

      {gameLoadError && (
        <div className="game-loading">
          <div className="game-loading__content">
            <h1>FAILED TO LOAD</h1>
            <p>The battle could not be prepared.</p>

            <button
              type="button"
              className="menu-button"
              onClick={handleRestart}
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {!isGameLoading &&
        !gameLoadError &&
        !hasGameStarted &&
        gameControls && (
          <div className="game-loading">
            <div className="game-loading__content">
              <h1>READY?</h1>
              <p>Prepare for battle!</p>

              <button
                type="button"
                className="menu-button"
                onClick={() => {
                  gameControls.start();
                  setHasGameStarted(true);
                }}
              >
                START
              </button>
            </div>
          </div>
        )}

      {hasGameStarted && <Hud snapshot={snapshot} />}

      {hasGameStarted &&
        snapshot.gameState !== 'gameOver' &&
        gameControls && (
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
          isRegistering={createSessionMutation.isPending}
          isRegistered={createSessionMutation.isSuccess}
          hasRegistrationError={createSessionMutation.isError}
          onRetryRegistration={handleRetryRegistration}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </>
  );
};

export default App;