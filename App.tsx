
import React, { useState, useEffect, useMemo } from 'react';
import { Game, ViewMode, RamVgaTemplate, MiscTemplate, RequirementTemplate } from './types';
import { AdminPanel } from './components/AdminPanel';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { LoginForm } from './components/LoginForm';
import { Footer } from './components/Footer';
import { 
  cloudFetchGames, 
  cloudSaveGame, 
  cloudDeleteGame, 
  isFirebaseConfigured, 
  subscribeToAuth,
  cloudFetchTemplates,
  cloudFetchRequirements,
  cloudSaveTemplate,
  cloudSaveRequirements,
  cloudDeleteTemplate,
  cloudDeleteRequirements
} from './firebase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VISITOR);
  const [games, setGames] = useState<Game[]>([]);
  const [ramVgaTemplates, setRamVgaTemplates] = useState<RamVgaTemplate[]>([]);
  const [miscTemplates, setMiscTemplates] = useState<MiscTemplate[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [onlyWithRequirements, setOnlyWithRequirements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (isFirebaseConfigured) {
        try {
          const [gamesRes, templatesRes, requirementsRes] = await Promise.allSettled([
            cloudFetchGames(),
            cloudFetchTemplates(),
            cloudFetchRequirements(),
          ]);
          
          if (gamesRes.status === 'fulfilled' && gamesRes.value) setGames(gamesRes.value as Game[]);
          if (templatesRes.status === 'fulfilled' && Array.isArray(templatesRes.value)) {
            setRamVgaTemplates(templatesRes.value as RamVgaTemplate[]);
          }
          if (requirementsRes.status === 'fulfilled' && Array.isArray(requirementsRes.value)) {
            setMiscTemplates(requirementsRes.value as MiscTemplate[]);
          }
        } catch (e) {
          console.error("Data fetch failed", e);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const parseValue = (label: string | number): number => {
    const sLabel = label.toString();
    if (/^\d+(\.\d+)?$/.test(sLabel)) return parseFloat(sLabel);
    const match = sLabel.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(gb|mb)/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    return match[2] === 'mb' ? val / 1024 : val;
  };

  const groupedTemplates = useMemo(() => {
    const safeRamVga = Array.isArray(ramVgaTemplates) ? ramVgaTemplates : [];
    const safeMisc = Array.isArray(miscTemplates) ? miscTemplates : [];
    
    return {
      ram: safeRamVga.filter(t => t.category === 'ram').sort((a, b) => parseValue(a.label) - parseValue(b.label)),
      vga: safeRamVga.filter(t => t.category === 'vga').sort((a, b) => parseValue(a.label) - parseValue(b.label)),
      others: safeMisc.filter(t => t.category === 'others')
    };
  }, [ramVgaTemplates, miscTemplates]);

  const filteredGames = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return games.filter(g => {
      if (query && !g.name.toLowerCase().includes(query)) return false;
      const gameReqs = g.requirementIds || [];
      if (onlyWithRequirements && gameReqs.length === 0) return false;

      if (selectedReqIds.length > 0) {
        // RAM Compatibility
        const selRam = groupedTemplates.ram.filter(t => selectedReqIds.includes(t.id));
        if (selRam.length > 0) {
          const userMax = Math.max(...selRam.map(t => parseValue(t.label)));
          const gRam = groupedTemplates.ram.filter(t => gameReqs.includes(t.id));
          if (gRam.length > 0) {
            const gMin = Math.min(...gRam.map(t => parseValue(t.label)));
            if (gMin > userMax) return false;
          } else if (onlyWithRequirements) return false;
        }

        // VGA Compatibility
        const selVga = groupedTemplates.vga.filter(t => selectedReqIds.includes(t.id));
        if (selVga.length > 0) {
          const userMax = Math.max(...selVga.map(t => parseValue(t.label)));
          const gVga = groupedTemplates.vga.filter(t => gameReqs.includes(t.id));
          if (gVga.length > 0) {
            const gMin = Math.min(...gVga.map(t => parseValue(t.label)));
            if (userMax > 0 && gMin > 0 && gMin > userMax) return false;
            if (gMin === 0 && !selVga.some(t => gameReqs.includes(t.id))) return false;
          } else if (onlyWithRequirements) return false;
        }

        // Misc Features
        const selOther = selectedReqIds.filter(id => groupedTemplates.others.some(t => t.id === id));
        if (selOther.length > 0 && !selOther.some(id => gameReqs.includes(id))) return false;
      }
      return true;
    });
  }, [games, searchTerm, selectedReqIds, onlyWithRequirements, groupedTemplates]);

  const allTemplates: RequirementTemplate[] = useMemo(() => {
    return [...ramVgaTemplates, ...miscTemplates];
  }, [ramVgaTemplates, miscTemplates]);

  const FilterPanel = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Compatibility</h3>
        {selectedReqIds.length > 0 && <button onClick={() => setSelectedReqIds([])} className="text-[10px] text-indigo-400 font-bold">Reset</button>}
      </div>
      <div className="space-y-6">
        {[
          { title: "Memory (RAM)", tags: groupedTemplates.ram, color: "bg-indigo-500", suffix: "GB" },
          { title: "Graphics (VGA)", tags: groupedTemplates.vga, color: "bg-emerald-500", suffix: "GB" },
          { title: "Features", tags: groupedTemplates.others, color: "bg-amber-500", suffix: "" }
        ].map(s => (
          <div key={s.title} className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
              <span className={`w-1 h-1 rounded-full ${s.color}`} /> {s.title}
            </h4>
            <div className="flex flex-wrap gap-2">
              {s.tags.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedReqIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedReqIds.includes(t.id) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                >
                  {t.label}{s.suffix}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isFilterDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsFilterDrawerOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-800 shadow-2xl transition-transform duration-300 transform ${isFilterDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 text-zinc-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto"><FilterPanel /></div>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">SteamVault</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none text-xs outline-none w-48 text-white" />
            </div>
            <button onClick={() => setViewMode(viewMode === ViewMode.VISITOR ? ViewMode.ADMIN : ViewMode.VISITOR)} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors">
              {viewMode === ViewMode.ADMIN ? 'Store' : 'Admin'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-40"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
        ) : viewMode === ViewMode.ADMIN ? (
          currentUser ? (
            <AdminPanel 
              games={games} 
              templates={ramVgaTemplates} 
              miscTemplates={miscTemplates}
              onAddGame={async (g) => { setGames([g, ...games]); await cloudSaveGame(g); }}
              onEditGame={async (g) => { setGames(games.map(x => x.id === g.id ? g : x)); await cloudSaveGame(g); }}
              onDeleteGame={async (id) => { setGames(games.filter(x => x.id !== id)); await cloudDeleteGame(id); }}
              onAddTemplate={async (l, c) => { const n = { id: Date.now().toString(), label: l, category: c }; setRamVgaTemplates(prev => [...prev, n]); await cloudSaveTemplate(n); }}
              onAddRequirements={async (l, c) => { const n = { id: Date.now().toString(), label: l, category: c }; setMiscTemplates(prev => [...prev, n]); await cloudSaveRequirements(n); }}
              onDeleteTemplate={async (id) => { setRamVgaTemplates(prev => prev.filter(x => x.id !== id)); await cloudDeleteTemplate(id); }}
              onDeleteRequirements={async (id) => { setMiscTemplates(prev => prev.filter(x => x.id !== id)); await cloudDeleteRequirements(id); }}
            />
          ) : <LoginForm />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Game Collection</h2>
              <button onClick={() => setIsFilterDrawerOpen(true)} className="md:hidden flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Filters {selectedReqIds.length > 0 && `(${selectedReqIds.length})`}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <aside className="hidden md:block sticky top-24 h-fit bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-sm"><FilterPanel /></aside>
              <div className="md:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map(game => <GameCard key={game.id} game={game} onClick={setSelectedGame} />)}
                  {filteredGames.length === 0 && <div className="col-span-full py-40 text-center text-zinc-600 border border-zinc-800/50 border-dashed rounded-[3rem]">No games found matching criteria.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <GameModal game={selectedGame} templates={allTemplates} onClose={() => setSelectedGame(null)} />
    </div>
  );
};

export default App;
