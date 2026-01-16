import React, { useState, useEffect } from 'react';
import { Game, RequirementTemplate } from '../types';
import { Button } from './Button';

interface GameModalProps {
  game: Game | null;
  templates: RequirementTemplate[];
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, templates, onClose }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (game) {
      setIsReady(false);
      // Brief delay to show skeleton and improve perceived performance
      const timer = setTimeout(() => setIsReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [game]);

  if (!game) return null;

  const activeRequirements = templates.filter(t => game.requirementIds?.includes(t.id));

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-zinc-800/50 animate-pulse rounded-lg ${className}`} />
  );

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
          <img 
            src={game.thumbnail} 
            alt={game.name} 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-20'}`} 
          />
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
            {!isReady ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-3/4 md:h-14" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter drop-shadow-2xl line-clamp-2">{game.name}</h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-4">
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
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            
            {/* TRAILER SECTION */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg hidden sm:block">
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter">Cinematic Preview</h3>
              </div>
              
              <div className="relative ring-1 ring-white/10 rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl aspect-video w-full">
                {!isReady ? (
                  <Skeleton className="w-full h-full rounded-none" />
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-700 w-full h-full">
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
                      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                        <img 
                          src={game.thumbnail} 
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-110" 
                        />
                        <div className="absolute inset-0 bg-zinc-950/60" />
                        <div className="relative z-10 flex flex-col items-center text-center p-6">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center mb-4 backdrop-blur-md">
                            <svg className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18" className="text-zinc-500" />
                            </svg>
                          </div>
                          <h4 className="text-sm md:text-base font-bold text-zinc-400">Cinematic Unavailable</h4>
                          <p className="text-[10px] md:text-xs text-zinc-600 mt-1 max-w-[240px]">The publisher hasn't provided a preview video for this title yet.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ABOUT SECTION */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg hidden sm:block">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter">About Game</h3>
              </div>
              {!isReady ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div 
                  className="text-zinc-400 text-sm md:text-base leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-headings:text-white"
                  dangerouslySetInnerHTML={{ __html: game.description }} 
                />
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            {/* SYSTEM REQUIREMENTS CARD */}
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 md:p-8 space-y-8 backdrop-blur-md sticky top-8">
              {!isReady ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                  <RequirementBlock 
                    title="Minimum Requirements" 
                    html={game.minRequirements} 
                    colorClass="text-indigo-400"
                  />
                  <RequirementBlock 
                    title="Recommended Requirements" 
                    html={game.recommendedRequirements} 
                    colorClass="text-emerald-400"
                  />
                  
                  {activeRequirements.length > 0 && (
                    <div className="pt-8 border-t border-zinc-800/50">
                      <h4 className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        Vault Tag Verified
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeRequirements.map(t => (
                          <span 
                            key={t.id} 
                            className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-500"
                          >
                            {/* Convert label to string for regex test */}
                            {t.label}{(t.category === 'ram' || t.category === 'vga') && /^\d+(\.\d+)?$/.test(t.label.toString()) ? 'GB' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-8 mt-8 border-t border-zinc-800/50">
                <Button 
                  variant="primary" 
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                  onClick={() => window.open(`https://store.steampowered.com/app/${game.steamAppId}`, '_blank')}
                >
                  View on Steam Store
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SPACER */}
        <div className="h-12 sm:h-0" />
      </div>
    </div>
  );
};