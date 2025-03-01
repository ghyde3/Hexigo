import { HexCoordinates, VertexCoordinates, EdgeCoordinates } from '../../../lib/types';
import { GridConfig } from '../types';

/**
 * Converts pixel coordinates to grid coordinates
 */
export const pixelToGrid = (
  x: number, 
  y: number, 
  gridConfig: GridConfig, 
  gridSize: { width: number; height: number }
) => {
  const { tileWidth, tileHeight, xSpacing, ySpacing } = gridConfig;
  
  // Adjust for grid center
  const centerX = gridSize.width / 2;
  const centerY = gridSize.height / 2;
  
  // Calculate effective width and height based on spacing
  const effectiveWidth = tileWidth * xSpacing;
  const effectiveHeight = tileHeight * ySpacing;
  
  // Convert to axial coordinates
  const q = ((x - centerX) * 2/3) / effectiveWidth;
  const r = ((y - centerY) / effectiveHeight - (x - centerX) / (effectiveWidth * 3));
  
  return { q, r, s: -q-r };
};

/**
 * Converts grid coordinates to pixel coordinates
 */
export const gridToPixel = (
  q: number, 
  r: number, 
  gridConfig: GridConfig, 
  gridSize: { width: number; height: number }
) => {
  const { tileWidth, tileHeight, xSpacing, ySpacing } = gridConfig;
  
  // Adjust for grid center
  const centerX = gridSize.width / 2;
  const centerY = gridSize.height / 2;
  
  // Calculate effective width and height based on spacing
  const effectiveWidth = tileWidth * xSpacing;
  const effectiveHeight = tileHeight * ySpacing;
  
  // Convert to pixel coordinates
  const x = centerX + q * effectiveWidth * 3/2;
  const y = centerY + (r + q/2) * effectiveHeight;
  
  return { x, y };
};

/**
 * Gets the neighboring positions for a given grid coordinate
 */
export const getNeighborPositions = (q: number, r: number) => {
  const directions = [
    { q: 1, r: -1 }, // Northeast
    { q: 1, r: 0 },  // East
    { q: 0, r: 1 },  // Southeast
    { q: -1, r: 1 }, // Southwest
    { q: -1, r: 0 }, // West
    { q: 0, r: -1 }  // Northwest
  ];
  
  return directions.map(dir => ({
    q: q + dir.q,
    r: r + dir.r
  }));
};

/**
 * Calculates the distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Checks if two vertex coordinates are equal
 */
export const isVertexEqual = (v1: VertexCoordinates, v2: VertexCoordinates) => {
  return v1.q === v2.q && v1.r === v2.r && v1.s === v2.s && v1.direction === v2.direction;
};

/**
 * Checks if two edge coordinates are equal
 */
export const isEdgeEqual = (e1: EdgeCoordinates, e2: EdgeCoordinates) => {
  return e1.q === e2.q && e1.r === e2.r && e1.s === e2.s && e1.direction === e2.direction;
}; 