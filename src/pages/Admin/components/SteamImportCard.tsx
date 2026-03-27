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
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
      <h3 className="text-xl font-bold text-white">Import from Steam</h3>

      {/* Search by Name */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Search by Name
        </label>
        <div className="flex gap-2">
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
        <div className="flex gap-2">
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
