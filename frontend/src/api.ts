import type { BootstrapData, Country, GlobalPulse, MarketMovement, Sector } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getBootstrapData(): Promise<BootstrapData> {
  const [countries, globalPulse, marketPulse, sectors] = await Promise.all([
    fetchJson<Country[]>("/api/countries"),
    fetchJson<GlobalPulse>("/api/global-pulse"),
    fetchJson<MarketMovement[]>("/api/market-pulse"),
    fetchJson<Sector[]>("/api/sectors"),
  ]);

  return { countries, globalPulse, marketPulse, sectors };
}
