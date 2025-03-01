import React, { useState, useEffect } from 'react';
import { SnapPoint } from './IsometricGridController';

interface IsometricGridManagerProps {
  isEditMode: boolean;
  snapPoints: SnapPoint[];
  onClearSnapPoints?: () => void;
}

/**
 * IsometricGridManager
 * 
 * Manager component for the isometric grid overlay.
 * Provides UI for viewing and exporting snap points.
 */
const IsometricGridManager: React.FC<IsometricGridManagerProps> = ({
  isEditMode,
  snapPoints,
  onClearSnapPoints
}) => {
  const [showManager, setShowManager] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'typescript'>('typescript');
  const [exportText, setExportText] = useState('');
  
  // Generate export text whenever snap points change
  useEffect(() => {
    if (snapPoints.length === 0) {
      setExportText('No snap points captured yet.');
      return;
    }
    
    if (exportFormat === 'json') {
      setExportText(JSON.stringify(snapPoints, null, 2));
    } else {
      // TypeScript format
      const tsText = `// Isometric Grid Snap Points\n` +
        `const snapPoints: SnapPoint[] = [\n` +
        snapPoints.map(point => `  { x: ${point.x}, y: ${point.y} }`).join(',\n') +
        `\n];\n\n` +
        `export default snapPoints;`;
      setExportText(tsText);
    }
  }, [snapPoints, exportFormat]);
  
  // If not in edit mode or no snap points, don't render
  if (!isEditMode) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <button 
        className={`px-3 py-2 rounded text-sm font-medium ${
          showManager ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-500 hover:bg-gray-600'
        } text-white`}
        onClick={() => setShowManager(prev => !prev)}
      >
        {showManager ? 'Hide Grid Manager' : 'Grid Manager'}
      </button>
      
      {showManager && (
        <div className="mt-2 p-4 bg-gray-800 rounded-lg text-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Isometric Grid Manager</h3>
            
            <div className="flex gap-2">
              <button 
                className="px-2 py-1 bg-red-500 hover:bg-red-600 rounded text-xs"
                onClick={onClearSnapPoints}
                disabled={snapPoints.length === 0}
              >
                Clear Points
              </button>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-sm mb-1">Captured Points: {snapPoints.length}</p>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="format-ts" 
                  checked={exportFormat === 'typescript'}
                  onChange={() => setExportFormat('typescript')}
                />
                <label htmlFor="format-ts" className="text-sm">TypeScript</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  id="format-json" 
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                />
                <label htmlFor="format-json" className="text-sm">JSON</label>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm mb-1">Export Data:</p>
            <div className="bg-gray-900 p-2 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
              <pre>{exportText}</pre>
            </div>
            
            <button 
              className="mt-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs"
              onClick={() => {
                navigator.clipboard.writeText(exportText);
              }}
              disabled={snapPoints.length === 0}
            >
              Copy to Clipboard
            </button>
          </div>
          
          {snapPoints.length > 0 && (
            <div className="mt-4">
              <p className="text-sm mb-1">Point List:</p>
              <div className="bg-gray-900 p-2 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pr-4">#</th>
                      <th className="text-left pr-4">X</th>
                      <th className="text-left">Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapPoints.map((point, index) => (
                      <tr key={index}>
                        <td className="pr-4">{index + 1}</td>
                        <td className="pr-4">{point.x.toFixed(2)}</td>
                        <td>{point.y.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IsometricGridManager; 