export type FundCategory =
  | "Large Cap"
  | "Flexi Cap"
  | "Mid Cap"
  | "Small Cap"
  | "ELSS"
  | "Sector ETF"
  | "Foreign ETF"
  | "Gold"
  | "Debt"
  | "Hybrid";

export type NavPoint = { date: string; nav: number };
export type SectorSlice = { sector: string; weight: number };
export type Holding = { name: string; ticker?: string; weight: number };

export type Fund = {
  id: string;
  name: string;
  shortName: string;
  category: FundCategory;
  nav: number;
  aum: number;
  expenseRatio: number;
  expenseRatioDirect: number;
  expenseRatioRegular: number;
  inceptionDate: string;
  fundManager: string;
  benchmark: string;
  navHistory: NavPoint[];
  trailingReturns: { 1: number; 3: number; 5: number; 10: number };
  sectorAllocation: SectorSlice[];
  assetAllocation: { equity: number; debt: number; cash: number; other: number };
  topHoldings: Holding[];
  drawdown: { max: number; date: string; recoveryMonths: number };
  volatility: { stdDev: number; sharpe: number; sortino: number; beta: number };
};

export type FundSlot = Fund | null;
