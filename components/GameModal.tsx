
import React from 'react';
import { Game, RequirementTemplate } from '../types';
import { Button } from './Button';

interface GameModalProps {
  game: Game | null;
  templates: RequirementTemplate[];
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, templates, onClose }) => {
  if (!game) return null;

  const activeRequirements = templates.filter(t => game.requirementIds?.includes(t.id));

  // Steam requirements often come wrapped in <ul> or <p> with specific formatting.
  const RequirementBlock = ({ title, html, colorClass }: { title: string, html: string, colorClass: string }) => (
    <div className="space-y-3">
      <h4 className={`${colorClass} text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
        <span className="w-1 h-1 rounded-full bg-current" />
        {title}
      </h4>
      <div 
        className="text-zinc-400 text-[11px] leading-relaxed steam-req-block prose prose-sm prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-zinc-900 sm:border sm:border-zinc-800 sm:rounded-3xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar relative">
        
        {/* Header Hero */}
        <div className="relative h-56 md:h-96 overflow-hidden flex-shrink-0">
          <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all hover:scale-110 active:scale-90 border border-white/10 z-30"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 space-y-2 md:space-y-4 z-20">
            <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter drop-shadow-2xl line-clamp-2">{game.name}</h2>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="px-3 py-1 md:px-4 md:py-1.5 bg-indigo-600 text-white rounded-full text-xs md:text-sm font-black shadow-xl shadow-indigo-600/20">
                {game.price}
              </div>
              {activeRequirements.length > 0 && (
                <div className="px-3 py-1 md:px-4 md:py-1.5 bg-amber-500 text-zinc-900 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20">
                  Hardware Verified
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            
            {/* TRAILER SECTION - Optimized for Mobile */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg hidden sm:block">
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter">Cinematic Preview</h3>
              </div>
              
              <div className="relative group ring-1 ring-white/10 rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl overflow-hidden">
                <div className="aspect-video w-full flex items-center justify-center">
                  {game.trailerUrl ? (
                    game.trailerUrl.includes('youtube') ? (
                      <iframe 
                        className="w-full h-full" 
                        src={game.trailerUrl.replace('watch?v=', 'embed/')} 
                        title="Game Trailer" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video 
                        className="w-full h-full object-contain bg-black" 
                        controls 
                        playsInline
                        preload="metadata"
                        src={game.trailerUrl}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
                      <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">No Preview Media Available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CUSTOM REQUIREMENTS BANNER */}
            {activeRequirements.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-amber-500 rounded-xl md:rounded-2xl shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-zinc-950" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-amber-500 uppercase tracking-tighter">Compatibility Notes</h3>
                    <p className="text-zinc-500 text-[11px] md:text-sm font-medium">Verified hardware constraints for this title:</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {activeRequirements.map(req => (
                    <div key={req.id} className="flex items-center gap-3 bg-zinc-950/80 p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-800 transition-all hover:border-amber-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs md:text-sm font-bold text-zinc-200">{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION SECTION */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="w-1 h-5 md:h-6 bg-indigo-600 rounded-full" />
                Store Description
              </h3>
              <div 
                className="text-zinc-400 text-xs md:text-sm leading-relaxed prose prose-invert max-w-none steam-desc-prose" 
                dangerouslySetInnerHTML={{ __html: game.description }} 
              />
            </div>
          </div>

          {/* SIDEBAR SECTION */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-zinc-800/20 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-6 md:space-y-8 backdrop-blur-sm">
              <h3 className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">System Specifications</h3>
              
              <RequirementBlock 
                title="Entry Level (Min)" 
                colorClass="text-indigo-400" 
                html={game.minRequirements} 
              />
              
              <div className="h-px bg-white/5" />
              
              <RequirementBlock 
                title="Optimal Level (Rec)" 
                colorClass="text-emerald-400" 
                html={game.recommendedRequirements} 
              />
            </div>

            <Button 
              className="w-full py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs" 
              variant="secondary" 
              onClick={onClose}
            >
              Close Catalog
            </Button>
          </div>
        </div>
      </div>
      
      <style>{`
        .steam-req-block ul { list-style: none; padding: 0; margin: 0; }
        .steam-req-block li { margin-bottom: 0.5rem; }
        .steam-req-block strong { color: #f4f4f5; display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .steam-desc-prose img { border-radius: 0.75rem; margin: 1rem 0; max-width: 100%; height: auto; }
        .steam-desc-prose h2, .steam-desc-prose h3 { font-size: 1.125rem; font-weight: 700; color: #fff; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        @media (max-width: 640px) {
          .steam-desc-prose p { margin-bottom: 0.75rem; }
        }
      `}</style>
    </div>
  );
};
