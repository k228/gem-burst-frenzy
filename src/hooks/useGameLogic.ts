import { useState, useCallback, useEffect } from 'react';
import { Candy, CandyType, GameState, Position, Match } from '@/types/game';

const GRID_SIZE = 8;
const CANDY_TYPES: CandyType[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
const INITIAL_MOVES = 30;
const TARGET_SCORE = 10000;

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    score: 0,
    moves: INITIAL_MOVES,
    level: 1,
    targetScore: TARGET_SCORE,
    isGameOver: false,
    isWon: false,
  });

  const [selectedCandy, setSelectedCandy] = useState<Position | null>(null);

  // Generate random candy type
  const getRandomCandyType = (): CandyType => {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
  };

  // Create a new candy
  const createCandy = (row: number, col: number): Candy => ({
    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
    type: getRandomCandyType(),
    row,
    col,
  });

  // Initialize grid
  const initializeGrid = useCallback((): (Candy | null)[][] => {
    const newGrid: (Candy | null)[][] = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        let newCandy;
        let attempts = 0;
        
        // Avoid creating initial matches
        do {
          newCandy = createCandy(row, col);
          attempts++;
        } while (attempts < 10 && wouldCreateMatch(newGrid, newCandy, row, col));
        
        newGrid[row][col] = newCandy;
      }
    }
    
    return newGrid;
  }, []);

  // Check if placing candy would create a match
  const wouldCreateMatch = (grid: (Candy | null)[][], candy: Candy, row: number, col: number): boolean => {
    // Check horizontal match
    let horizontalCount = 1;
    for (let c = col - 1; c >= 0 && grid[row][c]?.type === candy.type; c--) {
      horizontalCount++;
    }
    for (let c = col + 1; c < GRID_SIZE && grid[row][c]?.type === candy.type; c++) {
      horizontalCount++;
    }
    if (horizontalCount >= 3) return true;

    // Check vertical match
    let verticalCount = 1;
    for (let r = row - 1; r >= 0 && grid[r][col]?.type === candy.type; r--) {
      verticalCount++;
    }
    for (let r = row + 1; r < GRID_SIZE && grid[r][col]?.type === candy.type; r++) {
      verticalCount++;
    }
    if (verticalCount >= 3) return true;

    return false;
  };

  // Find matches in the grid
  const findMatches = (grid: (Candy | null)[][]): Match[] => {
    const matches: Match[] = [];
    const matchedCandies = new Set<string>();

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      let count = 1;
      let currentType = grid[row][0]?.type;
      
      for (let col = 1; col < GRID_SIZE; col++) {
        if (grid[row][col]?.type === currentType && currentType) {
          count++;
        } else {
          if (count >= 3 && currentType) {
            const matchCandies: Candy[] = [];
            for (let c = col - count; c < col; c++) {
              if (grid[row][c]) {
                matchCandies.push(grid[row][c]!);
                matchedCandies.add(grid[row][c]!.id);
              }
            }
            matches.push({ candies: matchCandies, type: 'horizontal' });
          }
          count = 1;
          currentType = grid[row][col]?.type;
        }
      }
      
      // Check end of row
      if (count >= 3 && currentType) {
        const matchCandies: Candy[] = [];
        for (let c = GRID_SIZE - count; c < GRID_SIZE; c++) {
          if (grid[row][c]) {
            matchCandies.push(grid[row][c]!);
            matchedCandies.add(grid[row][c]!.id);
          }
        }
        matches.push({ candies: matchCandies, type: 'horizontal' });
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      let count = 1;
      let currentType = grid[0][col]?.type;
      
      for (let row = 1; row < GRID_SIZE; row++) {
        if (grid[row][col]?.type === currentType && currentType) {
          count++;
        } else {
          if (count >= 3 && currentType) {
            const matchCandies: Candy[] = [];
            for (let r = row - count; r < row; r++) {
              if (grid[r][col] && !matchedCandies.has(grid[r][col]!.id)) {
                matchCandies.push(grid[r][col]!);
              }
            }
            if (matchCandies.length >= 3) {
              matches.push({ candies: matchCandies, type: 'vertical' });
            }
          }
          count = 1;
          currentType = grid[row][col]?.type;
        }
      }
      
      // Check end of column
      if (count >= 3 && currentType) {
        const matchCandies: Candy[] = [];
        for (let r = GRID_SIZE - count; r < GRID_SIZE; r++) {
          if (grid[r][col] && !matchedCandies.has(grid[r][col]!.id)) {
            matchCandies.push(grid[r][col]!);
          }
        }
        if (matchCandies.length >= 3) {
          matches.push({ candies: matchCandies, type: 'vertical' });
        }
      }
    }

    return matches;
  };

  // Apply gravity to make candies fall
  const applyGravity = (grid: (Candy | null)[][]): (Candy | null)[][] => {
    const newGrid = grid.map(row => [...row]);

    for (let col = 0; col < GRID_SIZE; col++) {
      // Get all non-null candies in this column
      const candies = [];
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col]) {
          candies.push(newGrid[row][col]);
          newGrid[row][col] = null;
        }
      }

      // Place candies at bottom and fill with new ones
      let row = GRID_SIZE - 1;
      for (const candy of candies) {
        if (candy) {
          candy.row = row;
          newGrid[row][col] = candy;
          row--;
        }
      }

      // Fill remaining spaces with new candies
      for (let r = row; r >= 0; r--) {
        newGrid[r][col] = createCandy(r, col);
      }
    }

    return newGrid;
  };

  // Check if two positions are adjacent
  const areAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // Swap two candies
  const swapCandies = (grid: (Candy | null)[][], pos1: Position, pos2: Position): (Candy | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    const candy1 = newGrid[pos1.row][pos1.col];
    const candy2 = newGrid[pos2.row][pos2.col];

    if (candy1) {
      candy1.row = pos2.row;
      candy1.col = pos2.col;
    }
    if (candy2) {
      candy2.row = pos1.row;
      candy2.col = pos1.col;
    }

    newGrid[pos1.row][pos1.col] = candy2;
    newGrid[pos2.row][pos2.col] = candy1;

    return newGrid;
  };

  // Handle candy selection and swapping
  const handleCandyClick = useCallback((position: Position) => {
    if (gameState.isGameOver || gameState.isWon) return;

    if (!selectedCandy) {
      setSelectedCandy(position);
    } else {
      if (selectedCandy.row === position.row && selectedCandy.col === position.col) {
        setSelectedCandy(null);
        return;
      }

      if (areAdjacent(selectedCandy, position)) {
        // Try to swap
        const newGrid = swapCandies(gameState.grid, selectedCandy, position);
        const matches = findMatches(newGrid);

        if (matches.length > 0) {
          // Valid move
          setGameState(prev => ({
            ...prev,
            grid: newGrid,
            moves: prev.moves - 1,
          }));
          
          // Process matches after a short delay
          setTimeout(() => {
            processMatches();
          }, 300);
        }
      }
      
      setSelectedCandy(null);
    }
  }, [selectedCandy, gameState]);

  // Process matches and cascading
  const processMatches = useCallback(() => {
    setGameState(prev => {
      const matches = findMatches(prev.grid);
      
      if (matches.length === 0) {
        // Check if game is over
        const hasValidMoves = checkForValidMoves(prev.grid);
        if (!hasValidMoves || prev.moves <= 0) {
          return {
            ...prev,
            isGameOver: prev.score < prev.targetScore,
            isWon: prev.score >= prev.targetScore,
          };
        }
        return prev;
      }

      // Remove matched candies and calculate score
      const newGrid = prev.grid.map(row => [...row]);
      let scoreIncrease = 0;

      matches.forEach(match => {
        scoreIncrease += match.candies.length * 100;
        match.candies.forEach(candy => {
          newGrid[candy.row][candy.col] = null;
        });
      });

      // Apply gravity
      const finalGrid = applyGravity(newGrid);

      const newScore = prev.score + scoreIncrease;
      
      return {
        ...prev,
        grid: finalGrid,
        score: newScore,
        isWon: newScore >= prev.targetScore,
      };
    });

    // Continue processing matches after gravity
    setTimeout(() => {
      processMatches();
    }, 300);
  }, []);

  // Check for valid moves
  const checkForValidMoves = (grid: (Candy | null)[][]): boolean => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Check right swap
        if (col < GRID_SIZE - 1) {
          const testGrid = swapCandies(grid, { row, col }, { row, col: col + 1 });
          if (findMatches(testGrid).length > 0) return true;
        }
        // Check down swap
        if (row < GRID_SIZE - 1) {
          const testGrid = swapCandies(grid, { row, col }, { row: row + 1, col });
          if (findMatches(testGrid).length > 0) return true;
        }
      }
    }
    return false;
  };

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      grid: initializeGrid(),
      score: 0,
      moves: INITIAL_MOVES,
      level: 1,
      targetScore: TARGET_SCORE,
      isGameOver: false,
      isWon: false,
    });
    setSelectedCandy(null);
  }, [initializeGrid]);

  // Initialize game on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return {
    gameState,
    selectedCandy,
    handleCandyClick,
    resetGame,
  };
};