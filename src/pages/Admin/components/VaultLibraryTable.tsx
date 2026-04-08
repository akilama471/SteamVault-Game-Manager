import React from "react";
import type { Game } from "@/types";
import { Button } from "@/components/Button";

type VaultLibraryTableProps = {
  games: Game[];
  librarySearch: string;
  onChangeLibrarySearch: (value: string) => void;

  onManualAdd: () => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
};

const VaultLibraryTable: React.FC<VaultLibraryTableProps> = ({
  games,
  librarySearch,
  onChangeLibrarySearch,
  onManualAdd,
  onEdit,
  onDelete,
}) => {
  const filtered = games.filter((g) =>
    g.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-bold text-white uppercase">Library</h3>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={librarySearch}
            onChange={(e) => onChangeLibrarySearch(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-1.5 outline-none"
          />
          <Button size="sm" onClick={onManualAdd}>
            Manual Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/40 font-bold text-zinc-500 border-b border-zinc-800 uppercase">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {filtered.map((game) => (
              <tr key={game.id} className="hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-medium text-zinc-300">{game.name}</td>
                <td className="px-6 py-4">
                  {(game.store === 'steam' || game.steamAppId) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.979 0C5.678 0 .511 4.86.022 10.934l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.834c0-2.553 2.078-4.631 4.632-4.631 2.554 0 4.631 2.078 4.631 4.631s-2.077 4.632-4.631 4.632h-.107l-4.074 2.91c0 .049.003.098.003.148 0 1.915-1.558 3.473-3.473 3.473a3.476 3.476 0 01-3.396-2.786L.293 14.656A12.013 12.013 0 0011.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
                      </svg>
                      Steam
                    </span>
                  )}
                  {game.store === 'manual' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
                      Manual
                    </span>
                  )}
                  {!game.store && !game.steamAppId && (
                    <span className="text-zinc-600 text-[9px]">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(game)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => confirm("Delete game?") && onDelete(game.id)}
                    >
                      Del
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-zinc-600">
                  No games found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default VaultLibraryTable;
