import React, { useState, useEffect } from 'react';
import { ResourceType, BUILDING_COSTS, StructureType, Player, Port, Structure, PortType } from '../lib/types';
import { getTradingRatio, hasAccessToPort } from '../lib/utils';

// Development card types
export enum DevelopmentCardType {
  Knight = 'knight',
  VictoryPoint = 'victoryPoint',
  RoadBuilding = 'roadBuilding',
  YearOfPlenty = 'yearOfPlenty',
  Monopoly = 'monopoly'
}

// Development card costs
export const DEVELOPMENT_CARD_COST = {
  [ResourceType.Ore]: 1,
  [ResourceType.Sheep]: 1,
  [ResourceType.Wheat]: 1,
  [ResourceType.Wood]: 0,
  [ResourceType.Brick]: 0
};

interface BankPanelProps {
  resources: Record<ResourceType, number>;
  developmentCards: Record<DevelopmentCardType, number>;
  onBuyDevelopmentCard: () => void;
  canBuyDevelopmentCard: boolean;
  onTrade?: (give: ResourceType, receive: ResourceType) => void;
  position?: { x: number; y: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
  currentPlayer?: Player;
  structures?: Structure[];
  ports?: Port[];
  hasLongestRoad?: number | null;
  hasLargestArmy?: number | null;
  players?: Player[];
}

const ResourceEmojis = {
  [ResourceType.Brick]: '🧱',
  [ResourceType.Wood]: '🌲',
  [ResourceType.Sheep]: '🐑',
  [ResourceType.Wheat]: '🌾',
  [ResourceType.Ore]: '⛏️',
};

const PortEmojis = {
  [PortType.Generic]: '🔄',
  [PortType.Brick]: '🧱',
  [PortType.Wood]: '🌲',
  [PortType.Sheep]: '🐑',
  [PortType.Wheat]: '🌾',
  [PortType.Ore]: '⛏️',
};

const DevelopmentCardEmojis = {
  [DevelopmentCardType.Knight]: '⚔️',
  [DevelopmentCardType.VictoryPoint]: '🏆',
  [DevelopmentCardType.RoadBuilding]: '🛣️',
  [DevelopmentCardType.YearOfPlenty]: '🌽',
  [DevelopmentCardType.Monopoly]: '💰',
};

const DevelopmentCardNames = {
  [DevelopmentCardType.Knight]: 'Knight',
  [DevelopmentCardType.VictoryPoint]: 'Victory Point',
  [DevelopmentCardType.RoadBuilding]: 'Road Building',
  [DevelopmentCardType.YearOfPlenty]: 'Year of Plenty',
  [DevelopmentCardType.Monopoly]: 'Monopoly',
};

const BankPanel: React.FC<BankPanelProps> = ({
  resources,
  developmentCards,
  onBuyDevelopmentCard,
  canBuyDevelopmentCard,
  onTrade,
  position = { x: window.innerWidth - 320, y: 20 },
  onDragEnd,
  currentPlayer,
  structures = [],
  ports = [],
  hasLongestRoad = null,
  hasLargestArmy = null,
  players = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [showCosts, setShowCosts] = useState(false);
  const [showTradeInterface, setShowTradeInterface] = useState(() => {
    const saved = localStorage.getItem('bankPanelShowTradeInterface');
    return saved ? JSON.parse(saved) : false;
  });
  const [tradeGiveResource, setTradeGiveResource] = useState<ResourceType | null>(null);
  const [tradeReceiveResource, setTradeReceiveResource] = useState<ResourceType | null>(null);
  const [showDevCards, setShowDevCards] = useState(() => {
    const saved = localStorage.getItem('bankPanelShowDevCards');
    return saved ? JSON.parse(saved) : true;
  });
  const [showBuildingCosts, setShowBuildingCosts] = useState(() => {
    const saved = localStorage.getItem('bankPanelShowBuildingCosts');
    return saved ? JSON.parse(saved) : true;
  });
  const [showAchievements, setShowAchievements] = useState(() => {
    const saved = localStorage.getItem('bankPanelShowAchievements');
    return saved ? JSON.parse(saved) : true;
  });

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

  // Save UI state to localStorage
  useEffect(() => {
    localStorage.setItem('bankPanelShowTradeInterface', JSON.stringify(showTradeInterface));
  }, [showTradeInterface]);

  useEffect(() => {
    localStorage.setItem('bankPanelShowDevCards', JSON.stringify(showDevCards));
  }, [showDevCards]);

  useEffect(() => {
    localStorage.setItem('bankPanelShowBuildingCosts', JSON.stringify(showBuildingCosts));
  }, [showBuildingCosts]);

  useEffect(() => {
    localStorage.setItem('bankPanelShowAchievements', JSON.stringify(showAchievements));
  }, [showAchievements]);

  // Calculate total development cards
  const totalDevelopmentCards = Object.values(developmentCards).reduce((sum, count) => sum + count, 0);

  // Get player's accessible ports
  const getPlayerPorts = () => {
    if (!currentPlayer || !ports || ports.length === 0) return [];
    
    return ports.filter(port => hasAccessToPort(currentPlayer, port, structures));
  };
  
  // Get trading ratio for a resource
  const getResourceTradingRatio = (resource: ResourceType) => {
    if (!currentPlayer) return 4;
    return getTradingRatio(currentPlayer, resource, ports, structures);
  };

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

  // Handle trade button click
  const handleTradeClick = () => {
    if (tradeGiveResource && tradeReceiveResource && onTrade) {
      onTrade(tradeGiveResource, tradeReceiveResource);
      // Reset selections after trade
      setTradeGiveResource(null);
      setTradeReceiveResource(null);
    }
  };

  // Get player's accessible ports
  const playerPorts = getPlayerPorts();

  // Toggle section visibility with stopPropagation to prevent drag
  const toggleTradeInterface = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setShowTradeInterface(!showTradeInterface);
  };

  const toggleDevCards = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setShowDevCards(!showDevCards);
  };

  const toggleBuildingCosts = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setShowBuildingCosts(!showBuildingCosts);
  };

  const toggleAchievements = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setShowAchievements(!showAchievements);
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ 
        width: '300px',
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
        <h2 className="text-lg font-semibold">Bank</h2>
        <div className="flex space-x-2">
          <button 
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            onClick={toggleTradeInterface}
          >
            {showTradeInterface ? 'Hide Trade' : 'Trade'}
          </button>
        </div>
      </div>

      {/* Player's ports */}
      {playerPorts.length > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <h3 className="text-sm font-semibold mb-2">Your Ports</h3>
          <div className="flex flex-wrap gap-2">
            {playerPorts.map((port, index) => (
              <div 
                key={`port-${index}`} 
                className="flex items-center bg-white px-2 py-1 rounded-md border border-blue-300"
                title={port.type === PortType.Generic ? "3:1 Trading Port" : `2:1 ${port.type} Trading Port`}
              >
                <span className="mr-1">{PortEmojis[port.type]}</span>
                <span className="text-xs font-medium">
                  {port.type === PortType.Generic ? "3:1" : `2:1 ${port.type}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade interface */}
      {showTradeInterface && onTrade && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-md font-semibold mb-2">Trade with Bank</h3>
          
          <div className="flex flex-col space-y-3">
            {/* Give resources selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Give</label>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(ResourceType).filter(([key]) => key !== 'Desert').map(([_, resource]) => {
                  const ratio = getResourceTradingRatio(resource as ResourceType);
                  return (
                    <button
                      key={`give-${resource}`}
                      className={`p-1 rounded-md border ${
                        tradeGiveResource === resource 
                          ? `bg-${resource}-100 border-${resource}-500` 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => setTradeGiveResource(resource as ResourceType)}
                      disabled={currentPlayer && currentPlayer.resources[resource as ResourceType] < ratio}
                    >
                      <div className="flex flex-col items-center">
                        <span>{ResourceEmojis[resource as ResourceType]}</span>
                        <span className="text-xs mt-1">{ratio}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Receive resources selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receive (1)</label>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(ResourceType).filter(([key]) => key !== 'Desert').map(([_, resource]) => (
                  <button
                    key={`receive-${resource}`}
                    className={`p-1 rounded-md border ${
                      tradeReceiveResource === resource 
                        ? `bg-${resource}-100 border-${resource}-500` 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setTradeReceiveResource(resource as ResourceType)}
                    disabled={resources[resource as ResourceType] < 1}
                  >
                    <div className="flex flex-col items-center">
                      <span>{ResourceEmojis[resource as ResourceType]}</span>
                      <span className="text-xs mt-1">1</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Trade button */}
            <button
              className={`mt-2 px-3 py-2 rounded-md text-sm font-medium ${
                tradeGiveResource && tradeReceiveResource && currentPlayer && 
                currentPlayer.resources[tradeGiveResource] >= getResourceTradingRatio(tradeGiveResource)
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleTradeClick}
              disabled={!tradeGiveResource || !tradeReceiveResource || 
                !currentPlayer || 
                (tradeGiveResource && currentPlayer.resources[tradeGiveResource] < getResourceTradingRatio(tradeGiveResource))}
            >
              Trade
            </button>
          </div>
        </div>
      )}

      {/* Bank resources */}
      <div className="p-4">
        <h3 className="text-md font-semibold mb-2">Resources</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(resources).map(([resource, count]) => (
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

        {/* Development Cards */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">Development Cards</h3>
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={toggleDevCards}
            >
              {showDevCards ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showDevCards && (
            <>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {Object.entries(developmentCards).map(([cardType, count]) => (
                  <div 
                    key={cardType} 
                    className="bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-col items-center"
                    title={DevelopmentCardNames[cardType as DevelopmentCardType]}
                  >
                    <span className="text-xl">{DevelopmentCardEmojis[cardType as DevelopmentCardType]}</span>
                    <div className="mt-1 text-center">
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Cost:</span>
                  <div className="flex space-x-1">
                    {Object.entries(DEVELOPMENT_CARD_COST).map(([resource, count]) => 
                      count > 0 ? (
                        <div key={resource} className="flex items-center">
                          <span className="text-sm">{count}</span>
                          <span className="ml-1">{ResourceEmojis[resource as ResourceType]}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
                
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    canBuyDevelopmentCard 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={onBuyDevelopmentCard}
                  disabled={!canBuyDevelopmentCard}
                >
                  Buy Card
                </button>
              </div>
            </>
          )}
        </div>

        {/* Building Costs */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">Building Costs</h3>
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={toggleBuildingCosts}
            >
              {showBuildingCosts ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showBuildingCosts && (
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(BUILDING_COSTS).map(([structureType, costs]) => (
                <div key={structureType} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">
                      {structureType === StructureType.Road ? '🛣️' : 
                       structureType === StructureType.Settlement ? '🏠' : 
                       structureType === StructureType.City ? '🏙️' : ''}
                    </span>
                    <span className="text-sm font-medium">{structureType}</span>
                  </div>
                  <div className="flex space-x-1">
                    {Object.entries(costs).map(([resource, count]) => 
                      count > 0 ? (
                        <div key={resource} className="flex items-center">
                          <span className="text-sm">{count}</span>
                          <span className="ml-1">{ResourceEmojis[resource as ResourceType]}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Special Achievements */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">Special Achievements</h3>
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={toggleAchievements}
            >
              {showAchievements ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showAchievements && (
            <div className="grid grid-cols-1 gap-2">
              {/* Longest Road */}
              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md">
                <div className="flex items-center">
                  <span className="text-xl mr-2">🛣️</span>
                  <div>
                    <span className="text-sm font-medium">Longest Road</span>
                    <div className="text-xs text-gray-600">+2 Victory Points</div>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {hasLongestRoad !== null && players[hasLongestRoad] ? (
                    <span className={`px-2 py-1 rounded bg-${players[hasLongestRoad].color}-100 text-${players[hasLongestRoad].color}-800`}>
                      {players[hasLongestRoad].name}
                    </span>
                  ) : (
                    <span className="text-gray-500">Unclaimed</span>
                  )}
                </div>
              </div>
              
              {/* Largest Army */}
              <div className="flex items-center justify-between bg-red-50 p-2 rounded-md">
                <div className="flex items-center">
                  <span className="text-xl mr-2">⚔️</span>
                  <div>
                    <span className="text-sm font-medium">Largest Army</span>
                    <div className="text-xs text-gray-600">+2 Victory Points</div>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {hasLargestArmy !== null && players[hasLargestArmy] ? (
                    <span className={`px-2 py-1 rounded bg-${players[hasLargestArmy].color}-100 text-${players[hasLargestArmy].color}-800`}>
                      {players[hasLargestArmy].name}
                    </span>
                  ) : (
                    <span className="text-gray-500">Unclaimed</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankPanel; 