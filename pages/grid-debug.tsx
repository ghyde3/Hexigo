import React, { useState, useCallback } from 'react';
import IsometricGridController, { SnapPoint } from '../components/IsometricGridController';
import IsometricGridManager from '../components/IsometricGridManager';

/**
 * GridDebugPage
 * 
 * A standalone page for testing and demonstrating the isometric grid overlay.
 * This page doesn't modify any existing game functionality.
 */
const GridDebugPage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  
  // Toggle edit mode on/off
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);
  
  // Handle when a snap point is selected
  const handleSnapPointSelected = useCallback((point: SnapPoint) => {
    setSnapPoints(prev => [...prev, point]);
  }, []);
  
  // Clear all snap points
  const handleClearSnapPoints = useCallback(() => {
    setSnapPoints([]);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Isometric Grid Debug</h1>
          <p className="text-sm opacity-80">
            A standalone page for testing the isometric grid overlay
          </p>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 container mx-auto p-4 relative">
        {/* Content area that simulates the game board */}
        <div 
          className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-200px)] relative border-2 border-dashed border-gray-300"
          style={{
            backgroundColor: isEditMode ? 'rgba(200, 200, 200, 0.2)' : 'white',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            {!isEditMode ? (
              <div className="text-center">
                <p className="text-2xl mb-2">Game Board Area</p>
                <p className="text-sm">Enable edit mode to see the isometric grid</p>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <p className="text-sm">Click on grid points to capture coordinates</p>
              </div>
            )}
          </div>
          
          {/* This is where the isometric grid will appear when edit mode is on */}
          <IsometricGridController 
            isEditMode={isEditMode}
            onSnapPointSelected={handleSnapPointSelected}
          />
        </div>
        
        {/* Control panel */}
        <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Grid Debug Controls</h2>
            
            <button
              className={`px-4 py-2 rounded font-medium ${
                isEditMode ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
              onClick={handleToggleEditMode}
            >
              {isEditMode ? 'Exit Editor Mode' : 'Enter Editor Mode'}
            </button>
          </div>
          
          {/* Grid Manager appears here when in edit mode */}
          <div className="mt-4">
            <IsometricGridManager 
              isEditMode={isEditMode}
              snapPoints={snapPoints}
              onClearSnapPoints={handleClearSnapPoints}
            />
          </div>
          
          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-600 border-t pt-4">
            <h3 className="font-semibold mb-2">How to use the isometric grid:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Click "Enter Editor Mode" to enable the edit mode</li>
              <li>Click "Show Isometric Grid" to display the grid overlay</li>
              <li>Use the slider to adjust the grid cell size</li>
              <li>Click on grid points to capture their coordinates</li>
              <li>Use "Grid Manager" to export captured coordinates</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-3 text-center text-sm">
        <p>Isometric Grid Debug - Development Version</p>
      </footer>
    </div>
  );
};

export default GridDebugPage; 