
import { GoogleGenAI, Type } from "@google/genai";
import { Game, SteamSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchSteamGames = async (query: string): Promise<SteamSearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for Steam games matching: "${query}". Return a list of up to 5 games with their Steam App IDs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              appId: { type: Type.STRING, description: "The Steam Application ID" },
              name: { type: Type.STRING, description: "The Name of the Game" }
            },
            required: ["appId", "name"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error(`Gemini API returned an empty response for query: "${query}"`);
      return [];
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`Failed to parse search results JSON for query: "${query}". Raw text: ${text}`, parseError);
      return [];
    }
  } catch (apiError) {
    console.error(`Error calling Gemini API for search query: "${query}"`, apiError);
    return [];
  }
};

export const getSteamGameDetails = async (appId: string): Promise<Partial<Game>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Get full details for Steam game with AppID: ${appId}. Include description, thumbnail URL (header_image), price (if possible), minimum requirements, recommended requirements, and a YouTube trailer link or Steam movie link if available.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          thumbnail: { type: Type.STRING },
          price: { type: Type.STRING },
          description: { type: Type.STRING },
          minRequirements: { type: Type.STRING },
          recommendedRequirements: { type: Type.STRING },
          trailerUrl: { type: Type.STRING },
          releaseDate: { type: Type.STRING }
        },
        required: ["name", "thumbnail", "description", "minRequirements", "recommendedRequirements"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return {
      ...data,
      steamAppId: appId
    };
  } catch (e) {
    console.error("Failed to parse game details", e);
    return {};
  }
};
