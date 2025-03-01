import React, { useState, useCallback } from 'react';
import IsometricGrid from './IsometricGrid';

// Define the type for snap points
export interface SnapPoint {
  x: number;
  y: number;
}

interface IsometricGridControllerProps {
  isEditMode: boolean;
  onSnapPointSelected?: (point: SnapPoint) => void;
}

/**
 * IsometricGridController
 * 
 * Controller component for the isometric grid overlay.
 * Handles integration with the game's edit mode and manages grid visibility.
 */
const IsometricGridController: React.FC<IsometricGridControllerProps> = ({
  isEditMode,
  onSnapPointSelected
}) => {
  // State for grid visibility and configuration
  const [showIsometricGrid, setShowIsometricGrid] = useState(false);
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  
  // Toggle isometric grid visibility
  const handleToggleIsometricGrid = useCallback(() => {
    setShowIsometricGrid(prev => !prev);
  }, []);
  
  // Handle snap point selection
  const handleSnapPoint = useCallback((x: number, y: number) => {
    const newPoint = { x, y };
    setSnapPoints(prev => [...prev, newPoint]);
    
    if (onSnapPointSelected) {
      onSnapPointSelected(newPoint);
    }
  }, [onSnapPointSelected]);
  
  // If not in edit mode, don't render anything
  if (!isEditMode) {
    return null;
  }
  
  return (
    <>
      {/* Control button in the edit mode panel */}
      <div className="mt-4">
        <button
          className={`px-3 py-2 rounded text-sm font-medium ${
            showIsometricGrid ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
          onClick={handleToggleIsometricGrid}
        >
          {showIsometricGrid ? 'Hide Isometric Grid' : 'Show Isometric Grid'}
        </button>
        
        {showIsometricGrid && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Click on snap points to record their coordinates</p>
            <p>Snap points: {snapPoints.length}</p>
          </div>
        )}
      </div>
      
      {/* Render the isometric grid overlay */}
      <IsometricGrid 
        isVisible={showIsometricGrid} 
        onSnapPoint={handleSnapPoint}
      />
    </>
  );
};

export default IsometricGridController; 