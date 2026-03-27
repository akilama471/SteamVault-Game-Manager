import React, { useMemo, useState } from "react";
import type { Game, SteamSearchResult, RamVgaTemplate, MiscTemplate } from "@/types";
import { searchSteamGames, getSteamGameDetails } from "@/services/steamService";
import { Button } from "@/components/Button";
import { logoutAdmin } from "@/firebase/firebase";

import SteamImportCard from "@/pages/Admin/components/SteamImportCard";
import HardwareTagsManager from "@/pages/Admin/components/HardwareTagsManager";
import GameEditorModal from "@/pages/Admin/components/GameEditorModal";
import VaultLibraryTable from "@/pages/Admin/components/VaultLibraryTable";

interface AdminPanelProps {
  games: Game[];
  templates: RamVgaTemplate[];
  miscTemplates: MiscTemplate[];
  onAddGame: (game: Game) => Promise<void>;
  onEditGame: (game: Game) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
  onAddTemplate: (label: number, category: "ram" | "vga") => void;
  onAddRequirements: (label: string, category: "others") => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteRequirements: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  games,
  templates,
  miscTemplates,
  onAddGame,
  onEditGame,
  onDeleteGame,
  onAddTemplate,
  onAddRequirements,
  onDeleteTemplate,
  onDeleteRequirements,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [steamIdInput, setSteamIdInput] = useState("");
  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [librarySearch, setLibrarySearch] = useState("");
  const [newTags, setNewTags] = useState({ ram: "", vga: "", others: "" });

  const grouped = useMemo(() => {
    return {
      ram: templates.filter((t) => t.category === "ram"),
      vga: templates.filter((t) => t.category === "vga"),
      others: miscTemplates.filter((t) => t.category === "others"),
    };
  }, [templates, miscTemplates]);

  const handleSteamSync = async (appId: string) => {
    if (!appId) return;
    setIsFetching(true);
    setSearchResults([]);
    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame({ ...details, id: Date.now().toString(), requirementIds: [] });
      setSteamIdInput("");
    } catch {
      alert("Steam sync failed. Please check the AppID.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSteamNameSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const results = await searchSteamGames(q);
      setSearchResults(results);
    } catch {
      alert("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!editingGame?.name) return;
    const g = { ...editingGame, id: editingGame.id || Date.now().toString() } as Game;
    games.find((x) => x.id === g.id) ? await onEditGame(g) : await onAddGame(g);
    setEditingGame(null);
  };

  const toggleTag = (id: string) => {
    setEditingGame((prev) => {
      if (!prev) return prev;
      const cur = prev.requirementIds ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, requirementIds: next };
    });
  };

  const updateEditingField = (field: keyof Game, value: string) => {
    setEditingGame((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Administrator Dashboard
        </span>
        <Button variant="ghost" size="sm" onClick={logoutAdmin} className="text-red-400">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SteamImportCard
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          steamIdInput={steamIdInput}
          onChangeSteamIdInput={setSteamIdInput}
          isSearching={isSearching}
          isFetching={isFetching}
          searchResults={searchResults}
          onSearchByName={handleSteamNameSearch}
          onImportById={(id) => handleSteamSync(id)}
          onSyncResult={(appId) => handleSteamSync(appId)}
        />

        <HardwareTagsManager
          grouped={grouped}
          newTags={newTags}
          onChangeNewTags={setNewTags}
          onAddTemplate={onAddTemplate}
          onAddRequirements={onAddRequirements}
          onDeleteTemplate={onDeleteTemplate}
          onDeleteRequirements={onDeleteRequirements}
        />
      </div>

      <GameEditorModal
        open={!!editingGame}
        isFetching={isFetching}
        editingGame={editingGame || { name: "", price: "", requirementIds: [] }}
        grouped={grouped}
        onClose={() => setEditingGame(null)}
        onToggleTag={toggleTag}
        onChangeField={updateEditingField}
        onSave={handleSave}
      />

      <VaultLibraryTable
        games={games}
        librarySearch={librarySearch}
        onChangeLibrarySearch={setLibrarySearch}
        onManualAdd={() => setEditingGame({ name: "", price: "", requirementIds: [] })}
        onEdit={(game) => setEditingGame(game)}
        onDelete={onDeleteGame}
      />
    </div>
  );
};
