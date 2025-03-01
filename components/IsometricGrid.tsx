import React, { useState, useEffect, useRef } from 'react';

interface IsometricGridProps {
  isVisible: boolean;
  onSnapPoint?: (x: number, y: number) => void;
}

/**
 * IsometricGrid component
 * 
 * Renders an isometric grid overlay with configurable size and spacing.
 * Provides snapping points at vertices where grid lines intersect.
 */
const IsometricGrid: React.FC<IsometricGridProps> = ({ 
  isVisible, 
  onSnapPoint 
}) => {
  // Container ref to get dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Grid configuration state
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [cellSize, setCellSize] = useState(30);
  const [showSnapPoints, setShowSnapPoints] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number} | null>(null);
  
  // Update grid size when window resizes
  useEffect(() => {
    const updateGridSize = () => {
      if (containerRef.current) {
        setGridSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);
  
  // Calculate grid parameters
  const gridWidth = gridSize.width;
  const gridHeight = gridSize.height;
  
  // Calculate number of cells needed to cover the viewport
  const cellsX = Math.ceil(gridWidth / cellSize) * 2; // Double for safety
  const cellsY = Math.ceil(gridHeight / cellSize) * 2;
  
  // Calculate grid lines
  const renderIsometricGrid = () => {
    if (!isVisible) return null;
    
    const lines: JSX.Element[] = [];
    const centerX = gridWidth / 2;
    const centerY = gridHeight / 2;
    
    // Calculate the number of lines needed in each direction
    const numLines = Math.max(cellsX, cellsY) * 2; // Extra lines for full coverage
    
    // Generate diagonal lines from top-left to bottom-right (/)
    for (let i = -numLines; i <= numLines; i++) {
      const x1 = centerX - numLines * cellSize + i * cellSize;
      const y1 = centerY - numLines * cellSize;
      const x2 = centerX + numLines * cellSize + i * cellSize;
      const y2 = centerY + numLines * cellSize;
      
      lines.push(
        <line
          key={`diag1-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#888"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      );
    }
    
    // Generate diagonal lines from top-right to bottom-left (\)
    for (let i = -numLines; i <= numLines; i++) {
      const x1 = centerX + numLines * cellSize + i * cellSize;
      const y1 = centerY - numLines * cellSize;
      const x2 = centerX - numLines * cellSize + i * cellSize;
      const y2 = centerY + numLines * cellSize;
      
      lines.push(
        <line
          key={`diag2-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#888"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      );
    }
    
    return lines;
  };
  
  // Calculate and render snap points at intersections
  const renderSnapPoints = () => {
    if (!isVisible || !showSnapPoints) return null;
    
    const points: JSX.Element[] = [];
    const centerX = gridWidth / 2;
    const centerY = gridHeight / 2;
    
    // Calculate snap points (intersections of the isometric grid)
    // We'll use a smaller number of points to avoid overwhelming the UI
    const numPoints = Math.min(cellsX, cellsY) / 2;
    
    for (let i = -numPoints; i <= numPoints; i++) {
      for (let j = -numPoints; j <= numPoints; j++) {
        // Calculate the coordinates of each intersection
        const x = centerX + (i + j) * cellSize;
        const y = centerY + (i - j) * cellSize / 2;
        
        // Check if point is within viewport
        if (x >= 0 && x <= gridWidth && y >= 0 && y <= gridHeight) {
          const isHovered = hoveredPoint && hoveredPoint.x === x && hoveredPoint.y === y;
          
          points.push(
            <circle
              key={`point-${i}-${j}`}
              cx={x}
              cy={y}
              r={isHovered ? 6 : 4}
              fill={isHovered ? "rgba(52, 211, 153, 0.8)" : "rgba(52, 152, 219, 0.5)"}
              stroke={isHovered ? "#22c55e" : "#3498db"}
              strokeWidth={1.5}
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={() => {
                setHoveredPoint({ x, y });
              }}
              onMouseLeave={() => {
                setHoveredPoint(null);
              }}
              onClick={() => {
                if (onSnapPoint) {
                  onSnapPoint(x, y);
                }
              }}
            />
          );
        }
      }
    }
    
    return points;
  };
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        display: isVisible ? 'block' : 'none',
        zIndex: 5
      }}
    >
      {/* Grid Control Panel */}
      <div 
        className="absolute bottom-16 left-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-10 pointer-events-auto"
        style={{
          width: '250px'
        }}
      >
        <h3 className="text-lg font-semibold mb-3">Isometric Grid</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Cell Size: {cellSize}px
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={cellSize}
              onChange={(e) => setCellSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-snap-points"
              checked={showSnapPoints}
              onChange={(e) => setShowSnapPoints(e.target.checked)}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="show-snap-points" className="text-sm">
              Show Snap Points
            </label>
          </div>
        </div>
      </div>
      
      {/* SVG Grid */}
      <svg 
        width="100%" 
        height="100%" 
        className="pointer-events-none"
      >
        {renderIsometricGrid()}
        <g className="pointer-events-auto">
          {renderSnapPoints()}
        </g>
      </svg>
    </div>
  );
};

export default IsometricGrid; 