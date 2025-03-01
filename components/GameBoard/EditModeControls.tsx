import React from 'react';
import { EditModeType } from './types';

interface EditModeControlsProps {
  isEditMode: boolean;
  activeEditMode: EditModeType;
  onToggleEditMode?: () => void;
  onEditModeChange: (mode: EditModeType) => void;
}

const EditModeControls: React.FC<EditModeControlsProps> = ({
  isEditMode,
  activeEditMode,
  onToggleEditMode,
  onEditModeChange
}) => {
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Edit Mode</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isEditMode}
            onChange={onToggleEditMode}
            className="mr-2"
          />
          <span>Enable Edit Mode</span>
        </label>
      </div>
      
      {isEditMode && (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium mb-1">Edit Mode Type:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`px-3 py-2 rounded text-sm ${activeEditMode === EditModeType.TILES ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => onEditModeChange(EditModeType.TILES)}
            >
              Tiles
            </button>
            <button
              className={`px-3 py-2 rounded text-sm ${activeEditMode === EditModeType.PORTS ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => onEditModeChange(EditModeType.PORTS)}
            >
              Ports
            </button>
            <button
              className={`px-3 py-2 rounded text-sm ${activeEditMode === EditModeType.SETTLEMENTS ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => onEditModeChange(EditModeType.SETTLEMENTS)}
            >
              Settlements
            </button>
            <button
              className={`px-3 py-2 rounded text-sm ${activeEditMode === EditModeType.ROADS ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => onEditModeChange(EditModeType.ROADS)}
            >
              Roads
            </button>
          </div>
          
          <div className="mt-4 text-sm">
            <p className="mb-2">Instructions:</p>
            {activeEditMode === EditModeType.TILES && (
              <ul className="list-disc pl-5 text-xs">
                <li>Drag tiles to position them on the board</li>
                <li>Tiles will snap to valid positions</li>
              </ul>
            )}
            {activeEditMode === EditModeType.PORTS && (
              <ul className="list-disc pl-5 text-xs">
                <li>Click "Add Port" to create a new port</li>
                <li>Drag ports to position them on the board</li>
                <li>Select a port to edit its properties</li>
              </ul>
            )}
            {activeEditMode === EditModeType.SETTLEMENTS && (
              <ul className="list-disc pl-5 text-xs">
                <li>Click on a vertex to place a settlement</li>
                <li>Select a settlement to edit its properties</li>
              </ul>
            )}
            {activeEditMode === EditModeType.ROADS && (
              <ul className="list-disc pl-5 text-xs">
                <li>Click on an edge to place a road</li>
                <li>Select a road to edit its properties</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModeControls; 