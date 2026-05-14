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

export type PortfolioActionCtaType = "logic" | "funds" | "track";

export interface PortfolioCockpitAction {
  id: string;
  playId: string;
  riskLevel: "High" | "Medium" | "Low";
  assetType: "Portfolio" | "Stock" | "Mutual Fund";
  title: string;
  why: string;
  affectedHoldings: string[];
  confidence: "High" | "Medium" | "Low";
  mainRisk: string;
  ctaLabel: string;
  ctaType: PortfolioActionCtaType;
}

export interface PortfolioReadFact {
  label: string;
  value: string;
  detail: string;
}

export interface PortfolioRiskCard {
  id: string;
  label: string;
  headline: string;
  metric: string;
  affectedHoldings: string[];
  whyItMatters: string;
}

export interface PortfolioHoldingDecision {
  verdict: string;
  keyRisk: string;
  action: string;
  detail: string;
}

export interface PortfolioMarketDriver {
  id: string;
  theme: string;
  headline: string;
  explanation: string;
  affectedHoldings: string[];
  impactDirection: "Positive" | "Negative" | "Mixed";
  sources: string[];
}

export interface PortfolioCockpitData {
  status: {
    view: string;
    evidenceLevel: string;
    lastUpdated: string;
    sourceCount: number;
  };
  actions: PortfolioCockpitAction[];
  read: {
    title: string;
    summary: string;
    facts: PortfolioReadFact[];
  };
  riskStrip: PortfolioRiskCard[];
  holdingDecisions: Record<string, PortfolioHoldingDecision>;
  marketDrivers: PortfolioMarketDriver[];
}
