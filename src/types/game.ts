export type CandyType = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';

export interface Candy {
  id: string;
  type: CandyType;
  row: number;
  col: number;
  isMatched?: boolean;
  isAnimating?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  grid: (Candy | null)[][];
  score: number;
  moves: number;
  level: number;
  targetScore: number;
  isGameOver: boolean;
  isWon: boolean;
}

export interface Match {
  candies: Candy[];
  type: 'horizontal' | 'vertical';
}