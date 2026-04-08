import React from "react";
import type { SteamSearchResult } from "@/types";
import { Button } from "@/components/Button";

type SteamImportCardProps = {
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;

  steamIdInput: string;
  onChangeSteamIdInput: (value: string) => void;

  isSearching: boolean;
  isFetching: boolean;

  searchResults: SteamSearchResult[];

  onSearchByName: () => void;
  onImportById: (appId: string) => void;
  onSyncResult: (appId: string) => void;
};

const SteamImportCard: React.FC<SteamImportCardProps> = ({
  searchQuery,
  onChangeSearchQuery,
  steamIdInput,
  onChangeSteamIdInput,
  isSearching,
  isFetching,
  searchResults,
  onSearchByName,
  onImportById,
  onSyncResult,
}) => {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6 relative overflow-hidden">
      {/* Steam accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500" />

      <div className="flex items-center gap-3">
        {/* Steam icon */}
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-sky-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.979 0C5.678 0 .511 4.86.022 10.934l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.834c0-2.553 2.078-4.631 4.632-4.631 2.554 0 4.631 2.078 4.631 4.631s-2.077 4.632-4.631 4.632h-.107l-4.074 2.91c0 .049.003.098.003.148 0 1.915-1.558 3.473-3.473 3.473a3.476 3.476 0 01-3.396-2.786L.293 14.656A12.013 12.013 0 0011.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Import from Steam</h3>
      </div>

      {/* Search by Name */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Search by Name
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Game name..."
            className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none"
          />
          <Button onClick={onSearchByName} isLoading={isSearching}>
            Search
          </Button>
        </div>
      </div>

      {/* Import by AppID */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Import by AppID
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={steamIdInput}
            onChange={(e) => onChangeSteamIdInput(e.target.value)}
            placeholder="e.g. 1091500"
            className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm outline-none"
          />
          <Button
            variant="secondary"
            onClick={() => onImportById(steamIdInput.trim())}
            isLoading={isFetching}
          >
            Import ID
          </Button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
          {searchResults.map((r) => (
            <button
              key={r.appId}
              onClick={() => onSyncResult(r.appId)}
              className="w-full p-3 hover:bg-zinc-900 text-left text-sm text-zinc-300 flex justify-between group"
              type="button"
            >
              {r.name}{" "}
              <span className="text-[10px] text-zinc-600 group-hover:text-indigo-400 transition-colors">
                Sync Details
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SteamImportCard;
