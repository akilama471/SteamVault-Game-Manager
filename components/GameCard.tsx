
import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
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
