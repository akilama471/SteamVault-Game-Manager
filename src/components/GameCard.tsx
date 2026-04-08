
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
      className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={game.thumbnail || 'https://picsum.photos/400/225'} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity" />
        
        {/* Requirement Badge */}
        {hasRequirements && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-zinc-950 rounded text-[9px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            Special Requirements
          </div>
        )}

        {/* Store Platform Badge */}
        {(game.store === 'steam' || game.steamAppId) && (
          <div className="absolute bottom-2 left-2 px-1.5 py-1 bg-zinc-900/90 rounded text-[9px] font-bold border border-zinc-700/50 flex items-center gap-1" title="Steam">
            <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.979 0C5.678 0 .511 4.86.022 10.934l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.834c0-2.553 2.078-4.631 4.632-4.631 2.554 0 4.631 2.078 4.631 4.631s-2.077 4.632-4.631 4.632h-.107l-4.074 2.91c0 .049.003.098.003.148 0 1.915-1.558 3.473-3.473 3.473a3.476 3.476 0 01-3.396-2.786L.293 14.656A12.013 12.013 0 0011.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
            </svg>
            <span className="text-indigo-400">Steam</span>
          </div>
        )}


        <div className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-900/90 rounded text-xs font-bold text-indigo-400 border border-zinc-700">
          Rs. {game.price || 'Free'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 truncate transition-colors">
          {game.name}
        </h3>
      </div>
    </div>
  );
};
