import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import GameBoard from '../components/GameBoard/GameBoard';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  initializeGame,
  generateCatanBoard,
  rollDiceAndDistributeResources,
  advanceTurn,
  GameState,
  GamePhase,
  Player,
  Building,
  BuildingType,
  canBuild,
  BUILDING_COSTS
} from '../lib/gameModel';
import { v4 as uuidv4 } from 'uuid';

const Game = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showGamePanel, setShowGamePanel] = useState(true);
  const [buildingMode, setBuildingMode] = useState<BuildingType | null>(null);
  const [setupPhaseStep, setSetupPhaseStep] = useState<'settlement' | 'road' | null>(null);
  
  // Initialize game
  useEffect(() => {
    try {
      // Initialize game with default 4 players
      const newGame = initializeGame(4);
      
      // Generate a Catan board
      const tiles = generateCatanBoard();
      
      // Set up the game state
      setGameState({
        ...newGame,
        tiles
      });
      
      // Start setup phase with settlement placement
      setSetupPhaseStep('settlement');
      setBuildingMode(BuildingType.SETTLEMENT);
      
      // Simulate loading time
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to initialize game');
      setLoading(false);
    }
  }, []);
  
  // Game actions
  const handleRollDice = () => {
    if (!gameState) return;
    
    setGameState(rollDiceAndDistributeResources(gameState));
  };
  
  const handleEndTurn = () => {
    if (!gameState) return;
    
    // Clear building mode when ending turn
    setBuildingMode(null);
    
    // Update game state
    const updatedGameState = advanceTurn(gameState);
    setGameState(updatedGameState);
    
    // If we're still in setup phase, set the appropriate building mode
    if (updatedGameState.phase === 'setup') {
      setSetupPhaseStep('settlement');
      setBuildingMode(BuildingType.SETTLEMENT);
    } else {
      setSetupPhaseStep(null);
    }
  };
  
  // Handle retry if there's an error
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Reinitialize the game
    try {
      const newGame = initializeGame(4);
      const tiles = generateCatanBoard();
      setGameState({
        ...newGame,
        tiles
      });
      setSetupPhaseStep('settlement');
      setBuildingMode(BuildingType.SETTLEMENT);
      setTimeout(() => setLoading(false), 1000);
    } catch (err) {
      setError('Failed to reinitialize game');
      setLoading(false);
    }
  };
  
  // Toggle game panel visibility
  const toggleGamePanel = () => {
    setShowGamePanel(!showGamePanel);
  };
  
  // Toggle building mode
  const toggleBuildingMode = (type: BuildingType) => {
    if (!gameState) return;
    
    // In setup phase, don't allow manual building mode changes
    if (gameState.phase === 'setup') {
      return;
    }
    
    // If already in this building mode, turn it off
    if (buildingMode === type) {
      setBuildingMode(null);
      return;
    }
    
    // Check if player can afford this building type
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!canBuild(currentPlayer, type)) {
      // Show an error or notification that player can't afford this
      console.log(`Cannot afford to build ${type}`);
      return;
    }
    
    // Set building mode
    setBuildingMode(type);
  };
  
  // Handle building placement
  const handleBuildingPlaced = (building: Omit<Building, 'id'>) => {
    if (!gameState) return;
    
    // Create a new building with a unique ID
    const newBuilding: Building = {
      ...building,
      id: uuidv4()
    };
    
    // Debug: Log the new building
    console.log("New building placed:", newBuilding);
    
    // Update the game state with the new building
    const updatedGameState = { ...gameState };
    
    // Add the building
    updatedGameState.buildings = [...updatedGameState.buildings, newBuilding];
    
    // Debug: Log the updated buildings array
    console.log("Updated buildings array:", updatedGameState.buildings);
    
    // Handle setup phase special logic
    if (updatedGameState.phase === 'setup') {
      // In setup phase, players don't pay for buildings and must follow the sequence
      const playerIndex = updatedGameState.currentPlayerIndex;
      const player = { ...updatedGameState.players[playerIndex] };
      
      // Update available buildings
      if (building.type === BuildingType.SETTLEMENT) {
        player.buildings.settlements -= 1;
        player.points += 1;
        
        // After placing a settlement in setup, the next step is to place a road
        setSetupPhaseStep('road');
        setBuildingMode(BuildingType.ROAD);
        
        // Debug: Log the setup phase step change
        console.log("Setup phase step changed to road");
      } else if (building.type === BuildingType.ROAD) {
        player.buildings.roads -= 1;
        
        // Debug: Log the road placement
        console.log("Road placed in setup phase:", building);
        
        // After placing a road, the turn ends
        setSetupPhaseStep(null);
        setBuildingMode(null);
        
        // Update the player in the game state
        updatedGameState.players[playerIndex] = player;
        
        // Update game state and advance to next player
        setGameState(updatedGameState);
        handleEndTurn();
        return;
      }
      
      // Update the player in the game state
      updatedGameState.players[playerIndex] = player;
    } else {
      // Normal phase - deduct resources from the player
      const playerIndex = updatedGameState.currentPlayerIndex;
      const player = { ...updatedGameState.players[playerIndex] };
      const costs = BUILDING_COSTS[building.type];
      
      // Update resources
      player.resources = {
        brick: player.resources.brick - costs.brick,
        wood: player.resources.wood - costs.wood,
        sheep: player.resources.sheep - costs.sheep,
        wheat: player.resources.wheat - costs.wheat,
        ore: player.resources.ore - costs.ore
      };
      
      // Update available buildings
      if (building.type === BuildingType.SETTLEMENT) {
        player.buildings.settlements -= 1;
        // Add a point for the settlement
        player.points += 1;
      } else if (building.type === BuildingType.CITY) {
        player.buildings.cities -= 1;
        player.buildings.settlements += 1; // Return a settlement piece
        // Add a point for upgrading to a city (settlements are already worth 1)
        player.points += 1;
      } else if (building.type === BuildingType.ROAD) {
        player.buildings.roads -= 1;
      }
      
      // Update the player in the game state
      updatedGameState.players[playerIndex] = player;
      
      // Exit building mode
      setBuildingMode(null);
    }
    
    // Update game state
    setGameState(updatedGameState);
  };
  
  // Check if a building can be placed at a specific location
  const canPlaceBuilding = (type: BuildingType, locationId: string): boolean => {
    if (!gameState) return false;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // In setup phase, enforce the correct building sequence
    if (gameState.phase === 'setup') {
      // Only allow the current setup step
      if (setupPhaseStep === 'settlement' && type !== BuildingType.SETTLEMENT) {
        return false;
      }
      if (setupPhaseStep === 'road' && type !== BuildingType.ROAD) {
        return false;
      }
      
      // For roads in setup phase, they must be connected to the just-placed settlement
      if (type === BuildingType.ROAD && setupPhaseStep === 'road') {
        // Find the last settlement placed by this player
        const playerSettlements = gameState.buildings.filter(
          b => b.playerId === currentPlayer.id && b.type === BuildingType.SETTLEMENT
        );
        
        if (playerSettlements.length > 0) {
          const lastSettlement = playerSettlements[playerSettlements.length - 1];
          
          // Check if the road is connected to the last settlement
          // This is a simplified check - in a real game, you'd need to check if the edge
          // is connected to the vertex of the last settlement
          // For now, we'll just allow any road placement in setup
          return true;
        }
      }
    } else {
      // First check if player can afford it
      if (!canBuild(currentPlayer, type)) {
        return false;
      }
    }
    
    // Check if there's already a building at this location
    const existingBuilding = gameState.buildings.find(b => 
      (type === BuildingType.ROAD && b.edgeId === locationId) || 
      ((type === BuildingType.SETTLEMENT || type === BuildingType.CITY) && b.vertexId === locationId)
    );
    
    if (existingBuilding) {
      // If it's a settlement and we're trying to build a city, check if it's our settlement
      if (type === BuildingType.CITY && 
          existingBuilding.type === BuildingType.SETTLEMENT && 
          existingBuilding.playerId === currentPlayer.id) {
        return true;
      }
      return false;
    }
    
    // For settlements and cities, check distance rule (no adjacent settlements)
    if (type === BuildingType.SETTLEMENT || type === BuildingType.CITY) {
      // This is handled in TileManager component with the hasNearbyBuilding function
      return true;
    }
    
    // For roads, check connectivity to existing roads or settlements
    if (type === BuildingType.ROAD) {
      // This is a simplified check - in a real game, you'd need to check if the road
      // connects to an existing road or settlement owned by the player
      
      // For now, we'll just allow road placement
      return true;
    }
    
    return true;
  };
  
  // Get the current player for display
  const currentPlayer = gameState ? gameState.players[gameState.currentPlayerIndex] : null;
  
  // Get setup phase instructions
  const getSetupPhaseInstructions = () => {
    if (!gameState || gameState.phase !== 'setup') return null;
    
    const round = gameState.round;
    const playerName = currentPlayer ? currentPlayer.name : '';
    
    if (setupPhaseStep === 'settlement') {
      return `${playerName}: Place your ${round === 1 ? 'first' : 'second'} settlement`;
    } else if (setupPhaseStep === 'road') {
      return `${playerName}: Place a road connected to your settlement`;
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (error || !gameState || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <ErrorMessage
          title="Game Error"
          message={error || 'Game state not initialized'}
          onRetry={handleRetry}
        />
      </div>
    );
  }
  
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Head>
        <title>Hexigo - Game</title>
        <meta name="description" content="Play Hexigo, a hexagonal tile-based strategy game" />
      </Head>
      
      {/* Header is now fixed at the top */}
      <header className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-2 shadow-md z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold">Hexigo</h1>
        <div className="flex space-x-2">
          <button
            onClick={toggleGamePanel}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
          >
            {showGamePanel ? 'Hide Panel' : 'Show Panel'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
          >
            Menu
          </button>
        </div>
      </header>
      
      {/* Setup phase instructions */}
      {gameState.phase === 'setup' && (
        <div className="fixed top-16 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-center z-10">
          {getSetupPhaseInstructions()}
        </div>
      )}
      
      {/* Game board takes the full screen */}
      <div className="w-full h-full">
        <GameBoard 
          showHotspots={buildingMode !== null} 
          initialTiles={gameState.tiles}
          buildings={gameState.buildings}
          currentPlayerId={currentPlayer.id}
          buildingMode={buildingMode}
          onBuildingPlaced={handleBuildingPlaced}
          canPlaceBuilding={canPlaceBuilding}
          isEditable={false}
        />
      </div>
      
      {/* Building controls - fixed at the bottom */}
      {gameState.phase !== 'setup' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg shadow-md p-2 z-10 flex space-x-2">
          <button
            onClick={() => toggleBuildingMode(BuildingType.ROAD)}
            className={`px-3 py-2 rounded-md ${
              buildingMode === BuildingType.ROAD 
                ? 'bg-green-600 text-white' 
                : canBuild(currentPlayer, BuildingType.ROAD)
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canBuild(currentPlayer, BuildingType.ROAD)}
          >
            Road
          </button>
          <button
            onClick={() => toggleBuildingMode(BuildingType.SETTLEMENT)}
            className={`px-3 py-2 rounded-md ${
              buildingMode === BuildingType.SETTLEMENT 
                ? 'bg-green-600 text-white' 
                : canBuild(currentPlayer, BuildingType.SETTLEMENT)
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canBuild(currentPlayer, BuildingType.SETTLEMENT)}
          >
            Settlement
          </button>
          <button
            onClick={() => toggleBuildingMode(BuildingType.CITY)}
            className={`px-3 py-2 rounded-md ${
              buildingMode === BuildingType.CITY 
                ? 'bg-green-600 text-white' 
                : canBuild(currentPlayer, BuildingType.CITY)
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canBuild(currentPlayer, BuildingType.CITY)}
          >
            City
          </button>
          {buildingMode && (
            <button
              onClick={() => setBuildingMode(null)}
              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      
      {/* Game controls panel slides in from the right */}
      <div 
        className={`fixed top-12 right-0 bottom-0 bg-white shadow-lg z-10 transition-transform duration-300 ease-in-out transform ${
          showGamePanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '300px', maxWidth: '90vw' }}
      >
        <div className="h-full overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Game Info</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Phase:</div>
              <div className="font-medium capitalize">{gameState.phase}</div>
              
              <div className="text-gray-600">Round:</div>
              <div className="font-medium">{gameState.round}</div>
              
              <div className="text-gray-600">Current Player:</div>
              <div className="font-medium flex items-center">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: currentPlayer.color }}
                ></span>
                {currentPlayer.name}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Resources</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Brick:</div>
              <div className="font-medium">{currentPlayer.resources.brick}</div>
              
              <div className="text-gray-600">Wood:</div>
              <div className="font-medium">{currentPlayer.resources.wood}</div>
              
              <div className="text-gray-600">Sheep:</div>
              <div className="font-medium">{currentPlayer.resources.sheep}</div>
              
              <div className="text-gray-600">Wheat:</div>
              <div className="font-medium">{currentPlayer.resources.wheat}</div>
              
              <div className="text-gray-600">Ore:</div>
              <div className="font-medium">{currentPlayer.resources.ore}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Buildings</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Settlements:</div>
              <div className="font-medium">{currentPlayer.buildings.settlements}</div>
              
              <div className="text-gray-600">Cities:</div>
              <div className="font-medium">{currentPlayer.buildings.cities}</div>
              
              <div className="text-gray-600">Roads:</div>
              <div className="font-medium">{currentPlayer.buildings.roads}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Actions</h2>
            <div className="space-y-2">
              {gameState.phase === 'main' && (
                <button
                  onClick={handleRollDice}
                  disabled={gameState.dice !== null}
                  className={`w-full py-2 px-4 rounded-md ${
                    gameState.dice === null 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Roll Dice
                </button>
              )}
              
              {gameState.dice && (
                <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
                  Dice: {gameState.dice.die1} + {gameState.dice.die2} = {gameState.dice.die1 + gameState.dice.die2}
                </div>
              )}
              
              <button
                onClick={handleEndTurn}
                disabled={gameState.phase === 'setup' && setupPhaseStep !== null}
                className={`w-full py-2 px-4 ${
                  gameState.phase === 'setup' && setupPhaseStep !== null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } rounded-md`}
              >
                {gameState.phase === 'setup' ? 'Skip Turn' : 'End Turn'}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Players</h2>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <div 
                  key={player.id}
                  className={`p-2 rounded-md flex justify-between ${
                    player.id === currentPlayer.id ? 'bg-blue-100' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: player.color }}
                    ></span>
                    {player.name}
                  </div>
                  <div className="font-bold">{player.points} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game; 