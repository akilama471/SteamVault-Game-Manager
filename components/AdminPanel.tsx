
import React, { useState, useMemo, useRef } from 'react';
import { Game, SteamSearchResult, RequirementTemplate } from '../types';
import { searchSteamGames, getSteamGameDetails } from '../services/geminiService';
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
  onDeleteTemplate,
  onBulkImport 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAppId, setManualAppId] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isFetchingNewGame, setIsFetchingNewGame] = useState(false);
  const [isSyncingField, setIsSyncingField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<{name: string, error: string}[]>([]);
  const [bulkEditData, setBulkEditData] = useState({ releaseDate: '', price: '' });

  // Template Management UI state
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newRamSize, setNewRamSize] = useState('');
  const [newVgaSize, setNewVgaSize] = useState('');

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
    
    setIsFetchingNewGame(true);
    setEditingGame({
      steamAppId: appId,
      name: '',
      thumbnail: '',
      price: '',
      description: '',
      minRequirements: '',
      recommendedRequirements: '',
      trailerUrl: '',
      releaseDate: '',
      requirementIds: []
    });
    setSearchResults([]);
    setManualAppId('');

    try {
      const details = await getSteamGameDetails(appId);
      
      setEditingGame(prev => ({
        ...prev,
        ...details,
        id: Date.now().toString(),
      }));

      // Refinement: Specifically check for a valid trailer URL
      if (!details.trailerUrl) {
        // Brief delay to allow modal to render before alerting
        setTimeout(() => {
          alert("Sync complete, but no trailer URL was found for this game. Please provide a trailer link manually (YouTube or direct MP4) to complete the listing.");
        }, 150);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setEditingGame(null);
      alert("Failed to fetch game details. Please try again.");
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
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(gameToDelete.id);
          return next;
        });
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
      const errors: {name: string, error: string}[] = [];
      const gamesToDelete = processedGames.filter(g => selectedIds.has(g.id));

      for (const game of gamesToDelete) {
        try {
          await onDeleteGame(game.id);
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(game.id);
            return next;
          });
        } catch (err: any) {
          errors.push({ name: game.name, error: err.message || 'Cloud delete failed' });
        }
      }

      setIsBulkProcessing(false);
      if (errors.length > 0) {
        setBulkErrors(errors);
      }
    }
  };

  const handleBulkEditSubmit = async () => {
    setIsBulkProcessing(true);
    setBulkErrors([]);
    const gamesToEdit = processedGames.filter(g => selectedIds.has(g.id));
    const errors: {name: string, error: string}[] = [];

    for (const game of gamesToEdit) {
      try {
        await onEditGame({
          ...game,
          ...(bulkEditData.releaseDate ? { releaseDate: bulkEditData.releaseDate } : {}),
          ...(bulkEditData.price ? { price: bulkEditData.price } : {})
        });
      } catch (err: any) {
        errors.push({ name: game.name, error: err.message || 'Update failed' });
      }
    }

    setIsBulkProcessing(false);
    if (errors.length > 0) {
      setBulkErrors(errors);
    } else {
      setIsBulkEditModalOpen(false);
      setSelectedIds(new Set());
      setBulkEditData({ releaseDate: '', price: '' });
    }
  };

  const categorizedTemplates = useMemo(() => {
    const ram: RequirementTemplate[] = [];
    const vga: RequirementTemplate[] = [];
    const others: RequirementTemplate[] = [];

    const sortLabels = (a: RequirementTemplate, b: RequirementTemplate) => {
      const numA = parseInt(a.label.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.label.match(/\d+/)?.[0] || '0');
      return numA - numB;
    };

    templates.forEach(t => {
      const label = t.label.toLowerCase();
      // Improved matching: catch "8GB", "8 GB RAM", etc.
      const isRam = label.includes('ram') || (/\d+\s*gb/.test(label) && !label.includes('vga') && !label.includes('gpu'));
      const isVga = label.includes('vga') || label.includes('gpu') || label.includes('graphics');

      if (isRam) ram.push(t);
      else if (isVga) vga.push(t);
      else others.push(t);
    });

    return { ram: ram.sort(sortLabels), vga: vga.sort(sortLabels), others };
  }, [templates]);

  const quickAddRam = ["1GB RAM", "2GB RAM", "4GB RAM", "8GB RAM", "16GB RAM", "32GB RAM"];
  const quickAddVga = ["1GB VGA", "2GB VGA", "4GB VGA", "8GB VGA", "12GB VGA"];

  const handleQuickAdd = (label: string) => {
    if (!templates.find(t => t.label === label)) {
      onAddTemplate(label);
    }
  };

  const handleAddNewRam = () => {
    const val = newRamSize.trim();
    if (val) {
      const label = val.toUpperCase().includes('RAM') ? val : `${val} RAM`;
      handleQuickAdd(label);
      setNewRamSize('');
    }
  };

  const handleAddNewVga = () => {
    const val = newVgaSize.trim();
    if (val) {
      const label = val.toUpperCase().includes('VGA') ? val : `${val} VGA`;
      handleQuickAdd(label);
      setNewVgaSize('');
    }
  };

  const FieldSkeleton = () => (
    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10 animate-pulse overflow-hidden">
       <div className="flex items-center gap-2">
         <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
         <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Generating...</span>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 relative pb-24">
      <input type="file" ref={fileInputRef} className="hidden" />

      {isBulkProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-white font-medium">Processing bulk operation...</p>
          </div>
        </div>
      )}

      {bulkErrors.length > 0 && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <h3 className="text-xl font-bold">Operation Partially Failed</h3>
            </div>
            <p className="text-sm text-zinc-400">The following games could not be updated in the cloud:</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {bulkErrors.map((err, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs">
                  <span className="text-white font-bold block mb-1">{err.name}</span>
                  <span className="text-red-400 font-mono">{err.error}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setBulkErrors([])}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Admin Session Active</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logoutAdmin()} className="text-red-400">
          Logout
        </Button>
      </div>

      <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Requirement Templates</h2>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded font-bold uppercase tracking-widest">Master List</span>
        </div>
        
        {/* New Category Add Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Add New RAM Size</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newRamSize}
                onChange={(e) => setNewRamSize(e.target.value)}
                placeholder="e.g. 64GB"
                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button onClick={handleAddNewRam} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
          </div>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Add New VGA Size</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newVgaSize}
                onChange={(e) => setNewVgaSize(e.target.value)}
                placeholder="e.g. 16GB"
                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button onClick={handleAddNewVga} className="p-1.5 bg-emerald-600 rounded-lg text-white hover:bg-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
          </div>
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Add Custom Tag</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTemplateLabel}
                onChange={(e) => setNewTemplateLabel(e.target.value)}
                placeholder="e.g. DX12"
                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button onClick={() => { if(newTemplateLabel.trim()) { onAddTemplate(newTemplateLabel); setNewTemplateLabel(''); } }} className="p-1.5 bg-amber-600 rounded-lg text-white hover:bg-amber-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* RAM Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">RAM CONFIG</h4>
              <span className="text-[9px] text-zinc-600 font-bold">{categorizedTemplates.ram.length} Tags</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {quickAddRam.map(label => (
                  <button 
                    key={label}
                    onClick={() => handleQuickAdd(label)}
                    className="text-[9px] px-2 py-0.5 bg-zinc-800 text-zinc-500 hover:bg-indigo-900/40 hover:text-indigo-300 rounded border border-zinc-700 transition-colors uppercase font-bold"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedTemplates.ram.map(t => (
                  <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 group animate-in zoom-in-95">
                    <span className="text-xs font-bold text-zinc-300">{t.label}</span>
                    <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VGA Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">VGA CONFIG</h4>
              <span className="text-[9px] text-zinc-600 font-bold">{categorizedTemplates.vga.length} Tags</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {quickAddVga.map(label => (
                  <button 
                    key={label}
                    onClick={() => handleQuickAdd(label)}
                    className="text-[9px] px-2 py-0.5 bg-zinc-800 text-zinc-500 hover:bg-emerald-900/40 hover:text-emerald-300 rounded border border-zinc-700 transition-colors uppercase font-bold"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {categorizedTemplates.vga.map(t => (
                  <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 group animate-in zoom-in-95">
                    <span className="text-xs font-bold text-zinc-300">{t.label}</span>
                    <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Others Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">GENERAL</h4>
              <span className="text-[9px] text-zinc-600 font-bold">{categorizedTemplates.others.length} Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorizedTemplates.others.map(t => (
                <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 group animate-in zoom-in-95">
                  <span className="text-xs font-bold text-zinc-300">{t.label}</span>
                  <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {categorizedTemplates.others.length === 0 && <p className="text-[10px] text-zinc-600 italic">No general tags</p>}
            </div>
          </div>
        </div>
      </section>

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
                placeholder="Game title..."
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none"
              />
              <Button onClick={handleSearch} isLoading={isSearching}>Search</Button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Manual ID</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={manualAppId}
                onChange={(e) => setManualAppId(e.target.value)}
                placeholder="Steam App ID"
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm"
              />
              <Button variant="secondary" onClick={() => handleSelectSteamGame(manualAppId)}>Sync Game</Button>
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
              <h3 className="text-xl font-bold truncate max-w-[80%]">
                {isFetchingNewGame ? `Fetching details for AppID: ${editingGame.steamAppId}...` : editingGame.name || 'Game Editor'}
              </h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Additional Requirements</label>
                  <span className="text-[9px] text-zinc-600">Tagged games appear in filtered results</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTemplateSelection(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        editingGame.requirementIds?.includes(t.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  {templates.length === 0 && <p className="text-xs text-zinc-600 italic">No templates available. Create some in the manager above.</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Name</label>
                  <input type="text" value={editingGame.name || ''} onChange={e => setEditingGame({...editingGame, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" placeholder="..." />
                  {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Price</label>
                  <input type="text" value={editingGame.price || ''} onChange={e => setEditingGame({...editingGame, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" placeholder="..." />
                  {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
                </div>
              </div>
              
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500">Thumbnail URL</label>
                <input type="text" value={editingGame.thumbnail || ''} onChange={e => setEditingGame({...editingGame, thumbnail: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none" placeholder="..." />
                {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-zinc-500">Trailer URL</label>
                  {!editingGame.trailerUrl && (
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">Required for preview</span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={editingGame.trailerUrl || ''} 
                  onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})} 
                  className={`w-full bg-zinc-950 border ${!editingGame.trailerUrl ? 'border-amber-500/50' : 'border-zinc-800'} rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 transition-colors`} 
                  placeholder="YouTube URL or direct MP4 link..." 
                />
                {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Minimum Requirements (HTML)</label>
                  <textarea 
                    value={editingGame.minRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, minRequirements: e.target.value})} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32 outline-none font-mono" 
                    placeholder="Min specs HTML content..."
                  />
                  {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-zinc-500">Recommended Requirements (HTML)</label>
                  <textarea 
                    value={editingGame.recommendedRequirements || ''} 
                    onChange={e => setEditingGame({...editingGame, recommendedRequirements: e.target.value})} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32 outline-none font-mono" 
                    placeholder="Rec specs HTML content..."
                  />
                  {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-zinc-500">Description (HTML Content)</label>
                <textarea 
                  value={editingGame.description || ''} 
                  onChange={e => setEditingGame({...editingGame, description: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm h-32 outline-none font-mono" 
                  placeholder="..."
                />
                {(isFetchingNewGame || isSyncingField) && <FieldSkeleton />}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900 z-20">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isFetchingNewGame}>
                {isFetchingNewGame ? 'Processing...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
            <h3 className="text-xl font-bold text-white">Bulk Edit ({selectedIds.size} selected)</h3>
            <p className="text-xs text-zinc-500">Fields with values will be updated for all selected games.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">New Price</label>
                <input 
                  type="text" 
                  placeholder="e.g. Free to Play, $19.99"
                  value={bulkEditData.price}
                  onChange={(e) => setBulkEditData({...bulkEditData, price: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => setIsBulkEditModalOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleBulkEditSubmit} isLoading={isBulkProcessing}>Apply to All</Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
          <h2 className="text-xl font-bold text-white">Manage Library</h2>
          <input type="text" placeholder="Filter..." value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 outline-none" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/40 text-[10px] uppercase tracking-widest font-bold text-zinc-500 border-b border-zinc-800">
                <th className="px-6 py-4 w-12"><input type="checkbox" checked={selectedIds.size === processedGames.length && processedGames.length > 0} onChange={toggleSelectAll} /></th>
                <th className="px-6 py-4">Title & Requirements</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {processedGames.map(game => (
                <tr key={game.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedIds.has(game.id)} onChange={() => toggleSelect(game.id)} />
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={game.thumbnail} className="w-16 h-10 object-cover rounded" alt="" />
                    <div>
                      <span className="font-medium text-zinc-300 block">{game.name}</span>
                      <div className="flex gap-1 mt-1">
                        {game.requirementIds?.map(rid => {
                          const t = templates.find(temp => temp.id === rid);
                          return t ? <span key={rid} className="text-[8px] bg-amber-500/10 text-amber-500 px-1 rounded font-bold uppercase">{t.label}</span> : null;
                        })}
                      </div>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 ring-1 ring-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">{selectedIds.size} Selected</span>
              <button onClick={() => setSelectedIds(new Set())} className="text-[10px] text-zinc-500 hover:text-white transition-colors text-left mt-1">Deselect all</button>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsBulkEditModalOpen(true)}>
                Bulk Edit
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-sm text-center">
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
