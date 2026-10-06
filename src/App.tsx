import { useCallback, useState } from 'react';

import { GameCanvas } from './game/rendering/GameCanvas';
import { GameOver } from './game/rendering/GameOver';
import { Hud } from './game/rendering/Hud';

import { GAME_CONFIG } from './game/config/gameConfig';
import type { GameSnapshot } from './game/types/GameSnapshot';

import { MainMenu } from './app/MainMenu';
import type { AppScreen } from './app/types';

const INITIAL_SNAPSHOT: GameSnapshot = {
  health: 100,
  maxHealth: 100,
  score: 0,
  timeRemaining: GAME_CONFIG.session.duration,
  gameState: 'playing',
};

const App = () => {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);

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
    setSnapshot(INITIAL_SNAPSHOT);
    setGameKey((currentKey) => currentKey + 1);
  };

  if (screen === 'menu') {
    return (
      <MainMenu
        onPlay={handlePlay}
        onRanking={handleRanking}
        onHistory={handleHistory}
      />
    );
  }

  if (screen === 'ranking') {
    return (
      <main>
        <h1>Ranking</h1>

        <button
          type="button"
          onClick={() => setScreen('menu')}
        >
          Back
        </button>
      </main>
    );
  }

  if (screen === 'history') {
    return (
      <main>
        <h1>History</h1>

        <button
          type="button"
          onClick={() => setScreen('menu')}
        >
          Back
        </button>
      </main>
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
        />
      )}
    </>
  );
};

export default App;