
import { Game, SteamSearchResult } from "../types";

// Using a public CORS proxy because Steam's API does not set CORS headers for browser requests
const PROXY_URL = "https://api.allorigins.win/get?url=";

export const searchSteamGames = async (query: string): Promise<SteamSearchResult[]> => {
  try {
    const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(steamSearchUrl)}`);
    const data = await response.json();
    const parsed = JSON.parse(data.contents);

    if (!parsed || !parsed.items) return [];

    return parsed.items.map((item: any) => ({
      appId: item.id.toString(),
      name: item.name
    }));
  } catch (error) {
    console.error("Steam Search Error:", error);
    return [];
  }
};

export const getSteamGameDetails = async (appId: string): Promise<Partial<Game>> => {
  try {
    const steamDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(steamDetailsUrl)}`);
    const data = await response.json();
    const parsed = JSON.parse(data.contents);

    if (!parsed || !parsed[appId] || !parsed[appId].success) {
      throw new Error("Game not found or Steam API error");
    }

    const gameData = parsed[appId].data;

    // Extracting the best quality trailer if available
    let trailerUrl = "";
    if (gameData.movies && gameData.movies.length > 0) {
      // Prefer the highest quality webm or mp4
      trailerUrl = gameData.movies[0].mp4?.max || gameData.movies[0].webm?.max || "";
    }

    return {
      steamAppId: appId,
      name: gameData.name,
      thumbnail: gameData.header_image,
      price: gameData.is_free ? "Free to Play" : (gameData.price_overview?.final_formatted || "Coming Soon"),
      description: gameData.about_the_game || gameData.short_description,
      minRequirements: gameData.pc_requirements?.minimum || "No minimum requirements listed.",
      recommendedRequirements: gameData.pc_requirements?.recommended || "No recommended requirements listed.",
      trailerUrl: trailerUrl,
      releaseDate: gameData.release_date?.date || ""
    };
  } catch (error) {
    console.error("Steam Detail Fetch Error:", error);
    throw error;
  }
};
