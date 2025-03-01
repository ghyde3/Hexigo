import React from 'react';
import { GridConfig, presets } from './types';

interface GridControlsProps {
  gridConfig: GridConfig;
  setGridConfig: (config: GridConfig) => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
  showSnapPoints: boolean;
  setShowSnapPoints: (show: boolean) => void;
  showWaterBorder: boolean;
  setShowWaterBorder: (show: boolean) => void;
}

const GridControls: React.FC<GridControlsProps> = ({
  gridConfig,
  setGridConfig,
  showGridLines,
  setShowGridLines,
  showSnapPoints,
  setShowSnapPoints,
  showWaterBorder,
  setShowWaterBorder
}) => {
  const { tileWidth, tileHeight, xSpacing, ySpacing, snapThreshold } = gridConfig;

  // Handle input changes
  const handleTileWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridConfig({ ...gridConfig, tileWidth: Number(e.target.value) });
  };

  const handleTileHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridConfig({ ...gridConfig, tileHeight: Number(e.target.value) });
  };

  const handleXSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridConfig({ ...gridConfig, xSpacing: Number(e.target.value) });
  };

  const handleYSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridConfig({ ...gridConfig, ySpacing: Number(e.target.value) });
  };

  const handleSnapThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridConfig({ ...gridConfig, snapThreshold: Number(e.target.value) });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setGridConfig(presets.default);
  };

  // Apply a preset
  const applyPreset = (preset: keyof typeof presets) => {
    setGridConfig(presets[preset]);
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-2">Grid Controls</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-sm">Tile Width</label>
          <input
            type="range"
            min="50"
            max="200"
            value={tileWidth}
            onChange={handleTileWidthChange}
            className="w-full"
          />
          <input
            type="number"
            value={tileWidth}
            onChange={handleTileWidthChange}
            className="w-full border rounded p-1 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm">Tile Height</label>
          <input
            type="range"
            min="50"
            max="200"
            value={tileHeight}
            onChange={handleTileHeightChange}
            className="w-full"
          />
          <input
            type="number"
            value={tileHeight}
            onChange={handleTileHeightChange}
            className="w-full border rounded p-1 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm">X Spacing</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={xSpacing}
            onChange={handleXSpacingChange}
            className="w-full"
          />
          <input
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            value={xSpacing}
            onChange={handleXSpacingChange}
            className="w-full border rounded p-1 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm">Y Spacing</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={ySpacing}
            onChange={handleYSpacingChange}
            className="w-full"
          />
          <input
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            value={ySpacing}
            onChange={handleYSpacingChange}
            className="w-full border rounded p-1 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm">Snap Threshold</label>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={snapThreshold}
            onChange={handleSnapThresholdChange}
            className="w-full"
          />
          <input
            type="number"
            min="0.01"
            max="0.5"
            step="0.01"
            value={snapThreshold}
            onChange={handleSnapThresholdChange}
            className="w-full border rounded p-1 text-sm"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={resetToDefaults}
          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
        >
          Reset to Defaults
        </button>
        <button
          onClick={() => applyPreset('compact')}
          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
        >
          Compact
        </button>
        <button
          onClick={() => applyPreset('expanded')}
          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
        >
          Expanded
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => setShowGridLines(e.target.checked)}
            className="mr-2"
          />
          Show Grid Lines
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showSnapPoints}
            onChange={(e) => setShowSnapPoints(e.target.checked)}
            className="mr-2"
          />
          Show Snap Points
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showWaterBorder}
            onChange={(e) => setShowWaterBorder(e.target.checked)}
            className="mr-2"
          />
          Show Water Border
        </label>
      </div>
    </div>
  );
};

export default GridControls; 