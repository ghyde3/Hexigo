import React, { useState, useEffect, useRef } from 'react';
import { GridConfig, presets } from './types';
import { renderGridLines, renderSnapPoints } from './utils/renderUtils';

interface GridSystemProps {
  placedTiles: { q: number; r: number }[];
  validSnapPositions: { q: number; r: number }[];
  showGridLines: boolean;
  showSnapPoints: boolean;
  gridConfig: GridConfig;
  setGridConfig: (config: GridConfig) => void;
  children: React.ReactNode;
}

const GridSystem: React.FC<GridSystemProps> = ({
  placedTiles,
  validSnapPositions,
  showGridLines,
  showSnapPoints,
  gridConfig,
  setGridConfig,
  children
}) => {
  const [gridSize, setGridSize] = useState({ width: window.innerWidth, height: window.innerHeight - 200 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        setGridSize({
          width: gridRef.current.clientWidth,
          height: gridRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset grid configuration to defaults
  const resetToDefaults = () => {
    setGridConfig(presets.default);
  };

  // Apply a preset configuration
  const applyPreset = (preset: keyof typeof presets) => {
    setGridConfig(presets[preset]);
  };

  return (
    <div 
      ref={gridRef}
      className="relative w-full h-full overflow-hidden bg-blue-100"
      style={{ width: '100%', height: '100%' }}
    >
      <svg 
        width={gridSize.width} 
        height={gridSize.height}
        className="absolute top-0 left-0"
      >
        {/* Grid lines */}
        {showGridLines && renderGridLines(placedTiles, gridConfig, gridSize)}
        
        {/* Snap points */}
        {showSnapPoints && renderSnapPoints(validSnapPositions, gridConfig, gridSize)}
      </svg>
      
      {/* Child components (tiles, ports, etc.) */}
      <div className="absolute top-0 left-0 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default GridSystem; 