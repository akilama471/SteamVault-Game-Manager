
import { GoogleGenAI, Type } from "@google/genai";
import { Game, SteamSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchSteamGames = async (query: string): Promise<SteamSearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{
        parts: [{
          text: `Search for Steam games matching: "${query}". Return a list of up to 5 games with their Steam App IDs and full names. Return ONLY a JSON array.`
        }]
      }],
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
      console.warn(`Gemini API returned an empty response for query: "${query}"`);
      return [];
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`Failed to parse search results JSON for query: "${query}". Raw text: ${text}`, parseError);
      return [];
    }
  } catch (apiError: any) {
    // Specific check for the common 500 error seen in the environment
    console.error(`Error calling Gemini API for search query: "${query}".`, {
      message: apiError?.message,
      error: apiError?.error,
      status: apiError?.status
    });
    return [];
  }
};

export const getSteamGameDetails = async (appId: string): Promise<Partial<Game>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{
        parts: [{
          text: `Fetch complete details for Steam game with AppID: ${appId}. 
          You must provide:
          1. name: The official title.
          2. thumbnail: A high-quality header image URL.
          3. price: The current price (e.g., "$59.99" or "Free to Play").
          4. description: A brief, engaging summary (HTML format allowed).
          5. minRequirements: Minimum PC specs (HTML format allowed).
          6. recommendedRequirements: Recommended PC specs (HTML format allowed).
          7. trailerUrl: A valid URL for a video trailer (YouTube or Steam mp4).
          Return ONLY a JSON object.`
        }]
      }],
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

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini API");

    const data = JSON.parse(text);
    return {
      ...data,
      steamAppId: appId
    };
  } catch (e: any) {
    console.error(`Failed to fetch or parse game details for AppID: ${appId}`, e);
    throw e;
  }
};
