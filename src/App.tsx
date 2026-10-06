import { useCallback, useState } from 'react';

import { GameCanvas } from './game/rendering/GameCanvas';
import { GameOver } from './game/rendering/GameOver';
import { Hud } from './game/rendering/Hud';

import { GAME_CONFIG } from './game/config/gameConfig';
import type { GameSnapshot } from './game/types/GameSnapshot';

const INITIAL_SNAPSHOT: GameSnapshot = {
  health: 100,
  maxHealth: 100,
  score: 0,
  timeRemaining: GAME_CONFIG.session.duration,
  gameState: 'playing',
};

const App = () => {
  const [gameKey, setGameKey] = useState(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);

  const handleSnapshotChange = useCallback(
    (nextSnapshot: GameSnapshot) => {
      setSnapshot(nextSnapshot);
    },
    [],
  );

  const handleRestart = () => {
    setSnapshot(INITIAL_SNAPSHOT);
    setGameKey((currentKey) => currentKey + 1);
  };

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