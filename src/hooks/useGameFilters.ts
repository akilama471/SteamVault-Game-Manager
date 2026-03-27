import { useMemo, useState } from "react";
import type { Game, RamVgaTemplate, MiscTemplate, RequirementTemplate } from "@/types";

export function useGameFilters(
  games: Game[],
  ramVgaTemplates: RamVgaTemplate[],
  miscTemplates: MiscTemplate[]
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [onlyWithRequirements, setOnlyWithRequirements] = useState(false);

  const parseValue = (label: string | number): number => {
    const sLabel = label.toString();
    if (/^\d+(\.\d+)?$/.test(sLabel)) return parseFloat(sLabel);
    const match = sLabel.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(gb|mb)/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    return match[2] === "mb" ? val / 1024 : val;
  };

  const groupedTemplates = useMemo(() => {
    const safeRamVga = Array.isArray(ramVgaTemplates) ? ramVgaTemplates : [];
    const safeMisc = Array.isArray(miscTemplates) ? miscTemplates : [];

    return {
      ram: safeRamVga
        .filter((t) => t.category === "ram")
        .sort((a, b) => parseValue(a.label) - parseValue(b.label)),
      vga: safeRamVga
        .filter((t) => t.category === "vga")
        .sort((a, b) => parseValue(a.label) - parseValue(b.label)),
      others: safeMisc.filter((t) => t.category === "others"),
    };
  }, [ramVgaTemplates, miscTemplates]);

  const filteredGames = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return games.filter((g) => {
      if (query && !g.name.toLowerCase().includes(query)) return false;

      const gameReqs = g.requirementIds || [];
      if (onlyWithRequirements && gameReqs.length === 0) return false;

      // RAM (single selection)
      const selectedRamTemplate = groupedTemplates.ram.find((t) => selectedReqIds.includes(t.id));
      if (selectedRamTemplate) {
        const userCapacity = parseValue(selectedRamTemplate.label);
        const gRamTags = groupedTemplates.ram.filter((t) => gameReqs.includes(t.id));
        if (gRamTags.length > 0) {
          const gameReqValue = Math.max(...gRamTags.map((t) => parseValue(t.label)));
          if (gameReqValue > userCapacity) return false;
        } else if (onlyWithRequirements) {
          return false;
        }
      }

      // VGA (single selection)
      const selectedVgaTemplate = groupedTemplates.vga.find((t) => selectedReqIds.includes(t.id));
      if (selectedVgaTemplate) {
        const userCapacity = parseValue(selectedVgaTemplate.label);
        const gVgaTags = groupedTemplates.vga.filter((t) => gameReqs.includes(t.id));
        if (gVgaTags.length > 0) {
          const gameReqValue = Math.max(...gVgaTags.map((t) => parseValue(t.label)));
          if (gameReqValue > userCapacity) return false;
        } else if (onlyWithRequirements) {
          return false;
        }
      }

      // Others (multi select OR)
      const selOtherIds = selectedReqIds.filter((id) =>
        groupedTemplates.others.some((t) => t.id === id)
      );
      if (selOtherIds.length > 0) {
        if (!selOtherIds.some((id) => gameReqs.includes(id))) return false;
      }

      return true;
    });
  }, [games, searchTerm, selectedReqIds, onlyWithRequirements, groupedTemplates]);

  const allTemplates: RequirementTemplate[] = useMemo(
    () => [...ramVgaTemplates, ...miscTemplates],
    [ramVgaTemplates, miscTemplates]
  );

  const handleToggleTag = (tagId: string, category: "ram" | "vga" | "others") => {
    setSelectedReqIds((prev) => {
      if (category === "ram" || category === "vga") {
        const categoryTags = groupedTemplates[category].map((t) => t.id);
        const filtered = prev.filter((id) => !categoryTags.includes(id));
        return prev.includes(tagId) ? filtered : [...filtered, tagId];
      }
      return prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId];
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedReqIds,
    setSelectedReqIds,
    onlyWithRequirements,
    setOnlyWithRequirements,
    groupedTemplates,
    filteredGames,
    allTemplates,
    handleToggleTag,
  };
}
