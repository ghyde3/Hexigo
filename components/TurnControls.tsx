import React, { useState, useEffect, useRef } from 'react';
import { Player, StructureType } from '../lib/types';

interface TurnControlsProps {
  currentPlayer: Player;
  diceRoll?: [number, number];
  onRollDice: () => void;
  onBuildRoad: () => void;
  onBuildSettlement: () => void;
  onBuildCity: () => void;
  onEndTurn: () => void;
  onEndGame: () => void;
  canBuildRoad: boolean;
  canBuildSettlement: boolean;
  canBuildCity: boolean;
  position?: { x: number; y: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
  turnTimeLimit?: number; // Time limit in seconds
  onTimeExpired?: () => void; // Callback when time expires
}

const TurnControls: React.FC<TurnControlsProps> = ({
  currentPlayer,
  diceRoll,
  onRollDice,
  onBuildRoad,
  onBuildSettlement,
  onBuildCity,
  onEndTurn,
  onEndGame,
  canBuildRoad,
  canBuildSettlement,
  canBuildCity,
  position = { x: window.innerWidth / 2 - 150, y: window.innerHeight - 200 },
  onDragEnd,
  turnTimeLimit = 120, // Default 2 minutes
  onTimeExpired
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [timeRemaining, setTimeRemaining] = useState(turnTimeLimit);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [showDiceAnimation, setShowDiceAnimation] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

  // Initialize or reset timer when player changes or turn ends
  useEffect(() => {
    setTimeRemaining(turnTimeLimit);
    setIsTimerActive(true);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentPlayer.id, turnTimeLimit]);

  // Handle timer countdown
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerActive(false);
            if (onTimeExpired) {
              onTimeExpired();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, onTimeExpired]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle dice roll with animation
  const handleRollDice = () => {
    setShowDiceAnimation(true);
    setCurrentAction('rolling');
    
    // Simulate dice rolling animation
    setTimeout(() => {
      onRollDice();
      setShowDiceAnimation(false);
      setCurrentAction(null);
    }, 1000);
  };

  // Handle building actions
  const handleBuildAction = (action: string, callback: () => void) => {
    setCurrentAction(action);
    callback();
    // Reset action after a delay
    setTimeout(() => {
      setCurrentAction(null);
    }, 500);
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
      {/* Header with drag handle and timer */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between drag-handle cursor-move">
        <h2 className="text-lg font-semibold">Turn Actions</h2>
        <div className={`px-2 py-1 rounded text-sm font-mono ${
          timeRemaining < 30 ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
        }`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Current action indicator */}
        {currentAction && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 text-sm">
            {currentAction === 'rolling' ? 'Rolling dice...' : 
             currentAction === 'road' ? 'Building road...' :
             currentAction === 'settlement' ? 'Building settlement...' :
             currentAction === 'city' ? 'Building city...' : currentAction}
          </div>
        )}
        
        {/* Dice roll */}
        <div>
          <button
            className={`w-full ${
              showDiceAnimation 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-bold py-3 px-4 rounded transition-colors`}
            onClick={handleRollDice}
            disabled={showDiceAnimation}
          >
            {showDiceAnimation ? 'Rolling...' : 'Roll Dice'}
          </button>
          
          {diceRoll && (
            <div className="mt-3 flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md">
                {diceRoll[0]}
              </div>
              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md">
                {diceRoll[1]}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold">=</span>
                <span className="text-xl font-bold">{diceRoll[0] + diceRoll[1]}</span>
              </div>
            </div>
          )}
        </div>
      
        {/* Build actions */}
        <div className="grid grid-cols-1 gap-2">
          <button
            className={`py-2 px-4 rounded font-semibold flex items-center justify-center ${
              canBuildRoad 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'road' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildRoad && handleBuildAction('road', onBuildRoad)}
            disabled={!canBuildRoad}
          >
            <span className="mr-2">🛣️</span>
            Build Road
          </button>
          
          <button
            className={`py-2 px-4 rounded font-semibold flex items-center justify-center ${
              canBuildSettlement 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'settlement' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildSettlement && handleBuildAction('settlement', onBuildSettlement)}
            disabled={!canBuildSettlement}
          >
            <span className="mr-2">🏠</span>
            Build Settlement
          </button>
          
          <button
            className={`py-2 px-4 rounded font-semibold flex items-center justify-center ${
              canBuildCity 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'city' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildCity && handleBuildAction('city', onBuildCity)}
            disabled={!canBuildCity}
          >
            <span className="mr-2">🏙️</span>
            Build City
          </button>
        </div>
        
        {/* End turn and End game buttons */}
        <div className="flex space-x-2">
          <button
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            onClick={onEndTurn}
          >
            End Turn
          </button>
          <button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            onClick={onEndGame}
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurnControls; 