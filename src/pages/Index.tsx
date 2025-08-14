import { useGameLogic } from '@/hooks/useGameLogic';
import { CandyGrid } from '@/components/CandyGrid';
import { GameUI } from '@/components/GameUI';

const Index = () => {
  const { gameState, selectedCandy, handleCandyClick, resetGame } = useGameLogic();

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--gradient-game-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Game Board */}
          <div className="flex justify-center">
            <CandyGrid
              grid={gameState.grid}
              selectedCandy={selectedCandy}
              onCandyClick={handleCandyClick}
            />
          </div>

          {/* Game UI */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-md">
              <GameUI gameState={gameState} onRestart={resetGame} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
