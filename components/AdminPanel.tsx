
import React, { useState, useMemo, useRef } from 'react';
import { Game, SteamSearchResult, RequirementTemplate } from '../types';
import { searchSteamGames, getSteamGameDetails } from '../services/steamService';
import { Button } from './Button';
import { logoutAdmin } from '../firebase';

interface AdminPanelProps {
  games: Game[];
  templates: RequirementTemplate[];
  onAddGame: (game: Game) => Promise<void>;
  onEditGame: (game: Game) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
  onAddTemplate: (label: string) => void;
  onDeleteTemplate: (id: string) => void;
  onBulkImport?: (games: Game[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  games, 
  templates, 
  onAddGame, 
  onEditGame, 
  onDeleteGame, 
  onAddTemplate, 
  onDeleteTemplate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAppId, setManualAppId] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isFetchingNewGame, setIsFetchingNewGame] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newRamSize, setNewRamSize] = useState('');
  const [newVgaSize, setNewVgaSize] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchSteamGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSteamGame = async (appId: string) => {
    if (!appId) return;
    setIsFetchingNewGame(true);
    setEditingGame({ steamAppId: appId });
    setSearchResults([]);
    setManualAppId('');

    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame(prev => ({
        ...prev,
        ...details,
        id: Date.now().toString(),
        requirementIds: []
      }));

      if (!details.trailerUrl) {
        setTimeout(() => {
          alert("Note: No trailer URL was found for this game. You may want to add one manually.");
        }, 150);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setEditingGame(null);
      alert("Failed to fetch game details from Steam.");
    } finally {
      setIsFetchingNewGame(false);
    }
  };

  const handleSave = async () => {
    if (!editingGame?.name) return;
    const gameToSave = { ...editingGame, id: editingGame.id || Date.now().toString() } as Game;
    const exists = games.find(g => g.id === gameToSave.id);
    
    try {
      if (exists) await onEditGame(gameToSave);
      else await onAddGame(gameToSave);
      setEditingGame(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message || 'Unknown error'}`);
    }
  };

  const confirmDeletion = async () => {
    if (gameToDelete) {
      try {
        await onDeleteGame(gameToDelete.id);
        setGameToDelete(null);
      } catch (err: any) {
        alert(`Delete failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    if (!editingGame) return;
    const currentIds = editingGame.requirementIds || [];
    const newIds = currentIds.includes(templateId) 
      ? currentIds.filter(id => id !== templateId)
      : [...currentIds, templateId];
    setEditingGame({ ...editingGame, requirementIds: newIds });
  };

  const processedGames = useMemo(() => {
    let result = [...games];
    if (librarySearch) result = result.filter(g => g.name.toLowerCase().includes(librarySearch.toLowerCase()));
    return result;
  }, [games, librarySearch]);

  const toggleSelectAll = () => {
    if (selectedIds.size === processedGames.length && processedGames.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedGames.map(g => g.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} games?`)) {
      setIsBulkProcessing(true);
      const gamesToDelete = processedGames.filter(g => selectedIds.has(g.id));
      for (const game of gamesToDelete) {
        try { await onDeleteGame(game.id); } catch (e) {}
      }
      setSelectedIds(new Set());
      setIsBulkProcessing(false);
    }
  };

  const categorizedTemplates = useMemo(() => {
    const ram: RequirementTemplate[] = [];
    const vga: RequirementTemplate[] = [];
    const others: RequirementTemplate[] = [];
    templates.forEach(t => {
      const label = t.label.toLowerCase();
      const isRam = label.includes('ram') || (/\d+\s*gb/.test(label) && !label.includes('vga') && !label.includes('gpu'));
      const isVga = label.includes('vga') || label.includes('gpu') || label.includes('graphics');
      if (isRam) ram.push(t); else if (isVga) vga.push(t); else others.push(t);
    });
    return { ram, vga, others };
  }, [templates]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 relative pb-24">
      {isBulkProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-white font-medium">Processing...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Admin Dashboard</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logoutAdmin()} className="text-red-400">Logout</Button>
      </div>

      <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-8">
        <h2 className="text-xl font-bold text-white">Requirement Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RAM SECTION */}
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Add RAM Tag</label>
              <div className="flex gap-2">
                <input type="text" value={newRamSize} onChange={(e) => setNewRamSize(e.target.value)} placeholder="e.g. 16GB RAM" className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={() => { if(newRamSize) { onAddTemplate(newRamSize); setNewRamSize(''); } }} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current RAM Tags</h4>
              <div className="flex flex-wrap gap-2">
                {categorizedTemplates.ram.map(t => (
                  <div key={t.id} className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md flex items-center gap-2 group">
                    <span className="text-xs text-zinc-300">{t.label}</span>
                    <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {categorizedTemplates.ram.length === 0 && <p className="text-[10px] text-zinc-600 italic">No RAM tags added</p>}
              </div>
            </div>
          </div>

          {/* VGA SECTION */}
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Add VGA Tag</label>
              <div className="flex gap-2">
                <input type="text" value={newVgaSize} onChange={(e) => setNewVgaSize(e.target.value)} placeholder="e.g. RTX 3060" className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={() => { if(newVgaSize) { onAddTemplate(newVgaSize); setNewVgaSize(''); } }} className="p-1.5 bg-emerald-600 rounded-lg text-white hover:bg-emerald-700 transition-colors">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current VGA Tags</h4>
              <div className="flex flex-wrap gap-2">
                {categorizedTemplates.vga.map(t => (
                  <div key={t.id} className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md flex items-center gap-2 group">
                    <span className="text-xs text-zinc-300">{t.label}</span>
                    <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {categorizedTemplates.vga.length === 0 && <p className="text-[10px] text-zinc-600 italic">No VGA tags added</p>}
              </div>
            </div>
          </div>

          {/* OTHER SECTION */}
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Add Other Tag</label>
              <div className="flex gap-2">
                <input type="text" value={newTemplateLabel} onChange={(e) => setNewTemplateLabel(e.target.value)} placeholder="e.g. SSD Required" className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                <button onClick={() => { if(newTemplateLabel) { onAddTemplate(newTemplateLabel); setNewTemplateLabel(''); } }} className="p-1.5 bg-amber-600 rounded-lg text-white hover:bg-amber-700 transition-colors">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Other Tags</h4>
              <div className="flex flex-wrap gap-2">
                {categorizedTemplates.others.map(t => (
                  <div key={t.id} className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md flex items-center gap-2 group">
                    <span className="text-xs text-zinc-300">{t.label}</span>
                    <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {categorizedTemplates.others.length === 0 && <p className="text-[10px] text-zinc-600 italic">No other tags added</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-white">Import from Steam</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Search Store</label>
            <div className="flex gap-2">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Game title..." className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none" />
              <Button onClick={handleSearch} isLoading={isSearching}>Search</Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Manual ID Sync</label>
            <div className="flex gap-2">
              <input type="text" value={manualAppId} onChange={(e) => setManualAppId(e.target.value)} placeholder="Steam App ID" className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none" />
              <Button variant="secondary" onClick={() => handleSelectSteamGame(manualAppId)}>Sync</Button>
            </div>
          </div>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800">
            {searchResults.map(result => (
              <button key={result.appId} onClick={() => handleSelectSteamGame(result.appId)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 text-left">
                <span className="font-medium text-zinc-300">{result.name}</span>
                <span className="text-[10px] text-zinc-600">ID: {result.appId}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {editingGame && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative my-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-20">
              <h3 className="text-xl font-bold truncate">{isFetchingNewGame ? 'Fetching from Steam...' : editingGame.name || 'Edit Game'}</h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Hardware Templates</label>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => toggleTemplateSelection(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${editingGame.requirementIds?.includes(t.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Name</label><input type="text" value={editingGame.name || ''} onChange={e => setEditingGame({...editingGame, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Price</label><input type="text" value={editingGame.price || ''} onChange={e => setEditingGame({...editingGame, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" /></div>
              </div>
              
              <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Trailer URL</label><input type="text" value={editingGame.trailerUrl || ''} onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" placeholder="Direct MP4 or YouTube..." /></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Min Specs (HTML)</label><textarea value={editingGame.minRequirements || ''} onChange={e => setEditingGame({...editingGame, minRequirements: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32 outline-none font-mono" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Rec Specs (HTML)</label><textarea value={editingGame.recommendedRequirements || ''} onChange={e => setEditingGame({...editingGame, recommendedRequirements: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32 outline-none font-mono" /></div>
              </div>

              <div className="space-y-2"><label className="text-xs font-bold text-zinc-500">Description (HTML)</label><textarea value={editingGame.description || ''} onChange={e => setEditingGame({...editingGame, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs h-32 outline-none font-mono" /></div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900 z-20">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isFetchingNewGame}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Library</h2>
          <input type="text" placeholder="Filter..." value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/40 text-[10px] uppercase tracking-widest font-bold text-zinc-500 border-b border-zinc-800">
                <th className="px-6 py-4 w-12"><input type="checkbox" checked={selectedIds.size === processedGames.length && processedGames.length > 0} onChange={toggleSelectAll} /></th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {processedGames.map(game => (
                <tr key={game.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(game.id)} onChange={() => toggleSelect(game.id)} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={game.thumbnail} className="w-12 h-8 object-cover rounded" alt="" />
                      <span className="font-medium text-zinc-300">{game.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
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

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <span className="text-xs font-bold text-white">{selectedIds.size} Selected</span>
          <Button size="sm" variant="danger" onClick={handleBulkDelete}>Delete Selected</Button>
        </div>
      )}

      {gameToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setGameToDelete(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmDeletion}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
