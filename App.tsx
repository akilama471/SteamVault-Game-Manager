
import React, { useState, useEffect } from 'react';
import { Game, ViewMode } from './types';
import { AdminPanel } from './components/AdminPanel';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { Button } from './components/Button';
import { LoginForm } from './components/LoginForm';
import { cloudFetchGames, cloudSaveGame, cloudDeleteGame, isFirebaseConfigured, subscribeToAuth } from './firebase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VISITOR);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Persistence logic: Try Cloud, then Local fallback
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 1. Try fetching from Cloud
      if (isFirebaseConfigured) {
        try {
          const cloudGames = await cloudFetchGames();
          if (cloudGames) {
            setGames(cloudGames as Game[]);
            localStorage.setItem('steam_vault_games', JSON.stringify(cloudGames));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Cloud connection failed. Falling back to local data.");
        }
      }

      const saved = localStorage.getItem('steam_vault_games');
      if (saved) {
        try {
          setGames(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local backup");
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  const addGame = async (game: Game) => {
    const newGames = [game, ...games];
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try {
      await cloudSaveGame(game);
    } catch (e) {
      console.error("Cloud update failed.");
    }
  };

  const editGame = async (updatedGame: Game) => {
    const newGames = games.map(g => g.id === updatedGame.id ? updatedGame : g);
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try {
      await cloudSaveGame(updatedGame);
    } catch (e) {
      console.error("Cloud update failed.");
    }
  };

  const deleteGame = async (id: string) => {
    const newGames = games.filter(g => g.id !== id);
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try {
      await cloudDeleteGame(id);
    } catch (e) {
      console.error("Cloud delete failed.");
    }
  };

  const handleBulkImport = async (importedGames: Game[]) => {
    if (!confirm(`This will overwrite your current library. Continue?`)) return;
    setGames(importedGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(importedGames));
    if (isFirebaseConfigured && currentUser) {
      for (const game of importedGames) {
        await cloudSaveGame(game);
      }
    }
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              SteamVault
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
              <svg className="w-4 h-4 text-zinc-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-sm outline-none w-40 md:w-64"
              />
            </div>
            
            <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button 
                onClick={() => setViewMode(ViewMode.VISITOR)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === ViewMode.VISITOR ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Store
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.ADMIN)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === ViewMode.ADMIN ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 animate-pulse font-medium">Initializing Vault...</p>
          </div>
        ) : viewMode === ViewMode.ADMIN ? (
          currentUser ? (
            <AdminPanel 
              games={games}
              onAddGame={addGame}
              onEditGame={editGame}
              onDeleteGame={deleteGame}
              onBulkImport={handleBulkImport}
            />
          ) : (
            <LoginForm />
          )
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Explore Games</h2>
                <p className="text-zinc-500 mt-1">Requirements and trailers for your next adventure.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onClick={setSelectedGame} 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <GameModal 
        game={selectedGame} 
        onClose={() => setSelectedGame(null)} 
      />
    </div>
  );
};

export default App;
