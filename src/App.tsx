import { useCallback, useState } from 'react';

import { GameCanvas } from './game/rendering/GameCanvas';
import { Hud } from './game/rendering/Hud';

import { GAME_CONFIG } from './game/config/gameConfig';
import type { GameSnapshot } from './game/types/GameSnapshot';

const INITIAL_SNAPSHOT: GameSnapshot = {
  health: 100,
  maxHealth: 100,
  score: 0,
  timeRemaining: GAME_CONFIG.session.duration,
};

const App = () => {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);

  const handleSnapshotChange = useCallback(
    (nextSnapshot: GameSnapshot) => {
      setSnapshot(nextSnapshot);
    },
    [],
  );

  return (
    <>
      <GameCanvas onSnapshotChange={handleSnapshotChange} />
      <Hud snapshot={snapshot} />
    </>
  );
};

export default App;