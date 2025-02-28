import React, { useState, useRef, useEffect } from 'react';
import { ResourceType, StructureType } from '../lib/types';

// Types of log entries
export enum LogEntryType {
  DICE_ROLL = 'dice_roll',
  RESOURCE_GAIN = 'resource_gain',
  RESOURCE_LOSS = 'resource_loss',
  BUILD = 'build',
  TRADE = 'trade',
  DEVELOPMENT_CARD = 'development_card',
  ROBBER = 'robber',
  SYSTEM = 'system',
  CHAT = 'chat'
}

// Interface for a log entry
export interface LogEntry {
  id: string;
  type: LogEntryType;
  timestamp: Date;
  message: string;
  playerIndex?: number;
  playerName?: string;
  playerColor?: string;
  details?: any; // Additional details specific to the entry type
}

interface GameLogProps {
  entries: LogEntry[];
  players: { id: string; name: string; color: string }[];
  currentPlayerIndex: number;
  onSendChat: (message: string) => void;
  position?: { x: number; y: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
}

const GameLog: React.FC<GameLogProps> = ({
  entries,
  players,
  currentPlayerIndex,
  onSendChat,
  position = { x: 20, y: 20 },
  onDragEnd
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [filter, setFilter] = useState<LogEntryType | 'all'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState(position);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [entries]);

  // Update panel position when the position prop changes
  useEffect(() => {
    setPanelPosition(position);
  }, [position]);

  // Handle chat message submission
  const handleSendChat = () => {
    if (chatMessage.trim()) {
      onSendChat(chatMessage);
      setChatMessage('');
    }
  };

  // Handle key press in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  };

  // Start dragging the panel
  const handleDragStart = (e: React.MouseEvent) => {
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
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

  // Filter entries based on selected filter
  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(entry => entry.type === filter);

  // Get icon for log entry type
  const getEntryIcon = (type: LogEntryType) => {
    switch (type) {
      case LogEntryType.DICE_ROLL: return '🎲';
      case LogEntryType.RESOURCE_GAIN: return '📥';
      case LogEntryType.RESOURCE_LOSS: return '📤';
      case LogEntryType.BUILD: return '🏗️';
      case LogEntryType.TRADE: return '🔄';
      case LogEntryType.DEVELOPMENT_CARD: return '🃏';
      case LogEntryType.ROBBER: return '🦹';
      case LogEntryType.SYSTEM: return '⚙️';
      case LogEntryType.CHAT: return '💬';
      default: return '📝';
    }
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{ 
        width: '300px', 
        height: '400px',
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
      <div 
        ref={headerRef}
        className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between cursor-move"
      >
        <h2 className="text-lg font-semibold">Game Log</h2>
        <div className="flex space-x-2">
          <select 
            className="text-xs bg-gray-700 text-white rounded px-2 py-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogEntryType | 'all')}
          >
            <option value="all">All Events</option>
            <option value={LogEntryType.DICE_ROLL}>Dice Rolls</option>
            <option value={LogEntryType.RESOURCE_GAIN}>Resources Gained</option>
            <option value={LogEntryType.BUILD}>Building</option>
            <option value={LogEntryType.TRADE}>Trading</option>
            <option value={LogEntryType.CHAT}>Chat</option>
          </select>
        </div>
      </div>

      {/* Log entries */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50"
      >
        {filteredEntries.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No events to display</div>
        ) : (
          filteredEntries.map(entry => (
            <div 
              key={entry.id} 
              className={`p-2 rounded-md ${
                entry.type === LogEntryType.CHAT 
                  ? 'bg-blue-50 border-l-4 border-blue-300' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <span className="mr-2 text-lg">{getEntryIcon(entry.type)}</span>
                <div className="flex-1">
                  {entry.playerIndex !== undefined && (
                    <span 
                      className={`inline-block px-1.5 py-0.5 rounded-sm text-xs font-medium mr-1 bg-${players[entry.playerIndex]?.color || 'gray'}-100 text-${players[entry.playerIndex]?.color || 'gray'}-800`}
                    >
                      {players[entry.playerIndex]?.name || 'Player'}
                    </span>
                  )}
                  <span className="text-sm">{entry.message}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat input */}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className="bg-blue-600 text-white rounded-r-md px-3 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleSendChat}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GameLog; 