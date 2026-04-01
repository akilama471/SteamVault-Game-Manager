import React from "react";
import { ViewMode } from "@/types";

type NavbarProps = {
  viewMode: ViewMode;
  onToggleViewMode: () => void;

  searchTerm: string;
  onSearchTermChange: (value: string) => void;

  selectedReqCount: number;
  onOpenFilters: () => void;
};

const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onToggleViewMode,
  searchTerm,
  onSearchTermChange,
  selectedReqCount,
  onOpenFilters,
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">SteamVault</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search (desktop) */}
          <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="bg-transparent border-none text-xs outline-none w-48 text-white"
            />
          </div>

          {/* Filters button (mobile) */}
          <button
            onClick={onOpenFilters}
            className="sm:hidden flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            {selectedReqCount > 0 ? `(${selectedReqCount})` : ""}
          </button>

          {/* Admin/Store toggle */}
          <button
            onClick={onToggleViewMode}
            className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            type="button"
          >
            {viewMode === ViewMode.ADMIN ? "Store" : "Admin"}
          </button>
        </div>
      </div>

      {/* Search (mobile) */}
      <div className="sm:hidden px-4 pb-3">
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="bg-transparent border-none text-xs outline-none w-full text-white"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
