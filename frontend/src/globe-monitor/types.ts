export type MonitorEventCategory = "Conflict Zones" | "Diplomacy" | "Economics" | "Energy" | "Trade" | "Regulation";

export type MonitorImpact = "Watch" | "Elevated" | "High" | "Critical";

export interface GlobeMonitorEvent {
  id: string;
  title: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  category: MonitorEventCategory;
  impact: MonitorImpact;
  headline: string;
  sourceUrl: string;
  updatedAt: string;
  priority: number;
  label: string;
  summary: string;
  watchlist: string[];
  labelOffset?: {
    x: number;
    y: number;
  };
  fallbackPosition?: {
    x: number;
    y: number;
  };
}

export interface MonitorAffectedSector {
  label: string;
  exposure: "High" | "Medium" | "Low";
  signal: string;
}

export interface MonitorAffectedStock {
  ticker: string;
  name: string;
  exposure: "High" | "Medium" | "Low";
  signal: string;
}

export interface MonitorRelatedNews {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  summary: string;
}

export interface MonitorSuggestedPlay {
  id: string;
  assetType: "Stock" | "ETF" | "Mutual Fund";
  title: string;
  thesis: string;
  horizon: string;
  confidence: "Low" | "Medium" | "High";
}

export interface MonitorEventDetail {
  imageUrl: string;
  aiInsight: string;
  affectedSectors: MonitorAffectedSector[];
  affectedStocks: MonitorAffectedStock[];
  suggestedPlays: MonitorSuggestedPlay[];
  relatedNews: MonitorRelatedNews[];
}
