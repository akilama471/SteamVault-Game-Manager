import { useEffect, useState } from "react";
import type { Game, RamVgaTemplate, MiscTemplate } from "@/types";
import {
  isFirebaseConfigured,
  cloudFetchGames,
  cloudFetchTemplates,
  cloudFetchRequirements,
} from "@/firebase/firebase";

export function useSteamVaultData() {
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [ramVgaTemplates, setRamVgaTemplates] = useState<RamVgaTemplate[]>([]);
  const [miscTemplates, setMiscTemplates] = useState<MiscTemplate[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      if (isFirebaseConfigured) {
        const [gamesRes, templatesRes, reqRes] = await Promise.allSettled([
          cloudFetchGames(),
          cloudFetchTemplates(),
          cloudFetchRequirements(),
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
  };
}
