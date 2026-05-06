// Sample Indian-market data for the frontend-only Portfolio workspace.
// Replace this file with API-backed data when market, earnings, screener, and watchlist endpoints exist.

export type WorkspaceTone = "positive" | "negative" | "neutral";

export interface MarketIndexCard {
  symbol: string;
  name: string;
  value: string;
  changePercent: number;
  changeValue: string;
  points: number[];
}

export interface MarketMover {
  name: string;
  ticker: string;
  exchange: "NSE" | "BSE";
  price: number;
  move: number;
  sector: string;
}

export interface SectorPerformanceItem {
  sector: string;
  move: number;
  breadth: string;
}

export interface MarketInsight {
  title: string;
  summary: string;
  tone: WorkspaceTone;
}

export interface MarketHeatmapTile {
  ticker: string;
  company: string;
  sector: string;
  move: number;
  size: "large" | "medium" | "small";
}

export interface MarketDevelopment {
  title: string;
  source: string;
  summary: string;
  tone: WorkspaceTone;
}

export interface MarketQuestion {
  question: string;
  yes: number;
  no: number;
  catalyst: string;
  tone: WorkspaceTone;
}

export interface MarketStandout {
  ticker: string;
  company: string;
  exchange: "NSE" | "BSE";
  price: number;
  move: number;
  volume: string;
  marketCap: string;
  pe: string;
  dividendYield: string;
  summary: string;
  points: number[];
}

export interface EarningsEvent {
  id: string;
  company: string;
  ticker: string;
  dateLabel: string;
  dateGroup: "Today" | "This Week" | "Next Week" | "Recent";
  time: string;
  quarter: string;
  status: "Upcoming" | "Reported";
  estimate: string;
  actual?: string;
  surprise?: number;
  revenueGrowth: number;
  profitGrowth: number;
  notes: string[];
}

export interface ScreenerRow {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  marketCapCr: number;
  price: number;
  pe: number;
  oneDay: number;
  oneMonth: number;
  oneYear: number;
  revenueGrowth: number;
  profitGrowth: number;
  roe: number;
  debtEquity: number;
  dividendYield: number;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  price: number;
  oneDay: number;
  fiveDay: number;
  oneMonth: number;
  sixMonth: number;
  ytd: number;
  alert: boolean;
  note: string;
  points: number[];
}

export interface WatchlistNewsItem {
  ticker: string;
  source: string;
  time: string;
  headline: string;
}

export interface WatchlistMovement {
  ticker: string;
  date: string;
  time: string;
  move: number;
  summary: string;
  sources: number;
}

export const MARKET_INDEX_CARDS: MarketIndexCard[] = [
  {
    symbol: "NIFTY 50",
    name: "Large-cap benchmark",
    value: "24,330.95",
    changePercent: 1.24,
    changeValue: "+298.15",
    points: [24, 23, 22, 22, 21, 21, 23, 28, 34, 36, 35],
  },
  {
    symbol: "SENSEX",
    name: "BSE benchmark",
    value: "77,958.52",
    changePercent: 1.22,
    changeValue: "+940.73",
    points: [25, 24, 22, 21, 22, 21, 24, 31, 38, 39, 37],
  },
  {
    symbol: "BANK NIFTY",
    name: "Private bank leadership",
    value: "55,981.05",
    changePercent: 2.63,
    changeValue: "+1,434.00",
    points: [20, 20, 19, 19, 20, 22, 26, 30, 35, 39, 41],
  },
  {
    symbol: "MIDCAP 150",
    name: "Broader risk appetite",
    value: "22,904.12",
    changePercent: 0.58,
    changeValue: "+132.40",
    points: [28, 28, 27, 26, 27, 29, 30, 31, 32, 33, 33],
  },
  {
    symbol: "SMALLCAP 250",
    name: "Breadth check",
    value: "18,226.45",
    changePercent: -0.18,
    changeValue: "-32.84",
    points: [33, 32, 31, 30, 29, 30, 28, 27, 26, 26, 25],
  },
  {
    symbol: "NIFTY IT",
    name: "Rupee and US demand",
    value: "34,812.80",
    changePercent: -0.32,
    changeValue: "-111.60",
    points: [34, 33, 33, 31, 31, 29, 30, 29, 28, 27, 27],
  },
];

export const MARKET_BREADTH = {
  advances: 1392,
  declines: 927,
  unchanged: 117,
  highs52Week: 84,
  lows52Week: 19,
  fiiFlowCr: 1260,
  diiFlowCr: 1835,
};

export const MARKET_MOVERS = {
  gainers: [
    { name: "Firstsource Solutions", ticker: "FSL", exchange: "BSE", price: 243.35, move: 11.3, sector: "IT Services" },
    { name: "Coforge", ticker: "COFORGE", exchange: "NSE", price: 1280.7, move: 9.62, sector: "IT Services" },
    { name: "SRF", ticker: "SRF", exchange: "BSE", price: 2719.4, move: 7.59, sector: "Chemicals" },
    { name: "YES Bank", ticker: "YESBANK", exchange: "BSE", price: 22.13, move: 7.95, sector: "Financials" },
  ] satisfies MarketMover[],
  losers: [
    { name: "ONGC", ticker: "ONGC", exchange: "NSE", price: 252.4, move: -3.16, sector: "Energy" },
    { name: "Hindustan Unilever", ticker: "HINDUNILVR", exchange: "NSE", price: 2344.1, move: -1.42, sector: "Consumer" },
    { name: "Reliance Industries", ticker: "RELIANCE", exchange: "NSE", price: 1437.85, move: -1.8, sector: "Energy / Consumer" },
    { name: "Infosys", ticker: "INFY", exchange: "NSE", price: 1167.2, move: -0.93, sector: "IT Services" },
  ] satisfies MarketMover[],
  active: [
    { name: "ICICI Bank", ticker: "ICICIBANK", exchange: "NSE", price: 1809.9, move: 1.86, sector: "Financials" },
    { name: "Tata Motors", ticker: "TATAMOTORS", exchange: "NSE", price: 846.4, move: 2.25, sector: "Auto" },
    { name: "Zomato", ticker: "ZOMATO", exchange: "NSE", price: 203.5, move: 3.8, sector: "Consumer Internet" },
    { name: "Bharti Airtel", ticker: "BHARTIARTL", exchange: "NSE", price: 1398.6, move: 1.53, sector: "Telecom" },
  ] satisfies MarketMover[],
};

export const SECTOR_PERFORMANCE: SectorPerformanceItem[] = [
  { sector: "Financials", move: 2.18, breadth: "68% advancing" },
  { sector: "Auto", move: 1.42, breadth: "62% advancing" },
  { sector: "Capital Goods", move: 1.05, breadth: "59% advancing" },
  { sector: "Healthcare", move: 0.74, breadth: "55% advancing" },
  { sector: "Energy", move: -0.66, breadth: "42% advancing" },
  { sector: "IT Services", move: -0.31, breadth: "46% advancing" },
  { sector: "FMCG", move: -0.22, breadth: "44% advancing" },
];

export const MARKET_INSIGHTS: MarketInsight[] = [
  {
    title: "Indian benchmarks rallied as crude cooled",
    summary: "The clean read is lower import pressure, stronger banks, and broader domestic risk appetite.",
    tone: "positive",
  },
  {
    title: "Bank leadership is now the key confirmation signal",
    summary: "If Bank Nifty holds leadership, large-cap breadth can stay healthier than IT-led rallies.",
    tone: "positive",
  },
  {
    title: "IT remains more selective",
    summary: "Currency helps, but revenue commentary and US client budgets still matter more than beta.",
    tone: "neutral",
  },
];

export const MARKET_HEATMAP_TILES: MarketHeatmapTile[] = [
  { ticker: "ICICIBANK", company: "ICICI Bank", sector: "Financials", move: 1.86, size: "large" },
  { ticker: "HDFCBANK", company: "HDFC Bank", sector: "Financials", move: 1.4, size: "medium" },
  { ticker: "TATAMOTORS", company: "Tata Motors", sector: "Auto", move: 2.25, size: "large" },
  { ticker: "BHARTIARTL", company: "Bharti Airtel", sector: "Telecom", move: 1.53, size: "medium" },
  { ticker: "LT", company: "Larsen & Toubro", sector: "Capital Goods", move: 0.74, size: "medium" },
  { ticker: "TCS", company: "TCS", sector: "IT Services", move: 0.52, size: "small" },
  { ticker: "INFY", company: "Infosys", sector: "IT Services", move: -0.93, size: "medium" },
  { ticker: "RELIANCE", company: "Reliance", sector: "Energy", move: -1.8, size: "large" },
  { ticker: "ASIANPAINT", company: "Asian Paints", sector: "Consumer", move: -0.44, size: "small" },
  { ticker: "ZOMATO", company: "Zomato", sector: "Consumer Internet", move: 3.8, size: "medium" },
  { ticker: "ADANIGREEN", company: "Adani Green", sector: "Utilities", move: 1.1, size: "small" },
];

export const MARKET_DEVELOPMENTS: MarketDevelopment[] = [
  {
    title: "Indian benchmarks post strong gains as crude pressure cools",
    source: "Market desk",
    summary: "Banks and autos led a broad risk-on session while IT stayed more selective.",
    tone: "positive",
  },
  {
    title: "FII buying returns, but domestic flows remain the steadier support",
    source: "Flow tracker",
    summary: "The cleaner confirmation is still breadth outside the top five index weights.",
    tone: "neutral",
  },
  {
    title: "Reliance slips as investors wait for O2C margin clarity",
    source: "Broker note",
    summary: "Crude relief helps India broadly, but refining spread visibility remains uneven.",
    tone: "negative",
  },
];

export const MARKET_QUESTIONS: MarketQuestion[] = [
  {
    question: "Will Bank Nifty hold leadership through the next earnings window?",
    yes: 68,
    no: 32,
    catalyst: "Private bank results and deposit-cost commentary",
    tone: "positive",
  },
  {
    question: "Can IT recover without stronger US discretionary spending?",
    yes: 42,
    no: 58,
    catalyst: "TCS and Infosys guidance tone",
    tone: "neutral",
  },
  {
    question: "Does lower crude extend India's macro tailwind?",
    yes: 61,
    no: 39,
    catalyst: "Brent, rupee, and OMC margin spread",
    tone: "positive",
  },
];

export const MARKET_STANDOUTS: MarketStandout[] = [
  {
    ticker: "FSL",
    company: "Firstsource Solutions",
    exchange: "BSE",
    price: 243.35,
    move: 11.3,
    volume: "1.1M",
    marketCap: "168B",
    pe: "27.28",
    dividendYield: "2.26%",
    summary: "Sharp post-result momentum after stronger margin commentary and buy-side upgrades.",
    points: [20, 20, 21, 22, 24, 28, 31, 35, 39],
  },
  {
    ticker: "COFORGE",
    company: "Coforge",
    exchange: "NSE",
    price: 1280.7,
    move: 9.62,
    volume: "482K",
    marketCap: "806B",
    pe: "45.35",
    dividendYield: "1.23%",
    summary: "Investors rewarded better full-year growth commentary and order pipeline visibility.",
    points: [21, 22, 22, 24, 26, 30, 31, 34, 36],
  },
  {
    ticker: "YESBANK",
    company: "YES Bank",
    exchange: "BSE",
    price: 22.13,
    move: 7.95,
    volume: "38.8M",
    marketCap: "694B",
    pe: "19.76",
    dividendYield: "N/A",
    summary: "High volume move on improving sector sentiment and broad banking participation.",
    points: [20, 20, 21, 21, 22, 23, 25, 27, 28],
  },
];

export const EARNINGS_DAYS = [
  { day: "Mon", date: "May 4", calls: 25 },
  { day: "Tue", date: "May 5", calls: 19 },
  { day: "Wed", date: "May 6", calls: 21, active: true },
  { day: "Thu", date: "May 7", calls: 29 },
  { day: "Fri", date: "May 8", calls: 36 },
  { day: "Mon", date: "May 11", calls: 18 },
];

export const EARNINGS_EVENTS: EarningsEvent[] = [
  {
    id: "reliance-q4",
    company: "Reliance Industries",
    ticker: "RELIANCE",
    dateLabel: "Today",
    dateGroup: "Today",
    time: "4:00 PM",
    quarter: "Q4 FY26",
    status: "Upcoming",
    estimate: "PAT +8.4% YoY",
    revenueGrowth: 7.8,
    profitGrowth: 8.4,
    notes: ["Refining margin and retail commentary are the key swing factors.", "Jio ARPU and subscriber quality remain the cleaner read-through."],
  },
  {
    id: "tcs-q4",
    company: "Tata Consultancy Services",
    ticker: "TCS",
    dateLabel: "This week",
    dateGroup: "This Week",
    time: "6:30 PM",
    quarter: "Q4 FY26",
    status: "Upcoming",
    estimate: "EPS 2.8% above consensus",
    revenueGrowth: 5.6,
    profitGrowth: 7.2,
    notes: ["Watch order book, BFSI demand, and margin guidance.", "Rupee softness can help reported margins if demand holds."],
  },
  {
    id: "hdfc-bank-q4",
    company: "HDFC Bank",
    ticker: "HDFCBANK",
    dateLabel: "Next week",
    dateGroup: "Next Week",
    time: "3:30 PM",
    quarter: "Q4 FY26",
    status: "Upcoming",
    estimate: "NIM stabilisation",
    revenueGrowth: 11.4,
    profitGrowth: 9.2,
    notes: ["Deposit growth and net interest margin are the key investor questions.", "Asset quality is expected to remain stable."],
  },
  {
    id: "infosys-recent",
    company: "Infosys",
    ticker: "INFY",
    dateLabel: "Apr 24",
    dateGroup: "Recent",
    time: "5:00 PM",
    quarter: "Q4 FY26",
    status: "Reported",
    estimate: "EPS 4.28",
    actual: "EPS 5.03",
    surprise: 17.5,
    revenueGrowth: 6.4,
    profitGrowth: 8.1,
    notes: ["Guidance remained cautious but deal wins improved sequentially.", "The stock reaction depends on whether BFSI spending recovery broadens."],
  },
  {
    id: "tatamotors-recent",
    company: "Tata Motors",
    ticker: "TATAMOTORS",
    dateLabel: "Apr 30",
    dateGroup: "Recent",
    time: "4:30 PM",
    quarter: "Q4 FY26",
    status: "Reported",
    estimate: "PAT +12.0% YoY",
    actual: "PAT +18.6% YoY",
    surprise: 6.6,
    revenueGrowth: 14.2,
    profitGrowth: 18.6,
    notes: ["JLR margins were stronger than expected.", "EV commentary improved, but export sensitivity remains high."],
  },
];

export const SCREENER_PRESETS = ["All", "Quality", "Low debt", "Momentum", "Dividend"] as const;

export const SCREENER_ROWS: ScreenerRow[] = [
  { ticker: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy / Consumer", marketCapCr: 1945000, price: 1437.85, pe: 27.4, oneDay: -1.8, oneMonth: 1.6, oneYear: 12.2, revenueGrowth: 7.8, profitGrowth: 8.4, roe: 9.7, debtEquity: 0.36, dividendYield: 0.35 },
  { ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT Services", marketCapCr: 1432000, price: 3952.1, pe: 31.8, oneDay: 0.52, oneMonth: -1.2, oneYear: 9.4, revenueGrowth: 5.6, profitGrowth: 7.2, roe: 49.2, debtEquity: 0.08, dividendYield: 1.35 },
  { ticker: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", sector: "Financials", marketCapCr: 1361000, price: 1784.2, pe: 19.6, oneDay: 1.4, oneMonth: 4.8, oneYear: 16.1, revenueGrowth: 11.4, profitGrowth: 9.2, roe: 14.8, debtEquity: 0.0, dividendYield: 1.1 },
  { ticker: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Financials", marketCapCr: 1278000, price: 1809.9, pe: 18.2, oneDay: 1.86, oneMonth: 6.1, oneYear: 21.4, revenueGrowth: 12.5, profitGrowth: 13.8, roe: 17.1, debtEquity: 0.0, dividendYield: 0.72 },
  { ticker: "INFY", name: "Infosys", exchange: "NSE", sector: "IT Services", marketCapCr: 484000, price: 1167.2, pe: 24.8, oneDay: -0.93, oneMonth: -2.33, oneYear: -6.8, revenueGrowth: 6.4, profitGrowth: 8.1, roe: 31.4, debtEquity: 0.07, dividendYield: 2.2 },
  { ticker: "LT", name: "Larsen & Toubro", exchange: "NSE", sector: "Industrials", marketCapCr: 506000, price: 3684.5, pe: 34.6, oneDay: 0.74, oneMonth: 3.8, oneYear: 28.6, revenueGrowth: 17.2, profitGrowth: 18.4, roe: 15.9, debtEquity: 0.42, dividendYield: 0.78 },
  { ticker: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Auto", marketCapCr: 311000, price: 846.4, pe: 12.7, oneDay: 2.25, oneMonth: 8.8, oneYear: 34.5, revenueGrowth: 14.2, profitGrowth: 18.6, roe: 28.1, debtEquity: 0.71, dividendYield: 0.42 },
  { ticker: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", marketCapCr: 837000, price: 1398.6, pe: 54.2, oneDay: 1.53, oneMonth: 5.9, oneYear: 42.1, revenueGrowth: 12.8, profitGrowth: 22.4, roe: 11.2, debtEquity: 1.08, dividendYield: 0.35 },
  { ticker: "ASIANPAINT", name: "Asian Paints", exchange: "NSE", sector: "Consumer", marketCapCr: 281000, price: 2928.4, pe: 52.8, oneDay: -0.44, oneMonth: 1.1, oneYear: -3.2, revenueGrowth: 4.1, profitGrowth: 6.3, roe: 28.6, debtEquity: 0.12, dividendYield: 1.05 },
  { ticker: "ZOMATO", name: "Zomato", exchange: "NSE", sector: "Consumer Internet", marketCapCr: 183000, price: 203.5, pe: 86.0, oneDay: 3.8, oneMonth: 11.2, oneYear: 62.4, revenueGrowth: 34.5, profitGrowth: 120.0, roe: 6.8, debtEquity: 0.04, dividendYield: 0 },
  { ticker: "ADANIGREEN", name: "Adani Green Energy", exchange: "NSE", sector: "Utilities", marketCapCr: 276000, price: 1742.2, pe: 104.3, oneDay: 1.1, oneMonth: 4.2, oneYear: 24.8, revenueGrowth: 28.8, profitGrowth: 33.0, roe: 18.4, debtEquity: 5.2, dividendYield: 0 },
];

export const WATCHLIST_ITEMS: WatchlistItem[] = [
  { ticker: "INFY", name: "Infosys", exchange: "NSE", sector: "IT Services", price: 1167.2, oneDay: -0.93, fiveDay: -2.33, oneMonth: -6.48, sixMonth: -20.42, ytd: -7.2, alert: true, note: "Watch guidance tone and BFSI demand.", points: [35, 34, 32, 31, 32, 30, 29, 28] },
  { ticker: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Financials", price: 1809.9, oneDay: 1.86, fiveDay: 2.72, oneMonth: 5.66, sixMonth: -9.55, ytd: 8.4, alert: false, note: "Leadership name for Bank Nifty confirmation.", points: [22, 23, 24, 26, 28, 31, 32, 34] },
  { ticker: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy / Consumer", price: 1437.85, oneDay: -1.8, fiveDay: 0.53, oneMonth: 10.2, sixMonth: -3.87, ytd: 6.3, alert: true, note: "Track crude, refining spread, and Jio commentary.", points: [31, 32, 31, 30, 28, 27, 28, 27] },
  { ticker: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Auto", price: 846.4, oneDay: 2.25, fiveDay: 4.1, oneMonth: 8.8, sixMonth: 18.4, ytd: 17.8, alert: false, note: "Momentum name; confirm JLR margin trend.", points: [21, 22, 24, 27, 30, 32, 35, 36] },
  { ticker: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", price: 1398.6, oneDay: 1.53, fiveDay: 3.7, oneMonth: 5.9, sixMonth: 22.6, ytd: 14.1, alert: false, note: "ARPU and tariff action remain the main catalysts.", points: [24, 25, 25, 27, 28, 30, 31, 33] },
  { ticker: "ZOMATO", name: "Zomato", exchange: "NSE", sector: "Consumer Internet", price: 203.5, oneDay: 3.8, fiveDay: 7.2, oneMonth: 11.2, sixMonth: 38.4, ytd: 31.2, alert: true, note: "High momentum; watch quick-commerce margins.", points: [18, 19, 22, 25, 29, 32, 36, 39] },
];

export const WATCHLIST_NEWS: WatchlistNewsItem[] = [
  { ticker: "ICICIBANK", source: "Broker note", time: "18 minutes ago", headline: "Private bank leadership broadens as credit growth stabilizes" },
  { ticker: "TATAMOTORS", source: "Exchange filing", time: "32 minutes ago", headline: "Auto names rise on stronger export and EV demand checks" },
  { ticker: "RELIANCE", source: "Market desk", time: "1 hour ago", headline: "Crude softness offsets pressure in oil-to-chemicals expectations" },
  { ticker: "ZOMATO", source: "Analyst note", time: "2 hours ago", headline: "Quick-commerce scale keeps high-growth internet names in focus" },
  { ticker: "INFY", source: "Result transcript", time: "3 hours ago", headline: "Infosys commentary keeps investors focused on US discretionary budgets" },
  { ticker: "BHARTIARTL", source: "Sector note", time: "4 hours ago", headline: "Telecom names firm as ARPU upgrade cycle remains in focus" },
];

export const WATCHLIST_MOVEMENTS: WatchlistMovement[] = [
  {
    ticker: "ICICIBANK",
    date: "May 6",
    time: "5:20 PM IST",
    move: 1.86,
    summary: "ICICI Bank closed higher and outperformed broader financials as private-bank leadership broadened.",
    sources: 3,
  },
  {
    ticker: "RELIANCE",
    date: "May 6",
    time: "3:45 PM IST",
    move: -1.8,
    summary: "Reliance lagged as investors waited for clearer refining spread and retail commentary.",
    sources: 2,
  },
  {
    ticker: "ZOMATO",
    date: "May 5",
    time: "4:10 PM IST",
    move: 3.8,
    summary: "Zomato extended momentum on quick-commerce margin optimism and higher-volume buying.",
    sources: 4,
  },
];
