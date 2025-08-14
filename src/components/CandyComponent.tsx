import { Candy, Position } from '@/types/game';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CandyComponentProps {
  candy: Candy | null;
  position: Position;
  isSelected: boolean;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragEnd: (position: Position) => void;
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

const specialEmojis = {
  'striped-horizontal': '⚡',
  'striped-vertical': '⚡',
  'wrapped': '💎',
  'color-bomb': '💣',
};

const obstacleOverlays = {
  locked: '🔒',
  ice: '❄️',
  blocker: '🧱',
};

export const CandyComponent = ({ 
  candy, 
  position, 
  isSelected, 
  onClick, 
  onDragStart, 
  onDragEnd 
}: CandyComponentProps) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!candy) {
    return (
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed border-muted/30" />
    );
  }

  const handleMouseDown = () => {
    setIsDragging(true);
    onDragStart(position);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(position);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onDragStart(position);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      // Get touch position and find element underneath
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const candyElement = elementBelow?.closest('[data-candy-position]');
      
      if (candyElement) {
        const targetPos = JSON.parse(candyElement.getAttribute('data-candy-position') || '{}');
        onDragEnd(targetPos);
      } else {
        onDragEnd(position);
      }
    }
  };

  return (
    <button
      data-candy-position={JSON.stringify(position)}
      className={cn(
        'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold transition-all duration-200',
        'hover:scale-110 hover:shadow-lg active:scale-95',
        'border-2 border-white/50 shadow-md relative touch-manipulation',
        'bg-gradient-to-br from-white/20 to-transparent',
        candyColors[candy.type],
        isSelected && 'ring-4 ring-white ring-opacity-80 scale-110 shadow-xl animate-candy-glow',
        isDragging && 'scale-110 z-10',
        candy.obstacleType && 'opacity-80',
        'cursor-pointer select-none'
      )}
      onClick={() => onClick(position)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        background: `linear-gradient(135deg, hsl(var(--candy-${candy.type})) 0%, hsl(var(--candy-${candy.type})) 80%, rgba(255,255,255,0.3) 100%)`,
      }}
    >
      {/* Base candy emoji */}
      <span className="drop-shadow-sm filter relative z-10">
        {candyEmojis[candy.type]}
      </span>
      
      {/* Special candy overlay */}
      {candy.specialType && (
        <span className="absolute top-0 right-0 text-xs transform scale-75 animate-pulse">
          {specialEmojis[candy.specialType]}
        </span>
      )}
      
      {/* Obstacle overlay */}
      {candy.obstacleType && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <span className="text-xs">{obstacleOverlays[candy.obstacleType]}</span>
          {candy.obstacleHealth && candy.obstacleHealth > 1 && (
            <span className="absolute bottom-0 right-0 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {candy.obstacleHealth}
            </span>
          )}
        </div>
      )}
      
      {/* Striped effect for special candies */}
      {candy.specialType === 'striped-horizontal' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60 rounded-xl" />
      )}
      {candy.specialType === 'striped-vertical' && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent opacity-60 rounded-xl" />
      )}
      {candy.specialType === 'wrapped' && (
        <div className="absolute inset-0 border-4 border-white/60 rounded-xl animate-pulse" />
      )}
      {candy.specialType === 'color-bomb' && (
        <div className="absolute inset-0 bg-gradient-radial from-white/40 to-transparent rounded-xl animate-ping" />
      )}
    </button>
  );
};