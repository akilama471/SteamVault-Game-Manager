import React, { useMemo } from "react";
import type { Game, RamVgaTemplate, MiscTemplate, GameCategory } from "@/types";
import { Button } from "@/components/Button";
import { extractRequirements } from "@/services/systemRequirementService";

type GroupedTemplates = {
  ram: RamVgaTemplate[];
  vga: RamVgaTemplate[];
  others: MiscTemplate[];
};

type GameEditorModalProps = {
  open: boolean;
  isFetching: boolean;

  editingGame: Partial<Game>;
  grouped: GroupedTemplates;
  categories: GameCategory[];

  onClose: () => void;
  onToggleTag: (id: string) => void;
  onToggleCategory: (id: string) => void;

  onChangeField: (field: keyof Game, value: string) => void;
  onSave: () => void;
};

const GameEditorModal: React.FC<GameEditorModalProps> = ({
  open,
  isFetching,
  editingGame,
  grouped,
  categories,
  onClose,
  onToggleTag,
  onToggleCategory,
  onChangeField,
  onSave,
}) => {
  if (!open) return null;

  const parsedRequirements = useMemo(
    () => extractRequirements(editingGame.minRequirements || ""),
    [editingGame.minRequirements]
  );

  const requirementFields: Array<{
    key: keyof ReturnType<typeof extractRequirements>;
    label: string;
    multiline?: boolean;
  }> = [
    { key: "Minimum", label: "Minimum" },
    { key: "OS", label: "OS" },
    { key: "Processor", label: "Processor" },
    { key: "Memory", label: "Memory" },
    { key: "Graphics", label: "Graphics" },
    { key: "DirectX", label: "DirectX" },
    { key: "Network", label: "Network" },
    { key: "Storage", label: "Storage" },
    { key: "Notes", label: "Notes", multiline: true },
  ];

  const buildRequirementsHtml = (requirements: ReturnType<typeof extractRequirements>) => {
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const items = [
      ["OS", requirements.OS],
      ["Processor", requirements.Processor],
      ["Memory", requirements.Memory],
      ["Graphics", requirements.Graphics],
      ["DirectX", requirements.DirectX],
      ["Network", requirements.Network],
      ["Storage", requirements.Storage],
      ["Additional Notes", requirements.Notes],
    ]
      .filter(([, value]) => value?.trim())
      .map(
        ([label, value]) => `<li><strong>${label}:</strong> ${escapeHtml((value || "").trim())}</li>`
      )
      .join("");

    const minimum = requirements.Minimum?.trim();

    if (!minimum && !items) return "";

    return `${minimum ? `<strong>${escapeHtml(minimum)}:</strong>` : ""}${items ? `<ul>${items}</ul>` : ""}`;
  };

  const handleRequirementChange = (
    field: keyof ReturnType<typeof extractRequirements>,
    value: string
  ) => {
    onChangeField("minRequirements", buildRequirementsHtml({ ...parsedRequirements, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10 rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-xl font-bold truncate">
              {isFetching ? "Fetching Game Data..." : editingGame.name || "New Game"}
            </h3>
            {/* Store source badge */}
            {editingGame.store === "steam" && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                Steam
              </span>
            )}
            {editingGame.store === "manual" && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
                Manual
              </span>
            )}
          </div>
 
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 flex-shrink-0" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800/50">
            {[
              { key: "ram", title: "Memory (RAM)", color: "text-indigo-400", suffix: "GB", list: grouped.ram },
              { key: "vga", title: "Graphics (VGA)", color: "text-emerald-400", suffix: "GB", list: grouped.vga },
              { key: "others", title: "Misc/System", color: "text-amber-400", suffix: "", list: grouped.others },
            ].map((cat) => (
              <div key={cat.key} className="space-y-3">
                <span className={`text-[10px] font-bold ${cat.color} uppercase tracking-widest`}>{cat.title}</span>
                <div className="flex flex-wrap gap-2">
                  {cat.list.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => onToggleTag(t.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        editingGame.requirementIds?.includes(t.id)
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                      type="button"
                    >
                      {t.label}
                      {cat.suffix}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Categories Section */}
          <div className="bg-zinc-950/40 p-6 rounded-2xl border border-zinc-800/50 space-y-3">
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Global Categories</span>
             {categories && categories.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onToggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        editingGame.categoryIds?.includes(cat.id)
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      }`}
                      type="button"
                    >
                      {cat.label}
                    </button>
                 ))}
               </div>
             ) : (
               <div className="text-zinc-500 text-xs italic">No generic categories available in the vault.</div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label>
              <input
                type="text"
                value={editingGame.name || ""}
                onChange={(e) => onChangeField("name", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price</label>
              <input
                type="text"
                value={editingGame.price || ""}
                onChange={(e) => onChangeField("price", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Poster</label>
              <input
                type="text"
                value={editingGame.thumbnail || ""}
                onChange={(e) => onChangeField("thumbnail", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trailer</label>
              <input
                type="text"
                value={editingGame.trailerUrl || ""}
                onChange={(e) => onChangeField("trailerUrl", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Min Requirements (HTML)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirementFields.map(({ key, label, multiline }) => (
                  <div key={key} className={multiline ? "space-y-2 md:col-span-2" : "space-y-2"}>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {label}
                    </label>
                    {multiline ? (
                      <textarea
                        value={parsedRequirements[key] || ""}
                        onChange={(e) => handleRequirementChange(key, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm h-24"
                      />
                    ) : (
                      <input
                        type="text"
                        value={parsedRequirements[key] || ""}
                        onChange={(e) => handleRequirementChange(key, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">About (HTML)</label>
              <textarea
                value={editingGame.description || ""}
                onChange={(e) => onChangeField("description", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs h-40 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 rounded-b-3xl bg-zinc-900">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isFetching}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameEditorModal;
