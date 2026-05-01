export type ConflictSeverity = "Watch" | "Elevated" | "High" | "Critical";

export interface NewsSectorLink {
  id: string;
  label: string;
  signal: string;
}

export interface GeotaggedNewsItem {
  id: string;
  conflictId: string;
  title: string;
  location: string;
  region: string;
  lat: number;
  lng: number;
  severity: ConflictSeverity;
  time: string;
  source: string;
  summary: string;
  aiInsight: string;
  marketRead: string;
  imageUrl: string;
  sectors: NewsSectorLink[];
}

export interface EventArchiveRow {
  id: string;
  eventType: string;
  region: string;
  location: string;
  leaders: string;
  impact: string;
  dateOccurred: string;
  live?: boolean;
}

export interface HorizonEvent {
  id: string;
  label: string;
  location: string;
  date: string;
}

export interface EventTheme {
  accent: string;
  rgb: string;
  onAccent: string;
}
