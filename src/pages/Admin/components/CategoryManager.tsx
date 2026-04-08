import React, { useState } from "react";
import { GameCategory } from "@/types";
import { Button } from "@/components/Button";

interface CategoryManagerProps {
  categories: GameCategory[];
  onAddCategory: (label: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCategory, setNewCategory] = useState("");

  const handleAdd = () => {
    const val = newCategory.trim();
    if (!val) return;
    
    // Check for duplicates
    if (categories.some(c => c.label.toLowerCase() === val.toLowerCase())) {
        alert("Category already exists!");
        return;
    }

    onAddCategory(val);
    setNewCategory("");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 border border-blue-500/20 bg-blue-500/10 rounded-lg">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white tracking-widest uppercase">Game Categories</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Manage global library game categories</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="New Category (e.g. RPG, Sandbox)"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-white placeholder-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button onClick={handleAdd}>Add Category</Button>
      </div>

      <div>
        {categories.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-sm">
            No categories created yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group flex flex-col items-center p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl relative hover:border-zinc-700 transition-colors"
              >
                <button
                  onClick={() => confirm(`Delete category "${cat.label}"?`) && onDeleteCategory(cat.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Delete category"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="text-sm font-bold text-zinc-300 px-2 py-1">{cat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
