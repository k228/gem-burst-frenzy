import { Candy, Position } from '@/types/game';
import { cn } from '@/lib/utils';

interface CandyComponentProps {
  candy: Candy | null;
  position: Position;
  isSelected: boolean;
  onClick: (position: Position) => void;
}

const candyColors = {
  red: 'bg-candy-red',
  blue: 'bg-candy-blue',
  green: 'bg-candy-green',
  yellow: 'bg-candy-yellow',
  orange: 'bg-candy-orange',
  purple: 'bg-candy-purple',
};

const candyEmojis = {
  red: '🍓',
  blue: '🍇',
  green: '🍏',
  yellow: '🍋',
  orange: '🍊',
  purple: '🍆',
};

export const CandyComponent = ({ candy, position, isSelected, onClick }: CandyComponentProps) => {
  if (!candy) {
    return (
      <div className="w-12 h-12 rounded-xl border-2 border-dashed border-muted/30" />
    );
  }

  return (
    <button
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200',
        'hover:scale-110 hover:shadow-lg active:scale-95',
        'border-2 border-white/50 shadow-md',
        'bg-gradient-to-br from-white/20 to-transparent',
        candyColors[candy.type],
        isSelected && 'ring-4 ring-white ring-opacity-80 scale-110 shadow-xl animate-candy-glow',
        'cursor-pointer select-none'
      )}
      onClick={() => onClick(position)}
      style={{
        background: `linear-gradient(135deg, hsl(var(--candy-${candy.type})) 0%, hsl(var(--candy-${candy.type})) 80%, rgba(255,255,255,0.3) 100%)`,
      }}
    >
      <span className="drop-shadow-sm filter">
        {candyEmojis[candy.type]}
      </span>
    </button>
  );
};