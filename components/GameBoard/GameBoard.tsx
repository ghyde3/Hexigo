import React, { useState, useEffect, useRef } from 'react';
import { Tile, Port as PortType, Structure } from '../../lib/types';
import { GameBoardProps, EditModeType, GridConfig, presets } from './types';
import GridSystem from './GridSystem';
import TileManager from './TileManager';
import PortManager from './PortManager';
import GridControls from './GridControls';
import EditModeControls from './EditModeControls';

const GameBoard: React.FC<GameBoardProps> = ({ 
  tiles, 
  ports = [],
  structures = [],
  onTileClick,
  isEditMode = false,
  onToggleEditMode
}) => {
  // Grid configuration state
  const [gridConfig, setGridConfig] = useState<GridConfig>(presets.default);
  const [gridSize, setGridSize] = useState({ width: window.innerWidth, height: window.innerHeight - 200 });
  const [showGridLines, setShowGridLines] = useState(true);
  const [showSnapPoints, setShowSnapPoints] = useState(true);
  const [showWaterBorder, setShowWaterBorder] = useState(true);
  
  // Edit mode state
  const [activeEditMode, setActiveEditMode] = useState<EditModeType>(EditModeType.TILES);
  
  // Ports state
  const [editablePorts, setEditablePorts] = useState<PortType[]>(ports);
  
  // Grid ref for size calculations
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        setGridSize({
          width: gridRef.current.clientWidth,
          height: gridRef.current.clientHeight
        });
      } else {
        setGridSize({
          width: window.innerWidth,
          height: window.innerHeight - 200
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle edit mode change
  const handleEditModeChange = (mode: EditModeType) => {
    setActiveEditMode(mode);
  };

  // Handle ports change
  const handlePortsChange = (updatedPorts: PortType[]) => {
    setEditablePorts(updatedPorts);
  };

  return (
    <div className="flex h-screen">
      {/* Main game board area */}
      <div className="flex-grow h-full relative" ref={gridRef}>
        <GridSystem
          placedTiles={tiles.map((tile, index) => ({ 
            q: tile.coordinates.q, 
            r: tile.coordinates.r 
          }))}
          validSnapPositions={[]} // This will be calculated in TileManager
          showGridLines={showGridLines}
          showSnapPoints={showSnapPoints && isEditMode && activeEditMode === EditModeType.TILES}
          gridConfig={gridConfig}
          setGridConfig={setGridConfig}
        >
          {/* Tile Manager */}
          <TileManager
            tiles={tiles}
            gridConfig={gridConfig}
            gridSize={gridSize}
            onTileClick={onTileClick}
            isEditMode={isEditMode && activeEditMode === EditModeType.TILES}
          />
          
          {/* Port Manager */}
          <PortManager
            ports={editablePorts}
            gridConfig={gridConfig}
            gridSize={gridSize}
            isEditMode={isEditMode && activeEditMode === EditModeType.PORTS}
            placedTiles={tiles.map(tile => ({ 
              q: tile.coordinates.q, 
              r: tile.coordinates.r 
            }))}
            onPortsChange={handlePortsChange}
          />
          
          {/* We'll add more components here as we create them */}
          {/* SettlementManager */}
          {/* RoadManager */}
        </GridSystem>
      </div>
      
      {/* Controls sidebar */}
      {isEditMode && (
        <div className="w-80 h-full overflow-y-auto bg-gray-100 p-4 flex flex-col gap-4">
          <EditModeControls
            isEditMode={isEditMode}
            activeEditMode={activeEditMode}
            onToggleEditMode={onToggleEditMode}
            onEditModeChange={handleEditModeChange}
          />
          
          <GridControls
            gridConfig={gridConfig}
            setGridConfig={setGridConfig}
            showGridLines={showGridLines}
            setShowGridLines={setShowGridLines}
            showSnapPoints={showSnapPoints}
            setShowSnapPoints={setShowSnapPoints}
            showWaterBorder={showWaterBorder}
            setShowWaterBorder={setShowWaterBorder}
          />
          
          {/* We'll add more control components here as we create them */}
        </div>
      )}
    </div>
  );
};

export default GameBoard; 