import React from "react";
import type { RamVgaTemplate, MiscTemplate } from "@/types";
import { Button } from "@/components/Button";

type NewTagsState = {
  ram: string;
  vga: string;
  others: string;
};

type GroupedTemplates = {
  ram: RamVgaTemplate[];
  vga: RamVgaTemplate[];
  others: MiscTemplate[];
};

type HardwareTagsManagerProps = {
  grouped: GroupedTemplates;
  newTags: NewTagsState;
  onChangeNewTags: (next: NewTagsState) => void;

  onAddTemplate: (label: number, category: "ram" | "vga") => void;
  onAddRequirements: (label: string, category: "others") => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteRequirements: (id: string) => void;
};

const HardwareTagsManager: React.FC<HardwareTagsManagerProps> = ({
  grouped,
  newTags,
  onChangeNewTags,
  onAddTemplate,
  onAddRequirements,
  onDeleteTemplate,
  onDeleteRequirements,
}) => {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
      <h3 className="text-xl font-bold text-white">Hardware Tags Manager</h3>

      <div className="space-y-4">
        {(
          [
            {
              key: "ram",
              label: "Memory (RAM)",
              color: "text-indigo-400",
              placeholder: "e.g. 8",
              suffix: "GB",
            },
            {
              key: "vga",
              label: "Graphics (VGA)",
              color: "text-emerald-400",
              placeholder: "e.g. 4",
              suffix: "GB",
            },
          ] as const
        ).map((cat) => (
          <div key={cat.key} className="space-y-2">
            <label
              className={`text-[10px] font-bold ${cat.color} uppercase tracking-widest`}
            >
              {cat.label}
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                value={newTags[cat.key]}
                onChange={(e) =>
                  onChangeNewTags({ ...newTags, [cat.key]: e.target.value })
                }
                placeholder={cat.placeholder}
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newTags[cat.key]) {
                    onAddTemplate(Number(newTags[cat.key]), cat.key);
                    onChangeNewTags({ ...newTags, [cat.key]: "" });
                  }
                }}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {grouped[cat.key].map((t) => (
                <div
                  key={t.id}
                  className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-md flex items-center gap-2 group"
                >
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {t.label}
                    {cat.suffix}
                  </span>

                  <button
                    onClick={() => onDeleteTemplate(t.id)}
                    className="text-zinc-700 hover:text-red-500 transition-colors"
                    type="button"                    
                    aria-label="Delete template tag"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Others */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            Misc/System
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTags.others}
              onChange={(e) =>
                onChangeNewTags({ ...newTags, others: e.target.value })
              }
              placeholder="e.g. SSD Required"
              className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs outline-none"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newTags.others) {
                  onAddRequirements(newTags.others, "others");
                  onChangeNewTags({ ...newTags, others: "" });
                }
              }}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {grouped.others.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-md flex items-center gap-2 group"
              >
                <span className="text-[10px] text-zinc-500 font-medium">
                  {t.label}
                </span>

                <button
                  onClick={() => onDeleteRequirements(t.id)}
                  className="text-zinc-700 hover:text-red-500 transition-colors"
                  type="button"
                  aria-label="Delete requirements tag"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareTagsManager;
