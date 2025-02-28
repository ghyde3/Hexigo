import React from 'react';
import { Player, ResourceType, Structure, StructureType } from '../lib/types';

interface PlayerPanelProps {
  players: Player[];
  currentPlayer: number;
  onPlayerChange: (playerIndex: number) => void;
  onAddResources: () => void;
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

const PlayerPanel: React.FC<PlayerPanelProps> = ({ 
  players, 
  currentPlayer, 
  onPlayerChange,
  onAddResources
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Players</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        {players.map((player, index) => (
          <button
            key={player.id}
            className={`px-4 py-2 rounded-md border-2 transition-colors ${
              index === currentPlayer 
                ? `bg-${player.color}-500 text-white border-${player.color}-700` 
                : `border-${player.color}-500 text-${player.color}-500 hover:bg-${player.color}-50`
            }`}
            onClick={() => onPlayerChange(index)}
          >
            {player.name}
          </button>
        ))}
      </div>
      
      {players[currentPlayer] && (
        <div className="p-4 rounded-md bg-gray-50">
          <div className="flex items-center mb-4">
            <div className={`w-4 h-4 rounded-full bg-${players[currentPlayer].color}-500 mr-2`}></div>
            <h3 className="text-lg font-semibold">{players[currentPlayer].name}'s Turn</h3>
            <span className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
              {players[currentPlayer].victoryPoints} Points
            </span>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Resources</h4>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(players[currentPlayer].resources).map(([resource, count]) => (
                <div key={resource} className="flex items-center">
                  <span className="mr-1">{ResourceEmojis[resource as ResourceType]}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <button 
              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
              onClick={onAddResources}
            >
              + Add Resources (Dev)
            </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Structures</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(StructureType).map(type => {
                const count = players[currentPlayer].structures.filter(s => s.type === type).length;
                return (
                  <div key={type} className="flex items-center">
                    <span className="mr-1">{StructureEmojis[type]}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel; 