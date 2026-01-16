
export interface Game {
  id: string;
  steamAppId?: string;
  name: string;
  thumbnail: string;
  price: string;
  description: string;
  minRequirements: string;
  recommendedRequirements: string;
  trailerUrl: string;
  releaseDate?: string;
}

export interface SteamSearchResult {
  appId: string;
  name: string;
}

export enum ViewMode {
  VISITOR = 'VISITOR',
  ADMIN = 'ADMIN'
}
