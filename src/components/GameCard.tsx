
import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const hasRequirements = (game.requirementIds?.length || 0) > 0;

  return (
    <div 
      onClick={() => onClick(game)}
      className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={game.thumbnail || 'https://picsum.photos/400/225'} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Requirement Badge */}
        {hasRequirements && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-zinc-950 rounded text-[9px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            Special Requirements
          </div>
        )}

        <div className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-900/90 rounded text-xs font-bold text-indigo-400 border border-zinc-700">
          {game.price || 'Free'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
          {game.name}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
          {game.description.replace(/<[^>]*>?/gm, '')}
        </p>
      </div>
    </div>
  );
};
