import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="sticky top-0 z-60 bg-zinc-950 border-t border-zinc-800 py-4">
      <div className="flex flex-row justify-center items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-zinc-400 text-sm">Developed by Akila Madhushanka</p>
          <p className="text-zinc-500 text-xs">© {new Date().getFullYear()} All rights reserved by</p>
          <a href="https://nextgenware.lk/" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white transition-colors font-bold text-sm tracking-wide mt-1">
            NEXTGENWARE
          </a>
        </div>
      </div>
    </footer>
  );
};
