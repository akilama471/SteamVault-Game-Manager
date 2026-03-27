
import { Game, SteamSearchResult } from "../types";

// Correct format for corsproxy.io requires the 'url=' parameter for reliable fetching
const PROXY_URL = "https://corsproxy.io/?url=";

export const searchSteamGames = async (query: string): Promise<SteamSearchResult[]> => {
  try {
    const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    
    // We encode the full Steam URL to ensure it is correctly passed as a parameter to the proxy
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(steamSearchUrl)}`);
    
    if (!response.ok) {
      console.warn(`Steam Proxy Search Error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const parsed = await response.json();

    if (!parsed || !parsed.items) return [];

    return parsed.items.map((item: any) => ({
      appId: item.id.toString(),
      name: item.name
    }));
  } catch (error) {
    console.error("Steam Search Error:", error);
    // Return an empty array to prevent the UI from breaking on fetch failures
    return [];
  }
};

export const getSteamGameDetails = async (appId: string): Promise<Partial<Game>> => {
  try {
    const steamDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(steamDetailsUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Steam Proxy Details Error: ${response.status} ${response.statusText}`);
    }
    
    const parsed = await response.json();

    if (!parsed || !parsed[appId] || !parsed[appId].success) {
      throw new Error("Game not found or Steam API error");
    }

    const gameData = parsed[appId].data;

    // Extracting the best quality trailer if available
    let trailerUrl = "";
    if (gameData.movies && gameData.movies.length > 0) {
      // Prefer the highest quality mp4, fallback to webm
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
