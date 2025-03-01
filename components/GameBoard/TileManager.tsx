import React, { useState } from 'react';
import HexTile, { ResourceType } from '../HexTile/HexTile';
import { Building, BuildingType } from '../../lib/gameModel';

export interface TileData {
  id: string;
  q: number;
  r: number;
  s: number;
  resourceType: ResourceType;
  value?: number;
}

interface TileManagerProps {
  tiles: TileData[];
  hexSize: number;
  spacing?: number;
  onTileClick?: (tile: TileData) => void;
  selectedTileId?: string;
  showHotspots?: boolean;
  buildings?: Building[];
  currentPlayerId?: number;
  buildingMode?: BuildingType | null;
  onBuildingPlaced?: (building: Omit<Building, 'id'>) => void;
  canPlaceBuilding?: (type: BuildingType, locationId: string) => boolean;
}

// Helper function to calculate the pixel coordinates from cube coordinates
const cubeToPixel = (q: number, r: number, hexSize: number, spacing: number) => {
  const x = hexSize * spacing * (3/2 * q);
  const y = hexSize * spacing * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x, y };
};

// Helper function to calculate the corner points of a hexagon in pixel coordinates
const getHexCorners = (q: number, r: number, hexSize: number, spacing: number) => {
  const center = cubeToPixel(q, r, hexSize, spacing);
  const corners = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = center.x + hexSize * Math.cos(angle);
    const y = center.y + hexSize * Math.sin(angle);
    corners.push({ x, y });
  }
  
  return corners;
};

// Direction vectors for neighboring hexes in a pointy-top hexagonal grid
const HEX_DIRECTIONS = [
  { q: 1, r: -1, s: 0 },  // Northeast
  { q: 1, r: 0, s: -1 },  // East
  { q: 0, r: 1, s: -1 },  // Southeast
  { q: -1, r: 1, s: 0 },  // Southwest
  { q: -1, r: 0, s: 1 },  // West
  { q: 0, r: -1, s: 1 }   // Northwest
];

// Get the neighboring hex in a specific direction
const getNeighbor = (hex: { q: number, r: number, s: number }, direction: number) => {
  const dir = HEX_DIRECTIONS[direction];
  return {
    q: hex.q + dir.q,
    r: hex.r + dir.r,
    s: hex.s + dir.s
  };
};

// Get canonical vertex coordinates in the hex grid
// Each vertex in the grid is shared by up to 3 hexes
const getVertexKey = (q: number, r: number, corner: number) => {
  // Using Amit Patel's method for vertex identification in a hex grid
  // https://www.redblobgames.com/grids/hexagons/implementation.html
  
  // Define the corner directions (which 3 hexes share each corner)
  const cornerDirectionMap = [
    [0, 1],  // Between Northeast and East
    [1, 2],  // Between East and Southeast
    [2, 3],  // Between Southeast and Southwest
    [3, 4],  // Between Southwest and West
    [4, 5],  // Between West and Northwest
    [5, 0]   // Between Northwest and Northeast
  ];
  
  // Get the specific directions for this corner
  const [dir1, dir2] = cornerDirectionMap[corner];
  
  // The 3 hexes that share this vertex are:
  // 1. This hex
  // 2. Neighbor in direction dir1
  // 3. Neighbor in direction dir2
  const thisHex = { q, r, s: -q-r };
  const neighbor1 = getNeighbor(thisHex, dir1);
  const neighbor2 = getNeighbor(thisHex, dir2);
  
  // Sort the three hex coordinates to get a canonical order
  const hexes = [thisHex, neighbor1, neighbor2];
  
  // Sort by q, then r, then s to get a consistent order
  hexes.sort((a, b) => {
    if (a.q !== b.q) return a.q - b.q;
    if (a.r !== b.r) return a.r - b.r;
    return a.s - b.s;
  });
  
  // Create a unique string key from the sorted hexes
  return hexes.map(h => `${h.q},${h.r},${h.s}`).join('|');
};

// Get canonical edge key from two vertices
const getEdgeKey = (vertex1: string, vertex2: string) => {
  return [vertex1, vertex2].sort().join('--');
};

// Calculate the coordinates of all grid vertices, ensuring uniqueness
const calculateUniqueVertices = (tiles: TileData[], hexSize: number, spacing: number) => {
  // Map to store unique vertices with their properties
  const vertexMap = new Map<string, {
    pixelCoords: { x: number, y: number },
    tiles: TileData[]
  }>();
  
  // For each tile, calculate its 6 vertices
  tiles.forEach(tile => {
    const { q, r, s } = tile;
    const corners = getHexCorners(q, r, hexSize, spacing);
    
    // Process each corner of the hexagon
    for (let i = 0; i < 6; i++) {
      // Get canonical vertex key based on neighboring hexes
      const vertexKey = getVertexKey(q, r, i);
      const pixelCoord = corners[i];
      
      if (vertexMap.has(vertexKey)) {
        // If vertex exists, add this tile to its tiles list (if not already there)
        const vertex = vertexMap.get(vertexKey)!;
        if (!vertex.tiles.some(t => t.id === tile.id)) {
          vertex.tiles.push(tile);
        }
      } else {
        // Create new vertex entry
        vertexMap.set(vertexKey, {
          pixelCoords: pixelCoord,
          tiles: [tile]
        });
      }
    }
  });
  
  return vertexMap;
};

// Calculate unique edges between vertices
const calculateUniqueEdges = (tiles: TileData[], vertexMap: Map<string, any>, hexSize: number, spacing: number) => {
  const edgeMap = new Map<string, {
    from: { x: number, y: number },
    to: { x: number, y: number },
    fromVertexId: string,
    toVertexId: string
  }>();
  
  // For each tile, calculate its 6 edges
  tiles.forEach(tile => {
    const { q, r, s } = tile;
    const corners = getHexCorners(q, r, hexSize, spacing);
    
    // Each edge connects two adjacent corners
    for (let i = 0; i < 6; i++) {
      const currentVertex = getVertexKey(q, r, i);
      const nextVertex = getVertexKey(q, r, (i + 1) % 6);
      
      // Create a canonical key for this edge by sorting vertex keys
      const edgeKey = getEdgeKey(currentVertex, nextVertex);
      
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          from: corners[i],
          to: corners[(i + 1) % 6],
          fromVertexId: currentVertex,
          toVertexId: nextVertex
        });
      }
    }
  });
  
  return edgeMap;
};

// Get adjacent vertices (connected by a single edge)
const getAdjacentVertices = (edges: Map<string, any>) => {
  const adjacencyMap = new Map<string, Set<string>>();
  
  // Build adjacency map from edges
  edges.forEach((edge) => {
    const { fromVertexId, toVertexId } = edge;
    
    // Add fromVertex -> toVertex connection
    if (!adjacencyMap.has(fromVertexId)) {
      adjacencyMap.set(fromVertexId, new Set<string>());
    }
    adjacencyMap.get(fromVertexId)!.add(toVertexId);
    
    // Add toVertex -> fromVertex connection
    if (!adjacencyMap.has(toVertexId)) {
      adjacencyMap.set(toVertexId, new Set<string>());
    }
    adjacencyMap.get(toVertexId)!.add(fromVertexId);
  });
  
  return adjacencyMap;
};

const TileManager: React.FC<TileManagerProps> = ({
  tiles,
  hexSize,
  spacing = 1.0,
  onTileClick,
  selectedTileId,
  showHotspots = false,
  buildings = [],
  currentPlayerId,
  buildingMode = null,
  onBuildingPlaced,
  canPlaceBuilding = () => true,
}) => {
  // State to track selected hotspot - initialize as null to avoid debug state
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [connectedTileIds, setConnectedTileIds] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  
  // Calculate vertex and edge positions for hotspots
  const generateHotspots = () => {
    // Calculate unique vertices and edges using our improved algorithms
    const vertices = calculateUniqueVertices(tiles, hexSize, spacing);
    const edges = calculateUniqueEdges(tiles, vertices, hexSize, spacing);
    const adjacentVertices = getAdjacentVertices(edges);
    
    // Check if a vertex has a settlement or city within distance 1 (directly adjacent)
    const hasNearbyBuilding = (vertexId: string) => {
      // Get all adjacent vertices
      const adjacent = adjacentVertices.get(vertexId) || new Set<string>();
      
      // Check if any adjacent vertex has a settlement or city
      for (const adjVertex of Array.from(adjacent)) {
        if (buildings.some(b => 
          (b.type === BuildingType.SETTLEMENT || b.type === BuildingType.CITY) && 
          b.vertexId === adjVertex
        )) {
          return true;
        }
      }
      
      // Also check the vertex itself
      return buildings.some(b => 
        (b.type === BuildingType.SETTLEMENT || b.type === BuildingType.CITY) && 
        b.vertexId === vertexId
      );
    };
    
    // Handle vertex selection
    const handleVertexClick = (key: string, connectedTiles: TileData[]) => {
      if (buildingMode === BuildingType.SETTLEMENT || buildingMode === BuildingType.CITY) {
        // For settlements, check the distance rule
        if (buildingMode === BuildingType.SETTLEMENT && hasNearbyBuilding(key)) {
          // Cannot place a settlement here due to distance rule
          console.log("Cannot place settlement - too close to another building");
          return;
        }
        
        // Check if we can place a building here
        if (canPlaceBuilding(buildingMode, key) && onBuildingPlaced && currentPlayerId) {
          onBuildingPlaced({
            type: buildingMode,
            playerId: currentPlayerId,
            vertexId: key
          });
          return;
        }
      }
      
      // Only show debug info when not in building mode
      if (!buildingMode) {
        if (selectedVertex === key) {
          // If clicking the same vertex again, deselect it
          setSelectedVertex(null);
          setConnectedTileIds([]);
        } else {
          // Select this vertex and store its connected tiles
          setSelectedVertex(key);
          setConnectedTileIds(connectedTiles.map(t => t.id));
        }
      }
    };
    
    // Handle edge selection for road placement
    const handleEdgeClick = (key: string) => {
      if (buildingMode === BuildingType.ROAD) {
        // Check if we can place a road here
        if (canPlaceBuilding(BuildingType.ROAD, key) && onBuildingPlaced && currentPlayerId) {
          onBuildingPlaced({
            type: BuildingType.ROAD,
            playerId: currentPlayerId,
            edgeId: key
          });
          return;
        }
      }
      
      // Toggle selection for debug purposes
      if (!buildingMode) {
        setSelectedEdge(selectedEdge === key ? null : key);
      }
    };
    
    // Create maps for quick lookup of buildings by location
    const buildingsByVertex = new Map<string, Building>();
    const buildingsByEdge = new Map<string, Building>();
    
    buildings.forEach(building => {
      if (building.vertexId) {
        buildingsByVertex.set(building.vertexId, building);
      } else if (building.edgeId) {
        buildingsByEdge.set(building.edgeId, building);
      }
    });
    
    // Create vertex elements (settlement/city locations)
    const vertexElements = Array.from(vertices.entries()).map(([key, data]) => {
      const { pixelCoords, tiles } = data;
      const tileCount = tiles.length;
      const isSelected = key === selectedVertex;
      const existingBuilding = buildingsByVertex.get(key);
      
      // If there's already a settlement or city here, render it
      if (existingBuilding) {
        const playerColor = getPlayerColor(existingBuilding.playerId);
        
        if (existingBuilding.type === BuildingType.CITY) {
          // City (square)
          return (
            <rect
              key={`building-${key}`}
              x={pixelCoords.x - hexSize / 8}
              y={pixelCoords.y - hexSize / 8}
              width={hexSize / 4}
              height={hexSize / 4}
              fill={playerColor}
              stroke="#000"
              strokeWidth={1}
            />
          );
        } else {
          // Settlement (circle)
          return (
            <circle
              key={`building-${key}`}
              cx={pixelCoords.x}
              cy={pixelCoords.y}
              r={hexSize / 8}
              fill={playerColor}
              stroke="#000"
              strokeWidth={1}
            />
          );
        }
      }
      
      // Only render potential building spots if showHotspots is true
      if (!showHotspots) return null;
      
      // Check if this vertex is too close to another settlement/city
      const isTooClose = hasNearbyBuilding(key);
      
      // Otherwise, render a potential building spot
      // Determine appearance based on selection state and tile count
      const canBuild = buildingMode && 
                      ((buildingMode === BuildingType.SETTLEMENT && !isTooClose) || 
                       buildingMode === BuildingType.CITY) && 
                      canPlaceBuilding(buildingMode, key);
      
      const fillColor = isSelected ? "#ff9500" : 
                        isTooClose && buildingMode === BuildingType.SETTLEMENT ? "#9ca3af" : 
                        canBuild ? "#4ade80" : "#3b82f6"; // Orange when selected, gray when too close, green when buildable, blue otherwise
      
      const strokeColor = isSelected ? "#b45309" : 
                          isTooClose && buildingMode === BuildingType.SETTLEMENT ? "#6b7280" : 
                          canBuild ? "#166534" : "#1e40af";
      
      const strokeWidth = isSelected || canBuild ? 2 : 1;
      const radius = isSelected || canBuild ? hexSize / 8 : hexSize / 10;
      const opacity = isTooClose && buildingMode === BuildingType.SETTLEMENT ? 0.5 : 0.8;
      
      return (
        <circle
          key={`vertex-${key}`}
          cx={pixelCoords.x}
          cy={pixelCoords.y}
          r={radius}
          fill={fillColor}
          opacity={opacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          data-tiles={tiles.map(t => t.id).join(',')}
          data-tile-count={tileCount}
          onClick={() => handleVertexClick(key, tiles)}
          style={{ cursor: isTooClose && buildingMode === BuildingType.SETTLEMENT ? 'not-allowed' : 'pointer' }}
        />
      );
    }).filter(Boolean); // Filter out null elements
    
    // Create edge elements (road locations)
    const edgeElements = Array.from(edges.entries()).map(([key, data]) => {
      const { from, to } = data;
      const existingBuilding = buildingsByEdge.get(key);
      
      // If there's already a road here, render it
      if (existingBuilding && existingBuilding.type === BuildingType.ROAD) {
        const playerColor = getPlayerColor(existingBuilding.playerId);
        
        return (
          <line
            key={`road-${key}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={playerColor}
            strokeWidth={hexSize / 8}
            strokeLinecap="round"
          />
        );
      }
      
      // Only render potential road spots if showHotspots is true
      if (!showHotspots) return null;
      
      // Otherwise, render a potential road spot
      const isSelected = key === selectedEdge;
      const canBuild = buildingMode === BuildingType.ROAD && canPlaceBuilding(BuildingType.ROAD, key);
      const strokeColor = isSelected ? "#ff9500" : canBuild ? "#4ade80" : "#ef4444";
      const opacity = isSelected || canBuild ? 0.8 : 0.6;
      const strokeWidth = isSelected || canBuild ? hexSize / 8 : hexSize / 10;
      
      return (
        <line
          key={`edge-${key}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeLinecap="round"
          onClick={() => handleEdgeClick(key)}
          style={{ cursor: 'pointer' }}
        />
      );
    }).filter(Boolean); // Filter out null elements
    
    return (
      <g className="hotspots">
        {edgeElements}
        {vertexElements}
      </g>
    );
  };
  
  // Render buildings separately from hotspots
  const renderBuildings = () => {
    // Calculate unique vertices and edges
    const vertices = calculateUniqueVertices(tiles, hexSize, spacing);
    const edges = calculateUniqueEdges(tiles, vertices, hexSize, spacing);
    
    // Create maps for quick lookup of buildings by location
    const buildingsByVertex = new Map<string, Building>();
    const buildingsByEdge = new Map<string, Building>();
    
    // Debug: Log the buildings array
    console.log("Buildings array:", buildings);
    
    buildings.forEach(building => {
      if (building.vertexId) {
        buildingsByVertex.set(building.vertexId, building);
      } else if (building.edgeId) {
        buildingsByEdge.set(building.edgeId, building);
      }
    });
    
    // Debug: Log the buildings maps
    console.log("Buildings by vertex:", buildingsByVertex.size);
    console.log("Buildings by edge:", buildingsByEdge.size);
    
    // Render settlements and cities
    const buildingElements = Array.from(vertices.entries())
      .filter(([key]) => buildingsByVertex.has(key))
      .map(([key, data]) => {
        const { pixelCoords } = data;
        const building = buildingsByVertex.get(key)!;
        const playerColor = getPlayerColor(building.playerId);
        
        if (building.type === BuildingType.CITY) {
          // City (square)
          return (
            <rect
              key={`building-${key}`}
              x={pixelCoords.x - hexSize / 8}
              y={pixelCoords.y - hexSize / 8}
              width={hexSize / 4}
              height={hexSize / 4}
              fill={playerColor}
              stroke="#000"
              strokeWidth={1}
            />
          );
        } else {
          // Settlement (circle)
          return (
            <circle
              key={`building-${key}`}
              cx={pixelCoords.x}
              cy={pixelCoords.y}
              r={hexSize / 8}
              fill={playerColor}
              stroke="#000"
              strokeWidth={1}
            />
          );
        }
      });
    
    // Debug: Log the edges
    console.log("Edges count:", edges.size);
    console.log("Edge keys:", Array.from(edges.keys()));
    console.log("Building edge keys:", Array.from(buildingsByEdge.keys()));
    
    // Render roads directly from the buildings array instead of trying to match with edges
    const roadElements = buildings
      .filter(building => building.type === BuildingType.ROAD && building.edgeId)
      .map(building => {
        // Find the edge data for this edge ID
        const edgeEntry = Array.from(edges.entries()).find(([key]) => key === building.edgeId);
        
        if (!edgeEntry) {
          console.log("Could not find edge data for road:", building.edgeId);
          return null;
        }
        
        const [_, data] = edgeEntry;
        const { from, to } = data;
        const playerColor = getPlayerColor(building.playerId);
        
        console.log("Rendering road for player:", building.playerId, "with color:", playerColor);
        
        return (
          <line
            key={`road-${building.id}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={playerColor}
            strokeWidth={hexSize / 8}
            strokeLinecap="round"
          />
        );
      })
      .filter(Boolean);
    
    // Debug: Log the road elements
    console.log("Road elements count:", roadElements.length);
    
    return (
      <g className="buildings">
        {roadElements}
        {buildingElements}
      </g>
    );
  };

  // Helper to get player color
  const getPlayerColor = (playerId: number): string => {
    // This is a simple mapping - in a real app, you'd get this from your player data
    const colors = ['#ff0000', '#0000ff', '#ffffff', '#ffa500'];
    return colors[(playerId - 1) % colors.length];
  };
  
  // Render tiles with highlighting for connected tiles
  const renderTiles = () => {
    return tiles.map((tile) => {
      const isConnectedToSelectedVertex = connectedTileIds.includes(tile.id);
      const isSelected = selectedTileId === tile.id;
      
      return (
        <HexTile
          key={tile.id}
          q={tile.q}
          r={tile.r}
          s={tile.s}
          resourceType={tile.resourceType}
          value={tile.value}
          size={hexSize}
          spacing={spacing}
          isSelected={isSelected}
          isHighlighted={isConnectedToSelectedVertex}
          onClick={() => onTileClick && onTileClick(tile)}
        />
      );
    });
  };
  
  return (
    <>
      {/* Render the tiles first */}
      {renderTiles()}
      
      {/* Always render buildings */}
      {renderBuildings()}
      
      {/* Render the hotspots on top of the tiles if showHotspots is true */}
      {showHotspots && generateHotspots()}
      
      {/* Render building mode indicator */}
      {buildingMode && (
        <text
          x="0"
          y={-hexSize * 3.5}
          textAnchor="middle"
          fill="#1f2937"
          className="text-sm font-medium"
        >
          Building Mode: {buildingMode.charAt(0).toUpperCase() + buildingMode.slice(1)}
        </text>
      )}
    </>
  );
};

export default TileManager; 