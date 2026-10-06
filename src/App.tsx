import { useCallback, useState } from 'react';

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

const INITIAL_SNAPSHOT: GameSnapshot = {
  health: 100,
  maxHealth: 100,
  score: 0,
  timeRemaining: GAME_CONFIG.session.duration,
  gameState: 'playing',
};

const App = () => {
  const createSessionMutation = useCreateSessionMutation();
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);

  const [gameOptions, setGameOptions] = useState<GameOptions>(() => loadGameOptions());

  const handleSnapshotChange = useCallback(
    (nextSnapshot: GameSnapshot) => {
      setSnapshot(nextSnapshot);
    },
    [],
  );
  const handlePlay = () => {
    setSnapshot(INITIAL_SNAPSHOT);
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
    createSessionMutation.reset();
    setSnapshot(INITIAL_SNAPSHOT);
    setGameKey((currentKey) => currentKey + 1);
  };

  const handleMainMenu = () => {
    setSnapshot(INITIAL_SNAPSHOT);
    createSessionMutation.reset();
    setScreen('menu');
  };

  const handleOptions = () => {
    setScreen('options');
  };

  const handleSaveOptions = (options: GameOptions) => {
    setGameOptions(options);
    setScreen('menu');
  };

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
        onSnapshotChange={handleSnapshotChange}
      />

      <Hud snapshot={snapshot} />

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