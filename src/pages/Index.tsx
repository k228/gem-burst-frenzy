import { useGameLogic } from '@/hooks/useGameLogic';
import { CandyGrid } from '@/components/CandyGrid';
import { GameUI } from '@/components/GameUI';

const Index = () => {
  const { gameState, selectedCandy, handleCandyClick, handleDragStart, handleDragEnd, resetGame } = useGameLogic();

  return (
    <div className="min-h-screen p-2 sm:p-4" style={{ background: 'var(--gradient-game-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-8 items-start">
          {/* Game Board */}
          <div className="flex justify-center order-2 lg:order-1">
            <CandyGrid
              grid={gameState.grid}
              selectedCandy={selectedCandy}
              onCandyClick={handleCandyClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>

          {/* Game UI */}
          <div className="flex justify-center lg:justify-start order-1 lg:order-2 w-full">
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
