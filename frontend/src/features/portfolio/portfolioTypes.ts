export interface PortfolioHolding {
  ticker: string;
  name: string;
  exchange?: string;
  sector: string;
  shares: number;
  price: number;
  value: number;
  allocation: number;
  dayMove: number;
  risk: "High" | "Medium" | "Low";
  impact?: string;
}

export interface PortfolioHoldingContext {
  riskReason: string;
  signal: string;
  nextCheck: string;
  exposureCluster: string;
}

export interface PortfolioPerformancePoint {
  label: string;
  value: number;
}

export interface PortfolioRecommendationReason {
  icon: "chip" | "risk" | "goal";
  text: string;
  emphasis?: string;
}

export interface PortfolioSuggestedPlay {
  id: string;
  context: string;
  priority: "High" | "Medium" | "Low";
  riskLabel: string;
  headline: string;
  analysis: string;
  command: string;
  explanation: string;
  logic: string[];
  primaryAction: string;
  secondaryAction: string;
  reasons: PortfolioRecommendationReason[];
  confidence?: "High" | "Medium" | "Low";
  wouldChange?: string;
}

export interface PortfolioNewsCard {
  id: string;
  impact: string;
  headline: string;
  source: string;
  time: string;
  summary: string;
  severity: "High Impact" | "Medium Impact" | "Low Impact";
  tickers: string[];
}
