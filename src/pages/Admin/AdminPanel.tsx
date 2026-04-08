import React, { useMemo, useState } from "react";
import type { Game, SteamSearchResult, RamVgaTemplate, MiscTemplate } from "@/types";
import { searchSteamGames, getSteamGameDetails } from "@/services/steamService";
import { Button } from "@/components/Button";
import { logoutAdmin } from "@/firebase/firebase";

import SteamImportCard from "@/pages/Admin/components/SteamImportCard";
import ManualImportCard from "@/pages/Admin/components/ManualImportCard";
import CategoryManager from "@/pages/Admin/components/CategoryManager";
import HardwareTagsManager from "@/pages/Admin/components/HardwareTagsManager";
import GameEditorModal from "@/pages/Admin/components/GameEditorModal";
import VaultLibraryTable from "@/pages/Admin/components/VaultLibraryTable";

interface AdminPanelProps {
  games: Game[];
  templates: RamVgaTemplate[];
  miscTemplates: MiscTemplate[];
  categories: { id: string; label: string }[];
  onAddGame: (game: Game) => Promise<void>;
  onEditGame: (game: Game) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
  onAddTemplate: (label: number, category: "ram" | "vga") => void;
  onAddRequirements: (label: string, category: "others") => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteRequirements: (id: string) => void;
  onAddCategory: (label: string) => void;
  onDeleteCategory: (id: string) => void;
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
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  // ── Steam State ──
  const [steamSearchQuery, setSteamSearchQuery] = useState("");
  const [steamIdInput, setSteamIdInput] = useState("");
  const [steamSearchResults, setSteamSearchResults] = useState<SteamSearchResult[]>([]);
  const [isSteamSearching, setIsSteamSearching] = useState(false);

  // ── Shared State ──
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

  // ── Steam Handlers ──
  const handleSteamSync = async (appId: string) => {
    if (!appId) return;
    setIsFetching(true);
    setSteamSearchResults([]);
    try {
      const details = await getSteamGameDetails(appId);
      setEditingGame({
        ...details,
        id: Date.now().toString(),
        store: "steam",
        requirementIds: [],
      });
      setSteamIdInput("");
    } catch {
      alert("Steam sync failed. Please check the AppID.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSteamNameSearch = async () => {
    const q = steamSearchQuery.trim();
    if (!q) return;

    setIsSteamSearching(true);
    try {
      const results = await searchSteamGames(q);
      setSteamSearchResults(results);
    } catch {
      alert("Search failed. Try again.");
    } finally {
      setIsSteamSearching(false);
    }
  };

  // ── Shared Handlers ──
  const handleSave = async () => {
    if (!editingGame?.name) return;
    const g = {
      ...editingGame,
      id: editingGame.id || Date.now().toString(),
      store: editingGame.store || "manual",
    } as Game;
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

  const toggleCategory = (id: string) => {
    setEditingGame((prev) => {
      if (!prev) return prev;
      const cur = prev.categoryIds ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, categoryIds: next };
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

      {/* Import Cards — Steam, Manual side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SteamImportCard
          searchQuery={steamSearchQuery}
          onChangeSearchQuery={setSteamSearchQuery}
          steamIdInput={steamIdInput}
          onChangeSteamIdInput={setSteamIdInput}
          isSearching={isSteamSearching}
          isFetching={isFetching}
          searchResults={steamSearchResults}
          onSearchByName={handleSteamNameSearch}
          onImportById={(id) => handleSteamSync(id)}
          onSyncResult={(appId) => handleSteamSync(appId)}
        />

        <ManualImportCard
          onManualAdd={() =>
            setEditingGame({ name: "", price: "", store: "manual", requirementIds: [] })
          }
        />
      </div>

      <CategoryManager
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* Hardware Tags — full width below import cards */}
      <HardwareTagsManager
        grouped={grouped}
        newTags={newTags}
        onChangeNewTags={setNewTags}
        onAddTemplate={onAddTemplate}
        onAddRequirements={onAddRequirements}
        onDeleteTemplate={onDeleteTemplate}
        onDeleteRequirements={onDeleteRequirements}
      />

      <GameEditorModal
        open={!!editingGame}
        isFetching={isFetching}
        editingGame={editingGame || { name: "", price: "", requirementIds: [] }}
        grouped={grouped}
        categories={categories}
        onClose={() => setEditingGame(null)}
        onToggleTag={toggleTag}
        onToggleCategory={toggleCategory}
        onChangeField={updateEditingField}
        onSave={handleSave}
      />

      <VaultLibraryTable
        games={games}
        librarySearch={librarySearch}
        onChangeLibrarySearch={setLibrarySearch}
        onManualAdd={() =>
          setEditingGame({ name: "", price: "", store: "manual", requirementIds: [] })
        }
        onEdit={(game) => setEditingGame(game)}
        onDelete={onDeleteGame}
      />
    </div>
  );
};
