
export interface RamVgaTemplate {
  id: string;
  label: number;
  category: 'ram' | 'vga';
}

export interface MiscTemplate {
  id: string;
  label: string;
  category: 'others';
}

export type RequirementTemplate = RamVgaTemplate | MiscTemplate;

export type GameStore = 'steam' | 'manual';

export interface GameCategory {
  id: string;
  label: string;
}

export interface Game {
  id: string;
  steamAppId?: string;
  store?: GameStore;
  name: string;
  thumbnail: string;
  price: string;
  description: string;
  minRequirements: string;
  recommendedRequirements: string;
  trailerUrl: string;
  screenshots: string[];
  releaseDate?: string;
  requirementIds?: string[]; // IDs linking to RequirementTemplate
  categoryIds?: string[]; // IDs linking to GameCategory
}

export interface SteamSearchResult {
  appId: string;
  name: string;
}

export enum ViewMode {
  VISITOR = 'VISITOR',
  ADMIN = 'ADMIN'
}

