import { Game } from "@/types";
import React, { useState, useMemo } from "react";
import FilterPanel from "@/components/FilterPanel";
import { GameCard } from "@/components/GameCard";

interface VisitorPageProps {
  filteredGames: Game[];
  groupedTemplates: any;
  categories: any[];
  selectedReqIds: string[];
  selectedCategoryIds: string[];
  onResetFilters: () => void;
  onToggleTag: (id: string, category: "ram" | "vga" | "others") => void;
  onToggleCategory: (catId: string) => void;
  onSelectGame: (game: Game) => void;
}

const VisitorPage: React.FC<VisitorPageProps> = ({
  filteredGames,
  groupedTemplates,
  categories,
  selectedReqIds,
  selectedCategoryIds,
  onResetFilters,
  onToggleTag,
  onToggleCategory,
  onSelectGame,
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="hidden md:block sticky top-24 h-fit bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-sm">
          <FilterPanel
            groupedTemplates={groupedTemplates}
            categories={categories}
            selectedReqIds={selectedReqIds}
            selectedCategoryIds={selectedCategoryIds}
            onReset={onResetFilters}
            onToggleTag={onToggleTag}
            onToggleCategory={onToggleCategory}
          />
        </aside>

        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={onSelectGame}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorPage;
