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
  ports = []
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [showCosts, setShowCosts] = useState(false);
  const [showTradeInterface, setShowTradeInterface] = useState(false);
  const [tradeGiveResource, setTradeGiveResource] = useState<ResourceType | null>(null);
  const [tradeReceiveResource, setTradeReceiveResource] = useState<ResourceType | null>(null);

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

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
            onClick={() => setShowTradeInterface(!showTradeInterface)}
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

        {/* Development cards */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold">Development Cards</h3>
            <span className="text-sm text-gray-600">{totalDevelopmentCards} remaining</span>
          </div>

          <div className="relative mb-4">
            <div className="bg-purple-100 border border-purple-300 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xl mr-2">🃏</span>
                <span className="font-medium">Development Card</span>
              </div>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  canBuyDevelopmentCard 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                onClick={onBuyDevelopmentCard}
                disabled={!canBuyDevelopmentCard}
                onMouseEnter={() => setShowCosts(true)}
                onMouseLeave={() => setShowCosts(false)}
              >
                Buy
              </button>
            </div>

            {/* Cost tooltip */}
            {showCosts && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2 z-20">
                <div className="text-xs font-medium mb-1">Cost:</div>
                <div className="flex space-x-2">
                  {Object.entries(DEVELOPMENT_CARD_COST).map(([resource, cost]) => (
                    cost > 0 && (
                      <div key={resource} className="flex items-center">
                        <span className="mr-1">{ResourceEmojis[resource as ResourceType]}</span>
                        <span>{cost}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Development card types */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(developmentCards).map(([cardType, count]) => (
              <div 
                key={cardType}
                className="bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center"
              >
                <span className="text-xl mr-2">{DevelopmentCardEmojis[cardType as DevelopmentCardType]}</span>
                <div>
                  <div className="text-sm font-medium">{DevelopmentCardNames[cardType as DevelopmentCardType]}</div>
                  <div className="text-xs text-gray-600">{count} cards</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Building costs reference */}
        <div className="mt-4 border-t border-gray-200 pt-3">
          <h3 className="text-md font-semibold mb-2">Building Costs</h3>
          <div className="space-y-2">
            {Object.entries(BUILDING_COSTS).map(([structureType, costs]) => (
              <div key={structureType} className="bg-gray-50 border border-gray-200 rounded-md p-2">
                <div className="flex items-center mb-1">
                  <span className="text-lg mr-2">
                    {structureType === StructureType.Road ? '🛣️' : 
                     structureType === StructureType.Settlement ? '🏠' : '🏙️'}
                  </span>
                  <span className="font-medium">{structureType}</span>
                </div>
                <div className="flex space-x-2">
                  {Object.entries(costs).map(([resource, cost]) => (
                    cost > 0 && (
                      <div key={resource} className="flex items-center">
                        <span className="mr-1">{ResourceEmojis[resource as ResourceType]}</span>
                        <span>{cost}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPanel; 