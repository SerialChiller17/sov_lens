export interface PortfolioHolding {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  price: number;
  value: number;
  allocation: number;
  dayMove: number;
  risk: "High" | "Medium" | "Low";
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
}
