import React from 'react';
import { Player, ResourceType } from '../lib/types';

interface EndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onNewGame: () => void;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ isOpen, onClose, players, onNewGame }) => {
  if (!isOpen) return null;

  // Sort players by victory points in descending order
  const sortedPlayers = [...players].sort((a, b) => b.victoryPoints - a.victoryPoints);

  // Resource icons
  const resourceIcons = {
    [ResourceType.Brick]: '🧱',
    [ResourceType.Wood]: '🌲',
    [ResourceType.Sheep]: '🐑',
    [ResourceType.Wheat]: '🌾',
    [ResourceType.Ore]: '⛏️',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-blue-800">Game Over</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">🏆</span>
            </div>
            <h3 className="text-2xl font-semibold">Final Standings</h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex flex-col md:flex-row md:justify-between items-start md:items-center p-4 mb-3 rounded-lg shadow-sm ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'
                }`}
              >
                <div className="flex items-center mb-2 md:mb-0">
                  <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                       style={{ backgroundColor: player.color }}>
                    {index + 1}
                  </div>
                  <div>
                    <span className="font-bold text-lg">{player.name}</span>
                    {index === 0 && <span className="ml-2 text-yellow-600 font-semibold">👑 Winner!</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-sm text-gray-600">Points</div>
                    <div className="font-bold text-xl text-blue-700">{player.victoryPoints}</div>
                  </div>
                  
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-sm text-gray-600">Structures</div>
                    <div className="font-bold text-xl text-green-700">{player.structures?.length || 0}</div>
                  </div>
                  
                  <div className="bg-purple-50 p-2 rounded text-center">
                    <div className="text-sm text-gray-600">Knights</div>
                    <div className="font-bold text-xl text-purple-700">{player.knightsPlayed || 0}</div>
                  </div>
                  
                  <div className="bg-amber-50 p-2 rounded text-center">
                    <div className="text-sm text-gray-600">Resources</div>
                    <div className="font-bold text-xl text-amber-700">
                      {Object.values(player.resources).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Resource Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Object.entries(ResourceType).filter(([key]) => key !== 'Desert').map(([key, resource]) => (
              <div key={resource} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">{resourceIcons[resource as ResourceType]}</span>
                  <span className="font-medium capitalize">{resource}</span>
                </div>
                <div className="space-y-2">
                  {sortedPlayers.map(player => (
                    <div key={`${player.id}-${resource}`} className="flex justify-between items-center">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }}></div>
                      <span className="font-bold">{player.resources[resource as ResourceType]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-4 border-t">
          <button
            onClick={onNewGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-md"
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal; 