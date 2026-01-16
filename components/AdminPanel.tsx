
import React, { useState } from 'react';
import { Game, SteamSearchResult } from '../types';
import { searchSteamGames, getSteamGameDetails } from '../services/geminiService';
import { Button } from './Button';

interface AdminPanelProps {
  games: Game[];
  onAddGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ games, onAddGame, onEditGame, onDeleteGame }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchSteamGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSteamGame = async (appId: string) => {
    setIsLoadingDetails(true);
    const details = await getSteamGameDetails(appId);
    setEditingGame({
      id: Date.now().toString(),
      ...details
    });
    setIsLoadingDetails(false);
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!editingGame?.name) return;
    
    const gameToSave = {
      ...editingGame,
      id: editingGame.id || Date.now().toString(),
    } as Game;

    const exists = games.find(g => g.id === gameToSave.id);
    if (exists) {
      onEditGame(gameToSave);
    } else {
      onAddGame(gameToSave);
    }
    setEditingGame(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      {/* Search/Add Section */}
      <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white">Add New Game</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search game name on Steam..."
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-3.5">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          <Button onClick={handleSearch} isLoading={isSearching}>Search</Button>
          <Button variant="secondary" onClick={() => setEditingGame({ id: '', name: '', description: '', thumbnail: '', price: 'Free', minRequirements: '', recommendedRequirements: '', trailerUrl: '' })}>
            Add Custom
          </Button>
        </div>

        {/* Search Results Dropdown-like list */}
        {searchResults.length > 0 && (
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800">
            {searchResults.map(result => (
              <button
                key={result.appId}
                onClick={() => handleSelectSteamGame(result.appId)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
              >
                <span>{result.name}</span>
                <span className="text-xs text-zinc-500 font-mono">ID: {result.appId}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Editing Form Modal/Overlay */}
      {editingGame && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingGame.id ? 'Edit Game' : 'Add New Game'}</h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Game Name</label>
                  <input 
                    type="text" 
                    value={editingGame.name || ''} 
                    onChange={e => setEditingGame({...editingGame, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Price</label>
                  <input 
                    type="text" 
                    value={editingGame.price || ''} 
                    onChange={e => setEditingGame({...editingGame, price: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Thumbnail URL</label>
                <input 
                  type="text" 
                  value={editingGame.thumbnail || ''} 
                  onChange={e => setEditingGame({...editingGame, thumbnail: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Trailer URL</label>
                <input 
                  type="text" 
                  value={editingGame.trailerUrl || ''} 
                  onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm"
                  placeholder="YouTube link or direct mp4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea 
                  value={editingGame.description || ''} 
                  onChange={e => setEditingGame({...editingGame, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Min Requirements</label>
                  <textarea 
                    value={editingGame.minRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, minRequirements: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Recommended Requirements</label>
                  <textarea 
                    value={editingGame.recommendedRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, recommendedRequirements: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={isLoadingDetails}>Save Game</Button>
            </div>
          </div>
        </div>
      )}

      {/* Managed Games List */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Manage Library ({games.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Game</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {games.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                    No games in library. Search above to add some!
                  </td>
                </tr>
              ) : (
                games.map(game => (
                  <tr key={game.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <img src={game.thumbnail} className="w-16 h-10 object-cover rounded shadow" alt="" />
                      <span className="font-medium text-zinc-200">{game.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400">{game.price}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingGame(game)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onDeleteGame(game.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
