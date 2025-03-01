import { TileData } from '../components/GameBoard/TileManager';
import { ResourceType } from '../components/HexTile/HexTile';

// Player representation
export interface Player {
  id: number;
  name: string;
  color: string;
  resources: {
    brick: number;
    wood: number;
    sheep: number;
    wheat: number;
    ore: number;
  };
  buildings: {
    settlements: number;
    cities: number;
    roads: number;
  };
  points: number;
  developmentCards: any[]; // To be implemented later
}

// Building types
export enum BuildingType {
  SETTLEMENT = 'settlement',
  CITY = 'city',
  ROAD = 'road'
}

// Building representation
export interface Building {
  id: string;
  type: BuildingType;
  playerId: number;
  vertexId?: string; // For settlements and cities
  edgeId?: string;   // For roads
}

// Game phases
export type GamePhase = 'setup' | 'main' | 'end';

// Game state
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  round: number;
  gameOver: boolean;
  winner: number | null;
  dice: { die1: number, die2: number } | null;
  tiles: TileData[];
  buildings: Building[];
  longestRoad: number | null; // Player ID who has the longest road
  largestArmy: number | null; // Player ID who has the largest army
}

// Resource costs for building
export const BUILDING_COSTS = {
  [BuildingType.ROAD]: {
    brick: 1,
    wood: 1,
    sheep: 0,
    wheat: 0,
    ore: 0
  },
  [BuildingType.SETTLEMENT]: {
    brick: 1,
    wood: 1,
    sheep: 1,
    wheat: 1,
    ore: 0
  },
  [BuildingType.CITY]: {
    brick: 0,
    wood: 0,
    sheep: 0,
    wheat: 2,
    ore: 3
  }
};

// Initialize a new game
export const initializeGame = (numPlayers: number): GameState => {
  if (numPlayers < 2 || numPlayers > 4) {
    throw new Error('Number of players must be between 2 and 4');
  }
  
  // Player colors
  const colors = ['#ff0000', '#0000ff', '#ffffff', '#ffa500'];
  
  // Create players
  const players: Player[] = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: i + 1,
      name: `Player ${i + 1}`,
      color: colors[i],
      resources: {
        // Start with zero resources in setup phase (per Catan rules)
        brick: 0,
        wood: 0,
        sheep: 0,
        wheat: 0,
        ore: 0
      },
      buildings: {
        settlements: 5,
        cities: 4,
        roads: 15
      },
      points: 0,
      developmentCards: []
    });
  }
  
  // Initialize game state
  return {
    players,
    currentPlayerIndex: 0,
    phase: 'setup',
    round: 1,
    gameOver: false,
    winner: null,
    dice: null,
    tiles: [],
    buildings: [],
    longestRoad: null,
    largestArmy: null
  };
};

// Generate a Catan-style board
export const generateCatanBoard = (): TileData[] => {
  // Create tiles in spiral order (how Catan boards are typically arranged)
  const spiralCoordinates = [
    // Center
    { q: 0, r: 0, s: 0 },
    // Inner ring (clockwise from top)
    { q: 0, r: -1, s: 1 },
    { q: 1, r: -1, s: 0 },
    { q: 1, r: 0, s: -1 },
    { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 },
    { q: -1, r: 0, s: 1 },
    // Outer ring (clockwise from top)
    { q: 0, r: -2, s: 2 },
    { q: 1, r: -2, s: 1 },
    { q: 2, r: -2, s: 0 },
    { q: 2, r: -1, s: -1 },
    { q: 2, r: 0, s: -2 },
    { q: 1, r: 1, s: -2 },
    { q: 0, r: 2, s: -2 },
    { q: -1, r: 2, s: -1 },
    { q: -2, r: 2, s: 0 },
    { q: -2, r: 1, s: 1 },
    { q: -2, r: 0, s: 2 },
    { q: -1, r: -1, s: 2 },
  ];
  
  // Catan standard resource distribution
  const catanResourceDistribution: ResourceType[] = [
    'desert',
    'brick', 'brick', 'brick',
    'wood', 'wood', 'wood', 'wood',
    'sheep', 'sheep', 'sheep', 'sheep',
    'wheat', 'wheat', 'wheat', 'wheat',
    'ore', 'ore', 'ore'
  ];
  
  // Catan standard number tokens (excluding 7)
  const catanNumberTokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  
  // Shuffle resources and numbers
  const shuffledResources = [...catanResourceDistribution].sort(() => Math.random() - 0.5);
  const shuffledNumbers = [...catanNumberTokens].sort(() => Math.random() - 0.5);
  
  // Create tiles
  const tiles: TileData[] = spiralCoordinates.map((coord, index) => {
    const resourceType = shuffledResources[index];
    // Only assign number if not desert
    const value = resourceType === 'desert' ? undefined : shuffledNumbers.pop();
    
    return {
      id: `tile-${index}`,
      q: coord.q,
      r: coord.r,
      s: coord.s,
      resourceType,
      value,
    };
  });
  
  return tiles;
};

// Roll dice and distribute resources
export const rollDiceAndDistributeResources = (gameState: GameState): GameState => {
  // Roll two dice
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const diceSum = die1 + die2;
  
  // Create a copy of the game state to modify
  const newGameState = { ...gameState };
  newGameState.dice = { die1, die2 };
  
  // If 7 is rolled, handle robber (to be implemented)
  if (diceSum === 7) {
    // TODO: Implement robber logic
    return newGameState;
  }
  
  // Find tiles that match the dice roll
  const matchingTiles = gameState.tiles.filter(tile => tile.value === diceSum);
  
  // Distribute resources to players based on their buildings adjacent to matching tiles
  matchingTiles.forEach(tile => {
    // Skip desert tiles
    if (tile.resourceType === 'desert') return;
    
    // Find buildings (settlements and cities) adjacent to this tile
    gameState.buildings.forEach(building => {
      if (building.type !== BuildingType.SETTLEMENT && building.type !== BuildingType.CITY) return;
      
      // Check if the building is connected to this tile
      // This is a placeholder - in a real game, you'd need to check if the vertex is actually adjacent to the tile
      if (isVertexConnectedToTile(building.vertexId!, tile)) {
        const playerId = building.playerId;
        const playerIndex = gameState.players.findIndex(p => p.id === playerId);
        
        if (playerIndex !== -1) {
          // Determine resource amount (1 for settlement, 2 for city)
          const resourceAmount = building.type === BuildingType.SETTLEMENT ? 1 : 2;
          
          // Add resources to the player
          const resourceType = tile.resourceType;
          if (resourceType !== 'desert') {
            const player = newGameState.players[playerIndex];
            
            // Update the player's resources
            switch (resourceType) {
              case 'brick':
                player.resources.brick += resourceAmount;
                break;
              case 'wood':
                player.resources.wood += resourceAmount;
                break;
              case 'sheep':
                player.resources.sheep += resourceAmount;
                break;
              case 'wheat':
                player.resources.wheat += resourceAmount;
                break;
              case 'ore':
                player.resources.ore += resourceAmount;
                break;
            }
          }
        }
      }
    });
  });
  
  return newGameState;
};

// Check if a player can afford to build something
export const canBuild = (player: Player, buildingType: BuildingType): boolean => {
  const cost = BUILDING_COSTS[buildingType];
  
  // Check if player has enough resources
  const hasEnoughResources = 
    player.resources.brick >= cost.brick &&
    player.resources.wood >= cost.wood &&
    player.resources.sheep >= cost.sheep &&
    player.resources.wheat >= cost.wheat &&
    player.resources.ore >= cost.ore;
  
  // Check if player has available building pieces
  let hasAvailableBuilding = false;
  switch (buildingType) {
    case BuildingType.SETTLEMENT:
      hasAvailableBuilding = player.buildings.settlements > 0;
      break;
    case BuildingType.CITY:
      hasAvailableBuilding = player.buildings.cities > 0;
      break;
    case BuildingType.ROAD:
      hasAvailableBuilding = player.buildings.roads > 0;
      break;
  }
  
  return hasEnoughResources && hasAvailableBuilding;
};

// Placeholder function - in a real game, you'd implement proper vertex-tile connectivity
export const isVertexConnectedToTile = (vertexId: string, tile: TileData): boolean => {
  // This is a placeholder implementation
  // In a real game, you'd need to check if the vertex is actually adjacent to the tile
  // based on the hex grid connectivity
  
  // For now, we'll just return true to simulate connectivity
  return true;
};

// Advance to the next player's turn
export const advanceTurn = (gameState: GameState): GameState => {
  const newGameState = { ...gameState };
  
  // Clear dice roll
  newGameState.dice = null;
  
  // Special player order for setup phase: 1,2,3,4,4,3,2,1
  if (newGameState.phase === 'setup') {
    const numPlayers = newGameState.players.length;
    
    // First round: players go in ascending order (0,1,2,3)
    // Second round: players go in descending order (3,2,1,0)
    if (newGameState.round === 1) {
      // First round - ascending order
      newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % numPlayers;
      
      // If we've gone through all players in the first round, start second round
      if (newGameState.currentPlayerIndex === 0) {
        newGameState.round = 2;
        // Set to last player to start the descending order
        newGameState.currentPlayerIndex = numPlayers - 1;
      }
    } else if (newGameState.round === 2) {
      // Second round - descending order
      newGameState.currentPlayerIndex = newGameState.currentPlayerIndex - 1;
      
      // If we've gone through all players in reverse, move to main phase
      if (newGameState.currentPlayerIndex < 0) {
        newGameState.currentPlayerIndex = 0; // Reset to first player
        newGameState.round = 3;
        newGameState.phase = 'main';
        
        // When setup is complete, distribute initial resources based on second settlement
        distributeInitialResources(newGameState);
      }
    }
  } else {
    // Normal turn order for main phase
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    
    // If we've gone through all players, increment the round
    if (newGameState.currentPlayerIndex === 0) {
      newGameState.round += 1;
    }
  }
  
  // Check for game end conditions (e.g., a player has 10 points)
  newGameState.players.forEach(player => {
    if (player.points >= 10) {
      newGameState.gameOver = true;
      newGameState.winner = player.id;
    }
  });
  
  return newGameState;
};

// Distribute initial resources based on the second settlement placement
const distributeInitialResources = (gameState: GameState): void => {
  const { players, buildings, tiles } = gameState;
  
  // For each player, find their second settlement
  players.forEach(player => {
    // Get all settlements for this player
    const playerSettlements = buildings.filter(
      b => b.playerId === player.id && b.type === BuildingType.SETTLEMENT
    );
    
    // If player has at least 2 settlements (should always be true after setup)
    if (playerSettlements.length >= 2) {
      // The second settlement is the one placed in round 2
      // We can identify it as the settlement with the higher index in the buildings array
      // since buildings are added in order of placement
      const secondSettlement = playerSettlements.reduce((latest, current) => {
        const latestIndex = buildings.findIndex(b => b.id === latest.id);
        const currentIndex = buildings.findIndex(b => b.id === current.id);
        return currentIndex > latestIndex ? current : latest;
      });
      
      // Find all tiles adjacent to this settlement
      if (secondSettlement.vertexId) {
        // For each tile, check if it's connected to this vertex
        tiles.forEach(tile => {
          // Skip desert tiles
          if (tile.resourceType === 'desert') return;
          
          // Check if the settlement is connected to this tile
          if (isVertexConnectedToTile(secondSettlement.vertexId!, tile)) {
            // Add one resource of the tile's type to the player
            const resourceType = tile.resourceType;
            
            // Update the player's resources
            switch (resourceType) {
              case 'brick':
                player.resources.brick += 1;
                break;
              case 'wood':
                player.resources.wood += 1;
                break;
              case 'sheep':
                player.resources.sheep += 1;
                break;
              case 'wheat':
                player.resources.wheat += 1;
                break;
              case 'ore':
                player.resources.ore += 1;
                break;
            }
          }
        });
      }
    }
  });
}; 