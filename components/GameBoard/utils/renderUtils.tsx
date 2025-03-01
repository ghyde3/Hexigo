import React from 'react';
import { HexCoordinates, VertexCoordinates, EdgeCoordinates } from '../../../lib/types';
import { GridConfig } from '../types';
import { gridToPixel } from './coordinateUtils';

/**
 * Generates points for a hexagon at the given coordinates
 */
export const generateHexPoints = (
  q: number, 
  r: number, 
  gridConfig: GridConfig, 
  gridSize: { width: number; height: number }
) => {
  const { tileWidth, tileHeight } = gridConfig;
  const { x, y } = gridToPixel(q, r, gridConfig, gridSize);
  
  // Generate the six points of the hexagon
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const pointX = x + tileWidth / 2 * Math.cos(angle);
    const pointY = y + tileHeight / 2 * Math.sin(angle);
    points.push({ x: pointX, y: pointY });
  }
  
  return points;
};

/**
 * Generates vertex points for all hexagons
 */
export const generateVertexPoints = (
  placedTiles: { q: number; r: number }[],
  gridConfig: GridConfig,
  gridSize: { width: number; height: number }
) => {
  const vertexPoints: VertexCoordinates[] = [];
  const addedVertices = new Set<string>();
  
  placedTiles.forEach(tile => {
    const { q, r } = tile;
    const s = -q - r;
    const hexPoints = generateHexPoints(q, r, gridConfig, gridSize);
    
    // Add the six vertices of the hexagon
    for (let i = 0; i < 6; i++) {
      const vertexKey = `${q},${r},${s},${i}`;
      if (!addedVertices.has(vertexKey)) {
        addedVertices.add(vertexKey);
        vertexPoints.push({ q, r, s, direction: i });
      }
    }
  });
  
  return vertexPoints;
};

/**
 * Generates edge points for all hexagons
 */
export const generateEdgePoints = (
  placedTiles: { q: number; r: number }[],
  gridConfig: GridConfig,
  gridSize: { width: number; height: number }
) => {
  const edgePoints: EdgeCoordinates[] = [];
  const addedEdges = new Set<string>();
  
  placedTiles.forEach(tile => {
    const { q, r } = tile;
    const s = -q - r;
    
    // Add the six edges of the hexagon
    for (let i = 0; i < 6; i++) {
      const edgeKey = `${q},${r},${s},${i}`;
      if (!addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        edgePoints.push({ q, r, s, direction: i });
      }
    }
  });
  
  return edgePoints;
};

/**
 * Renders grid lines for the hexagonal grid
 */
export const renderGridLines = (
  placedTiles: { q: number; r: number }[],
  gridConfig: GridConfig,
  gridSize: { width: number; height: number }
) => {
  const lines: JSX.Element[] = [];
  
  placedTiles.forEach((tile, index) => {
    const { q, r } = tile;
    const hexPoints = generateHexPoints(q, r, gridConfig, gridSize);
    
    // Draw the six edges of the hexagon
    for (let i = 0; i < 6; i++) {
      const startPoint = hexPoints[i];
      const endPoint = hexPoints[(i + 1) % 6];
      
      lines.push(
        <line
          key={`grid-line-${index}-${i}`}
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="#ccc"
          strokeWidth="1"
        />
      );
    }
  });
  
  return lines;
};

/**
 * Renders snap points for tile placement
 */
export const renderSnapPoints = (
  validSnapPositions: { q: number; r: number }[],
  gridConfig: GridConfig,
  gridSize: { width: number; height: number }
) => {
  return validSnapPositions.map((pos, index) => {
    const { x, y } = gridToPixel(pos.q, pos.r, gridConfig, gridSize);
    
    return (
      <circle
        key={`snap-point-${index}`}
        cx={x}
        cy={y}
        r={5}
        fill="rgba(0, 255, 0, 0.5)"
      />
    );
  });
}; 