export type CandyType = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';
export type SpecialType = 'striped-horizontal' | 'striped-vertical' | 'wrapped' | 'color-bomb';
export type ObstacleType = 'locked' | 'ice' | 'blocker';

export interface Candy {
  id: string;
  type: CandyType;
  row: number;
  col: number;
  isMatched?: boolean;
  isAnimating?: boolean;
  specialType?: SpecialType;
  obstacleType?: ObstacleType;
  obstacleHealth?: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface ObjectiveState {
  type: 'score' | 'clear-blockers' | 'collect-color';
  target: number;
  current: number;
  colorType?: CandyType;
  description: string;
}

export interface GameState {
  grid: (Candy | null)[][];
  score: number;
  moves: number;
  level: number;
  targetScore: number;
  isGameOver: boolean;
  isWon: boolean;
  objectives: ObjectiveState[];
  dragStart: Position | null;
}

export interface Match {
  candies: Candy[];
  type: 'horizontal' | 'vertical';
  length: number;
  specialCreated?: SpecialType;
}