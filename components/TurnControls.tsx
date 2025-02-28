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
  lastRollTime?: number; // Added to force re-renders
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
  onTimeExpired,
  lastRollTime
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  const [timeRemaining, setTimeRemaining] = useState(turnTimeLimit);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [showDiceAnimation, setShowDiceAnimation] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem('turnControlsCompactMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [horizontalLayout, setHorizontalLayout] = useState(() => {
    const saved = localStorage.getItem('turnControlsHorizontalLayout');
    return saved ? JSON.parse(saved) : false;
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

  // Save compact mode and layout orientation to localStorage when they change
  useEffect(() => {
    localStorage.setItem('turnControlsCompactMode', JSON.stringify(compactMode));
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('turnControlsHorizontalLayout', JSON.stringify(horizontalLayout));
  }, [horizontalLayout]);
  
  // Log when diceRoll or lastRollTime changes to debug re-rendering
  useEffect(() => {
    console.log("TurnControls - diceRoll changed:", diceRoll);
  }, [diceRoll]);
  
  useEffect(() => {
    console.log("TurnControls - lastRollTime changed:", lastRollTime);
    // This will force a component update when lastRollTime changes
  }, [lastRollTime]);

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

  // Toggle compact mode
  const toggleCompactMode = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setCompactMode(!compactMode);
  };

  // Toggle layout orientation
  const toggleLayoutOrientation = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    setHorizontalLayout(!horizontalLayout);
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ 
        width: horizontalLayout 
          ? (compactMode ? '400px' : '600px') 
          : (compactMode ? '80px' : '300px'),
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
        {!compactMode && <h2 className="text-lg font-semibold">Turn Actions</h2>}
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded text-sm font-mono ${
            timeRemaining < 30 ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
      
      <div className={`${compactMode ? 'p-2' : 'p-4'} ${horizontalLayout ? 'flex flex-wrap' : ''}`}>
        {/* Current action indicator */}
        {currentAction && !compactMode && (
          <div className={`bg-blue-50 border-l-4 border-blue-500 p-2 text-sm ${horizontalLayout ? 'w-full mb-2' : ''}`}>
            {currentAction === 'rolling' ? 'Rolling dice...' : 
             currentAction === 'road' ? 'Building road...' :
             currentAction === 'settlement' ? 'Building settlement...' :
             currentAction === 'city' ? 'Building city...' : currentAction}
          </div>
        )}
        
        {/* Dice roll */}
        <div className={horizontalLayout ? 'mr-4 mb-2' : 'mb-4'}>
          <button
            className={`${
              showDiceAnimation 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-bold ${compactMode ? 'py-2 px-2' : 'py-3 px-4'} rounded transition-colors flex items-center justify-center`}
            onClick={handleRollDice}
            disabled={showDiceAnimation}
            style={{ width: horizontalLayout && !compactMode ? '120px' : '100%' }}
          >
            <span className="text-xl">🎲</span>
            {!compactMode && <span className="ml-2">{showDiceAnimation ? 'Rolling...' : 'Roll Dice'}</span>}
          </button>
          
          {diceRoll && !compactMode && (
            <div className="mt-3 flex items-center justify-center space-x-4">
              {/* Log dice roll data for debugging */}
              {console.log("Rendering dice:", diceRoll) || null}
              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md">
                {diceRoll && Array.isArray(diceRoll) && diceRoll[0] !== undefined ? diceRoll[0] : '-'}
              </div>
              <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md">
                {diceRoll && Array.isArray(diceRoll) && diceRoll[1] !== undefined ? diceRoll[1] : '-'}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold">=</span>
                <span className="text-xl font-bold">
                  {diceRoll && Array.isArray(diceRoll) && 
                   typeof diceRoll[0] === 'number' && 
                   typeof diceRoll[1] === 'number' 
                    ? diceRoll[0] + diceRoll[1] 
                    : '-'}
                </span>
              </div>
            </div>
          )}
          
          {diceRoll && compactMode && (
            <div className="mt-2 flex items-center justify-center">
              <span className="text-lg font-bold">
                {diceRoll && Array.isArray(diceRoll) && 
                 typeof diceRoll[0] === 'number' && 
                 typeof diceRoll[1] === 'number' 
                  ? diceRoll[0] + diceRoll[1] 
                  : '-'}
              </span>
            </div>
          )}
        </div>
      
        {/* Build actions */}
        <div className={`${horizontalLayout ? 'flex flex-wrap' : 'grid grid-cols-1'} gap-2`}>
          <button
            className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center ${
              canBuildRoad 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'road' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildRoad && handleBuildAction('road', onBuildRoad)}
            disabled={!canBuildRoad}
            style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
          >
            <span className={compactMode ? '' : 'mr-2'}>🛣️</span>
            {!compactMode && <span>Build Road</span>}
          </button>
          
          <button
            className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center ${
              canBuildSettlement 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'settlement' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildSettlement && handleBuildAction('settlement', onBuildSettlement)}
            disabled={!canBuildSettlement}
            style={{ width: horizontalLayout && !compactMode ? '150px' : 'auto' }}
          >
            <span className={compactMode ? '' : 'mr-2'}>🏠</span>
            {!compactMode && <span>Build Settlement</span>}
          </button>
          
          <button
            className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center ${
              canBuildCity 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            } ${currentAction === 'city' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => canBuildCity && handleBuildAction('city', onBuildCity)}
            disabled={!canBuildCity}
            style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
          >
            <span className={compactMode ? '' : 'mr-2'}>🏙️</span>
            {!compactMode && <span>Build City</span>}
          </button>
          
          <button
            className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white`}
            onClick={onEndTurn}
            style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
          >
            <span className={compactMode ? '' : 'mr-2'}>⏭️</span>
            {!compactMode && <span>End Turn</span>}
          </button>
          
          <button
            className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center bg-red-600 hover:bg-red-700 text-white`}
            onClick={onEndGame}
            style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
          >
            <span className={compactMode ? '' : 'mr-2'}>🏁</span>
            {!compactMode && <span>End Game</span>}
          </button>
          
          {/* Control buttons moved here for better accessibility */}
          <div className={`${horizontalLayout ? 'flex' : 'grid grid-cols-2'} gap-2 mt-2 w-full`}>
            <button 
              className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white`}
              onClick={toggleCompactMode}
              title={compactMode ? "Expand Panel" : "Collapse Panel"}
              style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
            >
              <span className="text-xl">{compactMode ? '↔️' : '↕️'}</span>
              {!compactMode && <span className="ml-2">{compactMode ? "Expand" : "Collapse"}</span>}
            </button>
            
            <button 
              className={`${compactMode ? 'py-2 px-2' : 'py-2 px-4'} rounded font-semibold flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white`}
              onClick={toggleLayoutOrientation}
              title={horizontalLayout ? "Switch to Vertical Layout" : "Switch to Horizontal Layout"}
              style={{ width: horizontalLayout && !compactMode ? '120px' : 'auto' }}
            >
              <span className="text-xl">{horizontalLayout ? '↕️' : '↔️'}</span>
              {!compactMode && <span className="ml-2">{horizontalLayout ? "Vertical" : "Horizontal"}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnControls; 