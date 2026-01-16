
import React, { useState, useMemo, useRef } from 'react';
import { Game, SteamSearchResult } from '../types';
import { searchSteamGames, getSteamGameDetails } from '../services/geminiService';
import { Button } from './Button';
import { logoutAdmin } from '../firebase';

interface AdminPanelProps {
  games: Game[];
  onAddGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  onBulkImport?: (games: Game[]) => void;
}

type SortKey = 'name' | 'price' | 'releaseDate';
type SortOrder = 'asc' | 'desc';
type PriceRange = 'all' | 'free' | 'under10' | 'under30' | 'under60' | '60plus';

export const AdminPanel: React.FC<AdminPanelProps> = ({ games, onAddGame, onEditGame, onDeleteGame, onBulkImport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAppId, setManualAppId] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSyncingField, setIsSyncingField] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [librarySearch, setLibrarySearch] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'name', order: 'asc' });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    const results = await searchSteamGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSteamGame = async (appId: string) => {
    if (!appId) return;
    setIsLoadingDetails(true);
    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame({
        id: Date.now().toString(),
        steamAppId: appId,
        name: details.name || 'Untitled Game',
        thumbnail: details.thumbnail || '',
        price: details.price || 'Price Unknown',
        description: details.description || '',
        minRequirements: details.minRequirements || '',
        recommendedRequirements: details.recommendedRequirements || '',
        trailerUrl: details.trailerUrl || '',
        releaseDate: details.releaseDate || ''
      });
      setSearchResults([]);
      setManualAppId('');
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setTimeout(() => setIsLoadingDetails(false), 300);
    }
  };

  const handleSyncGame = async (game: Game) => {
    if (!game.steamAppId) return;
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
    const gameToSave = { ...editingGame, id: editingGame.id || Date.now().toString() } as Game;
    const exists = games.find(g => g.id === gameToSave.id);
    if (exists) onEditGame(gameToSave);
    else onAddGame(gameToSave);
    setEditingGame(null);
  };

  const confirmDeletion = () => {
    if (gameToDelete) {
      onDeleteGame(gameToDelete.id);
      setGameToDelete(null);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(games, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `steam-vault-${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported) && onBulkImport) onBulkImport(imported);
      } catch (err) { alert("Invalid file"); }
    };
    reader.readAsText(file);
  };

  const processedGames = useMemo(() => {
    let result = [...games];
    if (librarySearch) result = result.filter(g => g.name.toLowerCase().includes(librarySearch.toLowerCase()));
    return result;
  }, [games, librarySearch]);

  const SkeletonOverlay = () => (
    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10 animate-pulse">
       <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 relative pb-12">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Admin Session Active</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logoutAdmin()} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          Logout
        </Button>
      </div>

      {isLoadingDetails && !editingGame && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-white font-medium">Fetching Steam Data...</p>
        </div>
      )}

      {gameToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
            <h3 className="text-xl font-bold text-white text-center">Delete "{gameToDelete.name}"?</h3>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setGameToDelete(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDeletion}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-white">Add New Game</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Search Steam</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Cyberpunk"
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <Button onClick={handleSearch} isLoading={isSearching}>Search</Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">By App ID</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={manualAppId}
                onChange={(e) => setManualAppId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectSteamGame(manualAppId)}
                placeholder="e.g. 730"
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm font-mono"
              />
              <Button variant="secondary" onClick={() => handleSelectSteamGame(manualAppId)}>Add ID</Button>
            </div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800 shadow-2xl">
            {searchResults.map(result => (
              <button key={result.appId} onClick={() => handleSelectSteamGame(result.appId)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 text-left group">
                <span className="font-medium text-zinc-300 group-hover:text-white">{result.name}</span>
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">ID: {result.appId}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {editingGame && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative my-10">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-20">
              <h3 className="text-xl font-bold">{editingGame.id ? 'Edit Game' : 'Add New Game'}</h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Name</label>
                  <input type="text" value={editingGame.name || ''} onChange={e => setEditingGame({...editingGame, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm" />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Price</label>
                  <input type="text" value={editingGame.price || ''} onChange={e => setEditingGame({...editingGame, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm" />
                  {isSyncingField && <SkeletonOverlay />}
                </div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500">Thumbnail URL</label>
                <input type="text" value={editingGame.thumbnail || ''} onChange={e => setEditingGame({...editingGame, thumbnail: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm" />
                {isSyncingField && <SkeletonOverlay />}
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500">Trailer URL</label>
                <input type="text" value={editingGame.trailerUrl || ''} onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm" />
                {isSyncingField && <SkeletonOverlay />}
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500">About (HTML)</label>
                <textarea value={editingGame.description || ''} onChange={e => setEditingGame({...editingGame, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32" />
                {isSyncingField && <SkeletonOverlay />}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Library</h2>
            <div className="flex gap-4 mt-1">
              <button onClick={handleExport} className="text-[10px] text-zinc-500 hover:text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-zinc-500 hover:text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Import
              </button>
            </div>
          </div>
          <div className="relative">
             <input type="text" placeholder="Search..." value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 outline-none w-48" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-zinc-800">
              {processedGames.map(game => (
                <tr key={game.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={game.thumbnail} className="w-16 h-10 object-cover rounded border border-zinc-700" alt="" />
                    <span className="font-medium text-zinc-300">{game.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingGame(game)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setGameToDelete(game)}>Del</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
