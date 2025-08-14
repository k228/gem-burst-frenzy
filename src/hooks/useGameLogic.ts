import { useState, useCallback, useEffect } from 'react';
import { Candy, CandyType, GameState, Position, Match, SpecialType, ObjectiveState } from '@/types/game';

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
    objectives: [
      { type: 'score', target: TARGET_SCORE, current: 0, description: `Reach ${TARGET_SCORE.toLocaleString()} points` },
      { type: 'clear-blockers', target: 5, current: 0, description: 'Clear 5 blockers' }
    ],
    dragStart: null,
  });

  const [selectedCandy, setSelectedCandy] = useState<Position | null>(null);

  // Generate random candy type
  const getRandomCandyType = (): CandyType => {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
  };

  // Create a new candy
  const createCandy = (row: number, col: number): Candy => {
    const candy: Candy = {
      id: `${row}-${col}-${Date.now()}-${Math.random()}`,
      type: getRandomCandyType(),
      row,
      col,
    };

    // Add obstacles randomly (10% chance)
    if (Math.random() < 0.1) {
      const obstacles = ['locked', 'ice', 'blocker'];
      candy.obstacleType = obstacles[Math.floor(Math.random() * obstacles.length)] as any;
      candy.obstacleHealth = candy.obstacleType === 'ice' ? 2 : 1;
    }

    return candy;
  };

  // Create special candy based on match length
  const createSpecialCandy = (position: Position, matchLength: number, matchType: 'horizontal' | 'vertical'): SpecialType | null => {
    if (matchLength === 4) {
      return matchType === 'horizontal' ? 'striped-horizontal' : 'striped-vertical';
    } else if (matchLength === 5) {
      return 'wrapped';
    } else if (matchLength >= 6) {
      return 'color-bomb';
    }
    return null;
  };

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
    for (let c = col - 1; c >= 0 && grid[row] && grid[row][c]?.type === candy.type; c--) {
      horizontalCount++;
    }
    for (let c = col + 1; c < GRID_SIZE && grid[row] && grid[row][c]?.type === candy.type; c++) {
      horizontalCount++;
    }
    if (horizontalCount >= 3) return true;

    // Check vertical match
    let verticalCount = 1;
    for (let r = row - 1; r >= 0 && grid[r] && grid[r][col]?.type === candy.type; r--) {
      verticalCount++;
    }
    for (let r = row + 1; r < GRID_SIZE && grid[r] && grid[r][col]?.type === candy.type; r++) {
      verticalCount++;
    }
    if (verticalCount >= 3) return true;

    return false;
  };

  // Execute special candy effects
  const executeSpecialEffect = (grid: (Candy | null)[][], candy: Candy): (Candy | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    
    if (!candy.specialType) return newGrid;

    switch (candy.specialType) {
      case 'striped-horizontal':
        // Clear entire row
        for (let col = 0; col < GRID_SIZE; col++) {
          if (newGrid[candy.row][col]) {
            newGrid[candy.row][col] = null;
          }
        }
        break;
      
      case 'striped-vertical':
        // Clear entire column
        for (let row = 0; row < GRID_SIZE; row++) {
          if (newGrid[row][candy.col]) {
            newGrid[row][candy.col] = null;
          }
        }
        break;
      
      case 'wrapped':
        // Clear 3x3 area around candy
        for (let r = Math.max(0, candy.row - 1); r <= Math.min(GRID_SIZE - 1, candy.row + 1); r++) {
          for (let c = Math.max(0, candy.col - 1); c <= Math.min(GRID_SIZE - 1, candy.col + 1); c++) {
            if (newGrid[r][c]) {
              newGrid[r][c] = null;
            }
          }
        }
        break;
      
      case 'color-bomb':
        // Clear all candies of the same type
        const targetType = candy.type;
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (newGrid[row][col]?.type === targetType) {
              newGrid[row][col] = null;
            }
          }
        }
        break;
    }

    return newGrid;
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
        if (grid[row][col]?.type === currentType && currentType && !grid[row][col]?.obstacleType) {
          count++;
        } else {
          if (count >= 3 && currentType) {
            const matchCandies: Candy[] = [];
            for (let c = col - count; c < col; c++) {
              if (grid[row][c] && !grid[row][c]?.obstacleType) {
                matchCandies.push(grid[row][c]!);
                matchedCandies.add(grid[row][c]!.id);
              }
            }
            const specialType = createSpecialCandy({ row, col: col - Math.floor(count / 2) }, count, 'horizontal');
            matches.push({ 
              candies: matchCandies, 
              type: 'horizontal', 
              length: count,
              specialCreated: specialType || undefined
            });
          }
          count = 1;
          currentType = grid[row][col]?.type;
        }
      }
      
      // Check end of row
      if (count >= 3 && currentType) {
        const matchCandies: Candy[] = [];
        for (let c = GRID_SIZE - count; c < GRID_SIZE; c++) {
          if (grid[row][c] && !grid[row][c]?.obstacleType) {
            matchCandies.push(grid[row][c]!);
            matchedCandies.add(grid[row][c]!.id);
          }
        }
        const specialType = createSpecialCandy({ row, col: GRID_SIZE - Math.floor(count / 2) }, count, 'horizontal');
        matches.push({ 
          candies: matchCandies, 
          type: 'horizontal', 
          length: count,
          specialCreated: specialType || undefined
        });
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      let count = 1;
      let currentType = grid[0][col]?.type;
      
      for (let row = 1; row < GRID_SIZE; row++) {
        if (grid[row][col]?.type === currentType && currentType && !grid[row][col]?.obstacleType) {
          count++;
        } else {
          if (count >= 3 && currentType) {
            const matchCandies: Candy[] = [];
            for (let r = row - count; r < row; r++) {
              if (grid[r][col] && !matchedCandies.has(grid[r][col]!.id) && !grid[r][col]?.obstacleType) {
                matchCandies.push(grid[r][col]!);
              }
            }
            if (matchCandies.length >= 3) {
              const specialType = createSpecialCandy({ row: row - Math.floor(count / 2), col }, count, 'vertical');
              matches.push({ 
                candies: matchCandies, 
                type: 'vertical', 
                length: count,
                specialCreated: specialType || undefined
              });
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
          if (grid[r][col] && !matchedCandies.has(grid[r][col]!.id) && !grid[r][col]?.obstacleType) {
            matchCandies.push(grid[r][col]!);
          }
        }
        if (matchCandies.length >= 3) {
          const specialType = createSpecialCandy({ row: GRID_SIZE - Math.floor(count / 2), col }, count, 'vertical');
          matches.push({ 
            candies: matchCandies, 
            type: 'vertical', 
            length: count,
            specialCreated: specialType || undefined
          });
        }
      }
    }

    return matches;
  };

  // Damage obstacles
  const damageObstacles = (grid: (Candy | null)[][], matchedPositions: Position[]): (Candy | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    
    matchedPositions.forEach(pos => {
      const adjacent = [
        { row: pos.row - 1, col: pos.col },
        { row: pos.row + 1, col: pos.col },
        { row: pos.row, col: pos.col - 1 },
        { row: pos.row, col: pos.col + 1 }
      ];

      adjacent.forEach(adjPos => {
        if (adjPos.row >= 0 && adjPos.row < GRID_SIZE && adjPos.col >= 0 && adjPos.col < GRID_SIZE) {
          const candy = newGrid[adjPos.row][adjPos.col];
          if (candy?.obstacleType) {
            if (candy.obstacleHealth) {
              candy.obstacleHealth--;
              if (candy.obstacleHealth <= 0) {
                delete candy.obstacleType;
                delete candy.obstacleHealth;
              }
            }
          }
        }
      });
    });

    return newGrid;
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

    // Check for special candy combos
    if (candy1?.specialType && candy2?.specialType) {
      // Execute both special effects
      let resultGrid = executeSpecialEffect(newGrid, candy1);
      resultGrid = executeSpecialEffect(resultGrid, candy2);
      return resultGrid;
    } else if (candy1?.specialType) {
      return executeSpecialEffect(newGrid, candy1);
    } else if (candy2?.specialType) {
      return executeSpecialEffect(newGrid, candy2);
    }

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

  // Handle drag start
  const handleDragStart = useCallback((position: Position) => {
    if (gameState.isGameOver || gameState.isWon) return;
    setGameState(prev => ({ ...prev, dragStart: position }));
  }, [gameState]);

  // Handle drag end
  const handleDragEnd = useCallback((position: Position) => {
    if (!gameState.dragStart || gameState.isGameOver || gameState.isWon) return;
    
    if (areAdjacent(gameState.dragStart, position)) {
      const newGrid = swapCandies(gameState.grid, gameState.dragStart, position);
      const matches = findMatches(newGrid);

      if (matches.length > 0) {
        setGameState(prev => ({
          ...prev,
          grid: newGrid,
          moves: prev.moves - 1,
          dragStart: null,
        }));
        
        setTimeout(() => {
          processMatches();
        }, 300);
      }
    }
    
    setGameState(prev => ({ ...prev, dragStart: null }));
  }, [gameState]);

  // Update objectives
  const updateObjectives = (matches: Match[], clearedBlockers: number): ObjectiveState[] => {
    return gameState.objectives.map(obj => {
      switch (obj.type) {
        case 'score':
          return { ...obj, current: gameState.score };
        case 'clear-blockers':
          return { ...obj, current: obj.current + clearedBlockers };
        case 'collect-color':
          const colorMatches = matches.reduce((total, match) => {
            return total + match.candies.filter(candy => candy.type === obj.colorType).length;
          }, 0);
          return { ...obj, current: obj.current + colorMatches };
        default:
          return obj;
      }
    });
  };

  // Process matches and cascading
  const processMatches = useCallback(() => {
    setGameState(prev => {
      const matches = findMatches(prev.grid);
      
      if (matches.length === 0) {
        // Check if game is over
        const hasValidMoves = checkForValidMoves(prev.grid);
        const objectivesComplete = prev.objectives.every(obj => obj.current >= obj.target);
        
        if (!hasValidMoves || prev.moves <= 0) {
          return {
            ...prev,
            isGameOver: !objectivesComplete,
            isWon: objectivesComplete,
          };
        }
        return prev;
      }

      // Remove matched candies and calculate score
      let newGrid = prev.grid.map(row => [...row]);
      let scoreIncrease = 0;
      let clearedBlockers = 0;
      const matchedPositions: Position[] = [];

      matches.forEach(match => {
        scoreIncrease += match.candies.length * 100 * (match.length - 2); // Bonus for longer matches
        
        match.candies.forEach(candy => {
          matchedPositions.push({ row: candy.row, col: candy.col });
          if (candy.obstacleType === 'blocker') clearedBlockers++;
          
          // Create special candy if applicable
          if (match.specialCreated && match.candies.length >= 4) {
            const centerCandy = match.candies[Math.floor(match.candies.length / 2)];
            newGrid[centerCandy.row][centerCandy.col] = {
              ...centerCandy,
              specialType: match.specialCreated
            };
          } else {
            newGrid[candy.row][candy.col] = null;
          }
        });
      });

      // Damage adjacent obstacles
      newGrid = damageObstacles(newGrid, matchedPositions);

      // Apply gravity
      const finalGrid = applyGravity(newGrid);

      const newScore = prev.score + scoreIncrease;
      const updatedObjectives = updateObjectives(matches, clearedBlockers);
      
      return {
        ...prev,
        grid: finalGrid,
        score: newScore,
        objectives: updatedObjectives.map(obj => ({ ...obj, current: obj.type === 'score' ? newScore : obj.current })),
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
      objectives: [
        { type: 'score', target: TARGET_SCORE, current: 0, description: `Reach ${TARGET_SCORE.toLocaleString()} points` },
        { type: 'clear-blockers', target: 5, current: 0, description: 'Clear 5 blockers' }
      ],
      dragStart: null,
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
    handleDragStart,
    handleDragEnd,
    resetGame,
  };
};