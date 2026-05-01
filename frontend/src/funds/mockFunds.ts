import type { Fund, FundCategory, Holding, SectorSlice } from "./types";

type NavProfile = "equity" | "aggressiveEquity" | "globalEquity" | "gold" | "debt" | "hybrid";

type ReturnBoost = { from: string; to: string; monthly: number };
type ReturnProfile = Partial<{
  drift: number;
  volatility: number;
  covid: number;
  rebound: number;
  shock2022: number;
  fiveYearReturnTarget: number;
  boosts: ReturnBoost[];
}>;

type FundInput = Omit<Fund, "navHistory"> & {
  seed: string;
  profile: NavProfile;
  startNav?: number;
  returnProfile?: ReturnProfile;
};

const HISTORY_MONTHS = 120;
const HISTORY_START_YEAR = 2016;
const HISTORY_START_MONTH = 4;

const largeCapHoldings: Holding[] = [
  { name: "HDFC Bank", ticker: "HDFCBANK", weight: 8.7 },
  { name: "ICICI Bank", ticker: "ICICIBANK", weight: 7.9 },
  { name: "Reliance Industries", ticker: "RELIANCE", weight: 7.4 },
  { name: "Infosys", ticker: "INFY", weight: 5.6 },
  { name: "Larsen & Toubro", ticker: "LT", weight: 4.8 },
  { name: "Bharti Airtel", ticker: "BHARTIARTL", weight: 4.6 },
  { name: "Tata Consultancy Services", ticker: "TCS", weight: 4.4 },
  { name: "Axis Bank", ticker: "AXISBANK", weight: 3.7 },
  { name: "State Bank of India", ticker: "SBIN", weight: 3.3 },
  { name: "ITC", ticker: "ITC", weight: 3.1 },
];

const flexiHoldings: Holding[] = [
  { name: "HDFC Bank", ticker: "HDFCBANK", weight: 7.2 },
  { name: "Power Grid Corporation", ticker: "POWERGRID", weight: 5.3 },
  { name: "Coal India", ticker: "COALINDIA", weight: 4.7 },
  { name: "Bajaj Holdings", ticker: "BAJAJHLDNG", weight: 4.5 },
  { name: "ICICI Bank", ticker: "ICICIBANK", weight: 4.3 },
  { name: "Infosys", ticker: "INFY", weight: 3.8 },
  { name: "Maruti Suzuki", ticker: "MARUTI", weight: 3.4 },
  { name: "Axis Bank", ticker: "AXISBANK", weight: 3.2 },
  { name: "HCL Technologies", ticker: "HCLTECH", weight: 2.9 },
  { name: "Microsoft", ticker: "MSFT", weight: 2.6 },
];

const midCapHoldings: Holding[] = [
  { name: "Persistent Systems", ticker: "PERSISTENT", weight: 4.7 },
  { name: "Dixon Technologies", ticker: "DIXON", weight: 4.4 },
  { name: "BSE", ticker: "BSE", weight: 4.2 },
  { name: "Coforge", ticker: "COFORGE", weight: 3.8 },
  { name: "Max Healthcare", ticker: "MAXHEALTH", weight: 3.5 },
  { name: "The Federal Bank", ticker: "FEDERALBNK", weight: 3.2 },
  { name: "Trent", ticker: "TRENT", weight: 3.1 },
  { name: "Indian Hotels", ticker: "INDHOTEL", weight: 2.9 },
  { name: "Tube Investments", ticker: "TIINDIA", weight: 2.7 },
  { name: "CG Power", ticker: "CGPOWER", weight: 2.5 },
];

const bankHoldings: Holding[] = [
  { name: "HDFC Bank", ticker: "HDFCBANK", weight: 27.4 },
  { name: "ICICI Bank", ticker: "ICICIBANK", weight: 23.8 },
  { name: "State Bank of India", ticker: "SBIN", weight: 10.2 },
  { name: "Axis Bank", ticker: "AXISBANK", weight: 9.8 },
  { name: "Kotak Mahindra Bank", ticker: "KOTAKBANK", weight: 8.7 },
  { name: "Bank of Baroda", ticker: "BANKBARODA", weight: 3.3 },
  { name: "Punjab National Bank", ticker: "PNB", weight: 2.8 },
  { name: "IDFC First Bank", ticker: "IDFCFIRSTB", weight: 2.5 },
  { name: "AU Small Finance Bank", ticker: "AUBANK", weight: 1.8 },
  { name: "Federal Bank", ticker: "FEDERALBNK", weight: 1.7 },
];

const nasdaqHoldings: Holding[] = [
  { name: "Microsoft", ticker: "MSFT", weight: 8.9 },
  { name: "Apple", ticker: "AAPL", weight: 8.6 },
  { name: "NVIDIA", ticker: "NVDA", weight: 7.7 },
  { name: "Amazon", ticker: "AMZN", weight: 5.5 },
  { name: "Meta Platforms", ticker: "META", weight: 4.8 },
  { name: "Broadcom", ticker: "AVGO", weight: 4.6 },
  { name: "Alphabet Class A", ticker: "GOOGL", weight: 3.6 },
  { name: "Alphabet Class C", ticker: "GOOG", weight: 3.2 },
  { name: "Tesla", ticker: "TSLA", weight: 2.8 },
  { name: "Costco Wholesale", ticker: "COST", weight: 2.4 },
];

const goldHoldings: Holding[] = [
  { name: "Physical Gold 995", ticker: "GOLD", weight: 96.4 },
  { name: "TREPS", weight: 1.4 },
  { name: "Cash and equivalents", weight: 0.9 },
  { name: "Gold receivable", weight: 0.5 },
  { name: "Margin deposits", weight: 0.3 },
  { name: "Exchange settlement", weight: 0.2 },
  { name: "Collateral cash", weight: 0.1 },
  { name: "Accrued interest", weight: 0.1 },
  { name: "Other current assets", weight: 0.1 },
  { name: "Net receivables", weight: 0 },
];

const debtHoldings: Holding[] = [
  { name: "Government of India 7.18% 2033", ticker: "GSEC", weight: 14.8 },
  { name: "HDFC Bank CD", ticker: "HDFCBANK", weight: 8.3 },
  { name: "Power Finance Corp Bond", ticker: "PFC", weight: 7.2 },
  { name: "REC Limited Bond", ticker: "RECLTD", weight: 6.9 },
  { name: "National Bank for Agriculture Bond", ticker: "NABARD", weight: 6.1 },
  { name: "Small Industries Development Bank CD", ticker: "SIDBI", weight: 5.8 },
  { name: "State Development Loan", ticker: "SDL", weight: 5.2 },
  { name: "Treasury Bill", ticker: "TBILL", weight: 4.7 },
  { name: "TREPS", weight: 3.9 },
  { name: "Cash and equivalents", weight: 2.4 },
];

const largeCapSectors: SectorSlice[] = [
  { sector: "Financials", weight: 33.4 },
  { sector: "Technology", weight: 13.2 },
  { sector: "Energy", weight: 9.6 },
  { sector: "Consumer Staples", weight: 8.1 },
  { sector: "Industrials", weight: 7.7 },
  { sector: "Telecom", weight: 5.4 },
  { sector: "Healthcare", weight: 4.2 },
  { sector: "Cash", weight: 2.1 },
];

const flexiSectors: SectorSlice[] = [
  { sector: "Financials", weight: 26.2 },
  { sector: "Industrials", weight: 12.5 },
  { sector: "Technology", weight: 11.8 },
  { sector: "Utilities", weight: 8.4 },
  { sector: "Consumer Discretionary", weight: 7.6 },
  { sector: "Energy", weight: 6.8 },
  { sector: "Foreign Equity", weight: 5.9 },
  { sector: "Cash", weight: 6.1 },
];

const midCapSectors: SectorSlice[] = [
  { sector: "Industrials", weight: 18.4 },
  { sector: "Technology", weight: 16.2 },
  { sector: "Financials", weight: 14.7 },
  { sector: "Healthcare", weight: 10.4 },
  { sector: "Consumer Discretionary", weight: 9.8 },
  { sector: "Capital Goods", weight: 8.5 },
  { sector: "Materials", weight: 6.4 },
  { sector: "Cash", weight: 3.5 },
];

const smallCapSectors: SectorSlice[] = [
  { sector: "Industrials", weight: 20.3 },
  { sector: "Consumer Discretionary", weight: 15.6 },
  { sector: "Financials", weight: 13.9 },
  { sector: "Technology", weight: 12.1 },
  { sector: "Chemicals", weight: 9.2 },
  { sector: "Healthcare", weight: 7.4 },
  { sector: "Capital Goods", weight: 6.7 },
  { sector: "Cash", weight: 5.5 },
];

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function monthReturn(profile: NavProfile, date: string, noise: number, returnProfile: ReturnProfile = {}) {
  const jitter = noise - 0.5;
  const params: Record<NavProfile, { drift: number; volatility: number; covid: number; rebound: number; shock2022: number }> = {
    equity: { drift: 0.0105, volatility: 0.034, covid: -0.225, rebound: 0.085, shock2022: -0.045 },
    aggressiveEquity: { drift: 0.0125, volatility: 0.046, covid: -0.285, rebound: 0.12, shock2022: -0.062 },
    globalEquity: { drift: 0.0112, volatility: 0.042, covid: -0.205, rebound: 0.095, shock2022: -0.07 },
    gold: { drift: 0.0062, volatility: 0.028, covid: 0.045, rebound: 0.035, shock2022: 0.018 },
    debt: { drift: 0.0046, volatility: 0.004, covid: -0.006, rebound: 0.007, shock2022: -0.004 },
    hybrid: { drift: 0.0082, volatility: 0.022, covid: -0.12, rebound: 0.055, shock2022: -0.025 },
  };
  const selected = { ...params[profile], ...returnProfile };
  let value = selected.drift + jitter * selected.volatility;

  if (date === "2020-03-01") value += selected.covid;
  if (date === "2020-04-01") value += selected.covid * 0.35;
  if (date === "2020-05-01" || date === "2020-06-01") value += selected.rebound;
  if (date === "2022-06-01" || date === "2022-09-01") value += selected.shock2022;
  if (profile === "gold" && (date === "2019-08-01" || date === "2020-07-01" || date === "2024-03-01")) value += 0.045;
  if (profile === "debt" && (date === "2020-03-01" || date === "2022-06-01")) value = Math.max(value, -0.01);
  for (const boost of returnProfile.boosts ?? []) {
    if (date >= boost.from && date <= boost.to) value += boost.monthly;
  }

  return value;
}

function applyFiveYearReturnTarget(points: Array<{ date: string; nav: number }>, targetNav: number, fiveYearReturnTarget?: number) {
  const scaledPoints = points.map((point) => ({ ...point, nav: point.nav * (targetNav / points[points.length - 1].nav) }));
  if (fiveYearReturnTarget === undefined) {
    return scaledPoints;
  }

  const anchorIndex = scaledPoints.findIndex((point) => point.date === "2021-04-01");
  if (anchorIndex === -1) {
    return scaledPoints;
  }

  const desiredAnchorNav = targetNav / (1 + fiveYearReturnTarget / 100);
  const anchorMultiplier = desiredAnchorNav / scaledPoints[anchorIndex].nav;
  const remainingMonths = Math.max(scaledPoints.length - 1 - anchorIndex, 1);

  return scaledPoints.map((point, index) => {
    if (index <= anchorIndex) {
      return { ...point, nav: point.nav * anchorMultiplier };
    }

    const progress = (index - anchorIndex) / remainingMonths;
    const easedProgress = progress * progress * (3 - 2 * progress);
    const multiplier = anchorMultiplier + (1 - anchorMultiplier) * easedProgress;
    return { ...point, nav: point.nav * multiplier };
  });
}

function generateNavHistory(seed: string, profile: NavProfile, targetNav: number, startNav = 18, returnProfile: ReturnProfile = {}) {
  const random = seededRandom(seed);
  let nav = startNav;
  const points = Array.from({ length: HISTORY_MONTHS }, (_, index) => {
    const date = new Date(Date.UTC(HISTORY_START_YEAR, HISTORY_START_MONTH + index, 1));
    const isoDate = date.toISOString().slice(0, 10);
    nav = Math.max(1, nav * (1 + monthReturn(profile, isoDate, random(), returnProfile)));
    return { date: isoDate, nav };
  });
  const shapedPoints = applyFiveYearReturnTarget(points, targetNav, returnProfile.fiveYearReturnTarget);
  return shapedPoints.map((point) => ({ date: point.date, nav: Number(point.nav.toFixed(2)) }));
}

function fund(input: FundInput): Fund {
  const { seed, profile, startNav, returnProfile, ...rest } = input;
  return {
    ...rest,
    navHistory: generateNavHistory(seed, profile, rest.nav, startNav, returnProfile),
  };
}

function assetAllocation(category: FundCategory) {
  if (category === "Debt") return { equity: 0, debt: 91.8, cash: 6.7, other: 1.5 };
  if (category === "Gold") return { equity: 0, debt: 0, cash: 2.7, other: 97.3 };
  if (category === "Hybrid") return { equity: 68.5, debt: 23.4, cash: 5.1, other: 3 };
  if (category === "Foreign ETF") return { equity: 98.1, debt: 0, cash: 1.9, other: 0 };
  return { equity: 96.2, debt: 0, cash: 3.2, other: 0.6 };
}

export const MOCK_FUNDS: Fund[] = [
  fund({
    id: "nippon-india-large-cap",
    name: "Nippon India Large Cap Fund - Direct Growth",
    shortName: "Nippon Large Cap",
    category: "Large Cap",
    nav: 92.48,
    aum: 34420,
    expenseRatio: 1.52,
    expenseRatioDirect: 0.76,
    expenseRatioRegular: 1.52,
    inceptionDate: "2013-01-01",
    fundManager: "Sailesh Raj Bhan",
    benchmark: "NIFTY 100 TRI",
    trailingReturns: { 1: 22.8, 3: 16.2, 5: 13.0, 10: 14.4 },
    sectorAllocation: largeCapSectors,
    assetAllocation: assetAllocation("Large Cap"),
    topHoldings: largeCapHoldings,
    drawdown: { max: -32.0, date: "2020-03-23", recoveryMonths: 6 },
    volatility: { stdDev: 14.1, sharpe: 1.02, sortino: 1.48, beta: 0.96 },
    seed: "nippon-large",
    profile: "equity",
    startNav: 28,
    returnProfile: {
      drift: 0.0086,
      volatility: 0.026,
      covid: -0.24,
      rebound: 0.078,
      shock2022: -0.036,
      fiveYearReturnTarget: 84,
      boosts: [
        { from: "2021-01-01", to: "2021-12-01", monthly: 0.0012 },
        { from: "2023-04-01", to: "2024-03-01", monthly: 0.001 },
      ],
    },
  }),
  fund({
    id: "icici-pru-bluechip",
    name: "ICICI Prudential Bluechip Fund - Direct Growth",
    shortName: "ICICI Pru Bluechip",
    category: "Large Cap",
    nav: 108.21,
    aum: 53180,
    expenseRatio: 1.48,
    expenseRatioDirect: 0.89,
    expenseRatioRegular: 1.48,
    inceptionDate: "2013-01-01",
    fundManager: "S Naren",
    benchmark: "NIFTY 100 TRI",
    trailingReturns: { 1: 28.2, 3: 20.8, 5: 18.9, 10: 14.2 },
    sectorAllocation: largeCapSectors,
    assetAllocation: assetAllocation("Large Cap"),
    topHoldings: largeCapHoldings,
    drawdown: { max: -29.6, date: "2020-03-23", recoveryMonths: 8 },
    volatility: { stdDev: 14.8, sharpe: 0.98, sortino: 1.41, beta: 0.94 },
    seed: "icici-bluechip",
    profile: "equity",
    startNav: 32,
    returnProfile: {
      drift: 0.0082,
      volatility: 0.028,
      covid: -0.215,
      rebound: 0.07,
      shock2022: -0.03,
      fiveYearReturnTarget: 72,
      boosts: [
        { from: "2021-07-01", to: "2022-02-01", monthly: 0.001 },
        { from: "2024-01-01", to: "2024-10-01", monthly: 0.0015 },
      ],
    },
  }),
  fund({
    id: "axis-bluechip",
    name: "Axis Bluechip Fund - Direct Growth",
    shortName: "Axis Bluechip",
    category: "Large Cap",
    nav: 63.84,
    aum: 31120,
    expenseRatio: 1.63,
    expenseRatioDirect: 0.65,
    expenseRatioRegular: 1.63,
    inceptionDate: "2013-01-01",
    fundManager: "Shreyash Devalkar",
    benchmark: "NIFTY 100 TRI",
    trailingReturns: { 1: 22.6, 3: 12.7, 5: 14.8, 10: 13.5 },
    sectorAllocation: largeCapSectors,
    assetAllocation: assetAllocation("Large Cap"),
    topHoldings: largeCapHoldings,
    drawdown: { max: -27.9, date: "2020-03-23", recoveryMonths: 7 },
    volatility: { stdDev: 13.9, sharpe: 0.82, sortino: 1.18, beta: 0.9 },
    seed: "axis-bluechip",
    profile: "equity",
    startNav: 24,
    returnProfile: {
      drift: 0.0068,
      volatility: 0.024,
      covid: -0.2,
      rebound: 0.058,
      shock2022: -0.05,
      fiveYearReturnTarget: 50,
      boosts: [
        { from: "2021-01-01", to: "2021-10-01", monthly: 0.001 },
        { from: "2022-01-01", to: "2023-05-01", monthly: -0.0018 },
      ],
    },
  }),
  fund({
    id: "parag-parikh-flexi-cap",
    name: "Parag Parikh Flexi Cap Fund - Direct Growth",
    shortName: "Parag Parikh Flexi",
    category: "Flexi Cap",
    nav: 86.92,
    aum: 74480,
    expenseRatio: 1.34,
    expenseRatioDirect: 0.62,
    expenseRatioRegular: 1.34,
    inceptionDate: "2013-05-13",
    fundManager: "Rajeev Thakkar",
    benchmark: "NIFTY 500 TRI",
    trailingReturns: { 1: 28.4, 3: 21.6, 5: 17.0, 10: 18.1 },
    sectorAllocation: flexiSectors,
    assetAllocation: assetAllocation("Flexi Cap"),
    topHoldings: flexiHoldings,
    drawdown: { max: -28.0, date: "2020-03-23", recoveryMonths: 5 },
    volatility: { stdDev: 16.0, sharpe: 1.2, sortino: 1.72, beta: 0.78 },
    seed: "parag-flexi",
    profile: "equity",
    startNav: 26,
    returnProfile: {
      drift: 0.0108,
      volatility: 0.034,
      covid: -0.16,
      rebound: 0.065,
      shock2022: -0.058,
      fiveYearReturnTarget: 119,
      boosts: [
        { from: "2021-01-01", to: "2021-12-01", monthly: 0.004 },
        { from: "2023-01-01", to: "2024-09-01", monthly: 0.0036 },
        { from: "2022-04-01", to: "2022-12-01", monthly: -0.001 },
      ],
    },
  }),
  fund({
    id: "hdfc-flexi-cap",
    name: "HDFC Flexi Cap Fund - Direct Growth",
    shortName: "HDFC Flexi Cap",
    category: "Flexi Cap",
    nav: 1912.37,
    aum: 59840,
    expenseRatio: 1.55,
    expenseRatioDirect: 0.78,
    expenseRatioRegular: 1.55,
    inceptionDate: "2013-01-01",
    fundManager: "Rahul Baijal",
    benchmark: "NIFTY 500 TRI",
    trailingReturns: { 1: 35.2, 3: 27.5, 5: 24.6, 10: 16.8 },
    sectorAllocation: flexiSectors,
    assetAllocation: assetAllocation("Flexi Cap"),
    topHoldings: flexiHoldings,
    drawdown: { max: -33.1, date: "2020-03-23", recoveryMonths: 10 },
    volatility: { stdDev: 16.1, sharpe: 1.12, sortino: 1.53, beta: 0.98 },
    seed: "hdfc-flexi",
    profile: "equity",
    startNav: 640,
    returnProfile: {
      drift: 0.0103,
      volatility: 0.037,
      covid: -0.25,
      rebound: 0.092,
      shock2022: -0.043,
      fiveYearReturnTarget: 103,
      boosts: [
        { from: "2022-10-01", to: "2024-06-01", monthly: 0.0032 },
        { from: "2025-01-01", to: "2025-09-01", monthly: -0.001 },
      ],
    },
  }),
  fund({
    id: "motilal-oswal-midcap",
    name: "Motilal Oswal Midcap Fund - Direct Growth",
    shortName: "Motilal Midcap",
    category: "Mid Cap",
    nav: 103.76,
    aum: 19760,
    expenseRatio: 1.73,
    expenseRatioDirect: 0.68,
    expenseRatioRegular: 1.73,
    inceptionDate: "2014-02-24",
    fundManager: "Niket Shah",
    benchmark: "NIFTY MIDCAP 150 TRI",
    trailingReturns: { 1: 58.4, 3: 35.9, 5: 29.8, 10: 19.3 },
    sectorAllocation: midCapSectors,
    assetAllocation: assetAllocation("Mid Cap"),
    topHoldings: midCapHoldings,
    drawdown: { max: -38.4, date: "2020-03-23", recoveryMonths: 13 },
    volatility: { stdDev: 19.8, sharpe: 1.34, sortino: 1.82, beta: 1.08 },
    seed: "motilal-midcap",
    profile: "aggressiveEquity",
    startNav: 18,
    returnProfile: {
      drift: 0.0125,
      volatility: 0.052,
      covid: -0.31,
      rebound: 0.13,
      shock2022: -0.074,
      fiveYearReturnTarget: 150,
      boosts: [
        { from: "2023-01-01", to: "2024-08-01", monthly: 0.0062 },
        { from: "2021-01-01", to: "2021-09-01", monthly: 0.002 },
      ],
    },
  }),
  fund({
    id: "kotak-emerging-equity",
    name: "Kotak Emerging Equity Fund - Direct Growth",
    shortName: "Kotak Emerging Equity",
    category: "Mid Cap",
    nav: 139.54,
    aum: 46320,
    expenseRatio: 1.59,
    expenseRatioDirect: 0.43,
    expenseRatioRegular: 1.59,
    inceptionDate: "2013-01-01",
    fundManager: "Pankaj Tibrewal",
    benchmark: "NIFTY MIDCAP 150 TRI",
    trailingReturns: { 1: 44.1, 3: 30.5, 5: 27.2, 10: 20.1 },
    sectorAllocation: midCapSectors,
    assetAllocation: assetAllocation("Mid Cap"),
    topHoldings: midCapHoldings,
    drawdown: { max: -36.8, date: "2020-03-23", recoveryMonths: 12 },
    volatility: { stdDev: 18.2, sharpe: 1.25, sortino: 1.71, beta: 1.03 },
    seed: "kotak-emerging",
    profile: "aggressiveEquity",
    startNav: 29,
    returnProfile: {
      drift: 0.0114,
      volatility: 0.044,
      covid: -0.285,
      rebound: 0.112,
      shock2022: -0.056,
      fiveYearReturnTarget: 132,
      boosts: [
        { from: "2021-04-01", to: "2022-03-01", monthly: 0.003 },
        { from: "2023-06-01", to: "2024-12-01", monthly: 0.0032 },
      ],
    },
  }),
  fund({
    id: "nippon-india-small-cap",
    name: "Nippon India Small Cap Fund - Direct Growth",
    shortName: "Nippon Small Cap",
    category: "Small Cap",
    nav: 184.67,
    aum: 61240,
    expenseRatio: 1.56,
    expenseRatioDirect: 0.68,
    expenseRatioRegular: 1.56,
    inceptionDate: "2013-01-01",
    fundManager: "Samir Rachh",
    benchmark: "NIFTY SMALLCAP 250 TRI",
    trailingReturns: { 1: 51.7, 3: 34.6, 5: 31.1, 10: 24.2 },
    sectorAllocation: smallCapSectors,
    assetAllocation: assetAllocation("Small Cap"),
    topHoldings: midCapHoldings,
    drawdown: { max: -43.2, date: "2020-03-23", recoveryMonths: 15 },
    volatility: { stdDev: 22.4, sharpe: 1.18, sortino: 1.6, beta: 1.18 },
    seed: "nippon-small",
    profile: "aggressiveEquity",
    startNav: 34,
    returnProfile: {
      drift: 0.0132,
      volatility: 0.058,
      covid: -0.36,
      rebound: 0.15,
      shock2022: -0.084,
      fiveYearReturnTarget: 178,
      boosts: [
        { from: "2023-03-01", to: "2024-10-01", monthly: 0.007 },
        { from: "2025-03-01", to: "2025-10-01", monthly: -0.0018 },
      ],
    },
  }),
  fund({
    id: "mirae-asset-elss-tax-saver",
    name: "Mirae Asset ELSS Tax Saver Fund - Direct Growth",
    shortName: "Mirae ELSS",
    category: "ELSS",
    nav: 52.73,
    aum: 24890,
    expenseRatio: 1.58,
    expenseRatioDirect: 0.55,
    expenseRatioRegular: 1.58,
    inceptionDate: "2015-12-28",
    fundManager: "Neelesh Surana",
    benchmark: "NIFTY 500 TRI",
    trailingReturns: { 1: 25.8, 3: 19.4, 5: 21.1, 10: 0 },
    sectorAllocation: flexiSectors,
    assetAllocation: assetAllocation("ELSS"),
    topHoldings: flexiHoldings,
    drawdown: { max: -30.8, date: "2020-03-23", recoveryMonths: 9 },
    volatility: { stdDev: 15.8, sharpe: 1.02, sortino: 1.42, beta: 0.96 },
    seed: "mirae-elss",
    profile: "equity",
    startNav: 13,
    returnProfile: {
      drift: 0.0094,
      volatility: 0.032,
      covid: -0.23,
      rebound: 0.086,
      shock2022: -0.052,
      fiveYearReturnTarget: 92,
      boosts: [
        { from: "2021-05-01", to: "2022-01-01", monthly: 0.0026 },
        { from: "2024-02-01", to: "2024-12-01", monthly: 0.0018 },
      ],
    },
  }),
  fund({
    id: "nippon-india-etf-bank-bees",
    name: "Nippon India ETF Nifty Bank BeES",
    shortName: "Bank BeES",
    category: "Sector ETF",
    nav: 518.42,
    aum: 6920,
    expenseRatio: 0.16,
    expenseRatioDirect: 0.16,
    expenseRatioRegular: 0.16,
    inceptionDate: "2004-05-27",
    fundManager: "Vishal Jain",
    benchmark: "NIFTY BANK TRI",
    trailingReturns: { 1: 17.4, 3: 18.2, 5: 14.6, 10: 12.8 },
    sectorAllocation: [{ sector: "Financials", weight: 98.4 }, { sector: "Cash", weight: 1.6 }],
    assetAllocation: assetAllocation("Sector ETF"),
    topHoldings: bankHoldings,
    drawdown: { max: -39.6, date: "2020-03-23", recoveryMonths: 12 },
    volatility: { stdDev: 21.1, sharpe: 0.66, sortino: 0.98, beta: 1.14 },
    seed: "bank-bees",
    profile: "aggressiveEquity",
    startNav: 165,
    returnProfile: {
      drift: 0.0078,
      volatility: 0.052,
      covid: -0.34,
      rebound: 0.12,
      shock2022: -0.035,
      fiveYearReturnTarget: 60,
      boosts: [
        { from: "2022-07-01", to: "2023-01-01", monthly: 0.006 },
        { from: "2024-05-01", to: "2024-12-01", monthly: -0.003 },
      ],
    },
  }),
  fund({
    id: "motilal-oswal-nasdaq-100-etf",
    name: "Motilal Oswal Nasdaq 100 ETF",
    shortName: "Nasdaq 100 ETF",
    category: "Foreign ETF",
    nav: 164.26,
    aum: 9210,
    expenseRatio: 0.58,
    expenseRatioDirect: 0.58,
    expenseRatioRegular: 0.58,
    inceptionDate: "2011-03-29",
    fundManager: "Swapnil Mayekar",
    benchmark: "NASDAQ-100 TRI",
    trailingReturns: { 1: 34.8, 3: 17.7, 5: 22.9, 10: 20.6 },
    sectorAllocation: [
      { sector: "Technology", weight: 50.2 },
      { sector: "Communication Services", weight: 15.4 },
      { sector: "Consumer Discretionary", weight: 13.7 },
      { sector: "Healthcare", weight: 6.8 },
      { sector: "Cash", weight: 1.9 },
    ],
    assetAllocation: assetAllocation("Foreign ETF"),
    topHoldings: nasdaqHoldings,
    drawdown: { max: -32.7, date: "2022-10-14", recoveryMonths: 18 },
    volatility: { stdDev: 23.6, sharpe: 0.94, sortino: 1.32, beta: 1.06 },
    seed: "nasdaq-etf",
    profile: "globalEquity",
    startNav: 38,
    returnProfile: {
      drift: 0.0112,
      volatility: 0.05,
      covid: -0.14,
      rebound: 0.11,
      shock2022: -0.095,
      fiveYearReturnTarget: 130,
      boosts: [
        { from: "2021-01-01", to: "2021-11-01", monthly: 0.006 },
        { from: "2022-01-01", to: "2022-11-01", monthly: -0.006 },
        { from: "2023-03-01", to: "2024-07-01", monthly: 0.0062 },
      ],
    },
  }),
  fund({
    id: "nippon-india-gold-bees",
    name: "Nippon India ETF Gold BeES",
    shortName: "Gold BeES",
    category: "Gold",
    nav: 63.38,
    aum: 14780,
    expenseRatio: 0.81,
    expenseRatioDirect: 0.81,
    expenseRatioRegular: 0.81,
    inceptionDate: "2007-03-08",
    fundManager: "Vishal Jain",
    benchmark: "Domestic Price of Gold",
    trailingReturns: { 1: 18.7, 3: 15.4, 5: 13.9, 10: 10.2 },
    sectorAllocation: [{ sector: "Gold", weight: 96.4 }, { sector: "Cash", weight: 3.6 }],
    assetAllocation: assetAllocation("Gold"),
    topHoldings: goldHoldings,
    drawdown: { max: -14.9, date: "2021-03-05", recoveryMonths: 22 },
    volatility: { stdDev: 13.2, sharpe: 0.72, sortino: 1.04, beta: 0.18 },
    seed: "gold-bees",
    profile: "gold",
    startNav: 28,
    returnProfile: {
      drift: 0.0054,
      volatility: 0.026,
      fiveYearReturnTarget: 55,
      boosts: [
        { from: "2022-01-01", to: "2022-09-01", monthly: 0.004 },
        { from: "2024-02-01", to: "2024-09-01", monthly: 0.006 },
      ],
    },
  }),
  fund({
    id: "hdfc-short-term-debt",
    name: "HDFC Short Term Debt Fund - Direct Growth",
    shortName: "HDFC Short Term Debt",
    category: "Debt",
    nav: 31.82,
    aum: 15870,
    expenseRatio: 0.69,
    expenseRatioDirect: 0.31,
    expenseRatioRegular: 0.69,
    inceptionDate: "2013-01-01",
    fundManager: "Anupam Joshi",
    benchmark: "NIFTY Short Duration Debt Index",
    trailingReturns: { 1: 7.4, 3: 6.6, 5: 6.9, 10: 7.3 },
    sectorAllocation: [{ sector: "Sovereign", weight: 28.4 }, { sector: "AAA Corporate", weight: 44.7 }, { sector: "Money Market", weight: 17.2 }, { sector: "Cash", weight: 6.7 }],
    assetAllocation: assetAllocation("Debt"),
    topHoldings: debtHoldings,
    drawdown: { max: -2.8, date: "2020-03-24", recoveryMonths: 3 },
    volatility: { stdDev: 2.1, sharpe: 1.05, sortino: 1.52, beta: 0.07 },
    seed: "hdfc-debt",
    profile: "debt",
    startNav: 19,
    returnProfile: {
      drift: 0.0043,
      volatility: 0.0032,
      fiveYearReturnTarget: 40,
      boosts: [
        { from: "2022-06-01", to: "2023-03-01", monthly: -0.0008 },
        { from: "2023-08-01", to: "2024-04-01", monthly: 0.0011 },
      ],
    },
  }),
  fund({
    id: "icici-pru-equity-debt",
    name: "ICICI Prudential Equity & Debt Fund - Direct Growth",
    shortName: "ICICI Equity & Debt",
    category: "Hybrid",
    nav: 402.18,
    aum: 36110,
    expenseRatio: 1.51,
    expenseRatioDirect: 1.03,
    expenseRatioRegular: 1.51,
    inceptionDate: "2013-01-01",
    fundManager: "S Naren",
    benchmark: "CRISIL Hybrid 35+65 Aggressive TRI",
    trailingReturns: { 1: 29.6, 3: 21.2, 5: 18.4, 10: 15.1 },
    sectorAllocation: [
      { sector: "Financials", weight: 24.2 },
      { sector: "Energy", weight: 8.8 },
      { sector: "Technology", weight: 8.1 },
      { sector: "Sovereign Debt", weight: 17.4 },
      { sector: "AAA Corporate", weight: 8.9 },
      { sector: "Cash", weight: 5.1 },
    ],
    assetAllocation: assetAllocation("Hybrid"),
    topHoldings: [...largeCapHoldings.slice(0, 6), ...debtHoldings.slice(0, 4)],
    drawdown: { max: -20.4, date: "2020-03-23", recoveryMonths: 7 },
    volatility: { stdDev: 10.9, sharpe: 1.18, sortino: 1.66, beta: 0.62 },
    seed: "icici-hybrid",
    profile: "hybrid",
    startNav: 142,
    returnProfile: {
      drift: 0.0088,
      volatility: 0.024,
      covid: -0.13,
      rebound: 0.058,
      shock2022: -0.022,
      fiveYearReturnTarget: 88,
      boosts: [
        { from: "2021-02-01", to: "2021-12-01", monthly: 0.0025 },
        { from: "2023-04-01", to: "2024-05-01", monthly: 0.0022 },
      ],
    },
  }),
];
