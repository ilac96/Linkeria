export interface Place {
  id: string;
  title: string;
  description: string;
  category: "food" | "sight" | "nature";
  lat: number;
  lng: number;
  walkingDirections: string;
  mapUrl: string;
  visited: boolean; // false = Da visitare, true = Visitati
  imageUrl: string;
  originalLink?: string;
  createdAt: string;
  notes?: string;
  favorite?: boolean;
}

export interface GeneralLinkItem {
  id: string;
  title: string;
  link: string;
  description: string;
  notes?: string;
  category: "ideas" | "books" | "movies" | "recipes";
  createdAt: string;
  imageUrl?: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  description: string;
  language: "italian" | "international";
  read: boolean; // false = Da leggere, true = Già letto
  notes?: string;
  link?: string;
  imageUrl?: string;
  favorite?: boolean;
  createdAt: string;
}

export type MainCategory = "travel" | "ideas" | "books" | "movies" | "recipes";
