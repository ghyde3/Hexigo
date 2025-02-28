import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import GameBoard from '../components/GameBoard';
import CatanGame from '../lib/game';
import { canBuild, rollDice } from '../lib/utils';
import { StructureType, CatanState, Player } from '../lib/types';

// Number of players in the game
const NUM_PLAYERS = 4;

// Player colors with proper styling to match mockup
const PLAYER_COLORS = [
  { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-300' },
  { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' }
];

// Resource icons and colors
const RESOURCES = [
  { name: 'brick', icon: '🧱', color: 'bg-brick' },
  { name: 'wood', icon: '🌲', color: 'bg-wood' },
  { name: 'sheep', icon: '🐑', color: 'bg-sheep' },
  { name: 'wheat', icon: '🌾', color: 'bg-wheat' },
  { name: 'ore', icon: '⛏️', color: 'bg-ore' }
];

// The core game component that houses the game board and UI
const CatanGameComponent: React.FC<{
  G: CatanState;
  ctx: any;
  moves: any;
  events: any;
  gameMetadata: any;
}> = ({ G, ctx, moves, events, gameMetadata }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [playersBarPosition, setPlayersBarPosition] = useState({ x: window.innerWidth / 2, y: 100 });
  const [playersBarOrientation, setPlayersBarOrientation] = useState<'vertical' | 'horizontal'>('horizontal');
  const [toolbarPosition, setToolbarPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight - 80 });
  const [toolbarOrientation, setToolbarOrientation] = useState<'vertical' | 'horizontal'>('horizontal');
  
  // Dragging state
  const [isDraggingPlayersBar, setIsDraggingPlayersBar] = useState(false);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs for the UI elements
  const playersBarRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const currentPlayer = G.players[selectedPlayer];
  
  // Determine if the current player can build each structure type
  const canBuildRoad = canBuild(currentPlayer, StructureType.Road);
  const canBuildSettlement = canBuild(currentPlayer, StructureType.Settlement);
  const canBuildCity = canBuild(currentPlayer, StructureType.City);
  
  // Handle player switching (local multiplayer simulation)
  const handlePlayerChange = (playerIndex: number) => {
    setSelectedPlayer(playerIndex);
    events.setActivePlayers({ value: { [playerIndex]: 'play' } });
  };
  
  // Handle tile clicks (for building)
  const handleTileClick = (tile: any) => {
    if (isEditMode) return; // Disable tile clicks in edit mode
    
    // In a full implementation, this would handle placing structures on/near tiles
    console.log('Tile clicked:', tile);
  };
  
  // Handle dice rolling
  const handleRollDice = () => {
    moves.rollDice();
  };
  
  // Handle building a road
  const handleBuildRoad = () => {
    // For POC, just place a road at a fixed location
    // In a complete implementation, we would prompt the user to select an edge
    const roadCoordinates = {
      q: 0,
      r: 0,
      s: 0,
      direction: 0
    };
    moves.buildRoad(roadCoordinates);
  };
  
  // Handle building a settlement
  const handleBuildSettlement = () => {
    // For POC, just place a settlement at a fixed location
    // In a complete implementation, we would prompt the user to select a vertex
    const settlementCoordinates = {
      q: 0,
      r: 0,
      s: 0,
      direction: 0
    };
    moves.buildSettlement(settlementCoordinates);
  };
  
  // Handle building a city (upgrading a settlement)
  const handleBuildCity = () => {
    // For POC, find the first settlement and upgrade it
    // In a complete implementation, we would prompt the user to select a settlement
    const settlement = G.structures.find(
      s => s.type === StructureType.Settlement && s.playerId === String(selectedPlayer)
    );
    
    if (settlement) {
      moves.buildCity(settlement.id);
    }
  };
  
  // Handle ending the turn
  const handleEndTurn = () => {
    events.endTurn();
    // Auto-switch to the next player for local play
    const nextPlayer = (selectedPlayer + 1) % NUM_PLAYERS;
    setSelectedPlayer(nextPlayer);
  };
  
  // Handle adding resources (for development/testing)
  const handleAddResources = () => {
    moves.addResources(3); // Add 3 of each resource
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Toggle players bar orientation
  const togglePlayersBarOrientation = () => {
    setPlayersBarOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  };

  // Toggle toolbar orientation
  const toggleToolbarOrientation = () => {
    setToolbarOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  };

  // Start dragging the players bar
  const startDraggingPlayersBar = (e: React.MouseEvent) => {
    if (playersBarRef.current) {
      const rect = playersBarRef.current.getBoundingClientRect();
      setIsDraggingPlayersBar(true);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  // Start dragging the toolbar
  const startDraggingToolbar = (e: React.MouseEvent) => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      setIsDraggingToolbar(true);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPlayersBar) {
      setPlayersBarPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    } else if (isDraggingToolbar) {
      setToolbarPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  // Stop dragging
  const stopDragging = () => {
    setIsDraggingPlayersBar(false);
    setIsDraggingToolbar(false);
  };

  // Add global mouse up listener to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingPlayersBar(false);
      setIsDraggingToolbar(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Get player bar classes
  const getPlayerBarClasses = () => {
    const baseClasses = "flex gap-2 bg-white shadow-lg z-20 absolute rounded-lg p-2";
    return `${baseClasses} ${playersBarOrientation === 'vertical' ? 'flex-col' : 'flex-row'}`;
  };

  // Get toolbar classes
  const getToolbarClasses = () => {
    const baseClasses = "bg-white shadow-lg p-3 z-10 absolute rounded-lg";
    return baseClasses;
  };

  // Get toolbar content classes
  const getToolbarContentClasses = () => {
    return toolbarOrientation === 'vertical' 
      ? "flex flex-col gap-3" 
      : "flex flex-wrap justify-between items-center";
  };
  
  return (
    <div 
      className="min-h-screen bg-blue-500"
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
    >
      <Head>
        <title>Hexigo</title>
        <meta name="description" content="A Settlers of Catan inspired game" />
      </Head>
      
      {!isEditMode && (
        <>
          {/* Players bar */}
          <div 
            ref={playersBarRef}
            className={getPlayerBarClasses()}
            style={{
              left: `${playersBarPosition.x}px`,
              top: `${playersBarPosition.y}px`,
              transition: isDraggingPlayersBar ? 'none' : 'all 0.2s ease-out',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Drag handle for players bar */}
            <div 
              className="absolute -top-3 left-0 right-0 h-6 flex justify-center items-center cursor-move"
              onMouseDown={startDraggingPlayersBar}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Player quick select buttons */}
            {Array.from({ length: NUM_PLAYERS }).map((_, index) => (
              <div key={index} className="relative">
                <button
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-md transition-transform ${
                    selectedPlayer === index 
                      ? 'scale-110 border-2 border-yellow-400' 
                      : ''
                  } ${PLAYER_COLORS[index].bg} ${PLAYER_COLORS[index].text}`}
                  onClick={() => handlePlayerChange(index)}
                >
                  P{index + 1}
                </button>
              </div>
            ))}
            
            {/* Controls for players bar */}
            <div className="flex justify-center mt-1">
              <button 
                onClick={togglePlayersBarOrientation}
                className="p-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300"
                title={`Switch to ${playersBarOrientation === 'vertical' ? 'horizontal' : 'vertical'} layout`}
              >
                {playersBarOrientation === 'vertical' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Game toolbar */}
          <div 
            ref={toolbarRef}
            className={getToolbarClasses()}
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
              transform: 'translate(-50%, 0)',
              width: toolbarOrientation === 'vertical' ? 'auto' : 'min(90%, 800px)',
              transition: isDraggingToolbar ? 'none' : 'all 0.2s ease-out',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Drag handle for toolbar */}
            <div 
              className="absolute -top-3 left-0 right-0 h-6 flex justify-center items-center cursor-move"
              onMouseDown={startDraggingToolbar}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className={getToolbarContentClasses()}>
              {/* Player resources */}
              <div className="flex items-center gap-3">
                <div className={`font-bold text-lg ${PLAYER_COLORS[selectedPlayer].text}`}>
                  Player {selectedPlayer + 1}:
                </div>
                <div className="flex gap-2">
                  {RESOURCES.map(resource => (
                    <div key={resource.name} className={`${resource.color} text-white px-3 py-2 rounded-md flex items-center gap-1 shadow-sm`}>
                      <span className="text-xl">{resource.icon}</span>
                      <span className="font-medium">{currentPlayer.resources[resource.name]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Turn controls */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium shadow-sm"
                  onClick={handleRollDice}
                >
                  Roll Dice {G.lastRoll && `(${G.lastRoll.die1 + G.lastRoll.die2})`}
                </button>
                <button 
                  className={`px-4 py-2 rounded-md font-medium shadow-sm ${canBuildRoad ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`}
                  onClick={canBuildRoad ? handleBuildRoad : undefined}
                >
                  Build Road
                </button>
                <button 
                  className={`px-4 py-2 rounded-md font-medium shadow-sm ${canBuildSettlement ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`}
                  onClick={canBuildSettlement ? handleBuildSettlement : undefined}
                >
                  Build Settlement
                </button>
                <button 
                  className={`px-4 py-2 rounded-md font-medium shadow-sm ${canBuildCity ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`}
                  onClick={canBuildCity ? handleBuildCity : undefined}
                >
                  Build City
                </button>
                <button 
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium shadow-sm"
                  onClick={handleEndTurn}
                >
                  End Turn
                </button>
              </div>

              {/* Toolbar controls */}
              <div className="flex justify-center mt-2">
                <button 
                  onClick={toggleToolbarOrientation}
                  className="p-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300"
                  title={`Switch to ${toolbarOrientation === 'vertical' ? 'horizontal' : 'vertical'} layout`}
                >
                  {toolbarOrientation === 'vertical' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      <main className="w-full h-screen">
        <GameBoard 
          tiles={G.tiles} 
          onTileClick={handleTileClick}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
        />
      </main>
    </div>
  );
};

// Create the Boardgame.io client
const CatanClient = Client({
  game: CatanGame,
  numPlayers: NUM_PLAYERS,
  board: CatanGameComponent,
  multiplayer: Local(),  // Local multiplayer (no server needed)
  debug: false           // Set to true to enable the debug panel (useful during development)
});

// The main game page that renders the Boardgame.io client
const GamePage: React.FC = () => {
  // Use client-side rendering for Boardgame.io
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Save the game state to localStorage whenever it changes
    const handleBeforeUnload = () => {
      // Implement localStorage persistence if needed
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  if (!mounted) {
    return <div className="flex justify-center items-center min-h-screen">Loading Hexigo...</div>;
  }
  
  return <CatanClient playerID="0" />;
};

export default GamePage; 