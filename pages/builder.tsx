import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import GameBoard from '../components/GameBoard';
import { TileData } from '../components/GameBoard/TileManager';
import { GridConfig } from '../components/GridSystem/GridSystem';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';

export default function Builder() {
  const [savedBoards, setSavedBoards] = useState<{ 
    id: string; 
    name: string; 
    tiles: TileData[]; 
    config: GridConfig 
  }[]>([]);
  const [boardName, setBoardName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSaveBoard = (tiles: TileData[], config: GridConfig) => {
    try {
      if (!boardName.trim()) {
        setSaveMessage('Please enter a board name');
        return;
      }

      const newBoard = {
        id: Date.now().toString(),
        name: boardName,
        tiles,
        config,
      };

      setSavedBoards([...savedBoards, newBoard]);
      setBoardName('');
      setSaveMessage(`Board "${boardName}" saved successfully!`);
      setError(null);

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving board:', err);
      setError('Failed to save the board. Please try again.');
    }
  };

  const handleLoadBoard = (boardId: string) => {
    try {
      // In a real app, you would load the board here
      console.log('Loading board:', boardId);
      // For now, just show a message
      alert(`Board ${boardId} would be loaded here`);
    } catch (err) {
      console.error('Error loading board:', err);
      setError('Failed to load the board. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Head>
        <title>Hexigo - Board Builder</title>
        <meta name="description" content="Build and customize your game board" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hexigo Board Builder</h1>
          <Link href="/">
            <div className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md transition-colors">
              Home
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {error && (
          <div className="mb-4">
            <ErrorMessage 
              title="Error" 
              message={error} 
              onRetry={() => setError(null)} 
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name"
              className="flex-grow p-2 border border-gray-300 rounded-md mr-4"
            />
            {saveMessage && (
              <div className={`text-sm ${saveMessage.includes('Please') ? 'text-red-500' : 'text-green-500'}`}>
                {saveMessage}
              </div>
            )}
          </div>
          
          <ErrorBoundary>
            <GameBoard
              isEditable={true}
              onSave={handleSaveBoard}
            />
          </ErrorBoundary>
        </div>

        {savedBoards.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Saved Boards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedBoards.map((board) => (
                <div key={board.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg mb-2">{board.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Grid Radius: {board.config.radius}, Tiles: {board.tiles.length}
                  </p>
                  <button 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleLoadBoard(board.id)}
                  >
                    Load Board
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-blue-600 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>Hexigo Board Builder - Built with Next.js and React</p>
        </div>
      </footer>
    </div>
  );
} 