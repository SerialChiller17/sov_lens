// Demo-only Indian market universe. Replace with API-backed market data when live data exists.

export type MarketSector =
  | "Financial Services"
  | "Technology"
  | "Energy"
  | "Consumer Cyclical"
  | "Consumer Defensive"
  | "Industrials"
  | "Healthcare"
  | "Communication Services"
  | "Utilities"
  | "Basic Materials";

export interface MockMarketInstrument {
  symbol: string;
  ticker: string;
  name: string;
  sector: MarketSector;
  industry: string;
  price: number;
  changePercent: number;
  changeAbsolute: number;
  marketCap: number;
  marketCapCr: number;
  indexWeight: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
  exchange: "NSE";
  country: "India";
  currency: "INR";
  oneMonth: number;
  oneYear: number;
  revenueGrowth: number;
  profitGrowth: number;
  roe: number;
  debtEquity: number;
  sparkline: number[];
  isMock: true;
}

interface NiftySeed {
  ticker: string;
  name: string;
  sector: MarketSector;
  industry: string;
  price: number;
  marketCapCr: number;
  indexWeight: number;
  changePercent: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
}

export const MOCK_MARKET_DATA_NOTICE = "Demo NIFTY 50 market data - not live";

const NIFTY_50_SEEDS: NiftySeed[] = [
  { ticker: "RELIANCE", name: "Reliance Industries", sector: "Energy", industry: "Oil, Gas & Consumable Fuels", price: 1437.85, marketCapCr: 1942866, indexWeight: 9.81, changePercent: -1.8, peRatio: 28.4, dividendYield: 0.34, beta: 1.02 },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Financial Services", industry: "Private Banks", price: 1708.4, marketCapCr: 1225254, indexWeight: 6.19, changePercent: 1.4, peRatio: 19.6, dividendYield: 1.15, beta: 0.86 },
  { ticker: "BHARTIARTL", name: "Bharti Airtel", sector: "Communication Services", industry: "Telecom Services", price: 1398.6, marketCapCr: 1112906, indexWeight: 5.62, changePercent: 1.53, peRatio: 54.8, dividendYield: 0.42, beta: 0.74 },
  { ticker: "SBIN", name: "State Bank of India", sector: "Financial Services", industry: "Public Banks", price: 812.25, marketCapCr: 1007799, indexWeight: 5.09, changePercent: 1.92, peRatio: 11.2, dividendYield: 1.68, beta: 1.1 },
  { ticker: "ICICIBANK", name: "ICICI Bank", sector: "Financial Services", industry: "Private Banks", price: 1809.9, marketCapCr: 915923, indexWeight: 4.63, changePercent: 1.86, peRatio: 21.1, dividendYield: 0.74, beta: 0.92 },
  { ticker: "TCS", name: "Tata Consultancy Services", sector: "Technology", industry: "IT Services", price: 3894.15, marketCapCr: 868974, indexWeight: 4.39, changePercent: 0.52, peRatio: 29.7, dividendYield: 1.28, beta: 0.64 },
  { ticker: "BAJFINANCE", name: "Bajaj Finance", sector: "Financial Services", industry: "Consumer Finance", price: 7331.2, marketCapCr: 605505, indexWeight: 3.06, changePercent: 2.42, peRatio: 31.8, dividendYield: 0.48, beta: 1.28 },
  { ticker: "LT", name: "Larsen & Toubro", sector: "Industrials", industry: "Engineering & Construction", price: 3668.35, marketCapCr: 541805, indexWeight: 2.8, changePercent: 0.74, peRatio: 34.2, dividendYield: 0.82, beta: 0.94 },
  { ticker: "HINDUNILVR", name: "Hindustan Unilever", sector: "Consumer Defensive", industry: "Household & Personal Products", price: 2344.1, marketCapCr: 520108, indexWeight: 2.7, changePercent: -1.42, peRatio: 52.7, dividendYield: 1.74, beta: 0.42 },
  { ticker: "INFY", name: "Infosys", sector: "Technology", industry: "IT Services", price: 1167.2, marketCapCr: 493614, indexWeight: 2.38, changePercent: -0.93, peRatio: 24.4, dividendYield: 2.28, beta: 0.68 },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Healthcare", industry: "Pharmaceuticals", price: 1812.4, marketCapCr: 431240, indexWeight: 2.22, changePercent: 0.68, peRatio: 38.5, dividendYield: 0.76, beta: 0.51 },
  { ticker: "MARUTI", name: "Maruti Suzuki India", sector: "Consumer Cyclical", industry: "Automobiles", price: 12618.75, marketCapCr: 390215, indexWeight: 2.19, changePercent: 1.1, peRatio: 27.9, dividendYield: 0.98, beta: 0.79 },
  { ticker: "M&M", name: "Mahindra & Mahindra", sector: "Consumer Cyclical", industry: "Automobiles", price: 3034.6, marketCapCr: 386980, indexWeight: 2.12, changePercent: 1.76, peRatio: 30.2, dividendYield: 0.71, beta: 0.92 },
  { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Financial Services", industry: "Private Banks", price: 1742.35, marketCapCr: 354250, indexWeight: 1.91, changePercent: 0.42, peRatio: 18.9, dividendYield: 0.12, beta: 0.83 },
  { ticker: "AXISBANK", name: "Axis Bank", sector: "Financial Services", industry: "Private Banks", price: 1166.1, marketCapCr: 351420, indexWeight: 1.86, changePercent: 1.33, peRatio: 13.6, dividendYield: 0.09, beta: 1.0 },
  { ticker: "ULTRACEMCO", name: "UltraTech Cement", sector: "Basic Materials", industry: "Cement", price: 11738.8, marketCapCr: 338250, indexWeight: 1.72, changePercent: 0.88, peRatio: 46.1, dividendYield: 0.58, beta: 0.76 },
  { ticker: "ITC", name: "ITC", sector: "Consumer Defensive", industry: "Tobacco & FMCG", price: 438.55, marketCapCr: 548604, indexWeight: 1.69, changePercent: -0.24, peRatio: 27.4, dividendYield: 3.1, beta: 0.48 },
  { ticker: "NTPC", name: "NTPC", sector: "Utilities", industry: "Power Generation", price: 346.25, marketCapCr: 337860, indexWeight: 1.55, changePercent: 0.38, peRatio: 15.3, dividendYield: 2.14, beta: 0.72 },
  { ticker: "TATAMOTORS", name: "Tata Motors", sector: "Consumer Cyclical", industry: "Automobiles", price: 846.4, marketCapCr: 315205, indexWeight: 1.5, changePercent: 2.25, peRatio: 10.4, dividendYield: 0.71, beta: 1.38 },
  { ticker: "POWERGRID", name: "Power Grid", sector: "Utilities", industry: "Power Transmission", price: 306.2, marketCapCr: 284760, indexWeight: 1.44, changePercent: 0.55, peRatio: 18.1, dividendYield: 3.54, beta: 0.58 },
  { ticker: "HCLTECH", name: "HCL Technologies", sector: "Technology", industry: "IT Services", price: 1588.8, marketCapCr: 430125, indexWeight: 1.39, changePercent: -0.28, peRatio: 26.6, dividendYield: 3.22, beta: 0.66 },
  { ticker: "ASIANPAINT", name: "Asian Paints", sector: "Basic Materials", industry: "Specialty Chemicals", price: 2824.1, marketCapCr: 270640, indexWeight: 1.32, changePercent: -0.44, peRatio: 56.2, dividendYield: 1.19, beta: 0.55 },
  { ticker: "TITAN", name: "Titan Company", sector: "Consumer Cyclical", industry: "Luxury Retail", price: 4295.7, marketCapCr: 382503, indexWeight: 1.28, changePercent: 0.96, peRatio: 84.3, dividendYield: 0.32, beta: 0.82 },
  { ticker: "BAJAJFINSV", name: "Bajaj Finserv", sector: "Financial Services", industry: "Insurance & Financial Holdings", price: 1654.4, marketCapCr: 264188, indexWeight: 1.21, changePercent: 1.02, peRatio: 31.2, dividendYield: 0.06, beta: 1.16 },
  { ticker: "ONGC", name: "Oil & Natural Gas Corp", sector: "Energy", industry: "Oil & Gas Exploration", price: 252.4, marketCapCr: 317635, indexWeight: 1.18, changePercent: -3.16, peRatio: 8.2, dividendYield: 4.28, beta: 1.12 },
  { ticker: "TATASTEEL", name: "Tata Steel", sector: "Basic Materials", industry: "Steel", price: 216.85, marketCapCr: 270955, indexWeight: 1.1, changePercent: 1.64, peRatio: 17.3, dividendYield: 2.08, beta: 1.35 },
  { ticker: "ADANIPORTS", name: "Adani Ports", sector: "Industrials", industry: "Marine Ports & Services", price: 1372.35, marketCapCr: 296510, indexWeight: 1.08, changePercent: 1.21, peRatio: 31.5, dividendYield: 0.45, beta: 1.18 },
  { ticker: "ADANIENT", name: "Adani Enterprises", sector: "Industrials", industry: "Trading & Infrastructure", price: 3088.2, marketCapCr: 352050, indexWeight: 1.05, changePercent: -0.76, peRatio: 82.6, dividendYield: 0.05, beta: 1.42 },
  { ticker: "COALINDIA", name: "Coal India", sector: "Energy", industry: "Coal & Consumable Fuels", price: 392.15, marketCapCr: 241620, indexWeight: 1.0, changePercent: -0.62, peRatio: 7.6, dividendYield: 6.14, beta: 0.82 },
  { ticker: "WIPRO", name: "Wipro", sector: "Technology", industry: "IT Services", price: 197.35, marketCapCr: 207106, indexWeight: 0.94, changePercent: -0.51, peRatio: 17.1, dividendYield: 1.16, beta: 0.7 },
  { ticker: "JSWSTEEL", name: "JSW Steel", sector: "Basic Materials", industry: "Steel", price: 1028.55, marketCapCr: 251610, indexWeight: 0.93, changePercent: 1.12, peRatio: 28.8, dividendYield: 0.69, beta: 1.31 },
  { ticker: "NESTLEIND", name: "Nestle India", sector: "Consumer Defensive", industry: "Packaged Foods", price: 2284.25, marketCapCr: 220180, indexWeight: 0.91, changePercent: -0.18, peRatio: 71.4, dividendYield: 1.22, beta: 0.36 },
  { ticker: "CIPLA", name: "Cipla", sector: "Healthcare", industry: "Pharmaceuticals", price: 1536.35, marketCapCr: 123980, indexWeight: 0.88, changePercent: 0.44, peRatio: 29.1, dividendYield: 0.83, beta: 0.47 },
  { ticker: "DRREDDY", name: "Dr Reddy's Laboratories", sector: "Healthcare", industry: "Pharmaceuticals", price: 1296.5, marketCapCr: 109073, indexWeight: 0.86, changePercent: -0.39, peRatio: 23.5, dividendYield: 0.62, beta: 0.5 },
  { ticker: "GRASIM", name: "Grasim Industries", sector: "Basic Materials", industry: "Diversified Materials", price: 2714.45, marketCapCr: 181560, indexWeight: 0.82, changePercent: 0.57, peRatio: 32.7, dividendYield: 0.42, beta: 1.02 },
  { ticker: "TECHM", name: "Tech Mahindra", sector: "Technology", industry: "IT Services", price: 1435.75, marketCapCr: 140355, indexWeight: 0.8, changePercent: -0.84, peRatio: 36.5, dividendYield: 2.8, beta: 0.82 },
  { ticker: "HINDALCO", name: "Hindalco Industries", sector: "Basic Materials", industry: "Aluminium", price: 694.3, marketCapCr: 155960, indexWeight: 0.78, changePercent: 2.06, peRatio: 14.7, dividendYield: 0.52, beta: 1.37 },
  { ticker: "EICHERMOT", name: "Eicher Motors", sector: "Consumer Cyclical", industry: "Motorcycles", price: 5068.4, marketCapCr: 138820, indexWeight: 0.76, changePercent: 1.05, peRatio: 31.8, dividendYield: 0.9, beta: 0.86 },
  { ticker: "HEROMOTOCO", name: "Hero MotoCorp", sector: "Consumer Cyclical", industry: "Motorcycles", price: 4920.15, marketCapCr: 98410, indexWeight: 0.71, changePercent: 0.63, peRatio: 22.9, dividendYield: 2.04, beta: 0.81 },
  { ticker: "TATACONSUM", name: "Tata Consumer Products", sector: "Consumer Defensive", industry: "Tea, Coffee & Packaged Foods", price: 1126.95, marketCapCr: 111460, indexWeight: 0.65, changePercent: 0.26, peRatio: 70.3, dividendYield: 0.68, beta: 0.57 },
  { ticker: "APOLLOHOSP", name: "Apollo Hospitals", sector: "Healthcare", industry: "Healthcare Services", price: 8021.5, marketCapCr: 112696, indexWeight: 0.64, changePercent: 0.31, peRatio: 77.6, dividendYield: 0.22, beta: 0.72 },
  { ticker: "SHRIRAMFIN", name: "Shriram Finance", sector: "Financial Services", industry: "Vehicle Finance", price: 2868.75, marketCapCr: 107820, indexWeight: 0.63, changePercent: 1.27, peRatio: 13.2, dividendYield: 1.54, beta: 1.21 },
  { ticker: "SBILIFE", name: "SBI Life Insurance", sector: "Financial Services", industry: "Life Insurance", price: 1468.55, marketCapCr: 147160, indexWeight: 0.61, changePercent: 0.49, peRatio: 70.4, dividendYield: 0.19, beta: 0.78 },
  { ticker: "HDFCLIFE", name: "HDFC Life Insurance", sector: "Financial Services", industry: "Life Insurance", price: 634.35, marketCapCr: 136475, indexWeight: 0.59, changePercent: -0.22, peRatio: 82.7, dividendYield: 0.3, beta: 0.84 },
  { ticker: "INDUSINDBK", name: "IndusInd Bank", sector: "Financial Services", industry: "Private Banks", price: 946.95, marketCapCr: 74120, indexWeight: 0.58, changePercent: 0.02, peRatio: 10.7, dividendYield: 1.74, beta: 1.28 },
  { ticker: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "Consumer Cyclical", industry: "Two Wheelers", price: 8878.25, marketCapCr: 247820, indexWeight: 0.57, changePercent: 0.81, peRatio: 34.8, dividendYield: 1.14, beta: 0.77 },
  { ticker: "TRENT", name: "Trent", sector: "Consumer Cyclical", industry: "Apparel Retail", price: 5264.9, marketCapCr: 187180, indexWeight: 0.55, changePercent: 2.58, peRatio: 142.2, dividendYield: 0.05, beta: 1.0 },
  { ticker: "BEL", name: "Bharat Electronics", sector: "Industrials", industry: "Aerospace & Defense", price: 301.65, marketCapCr: 220450, indexWeight: 0.54, changePercent: 1.82, peRatio: 45.6, dividendYield: 0.86, beta: 0.92 },
  { ticker: "JIOFIN", name: "Jio Financial Services", sector: "Financial Services", industry: "Financial Holdings", price: 333.35, marketCapCr: 211650, indexWeight: 0.52, changePercent: -0.58, peRatio: 126.4, dividendYield: 0, beta: 1.12 },
  { ticker: "ZOMATO", name: "Zomato", sector: "Consumer Cyclical", industry: "Consumer Internet", price: 203.5, marketCapCr: 180460, indexWeight: 0.5, changePercent: 3.8, peRatio: 118.6, dividendYield: 0, beta: 1.46 },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function tickerHash(ticker: string) {
  return ticker.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}

function buildSparkline(seed: NiftySeed) {
  const hash = tickerHash(seed.ticker);
  const base = 44 + (hash % 18);
  const pointCount = 24;
  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const drift = seed.changePercent * progress * 4.2;
    const openingWobble = -Math.sign(seed.changePercent || 1) * Math.sin(progress * Math.PI) * (1.1 + (hash % 5) * 0.24);
    const wave = Math.sin((hash + index * 29) / 13) * 1.85 + Math.sin((hash + index * 17) / 7) * 0.92;
    const auctionPulse = index < 5 ? Math.sin((index + hash) / 2.4) * 1.2 : 0;
    const closingPush = progress > 0.76 ? seed.changePercent * (progress - 0.76) * 2.4 : 0;
    return round(clamp(base + drift + openingWobble + wave + auctionPulse + closingPush, 18, 82), 1);
  });
}

function enrichSeed(seed: NiftySeed, index: number): MockMarketInstrument {
  const hash = tickerHash(seed.ticker);
  const absMove = seed.price * (seed.changePercent / 100);
  const intradayRange = seed.price * (0.006 + (hash % 9) / 1000);
  const yearRange = 0.18 + (hash % 15) / 100;
  const oneMonth = clamp(seed.changePercent * 2.3 + ((hash % 120) - 58) / 12, -18, 24);
  const oneYear = clamp(seed.changePercent * 8 + ((hash % 420) - 160) / 7, -34, 78);

  return {
    symbol: `${seed.ticker}.NS`,
    ticker: seed.ticker,
    name: seed.name,
    sector: seed.sector,
    industry: seed.industry,
    price: seed.price,
    changePercent: seed.changePercent,
    changeAbsolute: round(absMove),
    marketCap: seed.marketCapCr * 10000000,
    marketCapCr: seed.marketCapCr,
    indexWeight: seed.indexWeight,
    volume: Math.round((seed.marketCapCr * (0.0008 + (hash % 15) / 10000) + index * 18000) * 1000),
    dayHigh: round(seed.price + intradayRange),
    dayLow: round(Math.max(seed.price - intradayRange, 1)),
    week52High: round(seed.price * (1 + yearRange)),
    week52Low: round(seed.price * (1 - yearRange * 0.72)),
    peRatio: seed.peRatio,
    dividendYield: seed.dividendYield,
    beta: seed.beta,
    exchange: "NSE",
    country: "India",
    currency: "INR",
    oneMonth: round(oneMonth),
    oneYear: round(oneYear),
    revenueGrowth: round(clamp(8 + seed.changePercent * 1.8 + (hash % 80) / 10, -4, 28)),
    profitGrowth: round(clamp(7 + seed.changePercent * 2 + (hash % 90) / 9, -8, 34)),
    roe: round(clamp(10 + (hash % 210) / 10, 7, 31)),
    debtEquity: round(clamp((hash % 120) / 100, 0.02, 1.1), 2),
    sparkline: buildSparkline(seed),
    isMock: true,
  };
}

export const MOCK_NIFTY_50_UNIVERSE: MockMarketInstrument[] = NIFTY_50_SEEDS.map(enrichSeed);

export interface MarketMoverSet {
  gainers: MockMarketInstrument[];
  losers: MockMarketInstrument[];
  active: MockMarketInstrument[];
}

export function getTopStocks(limit = 50) {
  return [...MOCK_NIFTY_50_UNIVERSE].sort((a, b) => b.indexWeight - a.indexWeight).slice(0, limit);
}

export function getStocksBySector(sector: MarketSector | "All") {
  if (sector === "All") return [...MOCK_NIFTY_50_UNIVERSE];
  return MOCK_NIFTY_50_UNIVERSE.filter((stock) => stock.sector === sector);
}

export function getHeatmapData(limit = 50) {
  return getTopStocks(limit);
}

export function getMarketMovers(limit = 4): MarketMoverSet {
  return {
    gainers: [...MOCK_NIFTY_50_UNIVERSE].sort((a, b) => b.changePercent - a.changePercent).slice(0, limit),
    losers: [...MOCK_NIFTY_50_UNIVERSE].sort((a, b) => a.changePercent - b.changePercent).slice(0, limit),
    active: [...MOCK_NIFTY_50_UNIVERSE].sort((a, b) => b.volume - a.volume).slice(0, limit),
  };
}

export function getScreenerRows(limit = 50) {
  return getTopStocks(limit).map((stock) => ({
    ticker: stock.ticker,
    name: stock.name,
    exchange: stock.exchange,
    sector: stock.sector,
    marketCapCr: stock.marketCapCr,
    price: stock.price,
    pe: stock.peRatio,
    oneDay: stock.changePercent,
    oneMonth: stock.oneMonth,
    oneYear: stock.oneYear,
    revenueGrowth: stock.revenueGrowth,
    profitGrowth: stock.profitGrowth,
    roe: stock.roe,
    debtEquity: stock.debtEquity,
    dividendYield: stock.dividendYield,
  }));
}

export function getWatchlistItems(tickers = ["INFY", "ICICIBANK", "RELIANCE", "TATAMOTORS", "BHARTIARTL", "ZOMATO"]) {
  const tickerSet = new Set(tickers);
  return MOCK_NIFTY_50_UNIVERSE.filter((stock) => tickerSet.has(stock.ticker));
}

export function searchStocks(query: string, limit = 10) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return MOCK_NIFTY_50_UNIVERSE.filter(
    (stock) =>
      stock.ticker.toLowerCase().includes(normalizedQuery) ||
      stock.symbol.toLowerCase().includes(normalizedQuery) ||
      stock.name.toLowerCase().includes(normalizedQuery) ||
      stock.sector.toLowerCase().includes(normalizedQuery) ||
      stock.industry.toLowerCase().includes(normalizedQuery),
  ).slice(0, limit);
}
