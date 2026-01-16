
import React, { useState, useEffect, useMemo } from 'react';
import { Game, ViewMode, RequirementTemplate } from './types';
import { AdminPanel } from './components/AdminPanel';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { Button } from './components/Button';
import { LoginForm } from './components/LoginForm';
import { Footer } from './components/Footer';
import { 
  cloudFetchGames, 
  cloudSaveGame, 
  cloudDeleteGame, 
  isFirebaseConfigured, 
  subscribeToAuth,
  cloudFetchTemplates,
  cloudSaveTemplate,
  cloudDeleteTemplate
} from './firebase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VISITOR);
  const [games, setGames] = useState<Game[]>([]);
  const [templates, setTemplates] = useState<RequirementTemplate[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [onlyWithRequirements, setOnlyWithRequirements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'offline' | 'error'>('synced');

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Data Loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      if (isFirebaseConfigured) {
        try {
          const [gamesResult, templatesResult] = await Promise.allSettled([
            cloudFetchGames(),
            cloudFetchTemplates()
          ]);
          
          let gamesLoadSuccess = false;
          let templatesLoadSuccess = false;
          let permissionDenied = false;

          if (gamesResult.status === 'fulfilled' && gamesResult.value) {
            setGames(gamesResult.value as Game[]);
            gamesLoadSuccess = true;
          } else if (gamesResult.status === 'rejected') {
            console.warn("Games collection failed to load:", gamesResult.reason);
            if ((gamesResult.reason as any).code === 'permission-denied') permissionDenied = true;
          }

          if (templatesResult.status === 'fulfilled' && templatesResult.value) {
            setTemplates(templatesResult.value as RequirementTemplate[]);
            templatesLoadSuccess = true;
          } else if (templatesResult.status === 'rejected') {
            console.warn("Templates collection failed to load:", templatesResult.reason);
            if ((templatesResult.reason as any).code === 'permission-denied') permissionDenied = true;
          }
          
          if (!gamesLoadSuccess && permissionDenied) {
            setSyncStatus('error');
          } else if (!gamesLoadSuccess && !templatesLoadSuccess) {
            setSyncStatus('offline');
          } else {
            setSyncStatus('synced');
          }
          
          setIsLoading(false);
          return;
        } catch (e: any) {
          console.error("General Sync Error:", e);
          setSyncStatus('offline');
        }
      }

      const savedGames = localStorage.getItem('steam_vault_games');
      const savedTemplates = localStorage.getItem('steam_vault_templates');
      if (savedGames) setGames(JSON.parse(savedGames));
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const saveTemplates = async (newTemplates: RequirementTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('steam_vault_templates', JSON.stringify(newTemplates));
  };

  const addGame = async (game: Game) => {
    const newGames = [game, ...games];
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try { await cloudSaveGame(game); } catch (e) { throw e; }
  };

  const editGame = async (updatedGame: Game) => {
    const newGames = games.map(g => g.id === updatedGame.id ? updatedGame : g);
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try { await cloudSaveGame(updatedGame); } catch (e) { throw e; }
  };

  const deleteGame = async (id: string) => {
    const newGames = games.filter(g => g.id !== id);
    setGames(newGames);
    localStorage.setItem('steam_vault_games', JSON.stringify(newGames));
    try { await cloudDeleteGame(id); } catch (e) { throw e; }
  };

  const handleAddTemplate = async (label: string) => {
    const newTemplate = { id: Date.now().toString(), label };
    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    try { 
      await cloudSaveTemplate(newTemplate); 
      setSyncStatus('synced');
    } catch (e: any) {
      if (e.code === 'permission-denied') setSyncStatus('error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
    try { 
      await cloudDeleteTemplate(id); 
      setSyncStatus('synced');
    } catch (e: any) {
      if (e.code === 'permission-denied') setSyncStatus('error');
    }
  };

  const toggleReqId = (id: string) => {
    setSelectedReqIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const groupedTemplates = useMemo(() => {
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
      // Use robust regex to match memory/vga labels consistently
      const isRam = label.includes('ram') || (/\d+\s*gb/.test(label) && !label.includes('vga') && !label.includes('gpu'));
      const isVga = label.includes('vga') || label.includes('gpu') || label.includes('graphics');

      if (isRam) ram.push(t);
      else if (isVga) vga.push(t);
      else others.push(t);
    });

    return { 
      ram: ram.sort(sortLabels), 
      vga: vga.sort(sortLabels), 
      others 
    };
  }, [templates]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasAnyRequirements = (g.requirementIds?.length || 0) > 0;
      
      if (onlyWithRequirements && !hasAnyRequirements) return false;

      if (selectedReqIds.length > 0) {
        const gameReqs = g.requirementIds || [];
        
        // Group selected IDs by category to apply OR within category and AND across
        const selectedRam = selectedReqIds.filter(id => groupedTemplates.ram.some(t => t.id === id));
        const selectedVga = selectedReqIds.filter(id => groupedTemplates.vga.some(t => t.id === id));
        const selectedOthers = selectedReqIds.filter(id => groupedTemplates.others.some(t => t.id === id));

        const matchesRam = selectedRam.length === 0 || selectedRam.some(id => gameReqs.includes(id));
        const matchesVga = selectedVga.length === 0 || selectedVga.some(id => gameReqs.includes(id));
        const matchesOthers = selectedOthers.length === 0 || selectedOthers.some(id => gameReqs.includes(id));

        if (!(matchesRam && matchesVga && matchesOthers)) return false;
      }

      return matchesSearch;
    });
  }, [games, searchTerm, selectedReqIds, onlyWithRequirements, groupedTemplates]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-none">
                SteamVault
              </h1>
              {syncStatus !== 'synced' && (
                <span className={`text-[9px] font-bold uppercase tracking-tighter ${syncStatus === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                  {syncStatus === 'error' ? 'Sync Permission Error' : 'Local Only'}
                </span>
              )}
            </div>
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
                className="bg-transparent border-none text-sm outline-none w-40 md:w-64 text-white"
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

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 animate-pulse font-medium">Initializing Vault...</p>
          </div>
        ) : viewMode === ViewMode.ADMIN ? (
          currentUser ? (
            <AdminPanel 
              games={games}
              templates={templates}
              onAddGame={addGame}
              onEditGame={editGame}
              onDeleteGame={deleteGame}
              onAddTemplate={handleAddTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          ) : (
            <LoginForm />
          )
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">Explore Games</h2>
                <p className="text-zinc-500 mt-1">Requirements and trailers for your next adventure.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOnlyWithRequirements(!onlyWithRequirements)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-semibold ${
                    onlyWithRequirements 
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg shadow-amber-500/5' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${onlyWithRequirements ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'}`}>
                    {onlyWithRequirements && (
                      <svg className="w-3 h-3 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  Special Requirements Only
                </button>
              </div>
            </div>

            {/* Comprehensive Filter Sidebar/Bar */}
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-6 md:p-8 space-y-8 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
                  </div>
                  <h3 className="text-sm font-black text-zinc-300 uppercase tracking-[0.2em]">Hardware Filter</h3>
                </div>
                {selectedReqIds.length > 0 && (
                  <button 
                    onClick={() => setSelectedReqIds([])}
                    className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/20"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* RAM Category */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Memory (RAM)</h4>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {groupedTemplates.ram.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleReqId(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedReqIds.includes(t.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    {groupedTemplates.ram.length === 0 && <span className="text-xs text-zinc-600 italic">No RAM tags found</span>}
                  </div>
                </div>

                {/* VGA Category */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Graphics (VGA)</h4>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {groupedTemplates.vga.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleReqId(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedReqIds.includes(t.id)
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    {groupedTemplates.vga.length === 0 && <span className="text-xs text-zinc-600 italic">No VGA tags found</span>}
                  </div>
                </div>

                {/* Others Category */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Additional Reqs</h4>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {groupedTemplates.others.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleReqId(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedReqIds.includes(t.id)
                          ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    {groupedTemplates.others.length === 0 && <span className="text-xs text-zinc-600 italic">No other tags found</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGames.length > 0 ? (
                filteredGames.map(game => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    onClick={setSelectedGame} 
                  />
                ))
              ) : (
                <div className="col-span-full py-28 text-center bg-zinc-900/20 border border-zinc-800/40 rounded-[2rem] border-dashed">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                    <svg className="w-10 h-10 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-400">Nothing fits the criteria</h3>
                  <p className="text-zinc-600 mt-2 max-w-sm mx-auto">Try clearing your hardware filters or adjusting your search term.</p>
                  <button 
                    onClick={() => { setSelectedReqIds([]); setSearchTerm(''); setOnlyWithRequirements(false); }}
                    className="mt-8 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                  >
                    Clear everything
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      <GameModal 
        game={selectedGame} 
        templates={templates}
        onClose={() => setSelectedGame(null)} 
      />
    </div>
  );
};

export default App;
