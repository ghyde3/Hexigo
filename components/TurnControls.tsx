import React from 'react';
import { Player, StructureType } from '../lib/types';

interface TurnControlsProps {
  currentPlayer: Player;
  diceRoll?: [number, number];
  onRollDice: () => void;
  onBuildRoad: () => void;
  onBuildSettlement: () => void;
  onBuildCity: () => void;
  onEndTurn: () => void;
  canBuildRoad: boolean;
  canBuildSettlement: boolean;
  canBuildCity: boolean;
}

const TurnControls: React.FC<TurnControlsProps> = ({
  currentPlayer,
  diceRoll,
  onRollDice,
  onBuildRoad,
  onBuildSettlement,
  onBuildCity,
  onEndTurn,
  canBuildRoad,
  canBuildSettlement,
  canBuildCity
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Turn Actions</h2>
      
      <div className="flex flex-col space-y-3">
        {/* Dice roll */}
        <div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={onRollDice}
          >
            Roll Dice
          </button>
          
          {diceRoll && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold">
                {diceRoll[0]}
              </div>
              <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-bold">
                {diceRoll[1]}
              </div>
              <span className="text-xl font-bold">=</span>
              <span className="text-xl font-bold">{diceRoll[0] + diceRoll[1]}</span>
            </div>
          )}
        </div>
      
        {/* Build actions */}
        <div className="grid grid-cols-1 gap-2">
          <button
            className={`py-2 px-4 rounded font-semibold ${
              canBuildRoad 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onBuildRoad}
            disabled={!canBuildRoad}
          >
            Build Road 🛣️
          </button>
          
          <button
            className={`py-2 px-4 rounded font-semibold ${
              canBuildSettlement 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onBuildSettlement}
            disabled={!canBuildSettlement}
          >
            Build Settlement 🏠
          </button>
          
          <button
            className={`py-2 px-4 rounded font-semibold ${
              canBuildCity 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onBuildCity}
            disabled={!canBuildCity}
          >
            Build City 🏙️
          </button>
        </div>
        
        {/* End turn */}
        <button
          className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded"
          onClick={onEndTurn}
        >
          End Turn
        </button>
      </div>
    </div>
  );
};

export default TurnControls; 