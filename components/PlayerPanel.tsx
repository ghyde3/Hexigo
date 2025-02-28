import React, { useState, useEffect } from 'react';
import { Player, ResourceType, Structure, StructureType } from '../lib/types';
import { DevelopmentCardType } from './BankPanel';

interface PlayerPanelProps {
  players: Player[];
  currentPlayer: number;
  onPlayerChange: (playerIndex: number) => void;
  onAddResources: () => void;
  position?: { x: number; y: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
  hasLongestRoad?: number | null;
  hasLargestArmy?: number | null;
  playerDevelopmentCards?: Record<number, Record<DevelopmentCardType, number>>;
  onUseDevCard?: (cardType: DevelopmentCardType) => void;
}

const ResourceEmojis = {
  [ResourceType.Brick]: '🧱',
  [ResourceType.Wood]: '🌲',
  [ResourceType.Sheep]: '🐑',
  [ResourceType.Wheat]: '🌾',
  [ResourceType.Ore]: '⛏️',
};

const StructureEmojis = {
  [StructureType.Settlement]: '🏠',
  [StructureType.City]: '🏙️',
  [StructureType.Road]: '🛣️',
};

const DevelopmentCardEmojis = {
  [DevelopmentCardType.Knight]: '⚔️',
  [DevelopmentCardType.VictoryPoint]: '🏆',
  [DevelopmentCardType.RoadBuilding]: '🛣️',
  [DevelopmentCardType.YearOfPlenty]: '🌽',
  [DevelopmentCardType.Monopoly]: '💰',
};

const PlayerPanel: React.FC<PlayerPanelProps> = ({ 
  players, 
  currentPlayer, 
  onPlayerChange,
  onAddResources,
  position = { x: 20, y: 20 },
  onDragEnd,
  hasLongestRoad,
  hasLargestArmy,
  playerDevelopmentCards = {},
  onUseDevCard
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [showResourceDetails, setShowResourceDetails] = useState(false);

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

  // Start dragging the panel
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y
      });
    }
  };

  // Handle dragging
  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      setPanelPosition(newPosition);
    }
  };

  // End dragging
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onDragEnd) {
        onDragEnd(panelPosition);
      }
    }
  };

  // Get remaining structures count
  const getRemainingStructures = (player: Player, type: StructureType) => {
    const built = player.structures?.filter(s => s.type === type)?.length || 0;
    const max = type === StructureType.Road ? 15 : type === StructureType.Settlement ? 5 : 4;
    return max - built;
  };

  // Get development cards for the current player
  const currentPlayerDevCards = playerDevelopmentCards[currentPlayer] || {
    [DevelopmentCardType.Knight]: 0,
    [DevelopmentCardType.VictoryPoint]: 0,
    [DevelopmentCardType.RoadBuilding]: 0,
    [DevelopmentCardType.YearOfPlenty]: 0,
    [DevelopmentCardType.Monopoly]: 0
  };

  // Handle using a development card
  const handleUseDevCard = (cardType: DevelopmentCardType) => {
    if (onUseDevCard && currentPlayerDevCards[cardType] > 0) {
      onUseDevCard(cardType);
    }
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ 
        width: '320px',
        left: `${panelPosition.x}px`,
        top: `${panelPosition.y}px`,
        zIndex: isDragging ? 1000 : 10
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header with drag handle */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between drag-handle cursor-move">
        <h2 className="text-lg font-semibold">Players</h2>
      </div>
      
      {/* Player selection tabs */}
      <div className="flex border-b border-gray-200">
        {players.map((player, index) => (
          <button
            key={player.id}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
              index === currentPlayer 
                ? `bg-${player.color}-100 text-${player.color}-800 border-b-2 border-${player.color}-500` 
                : `text-gray-600 hover:bg-gray-50 hover:text-gray-800`
            }`}
            onClick={() => onPlayerChange(index)}
          >
            {player.name}
            {/* Active player indicator */}
            {index === currentPlayer && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}
            {/* Special card indicators */}
            <div className="absolute top-0 left-0 flex">
              {hasLongestRoad === index && (
                <span className="text-xs bg-blue-500 text-white rounded-sm px-1 mr-1" title="Longest Road">🛣️</span>
              )}
              {hasLargestArmy === index && (
                <span className="text-xs bg-red-500 text-white rounded-sm px-1" title="Largest Army">⚔️</span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {players[currentPlayer] && (
        <div className="p-4">
          {/* Player header with avatar and points */}
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full bg-${players[currentPlayer].color}-500 flex items-center justify-center text-white text-xl font-bold mr-3`}>
              {players[currentPlayer].name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{players[currentPlayer].name}'s Turn</h3>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">Victory Points:</span>
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-sm font-medium">
                  {players[currentPlayer].victoryPoints} / 10
                </span>
              </div>
            </div>
          </div>
          
          {/* Resources section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Resources</h4>
              <button 
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setShowResourceDetails(!showResourceDetails)}
              >
                {showResourceDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-2">
              {Object.entries(players[currentPlayer].resources).map(([resource, count]) => (
                <div 
                  key={resource} 
                  className={`bg-${resource}-100 border border-${resource}-300 rounded-md p-2 flex flex-col items-center justify-center`}
                >
                  <span className="text-xl">{ResourceEmojis[resource as ResourceType]}</span>
                  <div className="mt-1 text-center">
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Resource details */}
            {showResourceDetails && (
              <div className="bg-gray-50 rounded-md p-2 mb-2 text-xs">
                <div className="font-medium mb-1">Total Resources: {
                  Object.values(players[currentPlayer].resources).reduce((sum, count) => sum + count, 0)
                }</div>
                <div className="grid grid-cols-2 gap-x-4">
                  {Object.entries(players[currentPlayer].resources).map(([resource, count]) => (
                    <div key={resource} className="flex justify-between">
                      <span>{resource}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Dev button */}
            <button 
              className="mt-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm w-full"
              onClick={onAddResources}
            >
              + Add Resources (Dev)
            </button>
          </div>
          
          {/* Development Cards */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Development Cards</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(DevelopmentCardType).map(type => {
                const count = currentPlayerDevCards[type] || 0;
                return (
                  <div 
                    key={type} 
                    className={`bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-col items-center ${
                      count > 0 && type !== DevelopmentCardType.VictoryPoint && onUseDevCard
                        ? 'cursor-pointer hover:bg-gray-100'
                        : ''
                    }`}
                    onClick={() => count > 0 && type !== DevelopmentCardType.VictoryPoint && onUseDevCard && handleUseDevCard(type)}
                  >
                    <span className="text-xl">{DevelopmentCardEmojis[type]}</span>
                    <span className="text-xs mt-1">{count}</span>
                    {count > 0 && type !== DevelopmentCardType.VictoryPoint && onUseDevCard && (
                      <button className="mt-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        Use
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Structures */}
          <div>
            <h4 className="font-medium mb-2">Available Structures</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(StructureType).map(type => {
                const remaining = getRemainingStructures(players[currentPlayer], type);
                return (
                  <div key={type} className="bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-col items-center">
                    <span className="text-xl">{StructureEmojis[type]}</span>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium">{remaining} left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Special achievements */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium mb-2">Special Achievements</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-md border ${
                hasLongestRoad === currentPlayer 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">🛣️</span>
                  <div>
                    <div className="text-sm font-medium">Longest Road</div>
                    <div className="text-xs text-gray-600">
                      {hasLongestRoad === currentPlayer 
                        ? 'You have it!' 
                        : hasLongestRoad !== null 
                          ? `Player ${players[hasLongestRoad].name} has it` 
                          : 'Not claimed'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 rounded-md border ${
                hasLargestArmy === currentPlayer 
                  ? 'bg-red-100 border-red-300' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">⚔️</span>
                  <div>
                    <div className="text-sm font-medium">Largest Army</div>
                    <div className="text-xs text-gray-600">
                      {hasLargestArmy === currentPlayer 
                        ? 'You have it!' 
                        : hasLargestArmy !== null 
                          ? `Player ${players[hasLargestArmy].name} has it` 
                          : 'Not claimed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel; 