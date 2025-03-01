import React, { useState, useEffect, useRef } from 'react';
import { Tile, Port as PortType, PortType as PortTypeEnum, HexCoordinates, VertexCoordinates, EdgeCoordinates, Structure, StructureType } from '../lib/types';
import HexTile from './HexTile';
import Port from './Port';

// Define edit mode types
enum EditModeType {
  TILES = 'tiles',
  PORTS = 'ports',
  SETTLEMENTS = 'settlements',
  ROADS = 'roads'
}

interface GameBoardProps {
  tiles: Tile[];
  ports?: PortType[];
  structures?: Structure[];
  onTileClick?: (tile: Tile) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

interface PlacedTile {
  tileIndex: number;
  q: number; // Axial grid coordinate
  r: number; // Axial grid coordinate
}

// Interface for port being edited
interface EditingPort extends Omit<PortType, 'id' | 'vertices'> {
  id?: string;
  isDragging?: boolean;
  // Store the two vertices this port connects
  vertexIndices?: [number, number];
}

// Interface for settlement being edited
interface EditingSettlement {
  id?: string;
  type: StructureType.Settlement | StructureType.City;
  playerId: number;
  coordinates: VertexCoordinates;
}

// Interface for road being edited
interface EditingRoad {
  id?: string;
  type: StructureType.Road;
  playerId: number;
  coordinates: EdgeCoordinates;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  tiles, 
  ports = [],
  structures = [],
  onTileClick,
  isEditMode = false,
  onToggleEditMode
}) => {
  const [tileWidth, setTileWidth] = useState(120); // Updated default tile width
  const [tileHeight, setTileHeight] = useState(120); // Updated default tile height
  const [gridSize, setGridSize] = useState({ width: window.innerWidth, height: window.innerHeight - 200 }); // Use full screen width
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [draggingTile, setDraggingTile] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGridLines, setShowGridLines] = useState(true);
  const [xSpacing, setXSpacing] = useState(0.6); // Updated default horizontal spacing
  const [ySpacing, setYSpacing] = useState(0.52); // Updated default vertical spacing
  const [snapThreshold, setSnapThreshold] = useState(0.1); // Default snap threshold
  const gridRef = useRef<HTMLDivElement>(null);
  const [showWaterBorder, setShowWaterBorder] = useState(true); // New state for water border
  
  // New state for active edit mode type
  const [activeEditMode, setActiveEditMode] = useState<EditModeType>(EditModeType.TILES);
  
  // New state for port editing
  const [editablePorts, setEditablePorts] = useState<PortType[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [editingPort, setEditingPort] = useState<EditingPort | null>(null);
  const [showPortDirections, setShowPortDirections] = useState(true);
  const [portDragOffset, setPortDragOffset] = useState({ x: 0, y: 0 });

  // New state for settlement editing
  const [editableStructures, setEditableStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<EditingSettlement | null>(null);
  const [showVertexPoints, setShowVertexPoints] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState(0);
  const [hoveredVertex, setHoveredVertex] = useState<VertexCoordinates | null>(null);

  // New state for road editing
  const [editingRoad, setEditingRoad] = useState<EditingRoad | null>(null);
  const [showEdgePoints, setShowEdgePoints] = useState(true);
  const [hoveredEdge, setHoveredEdge] = useState<EdgeCoordinates | null>(null);

  // Initialize editable ports from props
  useEffect(() => {
    if (ports.length > 0 && editablePorts.length === 0) {
      setEditablePorts([...ports]);
    }
  }, [ports, editablePorts.length]);

  // Initialize editable structures from props
  useEffect(() => {
    if (structures.length > 0 && editableStructures.length === 0) {
      setEditableStructures([...structures]);
    }
  }, [structures, editableStructures.length]);

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setGridSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - 200 // Leave some space for controls
      });
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate hex dimensions based on current spacing settings
  const hexWidth = tileWidth * xSpacing;
  const hexHeight = tileHeight * ySpacing;

  // Convert pixel position to grid (axial) coordinates
  const pixelToGrid = (x: number, y: number) => {
    const centerX = gridSize.width / 2;
    const centerY = gridSize.height / 2;

    // Convert to cube coordinates for easier rounding
    const size = hexWidth;
    const q = ((x - centerX) * Math.sqrt(3) / 3 - (y - centerY) / 3) / size;
    const r = (y - centerY) * 2 / 3 / size;

    // Round to the nearest hex
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    const s = -roundedQ - roundedR; // Ensure cube coordinates sum to 0

    return { q: roundedQ, r: roundedR };
  };

  // Convert grid (axial) coordinates to pixel position
  const gridToPixel = (q: number, r: number) => {
    const centerX = gridSize.width / 2;
    const centerY = gridSize.height / 2;

    // Adjusted based on current spacing settings
    const x = centerX + hexWidth * (q * Math.sqrt(3) + r * Math.sqrt(3) / 2);
    const y = centerY + hexHeight * (r * 3 / 2);

    return { x, y };
  };

  // Get all valid neighboring hex positions for a given position
  const getNeighborPositions = (q: number, r: number) => {
    return [
      { q: q + 1, r: r - 1 }, // Top right
      { q: q + 1, r: r },     // Right
      { q: q, r: r + 1 },     // Bottom right
      { q: q - 1, r: r + 1 }, // Bottom left
      { q: q - 1, r: r },     // Left
      { q: q, r: r - 1 },     // Top left
    ];
  };

  // Check if a position is already occupied
  const isPositionOccupied = (q: number, r: number) => {
    return placedTiles.some(tile => tile.q === q && tile.r === r);
  };

  // Get valid snap positions (unoccupied neighbors of existing tiles)
  const getValidSnapPositions = (): { q: number; r: number }[] => {
    const validPositions: { q: number; r: number }[] = [];

    if (placedTiles.length === 0) {
      validPositions.push({ q: 0, r: 0 }); // Start with center
      return validPositions;
    }

    placedTiles.forEach(tile => {
      const neighbors = getNeighborPositions(tile.q, tile.r);
      neighbors.forEach(pos => {
        if (!isPositionOccupied(pos.q, pos.r) && 
            !validPositions.some(p => p.q === pos.q && p.r === pos.r)) {
          validPositions.push(pos);
        }
      });
    });

    // Limit to a circular area for Catan's 19-tile layout
    return validPositions.filter(pos => {
      const dist = Math.abs(pos.q) + Math.abs(pos.r);
      return dist <= 4; // Slightly smaller radius for tighter layout
    });
  };

  // Handle mouse down (start dragging)
  const handleMouseDown = (e: React.MouseEvent, tileIndex: number) => {
    if (!isEditMode) return; // Only allow dragging in edit mode
    
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const tile = placedTiles.find(t => t.tileIndex === tileIndex);
      
      if (tile) {
        setDraggingTile(tileIndex);
        const { x, y } = gridToPixel(tile.q, tile.r);
        setDragOffset({
          x: e.clientX - rect.left - x,
          y: e.clientY - rect.top - y,
        });
      }
    }
    e.preventDefault();
  };

  // Handle mouse move (drag tile)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTile === null || !gridRef.current || !isEditMode) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const { q, r } = pixelToGrid(x, y);
    const validPositions = getValidSnapPositions();

    // Find the closest valid snap position
    let closestPos: { q: number; r: number } | null = null;
    let minDist = Number.MAX_VALUE;

    validPositions.forEach(pos => {
      const { x: px, y: py } = gridToPixel(pos.q, pos.r);
      const dist = distance(x, y, px, py);
      if (dist < minDist) {
        minDist = dist;
        closestPos = pos;
      }
    });

    setPlacedTiles(prevTiles => {
      const otherTiles = prevTiles.filter(t => t.tileIndex !== draggingTile);
      const draggingTileData = prevTiles.find(t => t.tileIndex === draggingTile);

      if (!draggingTileData) return prevTiles;

      // Snap to the closest valid position if within snapping distance
      const snapDistance = Math.min(tileWidth, tileHeight) * snapThreshold;
      const newPosition = closestPos && minDist < snapDistance 
        ? { q: closestPos.q, r: closestPos.r }
        : { q, r };

      return [
        ...otherTiles,
        {
          ...draggingTileData,
          q: newPosition.q,
          r: newPosition.r,
        },
      ];
    });
  };

  // Handle mouse up (stop dragging)
  const handleMouseUp = () => {
    setDraggingTile(null);
  };

  // Toggle grid lines visibility
  const toggleGridLines = () => {
    setShowGridLines(!showGridLines);
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingTile(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Render clear hexagonal grid lines
  const renderGridLines = () => {
    if (!showGridLines || !isEditMode) return null;

    const gridRadius = 4; // Reduced for a tighter, 19-tile layout
    const lines: React.ReactNode[] = [];

    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (let r = -gridRadius; r <= gridRadius; r++) {
        // Skip positions too far from center for a circular grid
        if (Math.abs(q) + Math.abs(r) > gridRadius * 1.5) continue;

        const { x, y } = gridToPixel(q, r);
        const isOccupied = isPositionOccupied(q, r);

        lines.push(
          <div
            key={`grid-${q}-${r}`}
            className={`absolute border ${isOccupied ? 'border-gray-600' : 'border-gray-300'}`}
            style={{
              width: `${tileWidth}px`,
              height: `${hexHeight}px`,
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              opacity: 0.8,
              backgroundColor: isOccupied ? 'rgba(200, 200, 200, 0.1)' : 'transparent',
            }}
          />
        );
      }
    }

    return lines;
  };

  // Render snap points (visual indicators for valid positions)
  const renderSnapPoints = () => {
    if (draggingTile === null || !isEditMode) return null;

    const validPositions = getValidSnapPositions();
    return validPositions.map(pos => {
      const { x, y } = gridToPixel(pos.q, pos.r);

      return (
        <div
          key={`snap-${pos.q}-${pos.r}`}
          className="absolute rounded-full bg-green-500 border-2 border-white"
          style={{
            width: '20px',
            height: '20px',
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
          }}
        />
      );
    });
  };

  // Generate coordinate output for Catan board layout
  const generateCoordinateOutput = () => {
    const sortedTiles = [...placedTiles].sort((a, b) => {
      if (a.r !== b.r) return a.r - b.r;
      return a.q - b.q;
    });

    const layoutCode = `const boardLayout = [\n  ${sortedTiles
      .map(t => `{ q: ${t.q}, r: ${t.r} }`)
      .join(', ')}\n];`;

    return layoutCode;
  };

  // Initialize tiles with the specified layout
  useEffect(() => {
    if (tiles.length > 0 && placedTiles.length === 0) {
      // Use the predefined Catan layout
      const catanLayout = [
        { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 }, 
        { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 }, 
        { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, 
        { q: 1, r: 0 }, { q: 2, r: 0 }, { q: -2, r: 1 }, 
        { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 }, 
        { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 }
      ];
      
      // Map tiles to the layout positions
      const initialTiles = tiles.slice(0, 19).map((_, index) => ({
        tileIndex: index,
        q: catanLayout[index].q,
        r: catanLayout[index].r
      }));
      
      setPlacedTiles(initialTiles);
    }
  }, [tiles, placedTiles.length]);

  // Utility function to calculate distance between two points
  const distance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Handle control changes
  const handleXSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setXSpacing(parseFloat(e.target.value));
  };

  const handleYSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYSpacing(parseFloat(e.target.value));
  };

  const handleSnapThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSnapThreshold(parseFloat(e.target.value));
  };

  const handleTileWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTileWidth(parseFloat(e.target.value));
  };

  const handleTileHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTileHeight(parseFloat(e.target.value));
  };

  // Handle direct input changes
  const handleXSpacingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setXSpacing(value);
    }
  };

  const handleYSpacingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setYSpacing(value);
    }
  };

  const handleSnapThresholdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
      setSnapThreshold(value);
    }
  };

  const handleTileWidthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 40 && value <= 200) {
      setTileWidth(value);
    }
  };

  const handleTileHeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 40 && value <= 200) {
      setTileHeight(value);
    }
  };

  const resetToDefaults = () => {
    setXSpacing(0.6);
    setYSpacing(0.52);
    setSnapThreshold(0.1);
    setTileWidth(120);
    setTileHeight(120);
  };

  // Preset configurations
  const presets = {
    tight: { x: 0.57, y: 0.5, snap: 0.1, width: 100, height: 100 },
    standard: { x: 0.6, y: 0.52, snap: 0.1, width: 120, height: 120 },
    spacious: { x: 0.7, y: 0.6, snap: 0.3, width: 140, height: 140 },
    perfectHex: { x: 0.866, y: 0.75, snap: 0.2, width: 120, height: 120 }, // Perfect hexagon ratio
    custom1: { x: 0.55, y: 0.5, snap: 0.15, width: 110, height: 110 }
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const { x, y, snap, width, height } = presets[preset];
    setXSpacing(x);
    setYSpacing(y);
    setSnapThreshold(snap);
    setTileWidth(width);
    setTileHeight(height);
  };

  const coordinateOutput = generateCoordinateOutput();

  // Function to handle edit mode change
  const handleEditModeChange = (mode: EditModeType) => {
    setActiveEditMode(mode);
    setSelectedPort(null);
    setEditingPort(null);
    setSelectedStructure(null);
    setEditingSettlement(null);
    setHoveredVertex(null);
    setEditingRoad(null);
    setHoveredEdge(null);
  };

  // Function to select a port for editing
  const handleSelectPort = (portId: string) => {
    setSelectedPort(portId);
    const port = editablePorts.find(p => p.id === portId);
    if (port) {
      setEditingPort({
        type: port.type,
        coordinates: { ...port.coordinates },
        direction: port.direction
      });
    }
  };

  // Function to start dragging a port
  const handlePortDragStart = (e: React.MouseEvent, portId: string) => {
    if (!isEditMode || activeEditMode !== EditModeType.PORTS) return;
    
    e.stopPropagation();
    
    const port = editablePorts.find(p => p.id === portId);
    if (!port) return;
    
    // Calculate the ship icon position (in water) based on hex and direction
    const { q, r } = port.coordinates;
    const { x, y } = gridToPixel(q, r);
    
    // Calculate position offset toward water
    const angle = (port.direction * 60) * Math.PI / 180;
    const distance = Math.min(tileWidth, tileHeight) * 0.75; // Position it further out in water
    const shipX = x + distance * Math.cos(angle);
    const shipY = y + distance * Math.sin(angle);
    
    setPortDragOffset({
      x: e.clientX - shipX,
      y: e.clientY - shipY
    });
    
    setSelectedPort(portId);
    setEditingPort({
      ...port,
      coordinates: { ...port.coordinates },
      isDragging: true
    });
  };

  // Function to handle port dragging
  const handlePortDrag = (e: React.MouseEvent) => {
    if (!editingPort?.isDragging || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find the closest coastal vertex (corner of a land hex facing water)
    // In Catan, ports are located at the vertices of hexes along the coast
    
    // 1. Get all placed tiles that are on the coastline
    const coastalTiles = placedTiles.filter(tile => {
      // Check if this tile has at least one empty neighbor (potential coastline)
      const neighbors = getNeighborPositions(tile.q, tile.r);
      return neighbors.some(neighbor => !isPositionOccupied(neighbor.q, neighbor.r));
    });
    
    // 2. Generate all vertices from coastal tiles
    const coastalVertices = coastalTiles.flatMap(tile => {
      const { q, r } = tile;
      const { x, y } = gridToPixel(q, r);
      
      // For each direction (0-5), generate vertex information
      return Array.from({ length: 6 }, (_, direction) => {
        // Calculate vertex position
        const angle = (direction * 60) * Math.PI / 180;
        const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half hex size
        const vertexX = x + distance * Math.cos(angle);
        const vertexY = y + distance * Math.sin(angle);
        
        // Check if this vertex faces water 
        // We need to check the two adjacent directions to see if at least one is water
        const dir1 = direction;
        const dir2 = (direction + 5) % 6; // Previous direction (counterclockwise)
        
        const neighborPos1 = getNeighborPositions(q, r)[dir1];
        const neighborPos2 = getNeighborPositions(q, r)[dir2];
        
        const facesWater = !isPositionOccupied(neighborPos1.q, neighborPos1.r) || 
                            !isPositionOccupied(neighborPos2.q, neighborPos2.r);
        
        if (facesWater) {
          // Calculate ship position (in the water)
          // It should be positioned in the direction between the two water-facing sides
          const shipAngle = ((dir1 + dir2) / 2 * 60) * Math.PI / 180;
          const shipDistance = distance * 1.5;
          const shipX = x + shipDistance * Math.cos(shipAngle);
          const shipY = y + shipDistance * Math.sin(shipAngle);
          
          // Find the two vertices this port connects
          // In Catan, a port connects two adjacent vertices
          const nextVertex = (direction + 1) % 6;
          const nextAngle = (nextVertex * 60) * Math.PI / 180;
          const nextVertexX = x + distance * Math.cos(nextAngle);
          const nextVertexY = y + distance * Math.sin(nextAngle);
          
          return {
            q, 
            r,
            direction,
            x: vertexX,
            y: vertexY,
            shipX,
            shipY,
            vertices: [
              { 
                q, r, direction,
                x: vertexX, y: vertexY 
              },
              { 
                q, r, direction: nextVertex,
                x: nextVertexX, y: nextVertexY 
              }
            ]
          };
        }
        return null;
      }).filter(Boolean);
    });
    
    // 3. Find the closest vertex to the mouse position
    let closestVertex = null;
    let minDistance = Number.MAX_VALUE;
    
    coastalVertices.forEach(vertex => {
      if (!vertex) return;
      
      // Calculate distance to the vertex position
      const dist = Math.sqrt(Math.pow(mouseX - vertex.x, 2) + Math.pow(mouseY - vertex.y, 2));
      
      if (dist < minDistance) {
        minDistance = dist;
        closestVertex = vertex;
      }
    });
    
    // 4. Update the port position
    if (closestVertex) {
      setEditingPort(prev => {
        if (!prev) return null;
        return {
          ...prev,
          coordinates: { 
            q: closestVertex!.q, 
            r: closestVertex!.r, 
            s: -closestVertex!.q - closestVertex!.r 
          },
          direction: closestVertex!.direction,
          vertexIndices: [closestVertex!.direction, (closestVertex!.direction + 1) % 6]
        };
      });
    }
  };

  // Function to end port dragging
  const handlePortDragEnd = () => {
    if (!editingPort?.isDragging) return;
    
    // Update the port in the list with new coordinates
    if (selectedPort) {
      setEditablePorts(prevPorts => 
        prevPorts.map(port => {
          if (port.id === selectedPort && editingPort) {
            // Calculate vertices based on new coordinates and direction
            const vertices = getPortVertices(editingPort.coordinates, editingPort.direction);
            
            return { 
              ...port, 
              coordinates: { ...editingPort.coordinates },
              vertices
            };
          }
          return port;
        })
      );
    }
    
    // Clear dragging state
    setEditingPort(prev => prev ? { ...prev, isDragging: false } : null);
  };

  // Function to update port type
  const handlePortTypeChange = (type: PortTypeEnum) => {
    if (editingPort) {
      setEditingPort({ ...editingPort, type });
    }
  };

  // Function to update port direction
  const handlePortDirectionChange = (direction: number) => {
    if (editingPort) {
      setEditingPort({ ...editingPort, direction });
    }
  };

  // Function to save port changes
  const handleSavePort = () => {
    if (selectedPort && editingPort) {
      // Calculate vertices based on coordinates and direction
      const vertices = getPortVertices(editingPort.coordinates, editingPort.direction);
      
      setEditablePorts(prevPorts => 
        prevPorts.map(port => 
          port.id === selectedPort 
            ? { 
                ...port, 
                type: editingPort.type, 
                coordinates: editingPort.coordinates, 
                direction: editingPort.direction,
                vertices
              } 
            : port
        )
      );
      
      setSelectedPort(null);
      setEditingPort(null);
    }
  };

  // Function to cancel port editing
  const handleCancelPortEdit = () => {
    setSelectedPort(null);
    setEditingPort(null);
  };

  // Function to add a new port
  const handleAddPort = () => {
    // Find a valid edge on the board
    const boardEdges = placedTiles.flatMap(tile => {
      return Array.from({ length: 6 }, (_, i) => ({
        coordinates: { q: tile.q, r: tile.r, s: -tile.q - tile.r },
        direction: i
      }));
    });
    
    // Filter out edges that already have ports
    const usedEdges = editablePorts.map(port => 
      `${port.coordinates.q},${port.coordinates.r},${port.direction}`
    );
    
    const availableEdges = boardEdges.filter(edge => 
      !usedEdges.includes(`${edge.coordinates.q},${edge.coordinates.r},${edge.direction}`)
    );
    
    if (availableEdges.length > 0) {
      // Pick a random available edge
      const randomEdge = availableEdges[Math.floor(Math.random() * availableEdges.length)];
      
      // Calculate vertices
      const vertices = getPortVertices(randomEdge.coordinates, randomEdge.direction);
      
      // Create a new port
      const newPort: PortType = {
        id: `port-${Date.now()}`,
        type: PortTypeEnum.Generic,
        coordinates: randomEdge.coordinates,
        direction: randomEdge.direction,
        vertices
      };
      
      setEditablePorts(prevPorts => [...prevPorts, newPort]);
      setSelectedPort(newPort.id);
      setEditingPort({
        type: newPort.type,
        coordinates: { ...newPort.coordinates },
        direction: newPort.direction
      });
    }
  };

  // Function to delete a port
  const handleDeletePort = (portId: string) => {
    setEditablePorts(prevPorts => prevPorts.filter(port => port.id !== portId));
    if (selectedPort === portId) {
      setSelectedPort(null);
      setEditingPort(null);
    }
  };

  // Helper function to get port vertices
  const getPortVertices = (hexCoords: HexCoordinates, direction: number) => {
    // Calculate the two vertices at the endpoints of the specified edge
    const { q, r } = hexCoords;
    
    // For vertex 1: use the current direction
    const vertex1 = {
      q, 
      r, 
      s: -q - r,
      direction
    };
    
    // For vertex 2: use the next direction (clockwise)
    const vertex2 = {
      q,
      r,
      s: -q - r,
      direction: (direction + 1) % 6
    };
    
    return [vertex1, vertex2];
  };

  // Render port visuals and controls
  const renderPortDirections = () => {
    if (!showPortDirections || activeEditMode !== EditModeType.PORTS) return null;

    return editablePorts.map(port => {
      const { q, r } = port.coordinates;
      const { x, y } = gridToPixel(q, r);
      const isSelected = port.id === selectedPort;
      const isDragging = editingPort?.isDragging && port.id === selectedPort;
      
      // If this port is being dragged, use the editing port coordinates and direction
      const displayCoords = isDragging && editingPort 
        ? editingPort.coordinates 
        : port.coordinates;
      
      const displayDirection = isDragging && editingPort
        ? editingPort.direction
        : port.direction;
      
      const displayPos = gridToPixel(displayCoords.q, displayCoords.r);
      
      // Calculate the positions of the two vertices that connect to this port
      const vertices = getPortVertices(displayCoords, displayDirection);
      
      // Convert vertex coordinates to pixel positions
      const vertexPositions = vertices.map(v => {
        const hexPos = gridToPixel(v.q, v.r);
        const angle = (v.direction * 60) * Math.PI / 180;
        const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half hex size
        
        return {
          x: hexPos.x + distance * Math.cos(angle),
          y: hexPos.y + distance * Math.sin(angle)
        };
      });
      
      // Calculate the ship position (in water)
      // It should be positioned outward from the two vertices
      const vertex1Angle = (displayDirection * 60) * Math.PI / 180;
      const vertex2Angle = ((displayDirection + 1) % 6 * 60) * Math.PI / 180;
      const middleAngle = (vertex1Angle + vertex2Angle) / 2;
      const distance = Math.min(tileWidth, tileHeight) * 0.75;
      
      const shipX = displayPos.x + distance * Math.cos(middleAngle);
      const shipY = displayPos.y + distance * Math.sin(middleAngle);
      
      // Determine port color based on type
      const portColor = 
        port.type === PortTypeEnum.Generic ? '#888888' :
        port.type === PortTypeEnum.Brick ? '#cc3333' :
        port.type === PortTypeEnum.Wood ? '#009900' :
        port.type === PortTypeEnum.Sheep ? '#99cc00' :
        port.type === PortTypeEnum.Wheat ? '#ffcc00' : 
        port.type === PortTypeEnum.Ore ? '#666666' : '#888888';

  return (
        <React.Fragment key={`port-${port.id}`}>
          {/* Port ship icon */}
          <div
            className={`absolute flex items-center justify-center ${isSelected ? 'z-11' : 'z-10'}`}
            style={{
              left: `${shipX}px`,
              top: `${shipY}px`,
              transform: 'translate(-50%, -50%)',
              cursor: 'move',
            }}
            onMouseDown={(e) => handlePortDragStart(e, port.id)}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectPort(port.id);
            }}
          >
            {/* Simple ship icon */}
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isSelected ? 'ring-2 ring-yellow-400' : ''
              }`}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${portColor}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <div 
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: portColor }}
              />
            </div>
          </div>
          
          {/* Trading ratio label */}
          <div
            className="absolute bg-white text-xs font-bold rounded-full flex items-center justify-center"
            style={{
              width: '20px',
              height: '20px',
              left: `${shipX}px`,
              top: `${shipY - 16}px`,
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${portColor}`,
              zIndex: 9
            }}
          >
            {port.type === PortTypeEnum.Generic ? '3:1' : '2:1'}
          </div>
          
          {/* Vertex indicators (only when selected) */}
          {isSelected && vertexPositions.map((pos, idx) => (
            <div
              key={`vertex-${port.id}-${idx}`}
              className="absolute rounded-full bg-yellow-300 border-2 border-yellow-500"
              style={{
                width: '12px',
                height: '12px',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 8
              }}
            />
          ))}
          
          {/* Connection line from ship to vertices (only when selected) */}
          {isSelected && (
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 7 }}
            >
              <line
                x1={vertexPositions[0].x}
                y1={vertexPositions[0].y}
                x2={shipX}
                y2={shipY}
                stroke="#FBBF24"
                strokeWidth="2"
                strokeDasharray="3"
              />
              <line
                x1={vertexPositions[1].x}
                y1={vertexPositions[1].y}
                x2={shipX}
                y2={shipY}
                stroke="#FBBF24"
                strokeWidth="2"
                strokeDasharray="3"
              />
              <line
                x1={vertexPositions[0].x}
                y1={vertexPositions[0].y}
                x2={vertexPositions[1].x}
                y2={vertexPositions[1].y}
                stroke="#FBBF24"
                strokeWidth="2"
                strokeDasharray="3"
              />
            </svg>
          )}
        </React.Fragment>
      );
    });
  };

  // Remove the old port drag handles function as we've integrated it into renderPortDirections
  const renderPortDragHandles = () => null;

  // Function to select a structure for editing
  const handleSelectStructure = (structureId: string) => {
    setSelectedStructure(structureId);
    const structure = editableStructures.find(s => s.id === structureId);
    if (structure && (structure.type === StructureType.Settlement || structure.type === StructureType.City)) {
      setEditingSettlement({
        id: structure.id,
        type: structure.type as StructureType.Settlement | StructureType.City,
        playerId: structure.playerId,
        coordinates: structure.coordinates as VertexCoordinates
      });
    }
  };

  // Function to update settlement type
  const handleSettlementTypeChange = (type: StructureType.Settlement | StructureType.City) => {
    if (editingSettlement) {
      setEditingSettlement({ ...editingSettlement, type });
    }
  };

  // Function to update settlement player
  const handleSettlementPlayerChange = (playerId: number) => {
    if (editingSettlement) {
      setEditingSettlement({ ...editingSettlement, playerId });
    }
    setSelectedPlayerId(playerId);
  };

  // Function to save settlement changes
  const handleSaveSettlement = () => {
    if (selectedStructure && editingSettlement) {
      setEditableStructures(prevStructures => 
        prevStructures.map(structure => 
          structure.id === selectedStructure 
            ? { 
                ...structure, 
                type: editingSettlement.type, 
                playerId: editingSettlement.playerId, 
                coordinates: editingSettlement.coordinates
              } 
            : structure
        )
      );
      
      setSelectedStructure(null);
      setEditingSettlement(null);
    }
  };

  // Function to cancel settlement editing
  const handleCancelSettlementEdit = () => {
    setSelectedStructure(null);
    setEditingSettlement(null);
  };

  // Function to add a new settlement
  const handleAddSettlement = () => {
    if (hoveredVertex) {
      // Create a new settlement
      const newSettlement: Structure = {
        id: `settlement-${Date.now()}`,
        type: StructureType.Settlement,
        playerId: selectedPlayerId,
        coordinates: hoveredVertex
      };
      
      setEditableStructures(prevStructures => [...prevStructures, newSettlement]);
      setSelectedStructure(newSettlement.id);
      setEditingSettlement({
        id: newSettlement.id,
        type: StructureType.Settlement,
        playerId: selectedPlayerId,
        coordinates: hoveredVertex
      });
      setHoveredVertex(null);
    }
  };

  // Function to delete a structure
  const handleDeleteStructure = (structureId: string) => {
    setEditableStructures(prevStructures => prevStructures.filter(structure => structure.id !== structureId));
    if (selectedStructure === structureId) {
      setSelectedStructure(null);
      setEditingSettlement(null);
    }
  };

  // Function to handle vertex hover
  const handleVertexHover = (vertex: VertexCoordinates | null) => {
    setHoveredVertex(vertex);
  };

  // Generate all possible vertex points for the board
  const generateVertexPoints = () => {
    const vertices: VertexCoordinates[] = [];
    
    // For each tile, generate 6 vertices
    placedTiles.forEach(tile => {
      for (let direction = 0; direction < 6; direction++) {
        vertices.push({
          q: tile.q,
          r: tile.r,
          s: -tile.q - tile.r,
          direction
        });
      }
    });
    
    // Remove duplicates (vertices are shared between tiles)
    return vertices.filter((vertex, index, self) => 
      index === self.findIndex(v => 
        v.q === vertex.q && 
        v.r === vertex.r && 
        v.s === vertex.s && 
        v.direction === vertex.direction
      )
    );
  };

  // Render vertex points for settlement placement
  const renderVertexPoints = () => {
    if (!showVertexPoints || activeEditMode !== EditModeType.SETTLEMENTS) return null;

    const vertices = generateVertexPoints();
    
    return vertices.map(vertex => {
      const { q, r } = vertex;
      const { x, y } = gridToPixel(q, r);
      
      // Calculate the position of the vertex
      const angle = (vertex.direction * 60) * Math.PI / 180;
      const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half the hex size
      const vertexX = x + distance * Math.cos(angle);
      const vertexY = y + distance * Math.sin(angle);
      
      // Check if this vertex already has a settlement
      const hasSettlement = editableStructures.some(s => 
        (s.type === StructureType.Settlement || s.type === StructureType.City) &&
        isVertexEqual(s.coordinates as VertexCoordinates, vertex)
      );
      
      // Skip rendering if already has a settlement
      if (hasSettlement) return null;
      
      // Check if this is the hovered vertex
      const isHovered = hoveredVertex && isVertexEqual(hoveredVertex, vertex);
      
      return (
        <div
          key={`vertex-${q}-${r}-${vertex.direction}`}
          className={`absolute rounded-full ${
            isHovered ? 'bg-green-500' : 'bg-gray-400 opacity-50 hover:opacity-100'
          }`}
          style={{
            width: '12px',
            height: '12px',
            left: `${vertexX}px`,
            top: `${vertexY}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 6,
            cursor: 'pointer'
          }}
          onMouseEnter={() => handleVertexHover(vertex)}
          onMouseLeave={() => handleVertexHover(null)}
          onClick={handleAddSettlement}
        />
      );
    });
  };

  // Render existing settlements
  const renderSettlements = () => {
    if (activeEditMode !== EditModeType.SETTLEMENTS && !isEditMode) return null;

    const structuresToRender = isEditMode ? editableStructures : structures;
    
    return structuresToRender
      .filter(s => s.type === StructureType.Settlement || s.type === StructureType.City)
      .map(structure => {
        const coords = structure.coordinates as VertexCoordinates;
        const { q, r } = coords;
        const { x, y } = gridToPixel(q, r);
        
        // Calculate the position of the vertex
        const angle = (coords.direction * 60) * Math.PI / 180;
        const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half the hex size
        const vertexX = x + distance * Math.cos(angle);
        const vertexY = y + distance * Math.sin(angle);
        
        const isSelected = structure.id === selectedStructure;
        const isSettlement = structure.type === StructureType.Settlement;
        
        // Player colors
        const playerColors = ['red', 'blue', 'white', 'orange', 'green', 'purple'];
        const color = playerColors[structure.playerId % playerColors.length];
        
        return (
          <div
            key={`structure-${structure.id}`}
            className={`absolute ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
            style={{
              left: `${vertexX}px`,
              top: `${vertexY}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 7,
              cursor: isEditMode ? 'pointer' : 'default'
            }}
            onClick={() => isEditMode && handleSelectStructure(structure.id)}
          >
            {isSettlement ? (
              // Settlement (house)
              <div 
                className="w-4 h-4 transform rotate-45"
                style={{ 
                  backgroundColor: color,
                  border: '1px solid black'
                }}
              />
            ) : (
              // City (larger building)
              <div className="relative">
                <div 
                  className="w-5 h-5"
                  style={{ 
                    backgroundColor: color,
                    border: '1px solid black'
                  }}
                />
                <div 
                  className="absolute top-0 right-0 w-3 h-3 transform translate-x-1 -translate-y-1"
                  style={{ 
                    backgroundColor: color,
                    border: '1px solid black'
                  }}
                />
              </div>
            )}
          </div>
        );
      });
  };

  // Helper function to check if two vertices are equal
  const isVertexEqual = (v1: VertexCoordinates, v2: VertexCoordinates) => {
    return v1.q === v2.q && 
           v1.r === v2.r && 
           v1.s === v2.s && 
           v1.direction === v2.direction;
  };

  // Function to handle edge hover
  const handleEdgeHover = (edge: EdgeCoordinates | null) => {
    setHoveredEdge(edge);
  };

  // Function to add a new road
  const handleAddRoad = () => {
    if (hoveredEdge) {
      // Create a new road
      const newRoad: Structure = {
        id: `road-${Date.now()}`,
        type: StructureType.Road,
        playerId: selectedPlayerId,
        coordinates: hoveredEdge
      };
      
      setEditableStructures(prevStructures => [...prevStructures, newRoad]);
      setSelectedStructure(newRoad.id);
      setEditingRoad({
        id: newRoad.id,
        type: StructureType.Road,
        playerId: selectedPlayerId,
        coordinates: hoveredEdge
      });
      setHoveredEdge(null);
    }
  };

  // Function to select a road for editing
  const handleSelectRoad = (roadId: string) => {
    setSelectedStructure(roadId);
    const road = editableStructures.find(s => s.id === roadId);
    if (road && road.type === StructureType.Road) {
      setEditingRoad({
        id: road.id,
        type: StructureType.Road,
        playerId: road.playerId,
        coordinates: road.coordinates as EdgeCoordinates
      });
    }
  };

  // Function to update road player
  const handleRoadPlayerChange = (playerId: number) => {
    if (editingRoad) {
      setEditingRoad({ ...editingRoad, playerId });
    }
    setSelectedPlayerId(playerId);
  };

  // Function to save road changes
  const handleSaveRoad = () => {
    if (selectedStructure && editingRoad) {
      setEditableStructures(prevStructures => 
        prevStructures.map(structure => 
          structure.id === selectedStructure 
            ? { 
                ...structure, 
                playerId: editingRoad.playerId, 
                coordinates: editingRoad.coordinates
              } 
            : structure
        )
      );
      
      setSelectedStructure(null);
      setEditingRoad(null);
    }
  };

  // Function to cancel road editing
  const handleCancelRoadEdit = () => {
    setSelectedStructure(null);
    setEditingRoad(null);
  };

  // Generate all possible edge points for the board
  const generateEdgePoints = () => {
    const edges: EdgeCoordinates[] = [];
    
    // For each tile, generate 6 edges
    placedTiles.forEach(tile => {
      for (let direction = 0; direction < 6; direction++) {
        edges.push({
          q: tile.q,
          r: tile.r,
          s: -tile.q - tile.r,
          direction
        });
      }
    });
    
    // Remove duplicates (edges are shared between tiles)
    return edges.filter((edge, index, self) => 
      index === self.findIndex(e => 
        e.q === edge.q && 
        e.r === edge.r && 
        e.s === edge.s && 
        e.direction === edge.direction
      )
    );
  };

  // Render edge points for road placement
  const renderEdgePoints = () => {
    if (!showEdgePoints || activeEditMode !== EditModeType.ROADS) return null;

    const edges = generateEdgePoints();
    
    return edges.map(edge => {
      const { q, r } = edge;
      const { x, y } = gridToPixel(q, r);
      
      // Calculate the position of the edge midpoint
      const startAngle = (edge.direction * 60) * Math.PI / 180;
      const endAngle = ((edge.direction + 1) % 6 * 60) * Math.PI / 180;
      
      const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half the hex size
      
      const startX = x + distance * Math.cos(startAngle);
      const startY = y + distance * Math.sin(startAngle);
      
      const endX = x + distance * Math.cos(endAngle);
      const endY = y + distance * Math.sin(endAngle);
      
      const edgeX = (startX + endX) / 2;
      const edgeY = (startY + endY) / 2;
      
      // Check if this edge already has a road
      const hasRoad = editableStructures.some(s => 
        s.type === StructureType.Road &&
        isEdgeEqual(s.coordinates as EdgeCoordinates, edge)
      );
      
      // Skip rendering if already has a road
      if (hasRoad) return null;
      
      // Check if this is the hovered edge
      const isHovered = hoveredEdge && isEdgeEqual(hoveredEdge, edge);
      
      return (
        <div
          key={`edge-${q}-${r}-${edge.direction}`}
          className={`absolute rounded-full ${
            isHovered ? 'bg-green-500' : 'bg-gray-400 opacity-50 hover:opacity-100'
          }`}
          style={{
            width: '12px',
            height: '12px',
            left: `${edgeX}px`,
            top: `${edgeY}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 6,
            cursor: 'pointer'
          }}
          onMouseEnter={() => handleEdgeHover(edge)}
          onMouseLeave={() => handleEdgeHover(null)}
          onClick={handleAddRoad}
        />
      );
    });
  };

  // Render existing roads
  const renderRoads = () => {
    if (activeEditMode !== EditModeType.ROADS && !isEditMode) return null;

    const structuresToRender = isEditMode ? editableStructures : structures;
    
    return structuresToRender
      .filter(s => s.type === StructureType.Road)
      .map(structure => {
        const coords = structure.coordinates as EdgeCoordinates;
        const { q, r } = coords;
        const { x, y } = gridToPixel(q, r);
        
        // Calculate the position of the edge endpoints
        const startAngle = (coords.direction * 60) * Math.PI / 180;
        const endAngle = ((coords.direction + 1) % 6 * 60) * Math.PI / 180;
        
        const distance = Math.min(tileWidth, tileHeight) * 0.5; // Half the hex size
        
        const startX = x + distance * Math.cos(startAngle);
        const startY = y + distance * Math.sin(startAngle);
        
        const endX = x + distance * Math.cos(endAngle);
        const endY = y + distance * Math.sin(endAngle);
        
        const isSelected = structure.id === selectedStructure;
        
        // Player colors
        const playerColors = ['red', 'blue', 'white', 'orange', 'green', 'purple'];
        const color = playerColors[structure.playerId % playerColors.length];
        
        return (
          <div
            key={`road-${structure.id}`}
            className={`absolute ${isSelected ? 'z-8' : 'z-7'}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              cursor: isEditMode ? 'pointer' : 'default'
            }}
            onClick={() => isEditMode && activeEditMode === EditModeType.ROADS && handleSelectRoad(structure.id)}
          >
            <svg
              width={tileWidth}
              height={tileHeight}
              viewBox={`0 0 ${tileWidth} ${tileHeight}`}
              style={{ 
                position: 'absolute', 
                top: `-${tileHeight/2}px`, 
                left: `-${tileWidth/2}px`,
                pointerEvents: 'none'
              }}
            >
              <line
                x1={startX - x + tileWidth/2}
                y1={startY - y + tileHeight/2}
                x2={endX - x + tileWidth/2}
                y2={endY - y + tileHeight/2}
                stroke={color}
                strokeWidth={isSelected ? "8" : "6"}
                strokeLinecap="round"
                className={isSelected ? 'stroke-2 stroke-yellow-400' : ''}
              />
            </svg>
          </div>
        );
      });
  };

  // Helper function to check if two edges are equal
  const isEdgeEqual = (e1: EdgeCoordinates, e2: EdgeCoordinates) => {
    return e1.q === e2.q && 
           e1.r === e2.r && 
           e1.s === e2.s && 
           e1.direction === e2.direction;
  };

  // Add global mouse move and up listeners for port dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (editingPort?.isDragging) {
        handlePortDrag(e as unknown as React.MouseEvent);
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (editingPort?.isDragging) {
        handlePortDragEnd();
      }
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [editingPort]);

  return (
    <div className={`relative w-full h-full ${isEditMode ? '' : 'user-select-none'}`}>
      {/* Water background for island effect */}
      {showWaterBorder && (
        <div className="absolute inset-0 bg-blue-400">
          <div className="absolute inset-0 opacity-30">
            {/* Water texture pattern */}
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="water-pattern" patternUnits="userSpaceOnUse" width="100" height="100">
                  <path d="M0 25C20 25 20 75 40 75C60 75 60 25 80 25C100 25 100 75 120 75" 
                        fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
                  <path d="M-20 50C0 50 0 100 20 100C40 100 40 50 60 50C80 50 80 100 100 100" 
                        fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#water-pattern)" />
            </svg>
          </div>
        </div>
      )}

      {/* Main grid container */}
      <div 
        ref={gridRef}
        className="relative w-full h-full user-select-none"
        style={{ 
          backgroundColor: isEditMode ? 'rgba(200, 200, 200, 0.2)' : 'transparent',
          overflow: 'hidden'
        }}
        onMouseMove={isEditMode ? handleMouseMove : undefined}
        onMouseUp={isEditMode ? handleMouseUp : undefined}
      >
        {/* Render grid lines */}
        {renderGridLines()}

        {/* Render snap points */}
        {renderSnapPoints()}

        {/* Render placed tiles */}
        {placedTiles.map(({ tileIndex, q, r }) => {
          const tile = tiles[tileIndex];
          const { x, y } = gridToPixel(q, r);
          
          return (
            <div
              key={`placed-${tileIndex}-${q}-${r}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}px`, top: `${y}px` }}
              onMouseDown={(e) => isEditMode && handleMouseDown(e, tileIndex)}
            >
              <HexTile
                resource={tile.resource}
                tokenNumber={tile.tokenNumber}
                width={tileWidth}
                height={tileHeight}
                onClick={() => !isEditMode && onTileClick && onTileClick(tile)}
                hasRobber={tile.hasRobber}
              />
            </div>
          );
        })}
        
        {/* Render ports */}
        {showWaterBorder && (
          <svg className="absolute inset-0 pointer-events-none">
            {(isEditMode && activeEditMode === EditModeType.PORTS ? editablePorts : ports).map(port => {
              // Convert port coordinates to pixel position
              const { q, r } = port.coordinates;
              const hexSize = Math.min(tileWidth, tileHeight) / 2;
              
              return (
                <Port 
                  key={port.id} 
                  port={port} 
                  hexSize={hexSize} 
                />
              );
            })}
          </svg>
        )}

        {/* Render port direction indicators in edit mode */}
        {isEditMode && renderPortDirections()}

        {/* Render vertex points for settlement placement */}
        {isEditMode && renderVertexPoints()}

        {/* Render edge points for road placement */}
        {isEditMode && renderEdgePoints()}

        {/* Render existing settlements */}
        {renderSettlements()}

        {/* Render existing roads */}
        {renderRoads()}
      </div>

      {/* Edit mode controls */}
      {isEditMode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <h3 className="text-lg font-bold mb-3 border-b pb-2">Board Editor</h3>
          
          {/* Edit mode selector */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Edit Mode:</div>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  activeEditMode === EditModeType.TILES 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleEditModeChange(EditModeType.TILES)}
              >
                Hex Tiles
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  activeEditMode === EditModeType.PORTS 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleEditModeChange(EditModeType.PORTS)}
              >
                Ports
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  activeEditMode === EditModeType.SETTLEMENTS 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleEditModeChange(EditModeType.SETTLEMENTS)}
              >
                Settlements
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  activeEditMode === EditModeType.ROADS 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleEditModeChange(EditModeType.ROADS)}
              >
                Roads
              </button>
            </div>
          </div>
          
          {/* Tile editing controls - only show when in TILES mode */}
          {activeEditMode === EditModeType.TILES && (
            <div className="flex flex-col gap-4">
              {/* Presets row */}
              <div className="flex flex-wrap gap-2 mb-1">
                <button 
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => applyPreset('tight')}
                >
                  Tight
                </button>
                <button 
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => applyPreset('standard')}
                >
                  Standard
                </button>
                <button 
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => applyPreset('spacious')}
                >
                  Spacious
                </button>
                <button 
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => applyPreset('perfectHex')}
                >
                  Perfect Hex
                </button>
                <button 
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                  onClick={() => applyPreset('custom1')}
                >
                  Custom 1
                </button>
              </div>
              
              {/* Sliders section */}
              <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                  <div className="w-24 text-sm font-medium">Tile Width:</div>
                <input 
                  type="range" 
                  min="40" 
                  max="200" 
                  step="1" 
                  value={tileWidth} 
                  onChange={handleTileWidthChange}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="40"
                  max="200"
                  step="1"
                  value={tileWidth}
                  onChange={handleTileWidthInput}
                    className="w-16 text-right px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="w-24 text-sm font-medium">Tile Height:</div>
                <input 
                  type="range" 
                  min="40" 
                  max="200" 
                  step="1" 
                  value={tileHeight} 
                  onChange={handleTileHeightChange}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="40"
                  max="200"
                  step="1"
                  value={tileHeight}
                  onChange={handleTileHeightInput}
                    className="w-16 text-right px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="w-24 text-sm font-medium">H-Spacing:</div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.01" 
                  value={xSpacing} 
                  onChange={handleXSpacingChange}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.01"
                  value={xSpacing}
                  onChange={handleXSpacingInput}
                    className="w-16 text-right px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="w-24 text-sm font-medium">V-Spacing:</div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.01" 
                  value={ySpacing} 
                  onChange={handleYSpacingChange}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.01"
                  value={ySpacing}
                  onChange={handleYSpacingInput}
                    className="w-16 text-right px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="w-24 text-sm font-medium">Snap:</div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="2.0" 
                  step="0.01" 
                  value={snapThreshold} 
                  onChange={handleSnapThresholdChange}
                    className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.01"
                  value={snapThreshold}
                  onChange={handleSnapThresholdInput}
                    className="w-16 text-right px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
              {/* Reset button */}
              <div className="mt-2 flex justify-end">
                <button 
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                  onClick={resetToDefaults}
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
          
          {/* Port editing controls - show when in PORTS mode */}
          {activeEditMode === EditModeType.PORTS && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Port Editor</h4>
                <button 
                  className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                  onClick={handleAddPort}
                >
                  Add New Port
                </button>
              </div>
              
              {/* Port list */}
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                {editablePorts.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No ports available</div>
                ) : (
                  <div className="space-y-1">
                    {editablePorts.map(port => (
                      <div 
                        key={port.id}
                        className={`flex justify-between items-center p-1.5 rounded text-sm cursor-pointer ${
                          selectedPort === port.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectPort(port.id)}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: port.type === PortTypeEnum.Generic ? '#888888' : 
                              port.type === PortTypeEnum.Brick ? '#cc3333' :
                              port.type === PortTypeEnum.Wood ? '#009900' :
                              port.type === PortTypeEnum.Sheep ? '#99cc00' :
                              port.type === PortTypeEnum.Wheat ? '#ffcc00' : '#666666'
                            }}
                          />
                          <span>
                            {port.type === PortTypeEnum.Generic ? '3:1 Port' : `2:1 ${port.type} Port`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            ({port.coordinates.q}, {port.coordinates.r})
                          </span>
                <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePort(port.id);
                            }}
                          >
                            ×
                </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Port editing form */}
              {selectedPort && editingPort && (
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-2">Edit Port</h4>
                  
                  {/* Port type selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">Port Type:</label>
                    <select
                      className="w-full p-1.5 border rounded text-sm"
                      value={editingPort.type}
                      onChange={(e) => handlePortTypeChange(e.target.value as PortTypeEnum)}
                    >
                      <option value={PortTypeEnum.Generic}>Generic (3:1)</option>
                      <option value={PortTypeEnum.Brick}>Brick (2:1)</option>
                      <option value={PortTypeEnum.Wood}>Wood (2:1)</option>
                      <option value={PortTypeEnum.Sheep}>Sheep (2:1)</option>
                      <option value={PortTypeEnum.Wheat}>Wheat (2:1)</option>
                      <option value={PortTypeEnum.Ore}>Ore (2:1)</option>
                    </select>
                  </div>
                  
                  {/* Port position information */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">Position:</label>
                    <div className="flex items-center space-x-2 text-sm bg-gray-100 p-2 rounded">
                      <span>Coastline Hex: ({editingPort.coordinates.q}, {editingPort.coordinates.r})</span>
                      <span>Direction: {editingPort.direction}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag the port icon to position along any coastline. The port connects to the two yellow settlement spots.
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2">
                <button 
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      onClick={handleCancelPortEdit}
                >
                      Cancel
                </button>
                <button 
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      onClick={handleSavePort}
                >
                      Save
                </button>
              </div>
                </div>
              )}
              
              {/* Port display options */}
              <div className="mt-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showPortDirections}
                    onChange={() => setShowPortDirections(!showPortDirections)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Show Port Direction Indicators</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Settlement editing controls - show when in SETTLEMENTS mode */}
          {activeEditMode === EditModeType.SETTLEMENTS && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Settlement Editor</h4>
                <div className="text-xs text-gray-600">Click on vertex points to place settlements</div>
              </div>
              
              {/* Player selector */}
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">Current Player:</label>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3].map(playerId => (
              <button 
                      key={`player-${playerId}`}
                      className={`flex-1 py-1 text-sm font-medium rounded ${
                        selectedPlayerId === playerId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => handleSettlementPlayerChange(playerId)}
                    >
                      P{playerId + 1}
              </button>
                  ))}
                </div>
            </div>

              {/* Structure list */}
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                {editableStructures.filter(s => 
                  s.type === StructureType.Settlement || s.type === StructureType.City
                ).length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No settlements or cities</div>
                ) : (
                  <div className="space-y-1">
                    {editableStructures
                      .filter(s => s.type === StructureType.Settlement || s.type === StructureType.City)
                      .map(structure => (
                        <div 
                          key={structure.id}
                          className={`flex justify-between items-center p-1.5 rounded text-sm cursor-pointer ${
                            selectedStructure === structure.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleSelectStructure(structure.id)}
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ 
                                backgroundColor: ['red', 'blue', 'white', 'orange'][structure.playerId % 4]
                              }}
                            />
                            <span>
                              {structure.type === StructureType.Settlement ? 'Settlement' : 'City'} (P{structure.playerId + 1})
                            </span>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStructure(structure.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              {/* Settlement editing form */}
              {selectedStructure && editingSettlement && (
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-2">Edit Structure</h4>
                  
                  {/* Structure type selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">Structure Type:</label>
                    <div className="flex space-x-2">
                      <button
                        className={`flex-1 py-1 text-sm font-medium rounded ${
                          editingSettlement.type === StructureType.Settlement
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => handleSettlementTypeChange(StructureType.Settlement)}
                      >
                        Settlement
                      </button>
                      <button
                        className={`flex-1 py-1 text-sm font-medium rounded ${
                          editingSettlement.type === StructureType.City
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => handleSettlementTypeChange(StructureType.City)}
                      >
                        City
                      </button>
                    </div>
                  </div>
                  
                  {/* Player selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">Player:</label>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3].map(playerId => (
                        <button
                          key={`edit-player-${playerId}`}
                          className={`flex-1 py-1 text-sm font-medium rounded ${
                            editingSettlement.playerId === playerId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          onClick={() => handleSettlementPlayerChange(playerId)}
                        >
                          P{playerId + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      onClick={handleCancelSettlementEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      onClick={handleSaveSettlement}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
              
              {/* Settlement display options */}
              <div className="mt-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showVertexPoints}
                    onChange={() => setShowVertexPoints(!showVertexPoints)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Show Vertex Points</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Road editing controls - show when in ROADS mode */}
          {activeEditMode === EditModeType.ROADS && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Road Editor</h4>
                <div className="text-xs text-gray-600">Click on edge points to place roads</div>
              </div>
              
              {/* Player selector */}
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">Current Player:</label>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3].map(playerId => (
                    <button
                      key={`road-player-${playerId}`}
                      className={`flex-1 py-1 text-sm font-medium rounded ${
                        selectedPlayerId === playerId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => handleRoadPlayerChange(playerId)}
                    >
                      P{playerId + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Road list */}
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                {editableStructures.filter(s => s.type === StructureType.Road).length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No roads</div>
                ) : (
                  <div className="space-y-1">
                    {editableStructures
                      .filter(s => s.type === StructureType.Road)
                      .map(structure => (
                        <div 
                          key={structure.id}
                          className={`flex justify-between items-center p-1.5 rounded text-sm cursor-pointer ${
                            selectedStructure === structure.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleSelectRoad(structure.id)}
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ 
                                backgroundColor: ['red', 'blue', 'white', 'orange'][structure.playerId % 4]
                              }}
                            />
                            <span>
                              Road (P{structure.playerId + 1})
                            </span>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStructure(structure.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              {/* Road editing form */}
              {selectedStructure && editingRoad && (
                <div className="border rounded p-3 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-2">Edit Road</h4>
                  
                  {/* Player selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">Player:</label>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3].map(playerId => (
                        <button
                          key={`edit-road-player-${playerId}`}
                          className={`flex-1 py-1 text-sm font-medium rounded ${
                            editingRoad.playerId === playerId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          onClick={() => handleRoadPlayerChange(playerId)}
                        >
                          P{playerId + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      onClick={handleCancelRoadEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      onClick={handleSaveRoad}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
              
              {/* Road display options */}
              <div className="mt-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showEdgePoints}
                    onChange={() => setShowEdgePoints(!showEdgePoints)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span>Show Edge Points</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Options section - always visible */}
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t">
            {/* Water border toggle */}
            <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showWaterBorder}
                  onChange={() => setShowWaterBorder(!showWaterBorder)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                />
                <span>Show Water Border</span>
              </label>
            
            {/* Grid lines toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showGridLines}
                onChange={toggleGridLines}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span>Show Grid Lines</span>
            </label>
          </div>
        </div>
      )}

      {/* Coordinate output (only in edit mode and when editing tiles) */}
      {isEditMode && activeEditMode === EditModeType.TILES && (
        <div className="fixed bottom-16 left-0 right-0 bg-white shadow-lg p-3 z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold mb-1">Board Layout Coordinates:</h3>
            <textarea
              className="w-full h-24 p-2 font-mono text-xs border rounded-md"
              value={coordinateOutput}
              readOnly
            />
          </div>
        </div>
      )}
      
      {/* Port output (only in edit mode and when editing ports) */}
      {isEditMode && activeEditMode === EditModeType.PORTS && (
        <div className="fixed bottom-16 left-0 right-0 bg-white shadow-lg p-3 z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold mb-1">Port Configuration:</h3>
            <textarea
              className="w-full h-24 p-2 font-mono text-xs border rounded-md"
              value={`const portConfig = ${JSON.stringify(editablePorts, null, 2)};`}
              readOnly
            />
          </div>
        </div>
      )}
      
      {/* Structure output (only in edit mode and when editing settlements) */}
      {isEditMode && activeEditMode === EditModeType.SETTLEMENTS && (
        <div className="fixed bottom-16 left-0 right-0 bg-white shadow-lg p-3 z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold mb-1">Settlement Configuration:</h3>
            <textarea
              className="w-full h-24 p-2 font-mono text-xs border rounded-md"
              value={`const settlementConfig = ${JSON.stringify(
                editableStructures.filter(s => s.type === StructureType.Settlement || s.type === StructureType.City),
                null, 2
              )};`}
              readOnly
            />
          </div>
        </div>
      )}
      
      {/* Road output (only in edit mode and when editing roads) */}
      {isEditMode && activeEditMode === EditModeType.ROADS && (
        <div className="fixed bottom-16 left-0 right-0 bg-white shadow-lg p-3 z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold mb-1">Road Configuration:</h3>
            <textarea
              className="w-full h-24 p-2 font-mono text-xs border rounded-md"
              value={`const roadConfig = ${JSON.stringify(
                editableStructures.filter(s => s.type === StructureType.Road),
                null, 2
              )};`}
              readOnly
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;