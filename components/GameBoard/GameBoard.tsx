import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GridSystem, { GridConfig } from '../GridSystem/GridSystem';
import TileManager, { TileData } from './TileManager';
import { ResourceType } from '../HexTile/HexTile';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { Building, BuildingType } from '../../lib/gameModel';

export interface GameBoardProps {
  isEditable?: boolean;
  initialConfig?: GridConfig;
  initialTiles?: TileData[];
  onSave?: (tiles: TileData[], config: GridConfig) => void;
  showHotspots?: boolean;
  buildings?: Building[];
  currentPlayerId?: number;
  buildingMode?: BuildingType | null;
  onBuildingPlaced?: (building: Omit<Building, 'id'>) => void;
  canPlaceBuilding?: (type: BuildingType, locationId: string) => boolean;
}

// Define the default grid configuration
const defaultConfig: GridConfig = {
  radius: 2,        // Updated from default value
  hexSize: 80,      // Updated from default value
  spacing: 1.03,    // Updated from default value
  padding: 45,      // Updated from default value
};

// Available resource types
const resourceTypes: ResourceType[] = ['desert', 'ore', 'wood', 'brick', 'sheep', 'wheat'];

// Resource color mapping
const resourceColors: Record<ResourceType, string> = {
  desert: '#e9d8a6',
  ore: '#9c9c9c',
  wood: '#588157',
  brick: '#bc6c25',
  sheep: '#a7c957',
  wheat: '#ffb703',
};

// Catan standard resource distribution
const catanResourceDistribution: ResourceType[] = [
  'desert',
  'ore', 'ore', 'ore',
  'wood', 'wood', 'wood', 'wood',
  'brick', 'brick', 'brick',
  'sheep', 'sheep', 'sheep', 'sheep',
  'wheat', 'wheat', 'wheat', 'wheat'
];

// Catan standard number tokens (excluding 7)
const catanNumberTokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

const GameBoard: React.FC<GameBoardProps> = ({
  isEditable = false, // Default to false to prevent accidental editing
  initialConfig = defaultConfig,
  initialTiles = [],
  onSave,
  showHotspots = false,
  buildings = [],
  currentPlayerId,
  buildingMode = null,
  onBuildingPlaced,
  canPlaceBuilding = () => true,
}) => {
  const [gridConfig, setGridConfig] = useState<GridConfig>(initialConfig);
  const [tiles, setTiles] = useState<TileData[]>(initialTiles);
  const [selectedTileId, setSelectedTileId] = useState<string | undefined>();
  const [selectedResource, setSelectedResource] = useState<ResourceType>('desert');
  const [selectedValue, setSelectedValue] = useState<number | undefined>(undefined);
  const [gridDimensions, setGridDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTileControls, setShowTileControls] = useState(false);
  
  // State for dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Track if we're in edit mode
  const [editMode, setEditMode] = useState(isEditable);

  // Calculate SVG dimensions based on grid dimensions
  const svgWidth = gridDimensions.width;
  const svgHeight = gridDimensions.height;

  // Generate empty tiles when radius changes
  useEffect(() => {
    if (tiles.length === 0 && editMode) {
      generateEmptyTiles();
    }
  }, [gridConfig.radius, editMode]);
  
  // Update dimensions when window resizes
  useEffect(() => {
    const handleResize = () => {
      setGridDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Generate empty tiles based on the grid radius
  const generateEmptyTiles = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newTiles: TileData[] = [];
      const { radius } = gridConfig;

      for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
          const s = -q - r;
          if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius) {
            newTiles.push({
              id: uuidv4(),
              q,
              r,
              s,
              resourceType: 'desert',
            });
          }
        }
      }

      setTiles(newTiles);
    } catch (err) {
      console.error('Error generating tiles:', err);
      setError('Failed to generate tiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Catan standard board
  const generateCatanBoard = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For Catan, we need a radius of 2
      const catanRadius = 2;
      if (gridConfig.radius !== catanRadius) {
        setGridConfig(prev => ({ ...prev, radius: catanRadius }));
      }
      
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
      
      // Shuffle resources and numbers
      const shuffledResources = [...catanResourceDistribution].sort(() => Math.random() - 0.5);
      const shuffledNumbers = [...catanNumberTokens].sort(() => Math.random() - 0.5);
      
      // Create tiles
      const newTiles: TileData[] = spiralCoordinates.map((coord, index) => {
        const resourceType = shuffledResources[index];
        // Only assign number if not desert
        const value = resourceType === 'desert' ? undefined : shuffledNumbers.pop();
        
        return {
          id: uuidv4(),
          q: coord.q,
          r: coord.r,
          s: coord.s,
          resourceType,
          value,
        };
      });
      
      setTiles(newTiles);
    } catch (err) {
      console.error('Error generating Catan board:', err);
      setError('Failed to generate Catan board. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tile click in edit mode
  const handleTileClick = (tile: TileData) => {
    if (!editMode || isDragging) return;

    setSelectedTileId(tile.id);
    
    // Update the tile with the selected resource and value
    setTiles((prevTiles) =>
      prevTiles.map((t) =>
        t.id === tile.id
          ? { ...t, resourceType: selectedResource, value: selectedValue }
          : t
      )
    );
  };

  // Handle grid config changes
  const handleConfigChange = (key: keyof GridConfig, value: number) => {
    setGridConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Handle save
  const handleSave = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onSave) {
        onSave(tiles, gridConfig);
      }
      
      // Exit edit mode after saving
      setEditMode(false);
    } catch (err) {
      console.error('Error saving board:', err);
      setError('Failed to save the board. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Handle grid resize
  const handleGridResize = (width: number, height: number) => {
    setGridDimensions({ width, height });
  };
  
  // Mouse event handlers for dragging
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    // Set cursor to grabbing
    document.body.style.cursor = 'grabbing';
  };
  
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    setMapPosition({
      x: mapPosition.x + dx,
      y: mapPosition.y + dy
    });
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reset cursor
    document.body.style.cursor = 'default';
  };
  
  // Also end dragging when mouse leaves the SVG
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    }
  };

  // Ensure edit mode is always false when isEditable is false
  useEffect(() => {
    if (!isEditable && editMode) {
      setEditMode(false);
    }
  }, [isEditable]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  return (
    <div 
      className="game-board fixed inset-0 w-full h-full" 
      style={{ backgroundColor: '#f0f9ff' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${-gridConfig.padding} ${-gridConfig.padding} ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${svgWidth / 2 + mapPosition.x}, ${svgHeight / 2 + mapPosition.y})`}>
          <TileManager 
            tiles={tiles}
            hexSize={gridConfig.hexSize}
            spacing={gridConfig.spacing}
            onTileClick={handleTileClick}
            selectedTileId={selectedTileId}
            showHotspots={showHotspots}
            buildings={buildings}
            currentPlayerId={currentPlayerId}
            buildingMode={buildingMode}
            onBuildingPlaced={onBuildingPlaced}
            canPlaceBuilding={canPlaceBuilding}
          />
        </g>
      </svg>

      {/* Edit mode toggle button - only show when isEditable is true */}
      {isEditable && (
        <div className="fixed top-16 right-4 z-10">
          <button
            className={`p-2 ${editMode ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-md shadow-lg hover:${editMode ? 'bg-red-700' : 'bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onClick={toggleEditMode}
          >
            {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          </button>
        </div>
      )}

      {/* Grid controls for the builder - these remain fixed */}
      {editMode && (
        <div className="fixed bottom-4 right-4 flex flex-col space-y-4 z-10">
          <button
            className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowTileControls(!showTileControls)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      )}

      {/* Tile controls modal */}
      {showTileControls && editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Tile Editor</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Resource Type</h3>
              <div className="grid grid-cols-3 gap-2">
                {resourceTypes.map((type) => (
                  <button
                    key={type}
                    className={`p-2 rounded-md ${
                      selectedResource === type
                        ? 'ring-2 ring-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: resourceColors[type],
                      color: ['desert', 'wheat', 'sheep'].includes(type) ? '#333' : '#fff',
                    }}
                    onClick={() => setSelectedResource(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Number Token</h3>
              <div className="grid grid-cols-6 gap-2">
                <button
                  className={`p-2 rounded-md ${
                    selectedValue === undefined
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedValue(undefined)}
                >
                  None
                </button>
                {[2, 3, 4, 5, 6, 8, 9, 10, 11, 12].map((num) => (
                  <button
                    key={num}
                    className={`p-2 rounded-md ${
                      selectedValue === num
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedValue(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Grid Configuration</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600">Radius</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={gridConfig.radius}
                    onChange={(e) =>
                      handleConfigChange('radius', parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="text-right text-sm">{gridConfig.radius}</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Hex Size</label>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={gridConfig.hexSize}
                    onChange={(e) =>
                      handleConfigChange('hexSize', parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="text-right text-sm">{gridConfig.hexSize}px</div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600">Spacing</label>
                  <input
                    type="range"
                    min="100"
                    max="120"
                    value={gridConfig.spacing * 100}
                    onChange={(e) =>
                      handleConfigChange(
                        'spacing',
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full"
                  />
                  <div className="text-right text-sm">
                    {(gridConfig.spacing * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={generateCatanBoard}
              >
                Generate Catan Board
              </button>
              
              <div className="space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => setShowTileControls(false)}
                >
                  Close
                </button>
                
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hotspots legend - now fixed position */}
      {showHotspots && (
        <div className="fixed top-4 left-4 p-3 bg-white bg-opacity-90 rounded-lg shadow-md max-w-xs z-10">
          <h4 className="font-medium mb-2 text-gray-800">Building Locations:</h4>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm">Settlement/City Spots</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm">Road Spots</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset position button */}
      <div className="fixed bottom-4 left-4 z-10">
        <button
          className="p-2 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setMapPosition({ x: 0, y: 0 })}
        >
          Center Map
        </button>
      </div>
      
      {/* Edit mode indicator */}
      {editMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-md z-10">
          Edit Mode Active
        </div>
      )}
    </div>
  );
};

export default GameBoard; 