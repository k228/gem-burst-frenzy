import { Candy, Position } from '@/types/game';
import { CandyComponent } from './CandyComponent';

interface CandyGridProps {
  grid: (Candy | null)[][];
  selectedCandy: Position | null;
  onCandyClick: (position: Position) => void;
}

export const CandyGrid = ({ grid, selectedCandy, onCandyClick }: CandyGridProps) => {
  return (
    <div className="grid grid-cols-8 gap-1 p-4 bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100 rounded-xl shadow-lg border-4 border-white/50">
      {grid.map((row, rowIndex) =>
        row.map((candy, colIndex) => (
          <CandyComponent
            key={candy?.id || `empty-${rowIndex}-${colIndex}`}
            candy={candy}
            position={{ row: rowIndex, col: colIndex }}
            isSelected={
              selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex
            }
            onClick={onCandyClick}
          />
        ))
      )}
    </div>
  );
};