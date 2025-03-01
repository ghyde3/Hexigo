import React, { useState, useEffect } from 'react';
import { Tile } from '../../lib/types';
import { PlacedTile, GridConfig } from './types';
import HexTile from '../../components/HexTile';
import { pixelToGrid, gridToPixel, getNeighborPositions, distance } from './utils/coordinateUtils';

interface TileManagerProps {
  tiles: Tile[];
  gridConfig: GridConfig;
  gridSize: { width: number; height: number };
  onTileClick?: (tile: Tile) => void;
  isEditMode: boolean;
}

const TileManager: React.FC<TileManagerProps> = ({
  tiles,
  gridConfig,
  gridSize,
  onTileClick,
  isEditMode
}) => {
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [draggingTile, setDraggingTile] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [validSnapPositions, setValidSnapPositions] = useState<{ q: number; r: number }[]>([]);

  // Initialize placed tiles from props
  useEffect(() => {
    if (tiles.length > 0 && placedTiles.length === 0) {
      const initialPlacedTiles = tiles.map((tile, index) => ({
        tileIndex: index,
        q: tile.coordinates.q,
        r: tile.coordinates.r
      }));
      setPlacedTiles(initialPlacedTiles);
    }
  }, [tiles]);

  // Update valid snap positions when placed tiles change
  useEffect(() => {
    if (isEditMode) {
      setValidSnapPositions(getValidSnapPositions());
    }
  }, [placedTiles, isEditMode]);

  // Check if a position is already occupied by a tile
  const isPositionOccupied = (q: number, r: number) => {
    return placedTiles.some(tile => tile.q === q && tile.r === r);
  };

  // Get valid positions where tiles can be snapped
  const getValidSnapPositions = () => {
    const positions: { q: number; r: number }[] = [];
    const addedPositions = new Set<string>();

    placedTiles.forEach(tile => {
      const neighbors = getNeighborPositions(tile.q, tile.r);
      
      neighbors.forEach(pos => {
        const key = `${pos.q},${pos.r}`;
        if (!addedPositions.has(key) && !isPositionOccupied(pos.q, pos.r)) {
          addedPositions.add(key);
          positions.push(pos);
        }
      });
    });

    return positions;
  };

  // Handle mouse down on a tile
  const handleMouseDown = (e: React.MouseEvent, tileIndex: number) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    
    const tile = placedTiles.find(t => t.tileIndex === tileIndex);
    if (!tile) return;
    
    const { x, y } = gridToPixel(tile.q, tile.r, gridConfig, gridSize);
    
    setDraggingTile(tileIndex);
    setDragOffset({
      x: x - e.clientX,
      y: y - e.clientY
    });
  };

  // Handle mouse move when dragging a tile
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTile === null || !isEditMode) return;
    
    const mouseX = e.clientX + dragOffset.x;
    const mouseY = e.clientY + dragOffset.y;
    
    // Find the closest valid snap position
    let closestPos = { q: 0, r: 0 };
    let minDistance = Infinity;
    
    validSnapPositions.forEach(pos => {
      const { x, y } = gridToPixel(pos.q, pos.r, gridConfig, gridSize);
      const dist = distance(mouseX, mouseY, x, y);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestPos = pos;
      }
    });
    
    // Check if we're close enough to snap
    const { x: snapX, y: snapY } = gridToPixel(closestPos.q, closestPos.r, gridConfig, gridSize);
    const snapDistance = distance(mouseX, mouseY, snapX, snapY);
    const snapThreshold = gridConfig.tileWidth * gridConfig.snapThreshold;
    
    if (snapDistance < snapThreshold) {
      // Update the tile position to the snap position
      setPlacedTiles(prev => 
        prev.map(tile => 
          tile.tileIndex === draggingTile 
            ? { ...tile, q: closestPos.q, r: closestPos.r } 
            : tile
        )
      );
    } else {
      // Update the tile position to follow the mouse
      const gridPos = pixelToGrid(mouseX, mouseY, gridConfig, gridSize);
      
      setPlacedTiles(prev => 
        prev.map(tile => 
          tile.tileIndex === draggingTile 
            ? { ...tile, q: gridPos.q, r: gridPos.r } 
            : tile
        )
      );
    }
  };

  // Handle mouse up when dragging a tile
  const handleMouseUp = () => {
    setDraggingTile(null);
  };

  // Generate output of tile coordinates
  const generateCoordinateOutput = () => {
    return placedTiles.map(tile => {
      const originalTile = tiles[tile.tileIndex];
      return {
        ...originalTile,
        coordinates: {
          q: tile.q,
          r: tile.r,
          s: -tile.q - tile.r
        }
      };
    });
  };

  // Render the tiles
  return (
    <div 
      className="absolute top-0 left-0 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {placedTiles.map(placedTile => {
        const tile = tiles[placedTile.tileIndex];
        const { x, y } = gridToPixel(placedTile.q, placedTile.r, gridConfig, gridSize);
        
        return (
          <div
            key={`tile-${placedTile.tileIndex}`}
            className={`absolute ${draggingTile === placedTile.tileIndex ? 'z-10' : 'z-0'}`}
            style={{
              left: `${x - gridConfig.tileWidth / 2}px`,
              top: `${y - gridConfig.tileHeight / 2}px`,
              width: `${gridConfig.tileWidth}px`,
              height: `${gridConfig.tileHeight}px`,
              cursor: isEditMode ? 'move' : 'pointer'
            }}
            onMouseDown={(e) => handleMouseDown(e, placedTile.tileIndex)}
            onClick={() => onTileClick && onTileClick(tile)}
          >
            <HexTile
              resource={tile.resource}
              tokenNumber={tile.tokenNumber}
              width={gridConfig.tileWidth}
              height={gridConfig.tileHeight}
              hasRobber={tile.hasRobber}
              onClick={() => onTileClick && onTileClick(tile)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TileManager; 