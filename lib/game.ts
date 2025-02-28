import { INVALID_MOVE } from 'boardgame.io/core';
import { PlayerID } from 'boardgame.io';
import { 
  CatanState, 
  ResourceType, 
  Tile, 
  Player, 
  Structure, 
  StructureType, 
  VertexCoordinates,
  EdgeCoordinates
} from './types';
import { 
  generateId, 
  generateHexGrid, 
  createResourceDistribution, 
  createNumberTokenDistribution, 
  shuffleArray, 
  rollDice, 
  collectResources,
  canBuild,
  deductResourcesForBuilding, 
  isValidSettlementLocation
} from './utils';

// Player colors
const PLAYER_COLORS = ['red', 'blue', 'green', 'orange'];

// Initial setup of the Catan game
const createInitialState = (numPlayers: number = 4): CatanState => {
  // Generate the hex grid coordinates
  const hexCoordinates = generateHexGrid();
  
  // Create resource distribution and shuffle
  const resources = shuffleArray(createResourceDistribution());
  
  // Create number token distribution and shuffle (excluding desert)
  const numberTokens = shuffleArray(createNumberTokenDistribution());
  
  // Create the tiles
  const tiles: Tile[] = hexCoordinates.map((coords, index) => {
    const resource = resources[index];
    // Desert has no number token
    const tokenNumber = resource !== ResourceType.Desert ? numberTokens.pop() : undefined;
    
    return {
      id: generateId(),
      coordinates: coords,
      resource,
      tokenNumber
    };
  });
  
  // Create players
  const players: Player[] = Array(numPlayers).fill(null).map((_, index) => ({
    id: `player${index}`,
    name: `Player ${index + 1}`,
    color: PLAYER_COLORS[index],
    resources: {
      [ResourceType.Brick]: 0,
      [ResourceType.Wood]: 0,
      [ResourceType.Sheep]: 0,
      [ResourceType.Wheat]: 0,
      [ResourceType.Ore]: 0
    },
    structures: [],
    victoryPoints: 0
  }));
  
  return {
    tiles,
    players,
    structures: [],
    currentPlayer: 0, // Start with player 0
  };
};

// Define the Catan game
const CatanGame = {
  name: 'catan',
  
  setup: (ctx) => {
    return createInitialState(ctx.numPlayers);
  },
  
  moves: {
    // Roll dice to start a turn
    rollDice: ({ G, ctx }) => {
      const [die1, die2] = rollDice();
      const diceSum = die1 + die2;
      
      // Collect resources for all players based on the dice roll
      collectResources(G, diceSum);
      
      // Update the last roll
      G.lastRoll = { die1, die2, sum: diceSum };
      
      return G;
    },
    
    // Build a settlement
    buildSettlement: ({ G, ctx, playerID }, coordinates: VertexCoordinates) => {
      // Validate player has resources
      const player = G.players[Number(playerID)];
      if (!canBuild(player, StructureType.Settlement)) {
        return G; // Not enough resources
      }
      
      // Check if the location is valid
      const existingSettlementCoords = G.structures
        .filter(s => s.type === StructureType.Settlement || s.type === StructureType.City)
        .map(s => s.coordinates as VertexCoordinates);
      
      if (!isValidSettlementLocation(coordinates, existingSettlementCoords)) {
        return G; // Invalid location
      }
      
      // Create the settlement
      const settlement: Structure = {
        id: generateId(),
        type: StructureType.Settlement,
        playerId: playerID as string,
        coordinates
      };
      
      // Deduct resources
      player.resources = deductResourcesForBuilding(player.resources, StructureType.Settlement);
      
      // Add settlement to structures
      G.structures.push(settlement);
      
      // Update player victory points
      player.victoryPoints += 1;
      
      return G;
    },
    
    // Build a road
    buildRoad: ({ G, ctx, playerID }, coordinates: EdgeCoordinates) => {
      // Validate player has resources
      const player = G.players[Number(playerID)];
      if (!canBuild(player, StructureType.Road)) {
        return G; // Not enough resources
      }
      
      // In a complete implementation, we would check if the road connects to
      // an existing settlement or road owned by the player
      
      // Create the road
      const road: Structure = {
        id: generateId(),
        type: StructureType.Road,
        playerId: playerID as string,
        coordinates
      };
      
      // Deduct resources
      player.resources = deductResourcesForBuilding(player.resources, StructureType.Road);
      
      // Add road to structures
      G.structures.push(road);
      
      return G;
    },
    
    // Upgrade settlement to city
    buildCity: ({ G, ctx, playerID }, settlementId: string) => {
      // Validate player has resources
      const player = G.players[Number(playerID)];
      if (!canBuild(player, StructureType.City)) {
        return G; // Not enough resources
      }
      
      // Find the settlement to upgrade
      const settlementIndex = G.structures.findIndex(
        s => s.id === settlementId && 
        s.type === StructureType.Settlement && 
        s.playerId === playerID
      );
      
      if (settlementIndex === -1) {
        return G; // Settlement not found or not owned by player
      }
      
      // Upgrade to city
      G.structures[settlementIndex].type = StructureType.City;
      
      // Deduct resources
      player.resources = deductResourcesForBuilding(player.resources, StructureType.City);
      
      // Update player victory points (replace 1 settlement point with 2 city points)
      player.victoryPoints += 1;
      
      return G;
    },
    
    // For POC: Add resources to current player
    addResources: ({ G, ctx, playerID }, amount: number = 1) => {
      const player = G.players[Number(playerID)];
      
      // Add some of each resource
      player.resources[ResourceType.Brick] += amount;
      player.resources[ResourceType.Wood] += amount;
      player.resources[ResourceType.Sheep] += amount;
      player.resources[ResourceType.Wheat] += amount;
      player.resources[ResourceType.Ore] += amount;
      
      return G;
    }
  },
  
  turn: {
    // Move to the next player after a turn
    order: {
      first: () => 0,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    }
  },
  
  endIf: ({ G }) => {
    // Check if any player has reached 10 victory points
    const winner = G.players.findIndex(p => p.victoryPoints >= 10);
    if (winner >= 0) {
      return { winner };
    }
  }
};

export default CatanGame; 