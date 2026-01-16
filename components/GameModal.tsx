
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img 
            src={game.thumbnail} 
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{game.name}</h2>
            <div className="flex items-center gap-3">
              <div className="inline-block px-3 py-1 bg-indigo-600 rounded text-sm font-semibold">{game.price}</div>
              {activeRequirements.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-500 rounded border border-amber-500/20 text-xs font-bold uppercase tracking-widest">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Requirements Detected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* ADDITIONAL REQUIREMENTS NOTICE */}
            {activeRequirements.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <svg className="w-5 h-5 text-zinc-950" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-500">Mandatory to Play</h3>
                    <p className="text-zinc-500 text-sm">Please ensure you meet these custom requirements set by the administrator.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeRequirements.map(req => (
                    <div key={req.id} className="flex items-center gap-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-semibold text-zinc-200">{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                Watch Trailer
              </h3>
              <div className="aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-zinc-800">
                {game.trailerUrl ? (
                   game.trailerUrl.includes('youtube') || game.trailerUrl.includes('youtu.be') ? (
                    <iframe className="w-full h-full" src={game.trailerUrl.replace('watch?v=', 'embed/')} title="Trailer" frameBorder="0" allowFullScreen></iframe>
                  ) : (
                    <video className="w-full h-full" controls src={game.trailerUrl} />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">No trailer available</div>
                )}
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">About this game</h3>
              <div className="text-zinc-400 leading-relaxed text-sm prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: game.description }} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700/50">
              <h3 className="font-semibold text-zinc-100 mb-4 text-xs uppercase tracking-widest">System Requirements</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-indigo-400 text-[10px] font-bold uppercase mb-2">Minimum Specs</h4>
                  <div className="text-zinc-400 text-xs leading-normal" dangerouslySetInnerHTML={{ __html: game.minRequirements }} />
                </div>
                <div className="pt-4 border-t border-zinc-700">
                  <h4 className="text-emerald-400 text-[10px] font-bold uppercase mb-2">Recommended</h4>
                  <div className="text-zinc-400 text-xs leading-normal" dangerouslySetInnerHTML={{ __html: game.recommendedRequirements }} />
                </div>
              </div>
            </div>
            <Button className="w-full" variant="secondary" onClick={onClose}>Close Details</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
