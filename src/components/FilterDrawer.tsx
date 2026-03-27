import React from "react";
import FilterPanel from "@/components/FilterPanel";

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

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;

  groupedTemplates: GroupedTemplates;
  selectedReqIds: string[];
  onResetSelected: () => void;
  onToggleTag: (tagId: string, category: "ram" | "vga" | "others") => void;
};

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  groupedTemplates,
  selectedReqIds,
  onResetSelected,
  onToggleTag,
}) => {
  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div
        className={`absolute left-0 top-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-800 shadow-2xl transition-transform duration-300 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Filters</h2>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white" type="button" aria-label="Close Mobile Filter Panel">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <FilterPanel
              groupedTemplates={groupedTemplates}
              selectedReqIds={selectedReqIds}
              onReset={onResetSelected}
              onToggleTag={onToggleTag}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
