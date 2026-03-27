import React from "react";

type TemplateItem = {
  id: string;
  label: string;
  category: "ram" | "vga" | "others";
};

type GroupedTemplates = {
  ram: TemplateItem[];
  vga: TemplateItem[];
  others: TemplateItem[];
};

type FilterPanelProps = {
  groupedTemplates: GroupedTemplates;
  selectedReqIds: string[];
  onReset: () => void;
  onToggleTag: (tagId: string, category: "ram" | "vga" | "others") => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  groupedTemplates,
  selectedReqIds,
  onReset,
  onToggleTag,
}) => {
  const sections = [
    { title: "Memory (RAM)", category: "ram" as const, tags: groupedTemplates.ram, dot: "bg-indigo-500", suffix: "GB" },
    { title: "Graphics (VGA)", category: "vga" as const, tags: groupedTemplates.vga, dot: "bg-emerald-500", suffix: "GB" },
    { title: "Features", category: "others" as const, tags: groupedTemplates.others, dot: "bg-amber-500", suffix: "" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex flex-col">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Compatibility</h3>
          <p className="text-[9px] text-zinc-600 font-medium mt-1">Select your hardware capacity</p>
        </div>

        {selectedReqIds.length > 0 && (
          <button
            onClick={onReset}
            className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            type="button"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.title} className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
              <span className={`w-1 h-1 rounded-full ${s.dot}`} /> {s.title}
            </h4>

            <div className="flex flex-wrap gap-2">
              {s.tags.map((t) => {
                const selected = selectedReqIds.includes(t.id);

                return (
                  <button
                    key={t.id}
                    onClick={() => onToggleTag(t.id, s.category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      selected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                    type="button"
                  >
                    {t.label}
                    {s.suffix}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;
