import React, { useState, useEffect } from 'react';
import { Port as PortType, PortType as PortTypeEnum, HexCoordinates, VertexCoordinates } from '../../lib/types';
import { EditingPort, GridConfig } from './types';
import { Port } from '../../components/Port';
import { gridToPixel } from './utils/coordinateUtils';

interface PortManagerProps {
  ports: PortType[];
  gridConfig: GridConfig;
  gridSize: { width: number; height: number };
  isEditMode: boolean;
  placedTiles: { q: number; r: number }[];
  onPortsChange?: (ports: PortType[]) => void;
}

const PortManager: React.FC<PortManagerProps> = ({
  ports,
  gridConfig,
  gridSize,
  isEditMode,
  placedTiles,
  onPortsChange
}) => {
  const [editablePorts, setEditablePorts] = useState<PortType[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [editingPort, setEditingPort] = useState<EditingPort | null>(null);
  const [portDragOffset, setPortDragOffset] = useState({ x: 0, y: 0 });

  // Initialize editable ports from props
  useEffect(() => {
    if (ports.length > 0 && editablePorts.length === 0) {
      setEditablePorts([...ports]);
    }
  }, [ports]);

  // Update parent component when ports change
  useEffect(() => {
    if (onPortsChange && editablePorts.length > 0) {
      onPortsChange(editablePorts);
    }
  }, [editablePorts, onPortsChange]);

  // Handle port selection
  const handleSelectPort = (portId: string) => {
    if (!isEditMode) return;
    
    setSelectedPort(portId);
    
    const port = editablePorts.find(p => p.id === portId);
    if (port) {
      setEditingPort({
        type: port.type,
        coordinates: { ...port.coordinates },
        direction: port.direction,
        id: port.id
      });
    }
  };

  // Handle port drag start
  const handlePortDragStart = (e: React.MouseEvent, portId: string) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    
    const port = editablePorts.find(p => p.id === portId);
    if (!port) return;
    
    // Calculate the center of the port
    const hexCoords = port.coordinates;
    const { x, y } = gridToPixel(hexCoords.q, hexCoords.r, gridConfig, gridSize);
    
    setSelectedPort(portId);
    setEditingPort({
      ...port,
      isDragging: true
    });
    
    setPortDragOffset({
      x: x - e.clientX,
      y: y - e.clientY
    });
  };

  // Handle port type change
  const handlePortTypeChange = (type: PortTypeEnum) => {
    if (editingPort) {
      setEditingPort({ ...editingPort, type });
    }
  };

  // Handle port direction change
  const handlePortDirectionChange = (direction: number) => {
    if (editingPort) {
      setEditingPort({ ...editingPort, direction });
    }
  };

  // Handle save port
  const handleSavePort = () => {
    if (!editingPort || !editingPort.id) return;
    
    // Find the port in the editable ports
    const portIndex = editablePorts.findIndex(p => p.id === editingPort.id);
    
    if (portIndex >= 0) {
      // Update existing port
      const updatedPorts = [...editablePorts];
      
      // Calculate vertices based on the hex and direction
      const vertices = getPortVertices(
        editingPort.coordinates,
        editingPort.direction
      );
      
      updatedPorts[portIndex] = {
        id: editingPort.id,
        type: editingPort.type,
        coordinates: { ...editingPort.coordinates },
        direction: editingPort.direction,
        vertices
      };
      
      setEditablePorts(updatedPorts);
    }
    
    // Clear selection
    setSelectedPort(null);
    setEditingPort(null);
  };

  // Handle cancel port edit
  const handleCancelPortEdit = () => {
    setSelectedPort(null);
    setEditingPort(null);
  };

  // Handle add port
  const handleAddPort = () => {
    if (placedTiles.length === 0) return;
    
    // Create a new port at the first tile
    const firstTile = placedTiles[0];
    const newPortId = `port-${Date.now()}`;
    
    const coordinates: HexCoordinates = {
      q: firstTile.q,
      r: firstTile.r,
      s: -firstTile.q - firstTile.r
    };
    
    const direction = 0;
    const vertices = getPortVertices(coordinates, direction);
    
    const newPort: PortType = {
      id: newPortId,
      type: PortTypeEnum.Generic,
      coordinates,
      direction,
      vertices
    };
    
    setEditablePorts([...editablePorts, newPort]);
    setSelectedPort(newPortId);
    setEditingPort({
      id: newPortId,
      type: PortTypeEnum.Generic,
      coordinates,
      direction
    });
  };

  // Handle delete port
  const handleDeletePort = (portId: string) => {
    const updatedPorts = editablePorts.filter(p => p.id !== portId);
    setEditablePorts(updatedPorts);
    
    if (selectedPort === portId) {
      setSelectedPort(null);
      setEditingPort(null);
    }
  };

  // Get the vertices for a port based on hex coordinates and direction
  const getPortVertices = (hexCoords: HexCoordinates, direction: number): VertexCoordinates[] => {
    // The two vertices that define the edge where the port is located
    const v1: VertexCoordinates = {
      q: hexCoords.q,
      r: hexCoords.r,
      s: hexCoords.s,
      direction
    };
    
    const v2: VertexCoordinates = {
      q: hexCoords.q,
      r: hexCoords.r,
      s: hexCoords.s,
      direction: (direction + 1) % 6
    };
    
    return [v1, v2];
  };

  // Render the ports
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      {editablePorts.map(port => {
        const { x, y } = gridToPixel(port.coordinates.q, port.coordinates.r, gridConfig, gridSize);
        
        return (
          <div
            key={`port-${port.id}`}
            className={`absolute ${selectedPort === port.id ? 'z-20' : 'z-10'}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              cursor: isEditMode ? 'move' : 'pointer'
            }}
            onClick={() => handleSelectPort(port.id)}
            onMouseDown={(e) => handlePortDragStart(e, port.id)}
          >
            <Port
              port={port}
              hexSize={gridConfig.tileWidth}
            />
          </div>
        );
      })}
      
      {isEditMode && (
        <div className="absolute bottom-4 left-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleAddPort}
          >
            Add Port
          </button>
        </div>
      )}
      
      {isEditMode && selectedPort && editingPort && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-md w-64">
          <h3 className="text-lg font-semibold mb-2">Edit Port</h3>
          
          <div className="mb-4">
            <label className="block text-sm mb-1">Port Type</label>
            <select
              value={editingPort.type}
              onChange={(e) => handlePortTypeChange(e.target.value as PortTypeEnum)}
              className="w-full border rounded p-2"
            >
              {Object.values(PortTypeEnum).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-1">Direction</label>
            <select
              value={editingPort.direction}
              onChange={(e) => handlePortDirectionChange(Number(e.target.value))}
              className="w-full border rounded p-2"
            >
              {[0, 1, 2, 3, 4, 5].map(dir => (
                <option key={dir} value={dir}>
                  Direction {dir}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-between">
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => handleDeletePort(editingPort.id!)}
            >
              Delete
            </button>
            <div>
              <button
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded mr-2"
                onClick={handleCancelPortEdit}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                onClick={handleSavePort}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortManager; 