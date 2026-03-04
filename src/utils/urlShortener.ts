export const MAP_KEY = "devtools-url-map";
export const HISTORY_KEY = "devtools-url-history";
export const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  shortUrl: string;
  original: string;
  createdAt: number;
}

export type UrlMap = Record<string, string>;

export function loadMap(): UrlMap {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) ?? "{}") as UrlMap;
  } catch {
    return {};
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveMap(map: UrlMap): void {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function saveHistory(history: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
