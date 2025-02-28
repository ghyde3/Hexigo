import { 
  ResourceType, 
  Tile, 
  HexCoordinates, 
  ResourceCounts, 
  Player, 
  StructureType, 
  BUILDING_COSTS,
  VertexCoordinates,
  EdgeCoordinates,
  CatanState,
  Port,
  PortType,
  Structure
} from './types';

// Generate a random string ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Get a random resource type
export function getRandomResource(): ResourceType {
  const resources = [
    ResourceType.Brick,
    ResourceType.Wood,
    ResourceType.Sheep,
    ResourceType.Wheat,
    ResourceType.Ore,
  ];
  return resources[Math.floor(Math.random() * resources.length)];
}

// Create a distribution of resources according to Catan rules
export function createResourceDistribution(): ResourceType[] {
  return [
    ResourceType.Desert,
    // 3 Brick tiles
    ResourceType.Brick, ResourceType.Brick, ResourceType.Brick,
    // 4 Wood tiles
    ResourceType.Wood, ResourceType.Wood, ResourceType.Wood, ResourceType.Wood,
    // 4 Sheep tiles
    ResourceType.Sheep, ResourceType.Sheep, ResourceType.Sheep, ResourceType.Sheep,
    // 4 Wheat tiles
    ResourceType.Wheat, ResourceType.Wheat, ResourceType.Wheat, ResourceType.Wheat,
    // 3 Ore tiles
    ResourceType.Ore, ResourceType.Ore, ResourceType.Ore
  ];
}

// Create a distribution of number tokens according to Catan rules
export function createNumberTokenDistribution(): number[] {
  return [
    2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
  ];
}

// Shuffle an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate the hexagonal grid coordinates for the Catan board
export function generateHexGrid(): HexCoordinates[] {
  const coordinates: HexCoordinates[] = [];
  
  // Define the exact coordinates for a standard Catan board
  const boardLayout = [
    // Row 0 (top row, 3 tiles)
    { q: -1, r: -2, s: 3 }, { q: 0, r: -2, s: 2 }, { q: 1, r: -2, s: 1 },
    // Row 1 (4 tiles)
    { q: -2, r: -1, s: 3 }, { q: -1, r: -1, s: 2 }, { q: 0, r: -1, s: 1 }, { q: 1, r: -1, s: 0 },
    // Row 2 (middle row, 5 tiles)
    { q: -2, r: 0, s: 2 }, { q: -1, r: 0, s: 1 }, { q: 0, r: 0, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 2, r: 0, s: -2 },
    // Row 3 (4 tiles)
    { q: -2, r: 1, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 }, { q: 1, r: 1, s: -2 },
    // Row 4 (bottom row, 3 tiles)
    { q: -2, r: 2, s: 0 }, { q: -1, r: 2, s: -1 }, { q: 0, r: 2, s: -2 }
  ];
  
  return boardLayout;
}

// Check if a player has enough resources to build a structure
export function canBuild(playerOrGame: Player | CatanState, structureTypeOrPlayerIndex: StructureType | number, structureType?: StructureType): boolean {
  // Handle both function signatures:
  // 1. canBuild(player: Player, structureType: StructureType)
  // 2. canBuild(game: CatanState, playerIndex: number, structureType: StructureType)
  
  let player: Player;
  let type: StructureType;
  
  if (structureType !== undefined) {
    // Using the second signature with game state
    const game = playerOrGame as CatanState;
    const playerIndex = structureTypeOrPlayerIndex as number;
    
    // Make sure the player exists in the game
    if (!game.players || !game.players[playerIndex]) {
      return false;
    }
    
    player = game.players[playerIndex];
    type = structureType;
  } else {
    // Using the first signature with player directly
    player = playerOrGame as Player;
    type = structureTypeOrPlayerIndex as StructureType;
  }
  
  // Make sure player.resources exists
  if (!player || !player.resources) {
    return false;
  }
  
  const cost = BUILDING_COSTS[type];
  
  return Object.entries(cost).every(([resource, amount]) => {
    return player.resources[resource as ResourceType] >= amount;
  });
}

// Deduct resources from a player when building
export function deductResourcesForBuilding(resources: ResourceCounts, structureType: StructureType): ResourceCounts {
  const cost = BUILDING_COSTS[structureType];
  const updatedResources = { ...resources };
  
  Object.entries(cost).forEach(([resource, amount]) => {
    updatedResources[resource as ResourceType] -= amount;
  });
  
  return updatedResources;
}

// Check if a settlement location is valid (at least 2 edges away from other settlements)
export function isValidSettlementLocation(
  vertexCoords: VertexCoordinates, 
  existingSettlements: VertexCoordinates[]
): boolean {
  // Check distance from other settlements (Catan rule: at least 2 roads distance)
  return !existingSettlements.some(existing => {
    const distance = calculateVertexDistance(vertexCoords, existing);
    return distance < 2;
  });
}

// Calculate the distance between two vertices
export function calculateVertexDistance(a: VertexCoordinates, b: VertexCoordinates): number {
  // This is a simplified calculation - in a real implementation, you'd need to 
  // account for the actual path distance along the edges
  const qDiff = Math.abs(a.q - b.q);
  const rDiff = Math.abs(a.r - b.r);
  const sDiff = Math.abs(a.s - b.s);
  
  return Math.max(qDiff, rDiff, sDiff);
}

// Roll two dice and return the sum
export function rollDice(): [number, number] {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return [die1, die2];
}

// Collect resources based on a dice roll
export function collectResources(
  G: any,
  diceRoll: number
): void {
  // Find all tiles with the rolled number
  const matchingTiles = G.tiles.filter(tile => tile.tokenNumber === diceRoll);
  
  // For each matching tile, give resources to players with adjacent settlements/cities
  matchingTiles.forEach(tile => {
    if (tile.resource === ResourceType.Desert) return; // Desert produces no resources
    
    // In a real implementation, you'd need to check which players have settlements/cities
    // adjacent to this tile and give them resources accordingly
    // This is simplified for the POC
    
    // For now, just give a random player one of that resource
    if (G.players.length > 0) {
      const randomPlayerIndex = Math.floor(Math.random() * G.players.length);
      G.players[randomPlayerIndex].resources[tile.resource]++;
    }
  });
}

// Generate ports for the Catan board
export function generatePorts(): Port[] {
  // Define the port types according to Catan rules
  const portTypes = [
    PortType.Generic, PortType.Generic, PortType.Generic, PortType.Generic, // 4 generic ports (3:1)
    PortType.Brick, PortType.Wood, PortType.Sheep, PortType.Wheat, PortType.Ore // 5 resource-specific ports (2:1)
  ];
  
  // Shuffle the port types
  const shuffledPortTypes = shuffleArray(portTypes);
  
  // Define the port locations on the edge of the board
  const portLocations = [
    // Each entry defines a hex coordinate and the direction (0-5) where the port is located
    { coordinates: { q: -1, r: -2, s: 3 }, direction: 0 }, // Top-left
    { coordinates: { q: 1, r: -2, s: 1 }, direction: 1 },  // Top-right
    { coordinates: { q: 2, r: 0, s: -2 }, direction: 1 },  // Right-top
    { coordinates: { q: 1, r: 1, s: -2 }, direction: 2 },  // Right-bottom
    { coordinates: { q: 0, r: 2, s: -2 }, direction: 3 },  // Bottom-right
    { coordinates: { q: -2, r: 2, s: 0 }, direction: 4 },  // Bottom-left
    { coordinates: { q: -2, r: 0, s: 2 }, direction: 5 },  // Left-bottom
    { coordinates: { q: -2, r: -1, s: 3 }, direction: 5 }, // Left-top
    { coordinates: { q: 0, r: -2, s: 2 }, direction: 0 }   // Top-middle
  ];
  
  // Create the ports
  return portLocations.map((location, index) => {
    // Calculate the two vertices where settlements can be built to use this port
    const vertices = getPortVertices(location.coordinates, location.direction);
    
    return {
      id: `port-${index}`,
      type: shuffledPortTypes[index],
      coordinates: location.coordinates,
      direction: location.direction,
      vertices
    };
  });
}

// Get the two vertices adjacent to a port
export function getPortVertices(hexCoords: HexCoordinates, direction: number): VertexCoordinates[] {
  // The two vertices are at the ends of the edge specified by direction
  const vertex1: VertexCoordinates = {
    q: hexCoords.q,
    r: hexCoords.r,
    s: hexCoords.s,
    direction
  };
  
  const vertex2: VertexCoordinates = {
    q: hexCoords.q,
    r: hexCoords.r,
    s: hexCoords.s,
    direction: (direction + 1) % 6
  };
  
  return [vertex1, vertex2];
}

// Check if a player has access to a specific port
export function hasAccessToPort(player: Player, port: Port, structures: Structure[]): boolean {
  // Get all settlement and city structures owned by the player
  const playerStructures = structures.filter(
    s => s.playerId === player.id && 
    (s.type === StructureType.Settlement || s.type === StructureType.City)
  );
  
  // Check if any of the player's structures are on the port's vertices
  return playerStructures.some(structure => {
    const coords = structure.coordinates as VertexCoordinates;
    
    return port.vertices.some(vertex => 
      vertex.q === coords.q && 
      vertex.r === coords.r && 
      vertex.s === coords.s && 
      vertex.direction === coords.direction
    );
  });
}

// Get the trading ratio for a player and resource
export function getTradingRatio(player: Player, resource: ResourceType, ports: Port[], structures: Structure[]): number {
  // Default trading ratio is 4:1
  let ratio = 4;
  
  // Check if player has access to a generic 3:1 port
  const genericPort = ports.find(p => p.type === PortType.Generic && hasAccessToPort(player, p, structures));
  if (genericPort) {
    ratio = 3;
  }
  
  // Check if player has access to a resource-specific 2:1 port for this resource
  const resourcePort = ports.find(
    p => p.type === resource && hasAccessToPort(player, p, structures)
  );
  
  if (resourcePort) {
    ratio = 2;
  }
  
  return ratio;
} 