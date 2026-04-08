import { useEffect, useState } from "react";
import type { Game, RamVgaTemplate, MiscTemplate } from "@/types";
import {
  isFirebaseConfigured,
  cloudFetchGames,
  cloudFetchTemplates,
  cloudFetchRequirements,
  cloudFetchCategories,
} from "@/firebase/firebase";

export function useSteamVaultData() {
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [ramVgaTemplates, setRamVgaTemplates] = useState<RamVgaTemplate[]>([]);
  const [miscTemplates, setMiscTemplates] = useState<MiscTemplate[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      if (isFirebaseConfigured) {
        const [gamesRes, templatesRes, reqRes, categoriesRes] = await Promise.allSettled([
          cloudFetchGames(),
          cloudFetchTemplates(),
          cloudFetchRequirements(),
          cloudFetchCategories(),
        ]);

        if (gamesRes.status === "fulfilled" && gamesRes.value) {
          setGames(gamesRes.value as Game[]);
        }

        if (templatesRes.status === "fulfilled" && Array.isArray(templatesRes.value)) {
          setRamVgaTemplates(templatesRes.value as RamVgaTemplate[]);
        }

        // NOTE: Your current code loads requirements into miscTemplates (name mismatch).
        // Keep as-is to avoid breaking UI.
        if (reqRes.status === "fulfilled" && Array.isArray(reqRes.value)) {
          setMiscTemplates(reqRes.value as MiscTemplate[]);
        }

        if (categoriesRes.status === "fulfilled" && Array.isArray(categoriesRes.value)) {
          setCategories(categoriesRes.value as {id: string, label: string}[]);
        }
      }

      setIsLoading(false);
    };

    load().catch((e) => {
      console.error("Data fetch failed", e);
      setIsLoading(false);
    });
  }, []);

  return {
    isLoading,
    games,
    setGames,
    ramVgaTemplates,
    setRamVgaTemplates,
    miscTemplates,
    setMiscTemplates,
    categories,
    setCategories,
  };
}
