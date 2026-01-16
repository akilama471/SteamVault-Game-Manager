
import React from 'react';
import { Game } from '../types';
import { Button } from './Button';

interface GameModalProps {
  game: Game | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  if (!game) return null;

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
            <div className="inline-block px-3 py-1 bg-indigo-600 rounded text-sm font-semibold">{game.price}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Trailer */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Official Trailer
              </h3>
              <div className="aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-zinc-800">
                {game.trailerUrl ? (
                   game.trailerUrl.includes('youtube') || game.trailerUrl.includes('youtu.be') ? (
                    <iframe 
                      className="w-full h-full"
                      src={game.trailerUrl.replace('watch?v=', 'embed/')} 
                      title="Trailer"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video 
                      className="w-full h-full" 
                      controls 
                      src={game.trailerUrl}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    No trailer available
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">About this game</h3>
              <div 
                className="text-zinc-400 leading-relaxed text-sm md:text-base prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: game.description }}
              />
            </div>
          </div>

          {/* Sidebar / Requirements */}
          <div className="space-y-6">
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700/50">
              <h3 className="font-semibold text-zinc-100 mb-4 text-sm uppercase tracking-wider">System Requirements</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2">Minimum</h4>
                  <div 
                    className="text-zinc-400 text-xs leading-normal space-y-1"
                    dangerouslySetInnerHTML={{ __html: game.minRequirements }}
                  />
                </div>
                
                <div className="pt-4 border-t border-zinc-700">
                  <h4 className="text-emerald-400 text-xs font-bold uppercase mb-2">Recommended</h4>
                  <div 
                    className="text-zinc-400 text-xs leading-normal space-y-1"
                    dangerouslySetInnerHTML={{ __html: game.recommendedRequirements }}
                  />
                </div>
              </div>
            </div>
            
            <Button className="w-full" variant="secondary" onClick={onClose}>
              Back to Store
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
