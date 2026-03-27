
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-none">
                  SteamVault
                </h1>
             </div>
             <p className="text-zinc-500 text-sm text-center md:text-left max-w-xs leading-relaxed">
               A high-performance gaming catalog with precise hardware requirement tracking. Empowering gamers to verify compatibility instantly.
             </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3">
            <p className="text-zinc-400 text-sm">
              Developed by <a href="https://akilama471.github.io/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold border-b border-indigo-500/20 hover:border-indigo-400">Akila Madhushanka</a>
            </p>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-zinc-500 text-xs">
                © {new Date().getFullYear()} All rights reserved by
              </p>
              <a href="https://nextgenware.lk/" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white transition-colors font-bold text-sm tracking-wide mt-1">
                NEXTGENWARE
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-900 flex justify-center">
          <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.3em]">
            Optimized for Modern Gaming Hardware
          </p>
        </div>
      </div>
    </footer>
  );
};
