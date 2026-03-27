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
        <h3 className="font-bold text-white uppercase">Vault Library</h3>

        <div className="flex gap-2">
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
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {filtered.map((game) => (
              <tr key={game.id} className="hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-medium text-zinc-300">{game.name}</td>
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
                <td colSpan={2} className="px-6 py-10 text-center text-zinc-600">
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
