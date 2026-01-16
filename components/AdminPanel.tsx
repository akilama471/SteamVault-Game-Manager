
import React, { useState, useMemo } from 'react';
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
  onAddTemplate: (label: string, category: 'ram' | 'vga' | 'others') => void;
  onDeleteTemplate: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  games, templates, onAddGame, onEditGame, onDeleteGame, onAddTemplate, onDeleteTemplate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const [newTags, setNewTags] = useState({ ram: '', vga: '', others: '' });

  const grouped = useMemo(() => {
    return {
      ram: templates.filter(t => t.category === 'ram'),
      vga: templates.filter(t => t.category === 'vga'),
      others: templates.filter(t => t.category === 'others')
    };
  }, [templates]);

  const handleSteamSync = async (appId: string) => {
    setIsFetching(true);
    setSearchResults([]);
    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame({ ...details, id: Date.now().toString(), requirementIds: [] });
    } catch (e) { alert("Steam sync failed."); }
    setIsFetching(false);
  };

  const handleSave = async () => {
    if (!editingGame?.name) return;
    const g = { ...editingGame, id: editingGame.id || Date.now().toString() } as Game;
    games.find(x => x.id === g.id) ? await onEditGame(g) : await onAddGame(g);
    setEditingGame(null);
  };

  const toggleTag = (id: string) => {
    if (!editingGame) return;
    const cur = editingGame.requirementIds || [];
    setEditingGame({ ...editingGame, requirementIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Administrator Dashboard</span>
        <Button variant="ghost" size="sm" onClick={logoutAdmin} className="text-red-400">Logout</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Steam Import */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <h3 className="text-xl font-bold text-white">Import from Steam</h3>
          <div className="flex gap-2">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Steam game name..." className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none" />
            <Button onClick={async () => { setIsSearching(true); setSearchResults(await searchSteamGames(searchQuery)); setIsSearching(false); }} isLoading={isSearching}>Search</Button>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
              {searchResults.map(r => (
                <button key={r.appId} onClick={() => handleSteamSync(r.appId)} className="w-full p-3 hover:bg-zinc-900 text-left text-sm text-zinc-300 flex justify-between">
                  {r.name} <span className="text-[10px] text-zinc-600">Sync Details</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Triple-Input Tag Manager */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
          <h3 className="text-xl font-bold text-white">Hardware Tags Manager</h3>
          <div className="space-y-4">
            {([
              { key: 'ram', label: 'Memory (RAM)', color: 'text-indigo-400', placeholder: 'e.g. 16GB RAM' },
              { key: 'vga', label: 'Graphics (VGA)', color: 'text-emerald-400', placeholder: 'e.g. 8GB VRAM' },
              { key: 'others', label: 'Misc/System', color: 'text-amber-400', placeholder: 'e.g. SSD Required' }
            ] as const).map(cat => (
              <div key={cat.key} className="space-y-2">
                <label className={`text-[10px] font-bold ${cat.color} uppercase tracking-widest`}>{cat.label}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTags[cat.key]} 
                    onChange={e => setNewTags({...newTags, [cat.key]: e.target.value})}
                    placeholder={cat.placeholder}
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none" 
                  />
                  <Button size="sm" onClick={() => { if(newTags[cat.key]) { onAddTemplate(newTags[cat.key], cat.key); setNewTags({...newTags, [cat.key]: ''}); } }}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {grouped[cat.key].map(t => (
                    <div key={t.id} className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-md flex items-center gap-2 group">
                      <span className="text-[10px] text-zinc-500 font-medium">{t.label}</span>
                      <button onClick={() => onDeleteTemplate(t.id)} className="text-zinc-700 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingGame && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10 rounded-t-3xl">
              <h3 className="text-xl font-bold truncate">{isFetching ? 'Fetching Steam Data...' : editingGame.name || 'New Game'}</h3>
              <button onClick={() => setEditingGame(null)} className="text-zinc-500 hover:text-white p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800/50">
                {([
                  { key: 'ram', title: 'Memory (RAM)', color: 'text-indigo-400' },
                  { key: 'vga', title: 'Graphics (VGA)', color: 'text-emerald-400' },
                  { key: 'others', title: 'Misc/System', color: 'text-amber-400' }
                ] as const).map(cat => (
                  <div key={cat.key} className="space-y-3">
                    <span className={`text-[10px] font-bold ${cat.color} uppercase tracking-widest`}>{cat.title}</span>
                    <div className="flex flex-wrap gap-2">
                      {grouped[cat.key].map(t => (
                        <button key={t.id} onClick={() => toggleTag(t.id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${editingGame.requirementIds?.includes(t.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label><input type="text" value={editingGame.name || ''} onChange={e => setEditingGame({...editingGame, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price</label><input type="text" value={editingGame.price || ''} onChange={e => setEditingGame({...editingGame, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Poster</label><input type="text" value={editingGame.thumbnail || ''} onChange={e => setEditingGame({...editingGame, thumbnail: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trailer</label><input type="text" value={editingGame.trailerUrl || ''} onChange={e => setEditingGame({...editingGame, trailerUrl: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm" /></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Min Requirements (HTML)</label><textarea value={editingGame.minRequirements || ''} onChange={e => setEditingGame({...editingGame, minRequirements: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs h-32 font-mono" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">About (HTML)</label><textarea value={editingGame.description || ''} onChange={e => setEditingGame({...editingGame, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs h-40 font-mono" /></div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 rounded-b-3xl bg-zinc-900">
              <Button variant="ghost" onClick={() => setEditingGame(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isFetching}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-white uppercase">Vault Library</h3>
          <div className="flex gap-2">
            <input type="text" placeholder="Search..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-1.5 outline-none" />
            <Button size="sm" onClick={() => setEditingGame({ name: '', price: '', requirementIds: [] })}>Manual Add</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/40 font-bold text-zinc-500 border-b border-zinc-800 uppercase">
              <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {games.filter(g => g.name.toLowerCase().includes(librarySearch.toLowerCase())).map(game => (
                <tr key={game.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4 font-medium text-zinc-300">{game.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingGame(game)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => confirm('Delete game?') && onDeleteGame(game.id)}>Del</Button>
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
