// Resource types in Catan
export enum ResourceType {
  Brick = 'brick',
  Wood = 'wood',
  Sheep = 'sheep',
  Wheat = 'wheat',
  Ore = 'ore',
  Desert = 'desert'
}

// Structure types that can be built
export enum StructureType {
  Settlement = 'settlement',
  City = 'city',
  Road = 'road'
}

// Port types in Catan
export enum PortType {
  Generic = 'generic', // 3:1 trading ratio
  Brick = 'brick',     // 2:1 trading ratio for brick
  Wood = 'wood',       // 2:1 trading ratio for wood
  Sheep = 'sheep',     // 2:1 trading ratio for sheep
  Wheat = 'wheat',     // 2:1 trading ratio for wheat
  Ore = 'ore'          // 2:1 trading ratio for ore
}

// Coordinates for the hexagonal grid
export interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

// Vertex coordinates for settlements/cities
export interface VertexCoordinates {
  q: number;
  r: number;
  s: number;
  direction: number; // 0-5 representing the six corners of a hexagon
}

// Edge coordinates for roads
export interface EdgeCoordinates {
  q: number;
  r: number;
  s: number;
  direction: number; // 0-5 representing the six edges of a hexagon
}

// Port location on the board
export interface Port {
  id: string;
  type: PortType;
  coordinates: HexCoordinates; // The hex tile adjacent to the port
  direction: number; // 0-5 representing the edge of the hex where the port is located
  vertices: VertexCoordinates[]; // The two vertices where settlements/cities can be built to use this port
}

// Resource counts for a player
export interface ResourceCounts {
  [ResourceType.Brick]: number;
  [ResourceType.Wood]: number;
  [ResourceType.Sheep]: number;
  [ResourceType.Wheat]: number;
  [ResourceType.Ore]: number;
}

// Structure representing a hex tile on the board
export interface Tile {
  id: string;
  coordinates: HexCoordinates;
  resource: ResourceType;
  tokenNumber?: number; // Desert has no number
  hasRobber?: boolean;
}

// Structure built by players
export interface Structure {
  id: string;
  type: StructureType;
  playerId: number;
  coordinates: VertexCoordinates | EdgeCoordinates;
}

// Player in the game
export interface Player {
  id: number;
  name: string;
  color: string;
  resources: ResourceCounts;
  structures: Structure[];
  victoryPoints: number;
  knightsPlayed?: number;
}

// The Catan game state
export interface CatanState {
  tiles: Tile[];
  players: Player[];
  structures: Structure[];
  ports: Port[]; // Added ports to the game state
  currentPlayer: number;
  lastRoll?: {
    die1: number;
    die2: number;
    sum: number;
  };
  gamePhase: string; // 'setup' or 'play'
  longestRoadPlayerId: number | null;
  largestArmyPlayerId: number | null;
}

// Building costs
export const BUILDING_COSTS = {
  [StructureType.Road]: {
    [ResourceType.Brick]: 1,
    [ResourceType.Wood]: 1,
    [ResourceType.Sheep]: 0,
    [ResourceType.Wheat]: 0,
    [ResourceType.Ore]: 0
  },
  [StructureType.Settlement]: {
    [ResourceType.Brick]: 1,
    [ResourceType.Wood]: 1,
    [ResourceType.Sheep]: 1,
    [ResourceType.Wheat]: 1,
    [ResourceType.Ore]: 0
  },
  [StructureType.City]: {
    [ResourceType.Brick]: 0,
    [ResourceType.Wood]: 0,
    [ResourceType.Sheep]: 0,
    [ResourceType.Wheat]: 2,
    [ResourceType.Ore]: 3
  }
}; 