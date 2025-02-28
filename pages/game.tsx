import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import GameBoard from '../components/GameBoard';
import PlayerPanel from '../components/PlayerPanel';
import TurnControls from '../components/TurnControls';
import GameLog, { LogEntry, LogEntryType } from '../components/GameLog';
import BankPanel, { DevelopmentCardType } from '../components/BankPanel';
import EndGameModal from '../components/EndGameModal';
import CatanGame, { createInitialState } from '../lib/game';
import { canBuild, rollDice, hasAccessToPort, getTradingRatio } from '../lib/utils';
import { StructureType, CatanState, Player, ResourceType } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

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

// Initial bank resources
const INITIAL_BANK_RESOURCES = {
  [ResourceType.Brick]: 19,
  [ResourceType.Wood]: 19,
  [ResourceType.Sheep]: 19,
  [ResourceType.Wheat]: 19,
  [ResourceType.Ore]: 19,
};

// Initial development cards
const INITIAL_DEVELOPMENT_CARDS = {
  [DevelopmentCardType.Knight]: 14,
  [DevelopmentCardType.VictoryPoint]: 5,
  [DevelopmentCardType.RoadBuilding]: 2,
  [DevelopmentCardType.YearOfPlenty]: 2,
  [DevelopmentCardType.Monopoly]: 2,
};

// The core game component that houses the game board and UI
const CatanGameComponent: React.FC<{
  G: CatanState;
  ctx: any;
  moves: any;
  events: any;
  gameMetadata: any;
  reset: () => void;
}> = ({ G, ctx, moves, events, gameMetadata, reset }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Panel positions with default values
  const [playerPanelPosition, setPlayerPanelPosition] = useState({ x: 20, y: 20 });
  const [turnControlsPosition, setTurnControlsPosition] = useState({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 200 });
  const [gameLogPosition, setGameLogPosition] = useState({ x: window.innerWidth - 320, y: 20 });
  const [bankPanelPosition, setBankPanelPosition] = useState({ x: 20, y: window.innerHeight - 400 });
  
  // Add state for the end game modal
  const [isEndGameModalOpen, setIsEndGameModalOpen] = useState(false);
  
  // Load panel positions from localStorage on component mount
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      try {
        const savedPlayerPanelPosition = localStorage.getItem('playerPanelPosition');
        const savedTurnControlsPosition = localStorage.getItem('turnControlsPosition');
        const savedGameLogPosition = localStorage.getItem('gameLogPosition');
        const savedBankPanelPosition = localStorage.getItem('bankPanelPosition');
        const savedSelectedPlayer = localStorage.getItem('catanSelectedPlayer');
        
        if (savedPlayerPanelPosition) {
          setPlayerPanelPosition(JSON.parse(savedPlayerPanelPosition));
        }
        if (savedTurnControlsPosition) {
          setTurnControlsPosition(JSON.parse(savedTurnControlsPosition));
        }
        if (savedGameLogPosition) {
          setGameLogPosition(JSON.parse(savedGameLogPosition));
        }
        if (savedBankPanelPosition) {
          setBankPanelPosition(JSON.parse(savedBankPanelPosition));
        }
        if (savedSelectedPlayer) {
          const selectedPlayerIndex = parseInt(savedSelectedPlayer, 10);
          setSelectedPlayer(selectedPlayerIndex);
        }
      } catch (error) {
        console.error('Error loading panel positions from localStorage:', error);
      }
    }
  }, []);
  
  // Save panel positions to localStorage when they change
  const handlePlayerPanelDragEnd = (position: { x: number; y: number }) => {
    setPlayerPanelPosition(position);
    localStorage.setItem('playerPanelPosition', JSON.stringify(position));
  };
  
  const handleTurnControlsDragEnd = (position: { x: number; y: number }) => {
    setTurnControlsPosition(position);
    localStorage.setItem('turnControlsPosition', JSON.stringify(position));
  };
  
  const handleGameLogDragEnd = (position: { x: number; y: number }) => {
    setGameLogPosition(position);
    localStorage.setItem('gameLogPosition', JSON.stringify(position));
  };
  
  const handleBankPanelDragEnd = (position: { x: number; y: number }) => {
    setBankPanelPosition(position);
    localStorage.setItem('bankPanelPosition', JSON.stringify(position));
  };
  
  // Game state
  const [bankResources, setBankResources] = useState(() => {
    try {
      const savedBankResources = localStorage.getItem('catanBankResources');
      return savedBankResources ? JSON.parse(savedBankResources) : INITIAL_BANK_RESOURCES;
    } catch (error) {
      return INITIAL_BANK_RESOURCES;
    }
  });
  
  const [developmentCards, setDevelopmentCards] = useState(() => {
    try {
      const savedDevelopmentCards = localStorage.getItem('catanDevelopmentCards');
      return savedDevelopmentCards ? JSON.parse(savedDevelopmentCards) : INITIAL_DEVELOPMENT_CARDS;
    } catch (error) {
      return INITIAL_DEVELOPMENT_CARDS;
    }
  });
  
  const [playerDevelopmentCards, setPlayerDevelopmentCards] = useState<Record<number, Record<DevelopmentCardType, number>>>(() => {
    try {
      const savedPlayerDevelopmentCards = localStorage.getItem('catanPlayerDevelopmentCards');
      return savedPlayerDevelopmentCards ? JSON.parse(savedPlayerDevelopmentCards) : {};
    } catch (error) {
      return {};
    }
  });
  
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() => {
    try {
      const savedLogEntries = localStorage.getItem('catanLogEntries');
      if (savedLogEntries) {
        // Parse log entries and restore Date objects
        const entries = JSON.parse(savedLogEntries);
        return entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
      return [
        {
          id: uuidv4(),
          type: LogEntryType.SYSTEM,
          timestamp: new Date(),
          message: 'Game started'
        }
      ];
    } catch (error) {
      return [
        {
          id: uuidv4(),
          type: LogEntryType.SYSTEM,
          timestamp: new Date(),
          message: 'Game started'
        }
      ];
    }
  });
  
  const [hasLongestRoad, setHasLongestRoad] = useState<number | null>(() => {
    try {
      const savedLongestRoad = localStorage.getItem('catanLongestRoad');
      return savedLongestRoad ? JSON.parse(savedLongestRoad) : null;
    } catch (error) {
      return null;
    }
  });
  
  const [hasLargestArmy, setHasLargestArmy] = useState<number | null>(() => {
    try {
      const savedLargestArmy = localStorage.getItem('catanLargestArmy');
      return savedLargestArmy ? JSON.parse(savedLargestArmy) : null;
    } catch (error) {
      return null;
    }
  });
  
  const [lastRollTime, setLastRollTime] = useState<number>(0);
  
  const currentPlayer = G.players[selectedPlayer];
  
  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('catanGameState', JSON.stringify(G));
      localStorage.setItem('catanGameMetadata', JSON.stringify({
        ctx,
        lastUpdateTime: new Date().toISOString()
      }));
    }
  }, [G, ctx]);
  
  // Save selected player to localStorage
  useEffect(() => {
    localStorage.setItem('catanSelectedPlayer', selectedPlayer.toString());
  }, [selectedPlayer]);
  
  // Save bank resources to localStorage
  useEffect(() => {
    localStorage.setItem('catanBankResources', JSON.stringify(bankResources));
  }, [bankResources]);
  
  // Save development cards to localStorage
  useEffect(() => {
    localStorage.setItem('catanDevelopmentCards', JSON.stringify(developmentCards));
  }, [developmentCards]);
  
  // Save player development cards to localStorage
  useEffect(() => {
    localStorage.setItem('catanPlayerDevelopmentCards', JSON.stringify(playerDevelopmentCards));
  }, [playerDevelopmentCards]);
  
  // Save log entries to localStorage
  useEffect(() => {
    localStorage.setItem('catanLogEntries', JSON.stringify(logEntries));
  }, [logEntries]);
  
  // Save longest road and largest army to localStorage
  useEffect(() => {
    localStorage.setItem('catanLongestRoad', JSON.stringify(hasLongestRoad));
  }, [hasLongestRoad]);
  
  useEffect(() => {
    localStorage.setItem('catanLargestArmy', JSON.stringify(hasLargestArmy));
  }, [hasLargestArmy]);
  
  // Force re-render when dice are rolled
  useEffect(() => {
    if (G.lastRoll) {
      console.log("Detected dice roll update:", G.lastRoll);
      // Log the actual values to see if they're valid numbers
      console.log("Die values:", {
        die1: G.lastRoll.die1, 
        die2: G.lastRoll.die2,
        sum: G.lastRoll.sum,
        isNum1: typeof G.lastRoll.die1 === 'number',
        isNum2: typeof G.lastRoll.die2 === 'number'
      });
      setLastRollTime(Date.now());
    }
  }, [G.lastRoll]);
  
  // Determine if the current player can build each structure type
  const canBuildRoad = canBuild(G, selectedPlayer, StructureType.Road);
  const canBuildSettlement = canBuild(G, selectedPlayer, StructureType.Settlement);
  const canBuildCity = canBuild(G, selectedPlayer, StructureType.City);
  
  // Check if player can buy development card
  const canBuyDevelopmentCard = Object.entries(currentPlayer.resources).every(([resource, count]) => {
    const requiredAmount = resource === ResourceType.Ore || resource === ResourceType.Sheep || resource === ResourceType.Wheat ? 1 : 0;
    return count >= requiredAmount;
  }) && Object.values(developmentCards).reduce((sum, count) => sum + count, 0) > 0;
  
  // Initialize player development cards
  useEffect(() => {
    const initialPlayerCards: Record<number, Record<DevelopmentCardType, number>> = {};
    
    G.players.forEach((_, index) => {
      initialPlayerCards[index] = {
        [DevelopmentCardType.Knight]: 0,
        [DevelopmentCardType.VictoryPoint]: 0,
        [DevelopmentCardType.RoadBuilding]: 0,
        [DevelopmentCardType.YearOfPlenty]: 0,
        [DevelopmentCardType.Monopoly]: 0
      };
    });
    
    setPlayerDevelopmentCards(initialPlayerCards);
  }, [G.players]);
  
  // Add a log entry
  const addLogEntry = (type: LogEntryType, message: string, playerIndex?: number, details?: any) => {
    const newEntry: LogEntry = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      message,
      playerIndex,
      details
    };
    setLogEntries(prev => [...prev, newEntry]);
  };
  
  // Handle player switching (local multiplayer simulation)
  const handlePlayerChange = (playerIndex: number) => {
    setSelectedPlayer(playerIndex);
    events.setActivePlayers({ value: { [playerIndex]: 'play' } });
    addLogEntry(LogEntryType.SYSTEM, `Player ${G.players[playerIndex].name}'s turn`);
  };
  
  // Handle tile clicks (for building)
  const handleTileClick = (tile: any) => {
    if (isEditMode) return; // Disable tile clicks in edit mode
    
    // In a full implementation, this would handle placing structures on/near tiles
    console.log('Tile clicked:', tile);
  };
  
  // Handle dice rolling
  const handleRollDice = () => {
    // Roll the dice locally first, so we have values to use
    const [die1, die2] = rollDice();
    const diceSum = die1 + die2;
    
    // Log the dice roll
    addLogEntry(
      LogEntryType.DICE_ROLL, 
      `Rolled ${diceSum} (${die1} + ${die2})`, 
      selectedPlayer
    );
    
    console.log("Rolling dice with values:", die1, die2);
    
    // Update the game state - pass our dice values to ensure consistency
    moves.rollDiceWithValues(die1, die2);
    
    console.log("After roll, Game state lastRoll:", G.lastRoll);
    
    // Distribute resources based on the roll
    distributeResources(diceSum);
  };
  
  // Distribute resources to players based on dice roll
  const distributeResources = (diceValue: number) => {
    // If a 7 is rolled, activate the robber
    if (diceValue === 7) {
      activateRobber();
      return;
    }
    
    // Find all tiles with the rolled number
    const matchingTiles = G.tiles.filter(tile => tile.tokenNumber === diceValue);
    
    if (matchingTiles.length === 0) {
      addLogEntry(LogEntryType.SYSTEM, `No resources produced with roll ${diceValue}`);
      return;
    }
    
    // Track resources gained by each player
    const resourcesGained: Record<number, Partial<Record<ResourceType, number>>> = {};
    
    // Initialize resource tracking for each player
    G.players.forEach((_, index) => {
      resourcesGained[index] = {};
    });
    
    // For each matching tile, give resources to players with adjacent settlements/cities
    matchingTiles.forEach(tile => {
      if (tile.resource === ResourceType.Desert) return; // Desert produces no resources
      
      // In a full implementation, we would check which players have settlements/cities
      // adjacent to this tile and give them resources accordingly
      // For now, we'll simulate this with a simplified approach
      
      // Get all structures (settlements and cities) adjacent to this tile
      const adjacentStructures = G.structures.filter(structure => {
        // Check if the structure is a settlement or city
        if (structure.type !== StructureType.Settlement && structure.type !== StructureType.City) {
          return false;
        }
        
        // In a real implementation, we would check if the structure coordinates
        // are adjacent to the tile coordinates
        // For now, we'll use a random chance to simulate adjacency
        return Math.random() < 0.3; // 30% chance a structure is adjacent to the tile
      });
      
      // Give resources to players based on their adjacent structures
      adjacentStructures.forEach(structure => {
        const playerIndex = G.players.findIndex(p => p.id === structure.playerId);
        if (playerIndex === -1) return;
        
        // Determine how many resources to give (1 for settlement, 2 for city)
        const resourceCount = structure.type === StructureType.City ? 2 : 1;
        
        // Update the player's resources
        G.players[playerIndex].resources[tile.resource] += resourceCount;
        
        // Track resources gained for logging
        if (!resourcesGained[playerIndex][tile.resource]) {
          resourcesGained[playerIndex][tile.resource] = 0;
        }
        resourcesGained[playerIndex][tile.resource]! += resourceCount;
        
        // Update bank resources
        setBankResources(prev => ({
          ...prev,
          [tile.resource]: Math.max(0, prev[tile.resource] - resourceCount)
        }));
      });
    });
    
    // Log resources gained by each player
    Object.entries(resourcesGained).forEach(([playerIndex, resources]) => {
      const resourceEntries = Object.entries(resources);
      if (resourceEntries.length > 0) {
        const resourceList = resourceEntries
          .map(([resource, count]) => `${count} ${resource}`)
          .join(', ');
        
        addLogEntry(
          LogEntryType.RESOURCE_GAIN,
          `Gained ${resourceList}`,
          parseInt(playerIndex)
        );
      }
    });
  };
  
  // Activate the robber when a 7 is rolled
  const activateRobber = () => {
    addLogEntry(LogEntryType.ROBBER, "Rolled a 7! The Robber has been activated!", selectedPlayer);
    
    // 1. Players with more than 7 cards must discard half (rounded down)
    const playersToDiscard: number[] = [];
    
    G.players.forEach((player, index) => {
      const totalCards = Object.values(player.resources).reduce((sum, count) => sum + count, 0);
      if (totalCards > 7) {
        playersToDiscard.push(index);
        
        // Calculate how many cards to discard (half, rounded down)
        const discardCount = Math.floor(totalCards / 2);
        
        addLogEntry(
          LogEntryType.RESOURCE_LOSS,
          `Must discard ${discardCount} cards`,
          index
        );
        
        // In a full implementation, we would prompt the player to select which cards to discard
        // For now, we'll simulate this by randomly discarding cards
        let remainingToDiscard = discardCount;
        const resourcesMap: Record<ResourceType, number> = {
          [ResourceType.Brick]: 0,
          [ResourceType.Wood]: 0,
          [ResourceType.Sheep]: 0,
          [ResourceType.Wheat]: 0,
          [ResourceType.Ore]: 0
        };
        
        while (remainingToDiscard > 0) {
          // Get all resources the player has
          const availableResources = Object.entries(player.resources)
            .filter(([resource, count]) => count > resourcesMap[resource as ResourceType])
            .map(([resource]) => resource as ResourceType);
          
          if (availableResources.length === 0) break;
          
          // Randomly select a resource to discard
          const resourceToDiscard = availableResources[Math.floor(Math.random() * availableResources.length)];
          
          // Track the resource to discard
          resourcesMap[resourceToDiscard]++;
          
          // Add it back to the bank
          setBankResources(prev => ({
            ...prev,
            [resourceToDiscard]: prev[resourceToDiscard] + 1
          }));
          
          remainingToDiscard--;
        }
        
        // Use the move to discard the resources
        moves.discardResources(index, resourcesMap);
      }
    });
    
    // 2. Move the robber to a new tile
    // In a full implementation, the current player would select a new tile for the robber
    // For now, we'll randomly select a new tile
    
    // Find the current robber tile (if any)
    const currentRobberTileIndex = G.tiles.findIndex(tile => tile.hasRobber);
    
    // Find all tiles that don't have the robber
    const eligibleTiles = G.tiles.filter(tile => !tile.hasRobber);
    
    // Randomly select a new tile for the robber
    const newRobberTileIndex = Math.floor(Math.random() * eligibleTiles.length);
    const newRobberTile = eligibleTiles[newRobberTileIndex];
    
    // Find the index of the new robber tile in the original tiles array
    const tileIndex = G.tiles.findIndex(tile => tile.id === newRobberTile.id);
    
    if (tileIndex !== -1) {
      // Use a move to update the tiles with the robber's new location
      moves.moveRobber(currentRobberTileIndex, tileIndex);
      
      addLogEntry(
        LogEntryType.ROBBER,
        `Moved the robber to a ${newRobberTile.resource} tile`,
        selectedPlayer
      );
      
      // 3. Steal a resource from a player with a settlement/city adjacent to the new robber tile
      // In a full implementation, the current player would select which player to steal from
      // For now, we'll randomly select a player
      
      // Get all players with settlements/cities adjacent to the new robber tile
      // (For simplicity, we'll just randomly select a player other than the current player)
      const otherPlayers = G.players.filter((_, index) => index !== selectedPlayer);
      
      if (otherPlayers.length > 0) {
        const targetPlayerIndex = Math.floor(Math.random() * otherPlayers.length);
        const targetPlayer = otherPlayers[targetPlayerIndex];
        const actualTargetIndex = G.players.findIndex(p => p.id === targetPlayer.id);
        
        // Get all resources the target player has
        const availableResources = Object.entries(targetPlayer.resources)
          .filter(([_, count]) => count > 0)
          .map(([resource]) => resource as ResourceType);
        
        if (availableResources.length > 0) {
          // Randomly select a resource to steal
          const resourceToSteal = availableResources[Math.floor(Math.random() * availableResources.length)];
          
          // Use the move to steal the resource instead of directly modifying state
          moves.stealResource(actualTargetIndex, selectedPlayer, resourceToSteal);
          
          addLogEntry(
            LogEntryType.ROBBER,
            `Stole a ${resourceToSteal} from ${targetPlayer.name}`,
            selectedPlayer
          );
        }
      }
    }
  };
  
  // Handle trading with the bank (using port ratios if available)
  const handleBankTrade = (give: ResourceType, receive: ResourceType) => {
    const player = G.players[selectedPlayer];
    
    // Get the trading ratio based on ports
    const ratio = getTradingRatio(player, give, G.ports, G.structures);
    
    // Check if player has enough resources
    if (player.resources[give] < ratio) {
      addLogEntry(LogEntryType.SYSTEM, `Not enough ${give} to trade (need ${ratio})`, selectedPlayer);
      return;
    }
    
    // Check if bank has the requested resource
    if (bankResources[receive] < 1) {
      addLogEntry(LogEntryType.SYSTEM, `Bank doesn't have any ${receive}`, selectedPlayer);
      return;
    }
    
    // Update player resources
    player.resources[give] -= ratio;
    player.resources[receive] += 1;
    
    // Update bank resources
    setBankResources(prev => ({
      ...prev,
      [give]: prev[give] + ratio,
      [receive]: prev[receive] - 1
    }));
    
    // Log the trade
    addLogEntry(
      LogEntryType.TRADE,
      `Traded ${ratio} ${give} for 1 ${receive} with the bank`,
      selectedPlayer
    );
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
    addLogEntry(LogEntryType.BUILD, 'Built a road', selectedPlayer);
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
    addLogEntry(LogEntryType.BUILD, 'Built a settlement', selectedPlayer);
  };
  
  // Handle building a city
  const handleBuildCity = () => {
    // For POC, just place a city at a fixed location
    // In a complete implementation, we would prompt the user to select a vertex with an existing settlement
    const cityCoordinates = {
      q: 0,
      r: 0,
      s: 0,
      direction: 0
    };
    moves.buildCity(cityCoordinates);
    addLogEntry(LogEntryType.BUILD, 'Built a city', selectedPlayer);
  };
  
  // Handle buying a development card
  const handleBuyDevelopmentCard = () => {
    const player = G.players[selectedPlayer];
    
    // Check if player can buy a development card
    if (!canBuyDevelopmentCard) {
      addLogEntry(LogEntryType.SYSTEM, "Can't buy a development card", selectedPlayer);
      return;
    }
    
    // Deduct resources from player
    player.resources[ResourceType.Ore]--;
    player.resources[ResourceType.Sheep]--;
    player.resources[ResourceType.Wheat]--;
    
    // Add resources to bank
    setBankResources(prev => ({
      ...prev,
      [ResourceType.Ore]: prev[ResourceType.Ore] + 1,
      [ResourceType.Sheep]: prev[ResourceType.Sheep] + 1,
      [ResourceType.Wheat]: prev[ResourceType.Wheat] + 1
    }));
    
    // Determine which development card to give
    // First, create a weighted array of available cards
    const availableCards: DevelopmentCardType[] = [];
    
    Object.entries(developmentCards).forEach(([cardType, count]) => {
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          availableCards.push(cardType as DevelopmentCardType);
        }
      }
    });
    
    if (availableCards.length === 0) {
      addLogEntry(LogEntryType.SYSTEM, "No development cards left", selectedPlayer);
      return;
    }
    
    // Randomly select a card
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const selectedCard = availableCards[randomIndex];
    
    // Remove the card from the bank
    setDevelopmentCards(prev => ({
      ...prev,
      [selectedCard]: prev[selectedCard] - 1
    }));
    
    // Add the card to the player's hand
    setPlayerDevelopmentCards(prev => ({
      ...prev,
      [selectedPlayer]: {
        ...prev[selectedPlayer],
        [selectedCard]: prev[selectedPlayer][selectedCard] + 1
      }
    }));
    
    // If it's a victory point card, immediately add a victory point
    if (selectedCard === DevelopmentCardType.VictoryPoint) {
      player.victoryPoints++;
    }
    
    // Log the purchase
    addLogEntry(
      LogEntryType.DEVELOPMENT_CARD,
      `Bought a ${selectedCard} development card`,
      selectedPlayer
    );
  };
  
  // Handle using a development card
  const handleUseDevCard = (cardType: DevelopmentCardType) => {
    // Check if player has the card
    if (!playerDevelopmentCards[selectedPlayer] || playerDevelopmentCards[selectedPlayer][cardType] <= 0) {
      addLogEntry(LogEntryType.SYSTEM, `You don't have a ${cardType} card to use`, selectedPlayer);
      return;
    }
    
    // Remove the card from the player's hand
    setPlayerDevelopmentCards(prev => ({
      ...prev,
      [selectedPlayer]: {
        ...prev[selectedPlayer],
        [cardType]: prev[selectedPlayer][cardType] - 1
      }
    }));
    
    // Handle the card effect
    switch (cardType) {
      case DevelopmentCardType.Knight:
        // Activate the robber
        activateRobber();
        
        // Update the player's knight count and check for largest army
        const knightsPlayed = (G.players[selectedPlayer].knightsPlayed || 0) + 1;
        G.players[selectedPlayer].knightsPlayed = knightsPlayed;
        
        // Check if this player now has the largest army (3+ knights and more than anyone else)
        if (knightsPlayed >= 3) {
          let largestArmy = true;
          let previousHolder = hasLargestArmy;
          
          // Check if any other player has more knights
          G.players.forEach((otherPlayer, index) => {
            if (index !== selectedPlayer && (otherPlayer.knightsPlayed || 0) >= knightsPlayed) {
              largestArmy = false;
            }
          });
          
          if (largestArmy && hasLargestArmy !== selectedPlayer) {
            // If another player had the largest army, they lose 2 points
            if (hasLargestArmy !== null) {
              G.players[hasLargestArmy].victoryPoints -= 2;
            }
            
            // This player gets 2 points
            G.players[selectedPlayer].victoryPoints += 2;
            setHasLargestArmy(selectedPlayer);
            
            addLogEntry(
              LogEntryType.SYSTEM,
              `${G.players[selectedPlayer].name} now has the Largest Army!`,
              selectedPlayer
            );
          }
        }
        break;
        
      case DevelopmentCardType.RoadBuilding:
        // Allow player to build 2 roads for free
        addLogEntry(
          LogEntryType.DEVELOPMENT_CARD,
          `Used Road Building card - build 2 roads for free`,
          selectedPlayer
        );
        // In a full implementation, we would prompt the player to place 2 roads
        // For now, we'll just simulate this
        break;
        
      case DevelopmentCardType.YearOfPlenty:
        // Allow player to take 2 resources of their choice from the bank
        addLogEntry(
          LogEntryType.DEVELOPMENT_CARD,
          `Used Year of Plenty card - take 2 resources from the bank`,
          selectedPlayer
        );
        // In a full implementation, we would prompt the player to select 2 resources
        // For now, we'll just give them 2 random resources
        const availableResources = Object.entries(bankResources)
          .filter(([resource, count]) => count > 0 && resource !== ResourceType.Desert)
          .map(([resource]) => resource as ResourceType);
        
        if (availableResources.length >= 2) {
          // Take 2 random resources
          for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * availableResources.length);
            const selectedResource = availableResources[randomIndex];
            
            // Add to player
            G.players[selectedPlayer].resources[selectedResource]++;
            
            // Remove from bank
            setBankResources(prev => ({
              ...prev,
              [selectedResource]: prev[selectedResource] - 1
            }));
            
            // Remove from available resources to avoid taking the same one twice
            availableResources.splice(randomIndex, 1);
          }
        }
        break;
        
      case DevelopmentCardType.Monopoly:
        // Take all of one resource type from all other players
        addLogEntry(
          LogEntryType.DEVELOPMENT_CARD,
          `Used Monopoly card - take all of one resource from all players`,
          selectedPlayer
        );
        // In a full implementation, we would prompt the player to select a resource
        // For now, we'll just pick a random resource
        const resourceTypes = [
          ResourceType.Brick,
          ResourceType.Wood,
          ResourceType.Sheep,
          ResourceType.Wheat,
          ResourceType.Ore
        ];
        const monopolyResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        
        let totalTaken = 0;
        
        // Take the resource from all other players
        G.players.forEach((otherPlayer, index) => {
          if (index !== selectedPlayer) {
            const amount = otherPlayer.resources[monopolyResource];
            if (amount > 0) {
              // Take from other player
              otherPlayer.resources[monopolyResource] = 0;
              
              // Give to current player
              G.players[selectedPlayer].resources[monopolyResource] += amount;
              
              totalTaken += amount;
            }
          }
        });
        
        addLogEntry(
          LogEntryType.RESOURCE_GAIN,
          `Took ${totalTaken} ${monopolyResource} from other players`,
          selectedPlayer
        );
        break;
        
      case DevelopmentCardType.VictoryPoint:
        // Victory points are automatically counted when the card is acquired
        addLogEntry(
          LogEntryType.SYSTEM,
          `Victory Point cards are automatically counted`,
          selectedPlayer
        );
        break;
    }
  };
  
  // Handle sending chat messages
  const handleSendChat = (message: string) => {
    addLogEntry(LogEntryType.CHAT, message, selectedPlayer);
  };
  
  // Handle end turn
  const handleEndTurn = () => {
    events.endTurn();
    const nextPlayer = (selectedPlayer + 1) % NUM_PLAYERS;
    setSelectedPlayer(nextPlayer);
    
    // Clear the dice roll when ending a turn
    // This explicit call to moves.clearLastRoll() will reset G.lastRoll
    moves.clearLastRoll();
    // Force a UI update by setting lastRollTime even though we're clearing the roll
    setLastRollTime(Date.now());
    
    addLogEntry(LogEntryType.SYSTEM, `Player ${G.players[nextPlayer].name}'s turn`);
  };
  
  // Handle time expired
  const handleTimeExpired = () => {
    addLogEntry(LogEntryType.SYSTEM, 'Time expired, ending turn automatically', selectedPlayer);
    
    // Clear dice roll values when time expires
    moves.clearLastRoll();
    setLastRollTime(Date.now());
    
    handleEndTurn();
  };
  
  // Handle adding resources (dev feature)
  const handleAddResources = () => {
    moves.addResources(selectedPlayer);
    addLogEntry(LogEntryType.RESOURCE_GAIN, 'Added resources (dev mode)', selectedPlayer);
  };
  
  // Toggle edit mode
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  // Handle ending the game
  const handleEndGame = () => {
    // Add a log entry for ending the game
    const newEntry: LogEntry = {
      id: uuidv4(),
      type: LogEntryType.SYSTEM,
      message: "Game ended by player",
      timestamp: new Date(),
    };
    setLogEntries(prev => [...prev, newEntry]);
    
    // Open the end game modal
    setIsEndGameModalOpen(true);
  };
  
  // Handle starting a new game
  const handleNewGame = () => {
    // Close the modal
    setIsEndGameModalOpen(false);
    
    // Reset the game
    reset();
    
    // Add a log entry for starting a new game
    const newEntry: LogEntry = {
      id: uuidv4(),
      type: LogEntryType.SYSTEM,
      message: "New game started",
      timestamp: new Date(),
    };
    setLogEntries([newEntry]);
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-blue-50">
      <Head>
        <title>Catan Game</title>
        <meta name="description" content="Catan board game implementation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Game board */}
      <GameBoard 
        tiles={G.tiles}
        ports={G.ports}
        onTileClick={handleTileClick}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
      />
      
      {/* Player panel */}
      <PlayerPanel 
        players={G.players}
        currentPlayer={selectedPlayer}
        onPlayerChange={handlePlayerChange}
        onAddResources={handleAddResources}
        position={playerPanelPosition}
        onDragEnd={handlePlayerPanelDragEnd}
        hasLongestRoad={hasLongestRoad}
        hasLargestArmy={hasLargestArmy}
        playerDevelopmentCards={playerDevelopmentCards}
        onUseDevCard={handleUseDevCard}
      />
      
      {/* Turn controls */}
      <TurnControls 
        currentPlayer={G.players[selectedPlayer]}
        diceRoll={G.lastRoll && typeof G.lastRoll.die1 === 'number' && typeof G.lastRoll.die2 === 'number' 
          ? [G.lastRoll.die1, G.lastRoll.die2] 
          : undefined}
        onRollDice={handleRollDice}
        onBuildRoad={handleBuildRoad}
        onBuildSettlement={handleBuildSettlement}
        onBuildCity={handleBuildCity}
        onEndTurn={handleEndTurn}
        onEndGame={handleEndGame}
        canBuildRoad={canBuild(G, selectedPlayer, StructureType.Road)}
        canBuildSettlement={canBuild(G, selectedPlayer, StructureType.Settlement)}
        canBuildCity={canBuild(G, selectedPlayer, StructureType.City)}
        position={turnControlsPosition}
        onDragEnd={handleTurnControlsDragEnd}
        turnTimeLimit={120}
        onTimeExpired={handleTimeExpired}
        lastRollTime={lastRollTime}
      />
      
      {/* Game log */}
      <GameLog 
        entries={logEntries}
        players={G.players}
        currentPlayerIndex={selectedPlayer}
        onSendChat={handleSendChat}
        position={gameLogPosition}
        onDragEnd={handleGameLogDragEnd}
      />
      
      {/* Bank panel */}
      <BankPanel
        resources={bankResources}
        onTrade={handleBankTrade}
        position={bankPanelPosition}
        onDragEnd={handleBankPanelDragEnd}
        onBuyDevelopmentCard={handleBuyDevelopmentCard}
        canBuyDevelopmentCard={canBuyDevelopmentCard}
        developmentCards={developmentCards}
        currentPlayer={G.players[selectedPlayer]}
        structures={G.structures}
        ports={G.ports}
        hasLongestRoad={G.longestRoadPlayer}
        hasLargestArmy={G.largestArmyPlayer}
        players={G.players}
      />
      
      {/* End Game Modal */}
      <EndGameModal
        isOpen={isEndGameModalOpen}
        onClose={() => setIsEndGameModalOpen(false)}
        players={G.players}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

// Create the Boardgame.io client
const CatanClient = Client({
  game: {
    ...CatanGame,
    setup: (ctx, setupData) => {
      // If we have saved state, use it, otherwise create a new initial state
      if (setupData && setupData.savedState) {
        console.log('Restoring saved game state');
        return setupData.savedState;
      }
      return createInitialState(ctx.numPlayers);
    }
  },
  numPlayers: NUM_PLAYERS,
  board: CatanGameComponent,
  multiplayer: Local(),  // Local multiplayer (no server needed)
  debug: false           // Set to true to enable the debug panel (useful during development)
});

// The main game page that renders the Boardgame.io client
const GamePage: React.FC = () => {
  // Use client-side rendering for Boardgame.io
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0); // Add a key state to force re-render for new game
  const [savedState, setSavedState] = useState<any>(null);
  
  // Load game state from localStorage
  useEffect(() => {
    setMounted(true);
    console.log('Boardgame.io client mounted');
    
    // Try to load the saved game state
    if (typeof window !== 'undefined') {
      try {
        const savedGameState = localStorage.getItem('catanGameState');
        const savedGameMetadata = localStorage.getItem('catanGameMetadata');
        
        if (savedGameState && savedGameMetadata) {
          const gameState = JSON.parse(savedGameState);
          console.log('Loaded saved game state from localStorage', gameState);
          setSavedState(gameState);
        }
      } catch (error) {
        console.error('Error loading game state from localStorage:', error);
      }
    }
  }, []);
  
  // Function to reset the game by changing the key and clearing saved state
  const resetGame = () => {
    // Clear saved game state
    localStorage.removeItem('catanGameState');
    localStorage.removeItem('catanGameMetadata');
    localStorage.removeItem('catanLogEntries');
    localStorage.removeItem('catanBankResources');
    localStorage.removeItem('catanDevelopmentCards');
    localStorage.removeItem('catanPlayerDevelopmentCards');
    localStorage.removeItem('catanLongestRoad');
    localStorage.removeItem('catanLargestArmy');
    localStorage.removeItem('catanSelectedPlayer');
    
    // Reset state key to force re-render
    setKey(prevKey => prevKey + 1);
    setSavedState(null);
  };
  
  if (!mounted) {
    return <div className="flex justify-center items-center min-h-screen">Loading Hexigo...</div>;
  }
  
  return <CatanClient 
    key={key} 
    playerID="0" 
    reset={resetGame} 
    setupData={{ savedState }}
  />;
};

export default GamePage; 