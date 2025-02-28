import React, { useState, useEffect, useRef } from 'react';
import { Tile } from '../lib/types';
import HexTile from './HexTile';

interface GameBoardProps {
  tiles: Tile[];
  onTileClick?: (tile: Tile) => void;
}

interface PlacedTile {
  tileIndex: number;
  q: number; // Axial grid coordinate
  r: number; // Axial grid coordinate
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, onTileClick }) => {
  const [tileWidth, setTileWidth] = useState(80); // Default tile width
  const [tileHeight, setTileHeight] = useState(80); // Default tile height
  const [gridSize, setGridSize] = useState({ width: 700, height: 600 }); // Slightly larger for better spacing
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [draggingTile, setDraggingTile] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGridLines, setShowGridLines] = useState(true);
  const [xSpacing, setXSpacing] = useState(0.59); // Updated default horizontal spacing
  const [ySpacing, setYSpacing] = useState(0.45); // Updated default vertical spacing
  const [snapThreshold, setSnapThreshold] = useState(0.1); // Updated default snap threshold
  const gridRef = useRef<HTMLDivElement>(null);

  // Responsive tile sizing
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // Small screens
        setTileWidth(50);
        setTileHeight(50);
        setGridSize({ width: 400, height: 350 });
      } else if (width < 1024) { // Medium screens
        setTileWidth(65);
        setTileHeight(65);
        setGridSize({ width: 550, height: 450 });
      } else { // Large screens
        setTileWidth(80);
        setTileHeight(80);
        setGridSize({ width: 700, height: 600 });
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate hex dimensions based on current spacing settings
  const hexWidth = tileWidth * xSpacing;
  const hexHeight = tileHeight * ySpacing;

  // Convert pixel position to grid (axial) coordinates
  const pixelToGrid = (x: number, y: number) => {
    const centerX = gridSize.width / 2;
    const centerY = gridSize.height / 2;

    // Convert to cube coordinates for easier rounding
    const size = hexWidth;
    const q = ((x - centerX) * Math.sqrt(3) / 3 - (y - centerY) / 3) / size;
    const r = (y - centerY) * 2 / 3 / size;

    // Round to the nearest hex
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    const s = -roundedQ - roundedR; // Ensure cube coordinates sum to 0

    return { q: roundedQ, r: roundedR };
  };

  // Convert grid (axial) coordinates to pixel position
  const gridToPixel = (q: number, r: number) => {
    const centerX = gridSize.width / 2;
    const centerY = gridSize.height / 2;

    // Adjusted based on current spacing settings
    const x = centerX + hexWidth * (q * Math.sqrt(3) + r * Math.sqrt(3) / 2);
    const y = centerY + hexHeight * (r * 3 / 2);

    return { x, y };
  };

  // Get all valid neighboring hex positions for a given position
  const getNeighborPositions = (q: number, r: number) => {
    return [
      { q: q + 1, r: r - 1 }, // Top right
      { q: q + 1, r: r },     // Right
      { q: q, r: r + 1 },     // Bottom right
      { q: q - 1, r: r + 1 }, // Bottom left
      { q: q - 1, r: r },     // Left
      { q: q, r: r - 1 },     // Top left
    ];
  };

  // Check if a position is already occupied
  const isPositionOccupied = (q: number, r: number) => {
    return placedTiles.some(tile => tile.q === q && tile.r === r);
  };

  // Get valid snap positions (unoccupied neighbors of existing tiles)
  const getValidSnapPositions = (): { q: number; r: number }[] => {
    const validPositions: { q: number; r: number }[] = [];

    if (placedTiles.length === 0) {
      validPositions.push({ q: 0, r: 0 }); // Start with center
      return validPositions;
    }

    placedTiles.forEach(tile => {
      const neighbors = getNeighborPositions(tile.q, tile.r);
      neighbors.forEach(pos => {
        if (!isPositionOccupied(pos.q, pos.r) && 
            !validPositions.some(p => p.q === pos.q && p.r === pos.r)) {
          validPositions.push(pos);
        }
      });
    });

    // Limit to a circular area for Catan's 19-tile layout
    return validPositions.filter(pos => {
      const dist = Math.abs(pos.q) + Math.abs(pos.r);
      return dist <= 4; // Slightly smaller radius for tighter layout
    });
  };

  // Handle mouse down (start dragging)
  const handleMouseDown = (e: React.MouseEvent, tileIndex: number) => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const tile = placedTiles.find(t => t.tileIndex === tileIndex);
      
      if (tile) {
        setDraggingTile(tileIndex);
        const { x, y } = gridToPixel(tile.q, tile.r);
        setDragOffset({
          x: e.clientX - rect.left - x,
          y: e.clientY - rect.top - y,
        });
      }
    }
    e.preventDefault();
  };

  // Handle mouse move (drag tile)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTile === null || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const { q, r } = pixelToGrid(x, y);
    const validPositions = getValidSnapPositions();

    // Find the closest valid snap position
    let closestPos: { q: number; r: number } | null = null;
    let minDist = Number.MAX_VALUE;

    validPositions.forEach(pos => {
      const { x: px, y: py } = gridToPixel(pos.q, pos.r);
      const dist = distance(x, y, px, py);
      if (dist < minDist) {
        minDist = dist;
        closestPos = pos;
      }
    });

    setPlacedTiles(prevTiles => {
      const otherTiles = prevTiles.filter(t => t.tileIndex !== draggingTile);
      const draggingTileData = prevTiles.find(t => t.tileIndex === draggingTile);

      if (!draggingTileData) return prevTiles;

      // Snap to the closest valid position if within snapping distance
      const snapDistance = Math.min(tileWidth, tileHeight) * snapThreshold;
      const newPosition = closestPos && minDist < snapDistance 
        ? { q: closestPos.q, r: closestPos.r }
        : { q, r };

      return [
        ...otherTiles,
        {
          ...draggingTileData,
          q: newPosition.q,
          r: newPosition.r,
        },
      ];
    });
  };

  // Handle mouse up (stop dragging)
  const handleMouseUp = () => {
    setDraggingTile(null);
  };

  // Toggle grid lines visibility
  const toggleGridLines = () => {
    setShowGridLines(!showGridLines);
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingTile(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Render clear hexagonal grid lines
  const renderGridLines = () => {
    if (!showGridLines) return null;

    const gridRadius = 4; // Reduced for a tighter, 19-tile layout
    const lines: React.ReactNode[] = [];

    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (let r = -gridRadius; r <= gridRadius; r++) {
        // Skip positions too far from center for a circular grid
        if (Math.abs(q) + Math.abs(r) > gridRadius * 1.5) continue;

        const { x, y } = gridToPixel(q, r);
        const isOccupied = isPositionOccupied(q, r);

        lines.push(
          <div
            key={`grid-${q}-${r}`}
            className={`absolute border ${isOccupied ? 'border-gray-600' : 'border-gray-300'}`}
            style={{
              width: `${tileWidth}px`,
              height: `${hexHeight}px`,
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              opacity: 0.8,
              backgroundColor: isOccupied ? 'rgba(200, 200, 200, 0.1)' : 'transparent',
            }}
          />
        );
      }
    }

    return lines;
  };

  // Render snap points (visual indicators for valid positions)
  const renderSnapPoints = () => {
    if (draggingTile === null) return null;

    const validPositions = getValidSnapPositions();
    return validPositions.map(pos => {
      const { x, y } = gridToPixel(pos.q, pos.r);

      return (
        <div
          key={`snap-${pos.q}-${pos.r}`}
          className="absolute rounded-full bg-green-500 border-2 border-white"
          style={{
            width: '20px',
            height: '20px',
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
          }}
        />
      );
    });
  };

  // Generate coordinate output for Catan board layout
  const generateCoordinateOutput = () => {
    const sortedTiles = [...placedTiles].sort((a, b) => {
      if (a.r !== b.r) return a.r - b.r;
      return a.q - b.q;
    });

    const layoutCode = `const boardLayout = [\n  ${sortedTiles
      .map(t => `{ q: ${t.q}, r: ${t.r} }`)
      .join(', ')}\n];`;

    return layoutCode;
  };

  // Initialize tiles with the specified layout
  useEffect(() => {
    if (tiles.length > 0 && placedTiles.length === 0) {
      // Use the predefined Catan layout
      const catanLayout = [
        { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 }, 
        { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 }, 
        { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, 
        { q: 1, r: 0 }, { q: 2, r: 0 }, { q: -2, r: 1 }, 
        { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 }, 
        { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 }
      ];
      
      // Map tiles to the layout positions
      const initialTiles = tiles.slice(0, 19).map((_, index) => ({
        tileIndex: index,
        q: catanLayout[index].q,
        r: catanLayout[index].r
      }));
      
      setPlacedTiles(initialTiles);
    }
  }, [tiles, placedTiles.length]);

  // Utility function to calculate distance between two points
  const distance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Handle control changes
  const handleXSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setXSpacing(parseFloat(e.target.value));
  };

  const handleYSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYSpacing(parseFloat(e.target.value));
  };

  const handleSnapThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSnapThreshold(parseFloat(e.target.value));
  };

  const handleTileWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTileWidth(parseFloat(e.target.value));
  };

  const handleTileHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTileHeight(parseFloat(e.target.value));
  };

  // Handle direct input changes
  const handleXSpacingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setXSpacing(value);
    }
  };

  const handleYSpacingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setYSpacing(value);
    }
  };

  const handleSnapThresholdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setSnapThreshold(value);
    }
  };

  const handleTileWidthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 40 && value <= 120) {
      setTileWidth(value);
    }
  };

  const handleTileHeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 40 && value <= 120) {
      setTileHeight(value);
    }
  };

  const resetToDefaults = () => {
    setXSpacing(0.6);
    setYSpacing(0.52);
    setSnapThreshold(0.1);
    setTileWidth(120);
    setTileHeight(120);
  };

  // Preset configurations
  const presets = {
    tight: { x: 0.57, y: 0.5, snap: 0.1, width: 70, height: 70 },
    standard: { x: 0.59, y: 0.45, snap: 0.1, width: 80, height: 80 },
    spacious: { x: 0.7, y: 0.6, snap: 0.3, width: 90, height: 90 },
    custom1: { x: 0.55, y: 0.5, snap: 0.15, width: 75, height: 75 },
    custom2: { x: 0.65, y: 0.55, snap: 0.2, width: 85, height: 85 },
    perfectHex: { x: 0.866, y: 0.75, snap: 0.2, width: 80, height: 80 } // Perfect hexagon ratio
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const { x, y, snap, width, height } = presets[preset];
    setXSpacing(x);
    setYSpacing(y);
    setSnapThreshold(snap);
    setTileWidth(width);
    setTileHeight(height);
  };

  const coordinateOutput = generateCoordinateOutput();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-4 flex justify-between w-full max-w-3xl">
        <h2 className="text-xl font-bold">Catan Board Designer</h2>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={toggleGridLines}
        >
          {showGridLines ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      {/* Grid controls */}
      <div className="w-full max-w-3xl mb-4 p-3 border rounded-lg bg-gray-50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="w-32">Tile Width:</div>
            <input 
              type="range" 
              min="40" 
              max="120" 
              step="1" 
              value={tileWidth} 
              onChange={handleTileWidthChange}
              className="flex-grow"
            />
            <input
              type="number"
              min="40"
              max="120"
              step="1"
              value={tileWidth}
              onChange={handleTileWidthInput}
              className="w-16 text-right px-1 border rounded"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-32">Tile Height:</div>
            <input 
              type="range" 
              min="40" 
              max="120" 
              step="1" 
              value={tileHeight} 
              onChange={handleTileHeightChange}
              className="flex-grow"
            />
            <input
              type="number"
              min="40"
              max="120"
              step="1"
              value={tileHeight}
              onChange={handleTileHeightInput}
              className="w-16 text-right px-1 border rounded"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-32">Horizontal Spacing:</div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.01" 
              value={xSpacing} 
              onChange={handleXSpacingChange}
              className="flex-grow"
            />
            <input
              type="number"
              min="0.1"
              max="2.0"
              step="0.01"
              value={xSpacing}
              onChange={handleXSpacingInput}
              className="w-16 text-right px-1 border rounded"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-32">Vertical Spacing:</div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.01" 
              value={ySpacing} 
              onChange={handleYSpacingChange}
              className="flex-grow"
            />
            <input
              type="number"
              min="0.1"
              max="2.0"
              step="0.01"
              value={ySpacing}
              onChange={handleYSpacingInput}
              className="w-16 text-right px-1 border rounded"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-32">Snap Sensitivity:</div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.01" 
              value={snapThreshold} 
              onChange={handleSnapThresholdChange}
              className="flex-grow"
            />
            <input
              type="number"
              min="0.1"
              max="2.0"
              step="0.01"
              value={snapThreshold}
              onChange={handleSnapThresholdInput}
              className="w-16 text-right px-1 border rounded"
            />
          </div>
          
          <div className="flex flex-wrap justify-between mt-2">
            <div className="flex gap-2">
              <button 
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                onClick={() => applyPreset('tight')}
              >
                Tight
              </button>
              <button 
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                onClick={() => applyPreset('standard')}
              >
                Standard
              </button>
              <button 
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                onClick={() => applyPreset('spacious')}
              >
                Spacious
              </button>
              <button 
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                onClick={() => applyPreset('perfectHex')}
              >
                Perfect Hex
              </button>
              <button 
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                onClick={() => applyPreset('custom1')}
              >
                Custom 1
              </button>
            </div>
            <button 
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <div
        ref={gridRef}
        className="relative border-2 border-gray-300 rounded-lg bg-gray-100 mb-4"
        style={{
          width: `${gridSize.width}px`,
          height: `${gridSize.height}px`,
          cursor: draggingTile !== null ? 'grabbing' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Blue circular water background */}
        <div
          className="absolute rounded-full bg-blue-500"
          style={{
            width: '70%', // Adjusted to fit tighter layout
            height: '70%',
            top: '15%',
            left: '15%',
            zIndex: 0,
          }}
        />

        {/* Render grid lines */}
        {renderGridLines()}

        {/* Render snap points */}
        {renderSnapPoints()}

        {/* Render placed tiles */}
        {placedTiles.map((placed) => {
          const tile = tiles[placed.tileIndex];
          if (!tile) return null;

          const { x, y } = gridToPixel(placed.q, placed.r);

          return (
            <div
              key={tile.id}
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                zIndex: draggingTile === placed.tileIndex ? 10 : 1,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => handleMouseDown(e, placed.tileIndex)}
            >
              <HexTile
                resource={tile.resource}
                tokenNumber={tile.tokenNumber}
                size={Math.min(tileWidth, tileHeight)} // Use the smaller dimension for the tile size
                width={tileWidth}
                height={tileHeight}
                onClick={() => onTileClick && onTileClick(tile)}
              />
            </div>
          );
        })}
      </div>

      {/* Coordinate output */}
      <div className="w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-2">Board Layout Coordinates:</h3>
        <textarea
          className="w-full h-32 p-2 font-mono text-sm border rounded-md"
          value={coordinateOutput}
          readOnly
        />
        <p className="text-sm text-gray-600 mt-2">
          <strong>Instructions:</strong> Drag and drop the tiles onto the grid. Tiles will snap to
          valid positions next to existing tiles. Use the sliders above to adjust grid spacing.
          Once you've created the Catan board layout, copy the coordinates above.
        </p>
      </div>
    </div>
  );
};

export default GameBoard;