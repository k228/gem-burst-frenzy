import { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Zap, RotateCcw, CheckCircle } from 'lucide-react';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameUI = ({ gameState, onRestart }: GameUIProps) => {
  const progress = (gameState.score / gameState.targetScore) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Candy Crush
        </h1>
        <p className="text-muted-foreground mt-2">Level {gameState.level}</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-primary" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {gameState.score.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-sm">
              <Target className="w-4 h-4 text-accent" />
              Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {gameState.targetScore.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-secondary" />
              Moves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${gameState.moves <= 5 ? 'text-destructive' : 'text-secondary'}`}>
              {gameState.moves}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectives */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-primary" />
            Objectives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gameState.objectives.map((objective, index) => {
            const progress = Math.min(100, (objective.current / objective.target) * 100);
            const isComplete = objective.current >= objective.target;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className={isComplete ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                    {objective.description}
                  </span>
                  <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-foreground'}`}>
                    {objective.current}/{objective.target}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      isComplete 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-r from-primary to-accent'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Game Over Modal */}
      {(gameState.isGameOver || gameState.isWon) && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">
              {gameState.isWon ? '🎉' : '😔'}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {gameState.isWon ? 'Congratulations!' : 'Game Over'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {gameState.isWon 
                ? `You reached the target score with ${gameState.moves} moves remaining!`
                : 'Better luck next time! Try again to beat the target score.'
              }
            </p>
            <Button onClick={onRestart} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Restart Button */}
      {!gameState.isGameOver && !gameState.isWon && (
        <Button 
          variant="outline" 
          onClick={onRestart}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restart Game
        </Button>
      )}
    </div>
  );
};