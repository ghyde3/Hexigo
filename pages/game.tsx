import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import GameBoard from '../components/GameBoard';
import PlayerPanel from '../components/PlayerPanel';
import TurnControls from '../components/TurnControls';
import CatanGame from '../lib/game';
import { canBuild, rollDice } from '../lib/utils';
import { StructureType, CatanState, Player } from '../lib/types';

// Number of players in the game
const NUM_PLAYERS = 4;

// The core game component that houses the game board and UI
const CatanGameComponent: React.FC<{
  G: CatanState;
  ctx: any;
  moves: any;
  events: any;
  gameMetadata: any;
}> = ({ G, ctx, moves, events, gameMetadata }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(0);
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
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Catan Game</title>
        <meta name="description" content="A Settlers of Catan game" />
      </Head>
      
      <header className="bg-white shadow py-2">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800">Settlers of Catan</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-2 py-2 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-12 gap-2 h-full">
          {/* Left sidebar - Player panel */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2 bg-white rounded-lg shadow p-3 overflow-auto">
            <PlayerPanel 
              players={G.players}
              currentPlayer={selectedPlayer}
              onPlayerChange={handlePlayerChange}
              onAddResources={handleAddResources}
            />
          </div>
          
          {/* Center - Game board */}
          <div className="col-span-12 md:col-span-6 lg:col-span-8 bg-white rounded-lg shadow p-2 flex items-center justify-center h-[60vh] md:h-full">
            <GameBoard 
              tiles={G.tiles} 
              structures={G.structures}
              onTileClick={handleTileClick}
            />
          </div>
          
          {/* Right sidebar - Turn controls */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2 bg-white rounded-lg shadow p-3 overflow-auto">
            <TurnControls 
              currentPlayer={currentPlayer}
              diceRoll={G.lastRoll ? [G.lastRoll.die1, G.lastRoll.die2] : undefined}
              onRollDice={handleRollDice}
              onBuildRoad={handleBuildRoad}
              onBuildSettlement={handleBuildSettlement}
              onBuildCity={handleBuildCity}
              onEndTurn={handleEndTurn}
              canBuildRoad={canBuildRoad}
              canBuildSettlement={canBuildSettlement}
              canBuildCity={canBuildCity}
            />
          </div>
        </div>
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
    return <div className="flex justify-center items-center min-h-screen">Loading Catan...</div>;
  }
  
  return <CatanClient playerID="0" />;
};

export default GamePage; 