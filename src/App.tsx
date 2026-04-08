import React, { useState } from "react";
import { ViewMode, Game } from "@/types";

import { AdminPanel } from "@/pages/Admin/AdminPanel";
import VisitorPage from "@/pages/Visitor/VisitorPage";
import { LoginForm } from "@/pages/Auth/LoginForm";

import { GameModal } from "@/components/GameModal";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FilterDrawer from "@/components/FilterDrawer";

import {
  cloudSaveGame,
  cloudDeleteGame,
  cloudSaveTemplate,
  cloudSaveRequirements,
  cloudDeleteTemplate,
  cloudDeleteRequirements,
  cloudSaveCategory,
  cloudDeleteCategory,
} from "@/firebase/firebase";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useSteamVaultData } from "@/hooks/useSteamVaultData";
import { useGameFilters } from "@/hooks/useGameFilters";

const App: React.FC = () => {
  // -----------------------
  // Global UI State
  // -----------------------
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VISITOR);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // -----------------------
  // Auth
  // -----------------------
  const currentUser = useAuthUser();

  // -----------------------
  // Data
  // -----------------------
  const {
    isLoading,
    games,
    setGames,
    ramVgaTemplates,
    setRamVgaTemplates,
    miscTemplates,
    setMiscTemplates,
    categories,
    setCategories,
  } = useSteamVaultData();

  // -----------------------
  // Filtering (Visitor)
  // -----------------------
  const {
    searchTerm,
    setSearchTerm,
    selectedReqIds,
    setSelectedReqIds,
    selectedCategoryIds,
    setSelectedCategoryIds,
    groupedTemplates,
    filteredGames,
    allTemplates,
    handleToggleTag,
    handleToggleCategory,
  } = useGameFilters(games, ramVgaTemplates, miscTemplates, categories);

  const isVisitor = viewMode === ViewMode.VISITOR;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Mobile filter drawer (Visitor only) */}
      {isVisitor && (
        <FilterDrawer
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          groupedTemplates={groupedTemplates}
          categories={categories}
          selectedReqIds={selectedReqIds}
          selectedCategoryIds={selectedCategoryIds}
          onResetSelected={() => {
            setSelectedReqIds([]);
            setSelectedCategoryIds([]);
          }}
          onToggleTag={handleToggleTag}
          onToggleCategory={handleToggleCategory}
        />
      )}

      {/* Global Navbar */}
      <Navbar
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode(isVisitor ? ViewMode.ADMIN : ViewMode.VISITOR)
        }
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedReqCount={selectedReqIds.length}
        onOpenFilters={() => setIsFilterDrawerOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : isVisitor ? (
          // -----------------------
          // VISITOR PAGE
          // -----------------------
          <VisitorPage
            filteredGames={filteredGames}
            groupedTemplates={groupedTemplates}
            categories={categories}
            selectedReqIds={selectedReqIds}
            selectedCategoryIds={selectedCategoryIds}
            onResetFilters={() => {
              setSelectedReqIds([]);
              setSelectedCategoryIds([]);
            }}
            onToggleTag={handleToggleTag}
            onToggleCategory={handleToggleCategory}
            onSelectGame={setSelectedGame}
          />
        ) : (
          // -----------------------
          // ADMIN PAGE
          // -----------------------
          currentUser ? (
            <AdminPanel
              games={games}
              templates={ramVgaTemplates}
              miscTemplates={miscTemplates}
              onAddGame={async (g) => {
                setGames((prev) => [g, ...prev]);
                await cloudSaveGame(g);
              }}
              onEditGame={async (g) => {
                setGames((prev) =>
                  prev.map((x) => (x.id === g.id ? g : x))
                );
                await cloudSaveGame(g);
              }}
              onDeleteGame={async (id) => {
                setGames((prev) => prev.filter((x) => x.id !== id));
                await cloudDeleteGame(id);
              }}
              onAddTemplate={async (l, c) => {
                const n = { id: Date.now().toString(), label: l, category: c };
                setRamVgaTemplates((prev) => [...prev, n]);
                await cloudSaveTemplate(n);
              }}
              onAddRequirements={async (l, c) => {
                const n = { id: Date.now().toString(), label: l, category: c };
                setMiscTemplates((prev) => [...prev, n]);
                await cloudSaveRequirements(n);
              }}
              onDeleteTemplate={async (id) => {
                setRamVgaTemplates((prev) =>
                  prev.filter((x) => x.id !== id)
                );
                await cloudDeleteTemplate(id);
              }}
              onDeleteRequirements={async (id) => {
                setMiscTemplates((prev) =>
                  prev.filter((x) => x.id !== id)
                );
                await cloudDeleteRequirements(id);
              }}
              categories={categories}
              onAddCategory={async (label) => {
                const n = { id: Date.now().toString(), label };
                setCategories((prev) => [...prev, n]);
                await cloudSaveCategory(n);
              }}
              onDeleteCategory={async (id) => {
                setCategories((prev) => prev.filter((x) => x.id !== id));
                await cloudDeleteCategory(id);
              }}
            />
          ) : (
            <LoginForm />
          )
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Global Game Modal */}
      <GameModal
        game={selectedGame}
        templates={allTemplates}
        categories={categories}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
};

export default App;
