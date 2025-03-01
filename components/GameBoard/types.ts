import { Tile, Port as PortType, PortType as PortTypeEnum, HexCoordinates, VertexCoordinates, EdgeCoordinates, Structure, StructureType } from '../../lib/types';

// Define edit mode types
export enum EditModeType {
  TILES = 'tiles',
  PORTS = 'ports',
  SETTLEMENTS = 'settlements',
  ROADS = 'roads'
}

export interface GameBoardProps {
  tiles: Tile[];
  ports?: PortType[];
  structures?: Structure[];
  onTileClick?: (tile: Tile) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export interface PlacedTile {
  tileIndex: number;
  q: number; // Axial grid coordinate
  r: number; // Axial grid coordinate
}

// Interface for port being edited
export interface EditingPort extends Omit<PortType, 'id' | 'vertices'> {
  id?: string;
  isDragging?: boolean;
  // Store the two vertices this port connects
  vertexIndices?: [number, number];
}

// Interface for settlement being edited
export interface EditingSettlement {
  id?: string;
  type: StructureType.Settlement | StructureType.City;
  playerId: number;
  coordinates: VertexCoordinates;
}

// Interface for road being edited
export interface EditingRoad {
  id?: string;
  type: StructureType.Road;
  playerId: number;
  coordinates: EdgeCoordinates;
}

// Grid system configuration
export interface GridConfig {
  tileWidth: number;
  tileHeight: number;
  xSpacing: number;
  ySpacing: number;
  snapThreshold: number;
}

// Preset configurations for the grid
export const presets = {
  default: {
    tileWidth: 120,
    tileHeight: 120,
    xSpacing: 0.6,
    ySpacing: 0.52,
    snapThreshold: 0.1
  },
  compact: {
    tileWidth: 100,
    tileHeight: 100,
    xSpacing: 0.5,
    ySpacing: 0.45,
    snapThreshold: 0.1
  },
  expanded: {
    tileWidth: 140,
    tileHeight: 140,
    xSpacing: 0.7,
    ySpacing: 0.6,
    snapThreshold: 0.1
  }
}; 