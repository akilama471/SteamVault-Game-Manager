
import { GoogleGenAI, Type } from "@google/genai";
import { Game, SteamSearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchSteamGames = async (query: string): Promise<SteamSearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Search for official Steam Store games matching the query: "${query}". 
          Return a JSON list of up to 5 results. 
          For each result, provide the 'appId' (as a string) and the 'name' (exactly as it appears on the Steam Storefront).`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              appId: { type: Type.STRING, description: "The numeric Steam App ID" },
              name: { type: Type.STRING, description: "The official Steam storefront title" }
            },
            required: ["appId", "name"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`Failed to parse search results JSON. Raw text: ${text}`, parseError);
      return [];
    }
  } catch (apiError: any) {
    console.error(`Error calling Gemini API for search query.`, apiError);
    return [];
  }
};

export const getSteamGameDetails = async (appId: string): Promise<Partial<Game>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `You are an expert on the Steam Storefront. Fetch the official data for App ID: ${appId}.
          
          REQUIRED FIELDS:
          1. name: The exact official title from the Steam Store. Do NOT shorten it.
          2. thumbnail: Use "https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg".
          3. price: Current price or "Free to Play".
          4. description: A detailed, high-quality HTML summary (3+ paragraphs) covering gameplay, features, and setting.
          5. minRequirements: Minimum PC specs in HTML format.
          6. recommendedRequirements: Recommended PC specs in HTML format.
          7. trailerUrl: A valid URL for a video. Try to find a direct .mp4 from steamstatic or a high-quality YouTube link.
          8. releaseDate: Format YYYY-MM-DD.
          
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
    console.error(`Failed to fetch game details for AppID: ${appId}`, e);
    throw e;
  }
};
