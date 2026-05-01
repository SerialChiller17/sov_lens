export type RiskLabel = "Stable" | "Developing" | "High Risk";
export type TradeFlow = "export" | "import";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TensionBreakdown {
  structural: number;
  sentiment: number;
  live_trigger: number;
  last_structural_update: string;
  last_sentiment_update: string;
}

export interface TradePartner {
  iso3: string;
  name: string;
  flow: TradeFlow;
  share: number;
  thesis: string;
}

export interface MarketPoint {
  label: string;
  value: number;
}

export type MarketTapeDirection = "up" | "down";

export interface MarketTapeItem {
  label: string;
  value: string;
  move: string;
  direction: MarketTapeDirection;
}

export interface MarketTapeBasket {
  label: string;
  items: MarketTapeItem[];
}

export interface MarketIndex {
  symbol: string;
  name: string;
  currency: string;
  change_24h: number;
  series: MarketPoint[];
}

export interface FxPulse {
  pair: string;
  rate: number;
  volatility_24h: number;
  trigger: string;
}

export interface Country {
  iso3: string;
  iso_numeric: string;
  name: string;
  flag: string;
  capital: string;
  coordinates: Coordinates;
  gdp_usd_bn: number;
  population_mn: number;
  gdp_growth_pct: number;
  gdp_per_capita_usd: number;
  gini: number;
  tension_score: number;
  tension_label: RiskLabel;
  tension_breakdown: TensionBreakdown;
  groups: string[];
  industry_criticality: string[];
  trade_partners: TradePartner[];
  market_index: MarketIndex;
  fx: FxPulse;
  contrarian_insight: string;
}

export interface PulseAlert {
  id: string;
  severity: RiskLabel;
  region: string;
  headline: string;
  impact: string;
  age_minutes: number;
}

export interface GlobalPulse {
  alerts: PulseAlert[];
  daily_briefs: string[];
  last_structural_update: string;
  last_sentiment_update: string;
}

export interface MarketMovement {
  id: string;
  instrument: string;
  move_pct: number;
  region: string;
  trigger: string;
}

export interface SectorArc {
  source: string;
  target: string;
  intensity: number;
  waypoint: string | null;
}

export interface Chokepoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  watch: string;
}

export interface Sector {
  id: string;
  name: string;
  color: string;
  market_value: string;
  systemic_multiplier: string;
  sensitivity: number;
  power_nodes: string[];
  consumption_nodes: string[];
  arcs: SectorArc[];
  chokepoints: Chokepoint[];
  brief: string;
  alpha: string;
  equity_proxy: string;
}

export interface BootstrapData {
  countries: Country[];
  globalPulse: GlobalPulse;
  marketPulse: MarketMovement[];
  sectors: Sector[];
}
