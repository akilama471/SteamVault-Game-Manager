
import React, { useState, useMemo } from 'react';
import { Game, SteamSearchResult } from '../types';
import { searchSteamGames, getSteamGameDetails } from '../services/geminiService';
import { Button } from './Button';

interface AdminPanelProps {
  games: Game[];
  onAddGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

type SortKey = 'name' | 'price' | 'releaseDate';
type SortOrder = 'asc' | 'desc';
type PriceRange = 'all' | 'free' | 'under10' | 'under30' | 'under60' | '60plus';

export const AdminPanel: React.FC<AdminPanelProps> = ({ games, onAddGame, onEditGame, onDeleteGame }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSyncingField, setIsSyncingField] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Filter and Sort State
  const [librarySearch, setLibrarySearch] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'name', order: 'asc' });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchSteamGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSteamGame = async (appId: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame({
        id: Date.now().toString(),
        steamAppId: appId,
        ...details
      });
      setSearchResults([]);
    } catch (error) {
      console.error("Error fetching game details:", error);
      alert("Failed to fetch game details. Please try again or add manually.");
    } finally {
      // Small delay for perceived smoothness before dismissing overlay
      setTimeout(() => setIsLoadingDetails(false), 300);
    }
  };

  const handleSyncGame = async (game: Game) => {
    if (!game.steamAppId) return;
    
    // Determine if we are in the modal or in the table
    const isModalSync = editingGame?.id === game.id;
    
    if (isModalSync) setIsSyncingField(true);
    else setSyncingIds(prev => new Set(prev).add(game.id));

    try {
      const updatedDetails = await getSteamGameDetails(game.steamAppId);
      const updatedGame = { ...game, ...updatedDetails };
      
      if (isModalSync) setEditingGame(updatedGame);
      onEditGame(updatedGame);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      if (isModalSync) setIsSyncingField(false);
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(game.id);
        return next;
      });
    }
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

  const confirmDeletion = () => {
    if (gameToDelete) {
      onDeleteGame(gameToDelete.id);
      setGameToDelete(null);
    }
  };

  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const lower = priceStr.toLowerCase();
    if (lower.includes('free') || lower === '0' || lower.includes('no cost')) return 0;
    const match = priceStr.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const processedGames = useMemo(() => {
    let result = [...games];

    if (librarySearch) {
      result = result.filter(g => g.name.toLowerCase().includes(librarySearch.toLowerCase()));
    }

    if (priceRange !== 'all') {
      result = result.filter(g => {
        const p = getNumericPrice(g.price);
        if (priceRange === 'free') return p === 0;
        if (priceRange === 'under10') return p > 0 && p < 10;
        if (priceRange === 'under30') return p > 0 && p < 30;
        if (priceRange === 'under60') return p > 0 && p < 60;
        if (priceRange === '60plus') return p >= 60;
        return true;
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortConfig.key === 'price') {
        comparison = getNumericPrice(a.price) - getNumericPrice(b.price);
      } else if (sortConfig.key === 'releaseDate') {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [games, librarySearch, priceRange, sortConfig]);

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setLibrarySearch('');
    setPriceRange('all');
    setSortConfig({ key: 'name', order: 'asc' });
  };

  // Helper for field pulses
  const SkeletonOverlay = () => (
    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] rounded-lg animate-pulse flex items-center justify-center">
       <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 relative">
      {/* Full-screen Loading Overlay with enhanced dismissal */}
      {isLoadingDetails && !editingGame && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full mx-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">Syncing with Steam</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Fetching high-resolution assets and system requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {gameToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Delete from Library?</h3>
                <p className="text-zinc-400 text-sm">
                  Are you sure you want to remove <span className="text-white font-medium">"{gameToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setGameToDelete(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDeletion}>Delete Game</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Game Section */}
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
          <div className="flex gap-2">
            <Button onClick={handleSearch} isLoading={isSearching} className="flex-1 md:flex-none">Search Steam</Button>
            <Button variant="secondary" onClick={() => setEditingGame({ id: '', name: '', description: '', thumbnail: '', price: 'Free', minRequirements: '', recommendedRequirements: '', trailerUrl: '' })}>
              Custom
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {searchResults.map(result => (
              <button
                key={result.appId}
                onClick={() => handleSelectSteamGame(result.appId)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  </div>
                  <span className="font-medium">{result.name}</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">ID: {result.appId}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Editing Form Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl my-8 shadow-2xl relative">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{editingGame.id ? 'Edit Game' : 'Add New Game'}</h3>
                {editingGame.steamAppId && (
                  <p className="text-xs text-zinc-500 font-mono">Steam ID: {editingGame.steamAppId}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {editingGame.steamAppId && (
                  <Button variant="ghost" size="sm" onClick={() => handleSyncGame(editingGame as Game)} isLoading={isSyncingField}>
                    Sync Latest
                  </Button>
                )}
                <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Game Name</label>
                  <input 
                    type="text" 
                    value={editingGame.name || ''} 
                    onChange={e => setEditingGame({...editingGame, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Price</label>
                  <input 
                    type="text" 
                    value={editingGame.price || ''} 
                    onChange={e => setEditingGame({...editingGame, price: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Thumbnail URL</label>
                  <input 
                    type="text" 
                    value={editingGame.thumbnail || ''} 
                    onChange={e => setEditingGame({...editingGame, thumbnail: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Release Date</label>
                  <input 
                    type="text" 
                    value={editingGame.releaseDate || ''} 
                    onChange={e => setEditingGame({...editingGame, releaseDate: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="YYYY-MM-DD"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500 uppercase">Trailer URL</label>
                <input 
                  type="text" 
                  value={editingGame.trailerUrl || ''} 
                  onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="YouTube link or direct mp4"
                />
                {isSyncingField && <SkeletonOverlay />}
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea 
                  value={editingGame.description || ''} 
                  onChange={e => setEditingGame({...editingGame, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                {isSyncingField && <SkeletonOverlay />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Min Requirements</label>
                  <textarea 
                    value={editingGame.minRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, minRequirements: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Recommended Requirements</label>
                  <textarea 
                    value={editingGame.recommendedRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, recommendedRequirements: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Managed Games List */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Library Management</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search library..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none w-40"
              />
            </div>

            <select 
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRange)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="under10">Under $10</option>
              <option value="under30">Under $30</option>
              <option value="under60">Under $60</option>
              <option value="60plus">$60+</option>
            </select>

            {(librarySearch || priceRange !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-[10px] h-8 px-2">
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">
                    Game
                    <div className="flex flex-col opacity-50">
                      <svg className={`w-2 h-2 ${sortConfig.key === 'name' && sortConfig.order === 'asc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                      <svg className={`w-2 h-2 ${sortConfig.key === 'name' && sortConfig.order === 'desc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4l8 8z"/></svg>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-2">
                    Price
                    <div className="flex flex-col opacity-50">
                      <svg className={`w-2 h-2 ${sortConfig.key === 'price' && sortConfig.order === 'asc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                      <svg className={`w-2 h-2 ${sortConfig.key === 'price' && sortConfig.order === 'desc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4l8 8z"/></svg>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-zinc-300 transition-colors select-none" onClick={() => toggleSort('releaseDate')}>
                  <div className="flex items-center gap-2">
                    Released
                    <div className="flex flex-col opacity-50">
                      <svg className={`w-2 h-2 ${sortConfig.key === 'releaseDate' && sortConfig.order === 'asc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                      <svg className={`w-2 h-2 ${sortConfig.key === 'releaseDate' && sortConfig.order === 'desc' ? 'text-indigo-500 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4l8 8z"/></svg>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {processedGames.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    {games.length === 0 ? "No games in library. Search above to add some!" : "No games match your filters."}
                  </td>
                </tr>
              ) : (
                processedGames.map(game => (
                  <tr key={game.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-4 min-w-[200px]">
                      <img src={game.thumbnail} className="w-16 h-10 object-cover rounded shadow ring-1 ring-zinc-700" alt="" />
                      <span className="font-medium text-zinc-200">{game.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-zinc-400 text-sm">{game.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-zinc-500 text-xs">{game.releaseDate || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {game.steamAppId && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => handleSyncGame(game)} 
                             isLoading={syncingIds.has(game.id)}
                             className="text-indigo-400 hover:text-indigo-300"
                           >
                             Sync
                           </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setEditingGame(game)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setGameToDelete(game)}>
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
