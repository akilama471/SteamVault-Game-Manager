
import React, { useState, useEffect } from 'react';
import { Game, ViewMode } from './types';
import { AdminPanel } from './components/AdminPanel';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { Button } from './components/Button';

const STORAGE_KEY = 'steam_vault_games';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VISITOR);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGames(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved games");
      }
    }
  }, []);

  const saveGames = (newGames: Game[]) => {
    setGames(newGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGames));
  };

  const addGame = (game: Game) => saveGames([game, ...games]);
  const editGame = (updatedGame: Game) => saveGames(games.map(g => g.id === updatedGame.id ? updatedGame : g));
  const deleteGame = (id: string) => {
    // Confirmation is now handled in the AdminPanel component UI
    saveGames(games.filter(g => g.id !== id));
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
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
                placeholder="Search catalog..." 
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === ViewMode.ADMIN ? (
          <AdminPanel 
            games={games}
            onAddGame={addGame}
            onEditGame={editGame}
            onDeleteGame={deleteGame}
          />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Explore Games</h2>
                <p className="text-zinc-500 mt-1">Discover requirements and trailers for your next adventure.</p>
              </div>
              <div className="text-sm text-zinc-500 font-medium">
                Showing {filteredGames.length} titles
              </div>
            </div>

            {filteredGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-300">No games found</h3>
                <p className="text-zinc-500 mt-2">Try searching for something else or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGames.map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onClick={setSelectedGame} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal for Game Details */}
      <GameModal 
        game={selectedGame} 
        onClose={() => setSelectedGame(null)} 
      />

      {/* Mobile Sticky CTA */}
      {viewMode === ViewMode.ADMIN && (
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
           <Button className="rounded-full w-14 h-14 p-0 shadow-2xl shadow-indigo-500/40" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 10l7-7 7 7M5 19l7-7 7 7"/></svg>
           </Button>
        </div>
      )}
    </div>
  );
};

export default App;
