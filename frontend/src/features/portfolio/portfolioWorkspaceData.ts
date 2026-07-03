// Sample Indian-market data for the frontend-only Portfolio workspace.
// Replace this file with API-backed data when market, earnings, screener, and watchlist endpoints exist.

import {
  MOCK_MARKET_DATA_NOTICE,
  getHeatmapData,
  getMarketMovers,
  getScreenerRows,
  getWatchlistItems,
  type MockMarketInstrument,
} from "../../data/mockMarketData";

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
  gainers: number;
  losers: number;
}

export interface MarketNewsItem {
  id: string;
  company: string;
  ticker: string;
  move: number;
  summary: string;
  timeAgo: string;
  logoDomain?: string;
}

export interface MarketInsight {
  id?: string;
  title: string;
  summary: string;
  tone: WorkspaceTone;
}

export interface MarketSummaryItem {
  id: string;
  title: string;
  summary: string;
  tone: WorkspaceTone;
}

export interface MarketSummarySource {
  sourceName: string;
  sourceType: "news" | "video" | "broker" | "exchange" | "market-data";
  domain?: string;
  title: string;
  snippet: string;
  url?: string;
  relatedSummaryIds?: string[];
}

export type MarketHeatmapTile = MockMarketInstrument;

export interface MarketDevelopment {
  id: string;
  title: string;
  summary: string;
  timeAgo: string;
  sources: MarketDevelopmentSource[];
  aiQuery: string;
  answer: MarketDevelopmentAnswer;
  tone: WorkspaceTone;
}

export interface MarketDevelopmentSource {
  name: string;
  domain?: string;
  url?: string;
}

export interface MarketDevelopmentAnswerSection {
  title: string;
  body: string;
  citations?: string[];
}

export interface MarketDevelopmentAnswer {
  shortAnswer: string;
  lead: string;
  sections: MarketDevelopmentAnswerSection[];
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

export type EarningsDateGroup = "Today" | "This Week" | "Next Week" | "Recent";
export type EarningsImpact = "High impact" | "Medium impact" | "Low impact";
export type EarningsSourceStatus = "Desk context" | "Consensus context" | "Filed result" | "Market context";

export interface EarningsMetric {
  label: string;
  value: string;
  tone?: WorkspaceTone;
}

export interface EarningsResultSnapshot {
  result: string;
  revenueYoY: string;
  patYoY: string;
  margin: string;
  priceReaction: number;
  readThrough: string;
}

export interface EarningsEvent {
  id: string;
  company: string;
  ticker: string;
  exchange: "NSE" | "BSE";
  sector: string;
  dateLabel: string;
  dateGroup: EarningsDateGroup;
  time: string;
  callTime: string;
  quarter: string;
  status: "Upcoming" | "Reported";
  impact: EarningsImpact;
  portfolioRelevance: string;
  watchlistRelevance: string;
  estimate: string;
  actual?: string;
  surprise?: number;
  revenueGrowth: number;
  profitGrowth: number;
  expectedMove: string;
  actualMove?: number;
  thesis: string;
  whyItMatters: string;
  watchFor: string;
  streetFocus: string;
  readThrough: string;
  evidenceLabel: string;
  sourceStatus: EarningsSourceStatus;
  tags: string[];
  consensusMetrics: EarningsMetric[];
  resultSnapshot?: EarningsResultSnapshot;
  notes: string[];
}

export interface EarningsDay {
  day: string;
  date: string;
  calls: number;
  totalResults: number;
  highImpact: number;
  portfolioWatchlist: number;
  reported: number;
  upcoming: number;
  intensity: number;
  active?: boolean;
}

export interface EarningsTheme {
  id: string;
  title: string;
  summary: string;
  sectors: string[];
  tickers: string[];
  tone: WorkspaceTone;
}

export interface EarningsForceName {
  ticker: string;
  company: string;
  exchange: "NSE" | "BSE";
  price: number;
  move: number;
  expectedMove: string;
  volume: string;
  reason: string;
  points: number[];
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

export interface ScreenerRowContext {
  reason: string;
  riskNote: string;
  nextCatalyst: string;
  themeTags: string[];
}

export interface WatchlistItemContext {
  reasonWatched: string;
  alertReason: string;
  riskCluster: string;
  latestSignal: string;
  relatedEarnings: string;
}

export interface EarningsEventContext {
  importance: "High impact" | "Medium impact" | "Low impact";
  relevance: string[];
  theme: string;
  whyItMatters: string;
  watchFor: string;
}

export const MARKET_INDEX_CARDS: MarketIndexCard[] = [
  {
    symbol: "NIFTY 50",
    name: "Large-cap benchmark",
    value: "24,330.95",
    changePercent: 1.24,
    changeValue: "+298.15",
    points: [31, 30, 28, 27, 26, 27, 29, 28, 31, 34, 33, 35, 38, 40, 39, 42, 45, 47, 46, 49, 51, 50],
  },
  {
    symbol: "SENSEX",
    name: "BSE benchmark",
    value: "77,958.52",
    changePercent: 1.22,
    changeValue: "+940.73",
    points: [33, 32, 29, 28, 27, 28, 27, 30, 34, 36, 35, 37, 41, 43, 42, 45, 48, 47, 50, 53, 52, 54],
  },
  {
    symbol: "BANK NIFTY",
    name: "Private bank leadership",
    value: "55,981.05",
    changePercent: 2.63,
    changeValue: "+1,434.00",
    points: [24, 24, 23, 25, 26, 25, 29, 32, 34, 33, 37, 40, 42, 45, 44, 48, 52, 55, 54, 58, 61, 63],
  },
  {
    symbol: "MIDCAP 150",
    name: "Broader risk appetite",
    value: "22,904.12",
    changePercent: 0.58,
    changeValue: "+132.40",
    points: [35, 35, 34, 33, 32, 33, 35, 34, 36, 37, 36, 38, 39, 41, 40, 42, 43, 42, 44, 45, 44, 46],
  },
  {
    symbol: "INDIA VIX",
    name: "Volatility gauge",
    value: "18.72",
    changePercent: -1.86,
    changeValue: "-0.36",
    points: [51, 53, 52, 50, 48, 49, 47, 45, 44, 46, 43, 42, 40, 41, 39, 37, 38, 35, 34, 36, 33, 32],
  },
  {
    symbol: "USD/INR",
    name: "Rupee reference",
    value: "₹85.47",
    changePercent: 0.12,
    changeValue: "+0.10",
    points: [38, 37, 39, 38, 40, 41, 40, 42, 43, 42, 44, 45, 44, 46, 47, 48, 47, 49, 50, 49, 51, 52],
  },
  {
    symbol: "SMALLCAP 250",
    name: "Breadth check",
    value: "18,226.45",
    changePercent: -0.18,
    changeValue: "-32.84",
    points: [42, 43, 41, 40, 38, 39, 37, 36, 35, 36, 34, 33, 32, 33, 31, 30, 29, 30, 28, 27, 28, 26],
  },
  {
    symbol: "NIFTY IT",
    name: "Rupee and US demand",
    value: "34,812.80",
    changePercent: -0.32,
    changeValue: "-111.60",
    points: [46, 45, 46, 44, 42, 43, 41, 39, 40, 38, 37, 39, 36, 35, 34, 35, 33, 32, 31, 32, 30, 29],
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

const mapMarketMover = (stock: MockMarketInstrument): MarketMover => ({
  name: stock.name,
  ticker: stock.ticker,
  exchange: stock.exchange,
  price: stock.price,
  move: stock.changePercent,
  sector: stock.sector,
});

const NIFTY_50_MOVERS = getMarketMovers(4);

export const MARKET_MOVERS = {
  gainers: NIFTY_50_MOVERS.gainers.map(mapMarketMover),
  losers: NIFTY_50_MOVERS.losers.map(mapMarketMover),
  active: NIFTY_50_MOVERS.active.map(mapMarketMover),
};

export const SECTOR_PERFORMANCE: SectorPerformanceItem[] = [
  { sector: "Financials", move: 2.18, breadth: "68% advancing", gainers: 24, losers: 13 },
  { sector: "Auto", move: 1.42, breadth: "62% advancing", gainers: 18, losers: 7 },
  { sector: "Capital Goods", move: 1.05, breadth: "59% advancing", gainers: 16, losers: 8 },
  { sector: "Healthcare", move: 0.74, breadth: "55% advancing", gainers: 14, losers: 10 },
  { sector: "Energy", move: -0.66, breadth: "42% advancing", gainers: 9, losers: 16 },
  { sector: "IT Services", move: -0.31, breadth: "46% advancing", gainers: 11, losers: 15 },
  { sector: "FMCG", move: -0.22, breadth: "44% advancing", gainers: 8, losers: 12 },
];

export const STOCKS_IN_NEWS: MarketNewsItem[] = [
  {
    id: "bpcl-rating-pressure",
    company: "BPCL",
    ticker: "BPCL",
    move: -0.39,
    summary:
      "JM Financial keeps BPCL under pressure after an asset-related hit, with LPG margin worries still clouding the near-term setup.",
    timeAgo: "28 minutes ago",
    logoDomain: "bharatpetroleum.in",
  },
  {
    id: "nykaa-fresh-peak",
    company: "Nykaa",
    ticker: "NYKAA",
    move: -0.89,
    summary:
      "Nykaa cools from a fresh peak as bulls point to retail momentum while bears flag a possible correction after the rally.",
    timeAgo: "28 minutes ago",
    logoDomain: "nykaa.com",
  },
  {
    id: "varun-beverages-contract",
    company: "Varun Beverages",
    ticker: "VBL",
    move: 3.2,
    summary:
      "Varun Beverages extends gains after investors react to a long-duration bottling contract and stronger volume visibility.",
    timeAgo: "28 minutes ago",
    logoDomain: "varunbeverages.com",
  },
  {
    id: "parle-industries-upper-circuit",
    company: "Parle Industries",
    ticker: "PARLEIND",
    move: 4.9,
    summary:
      "Parle Industries remains locked near the upper circuit as momentum traders chase a third consecutive session of strength.",
    timeAgo: "28 minutes ago",
    logoDomain: "parleindustries.com",
  },
  {
    id: "tata-motors-ev-watch",
    company: "Tata Motors",
    ticker: "TATAMOTORS",
    move: -1.18,
    summary:
      "Tata Motors trades softer as investors weigh EV margin pressure against resilient domestic passenger-vehicle demand.",
    timeAgo: "42 minutes ago",
    logoDomain: "tatamotors.com",
  },
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

export const MARKET_SUMMARY_ITEMS: MarketSummaryItem[] = [
  {
    id: "markets-open-higher",
    title: "Indian Markets Open Higher After Four Sessions of Losses",
    summary:
      "Indian benchmark indices bounced back on Wednesday, May 13, opening in positive territory after four consecutive sessions of steep declines. Persistent foreign outflows and elevated crude prices remain headwinds, though sentiment improved modestly.",
    tone: "positive",
  },
  {
    id: "gold-silver-duty",
    title: "Gold & Silver Import Duty Hiked to 15% - Jewellery Stocks in Focus",
    summary:
      "The government sharply raised import duties on gold and silver to 15% from 6%, comprising a 10% basic customs duty and a 5% AIDC, to curb imports and support the rupee amid forex reserve pressures linked to the West Asia crisis. On MCX, gold surged past ₹1,63,000 and silver touched ₹2,96,600, both rising over 6%, putting Titan, Senco Gold, and other jewellery stocks squarely in the spotlight.",
    tone: "neutral",
  },
  {
    id: "berger-paints-q4",
    title: "Berger Paints Q4 FY26: Net Profit Jumps 27.8% YoY",
    summary:
      "Berger Paints delivered a strong quarterly performance with consolidated net profit rising to ₹335 crore from ₹262 crore in Q4 FY25, driven by improved margins and steady revenue growth. The company also declared a final dividend and approved the reappointment of its MD & CEO, adding to positive investor sentiment.",
    tone: "positive",
  },
  {
    id: "dixon-tech-q4",
    title: "Dixon Technologies Q4 FY26: Net Profit Slumps 36% YoY",
    summary:
      "Dixon Technologies reported weaker quarterly earnings, with net profit falling sharply year-on-year. The move puts focus on margin pressure, order visibility, and whether the electronics manufacturing theme can sustain premium valuations.",
    tone: "negative",
  },
  {
    id: "dr-reddy-q4",
    title: "Dr Reddy's Laboratories Q4 FY26: PAT Craters 86% on North America Weakness",
    summary:
      "Dr Reddy's reported a steep decline in profit after tax, pressured by weakness in North America and softer operating performance. Investors will watch management commentary on pricing, US generics, and margin recovery.",
    tone: "negative",
  },
  {
    id: "air-india-fuel",
    title: "Air India Slashes ~200 Weekly Flights Amid Soaring Jet Fuel Costs",
    summary:
      "Air India has cut multiple weekly flights as rising fuel prices pressure airline economics. Higher ATF prices can weigh on aviation margins and may also affect travel-linked sectors.",
    tone: "negative",
  },
];

export const MARKET_SUMMARY_SOURCES: MarketSummarySource[] = [
  {
    sourceName: "upstox",
    sourceType: "broker",
    domain: "upstox.com",
    title: "Stocks to watch, May 13: Tata Motors, Dixon Tech, Berger Paints, Bharti Airtel, Tata Power, jewellery stocks",
    snippet: "Stocks to watch: Berger Paints reported a good set of fourth-quarter earnings, driven by improved margins and steady revenue growth.",
    url: "https://upstox.com",
    relatedSummaryIds: ["berger-paints-q4", "dixon-tech-q4", "gold-silver-duty"],
  },
  {
    sourceName: "youtube",
    sourceType: "video",
    domain: "youtube.com",
    title: "Stock Market Updates Live: Business & Finance | 13 May 2026 | CNBC Awaaz",
    snippet: "Live market update coverage tracking the first trade, index recovery, commodity moves, and major stock-specific triggers.",
    url: "https://www.youtube.com",
    relatedSummaryIds: ["markets-open-higher"],
  },
  {
    sourceName: "timesofindia.indiatimes",
    sourceType: "news",
    domain: "timesofindia.indiatimes.com",
    title: "Gold gets costlier: Why govt raised import duty and what changes for buyers",
    snippet: "The government raised import duties on gold and silver to 15% from 6% as part of a broader effort to curb imports.",
    url: "https://timesofindia.indiatimes.com",
    relatedSummaryIds: ["gold-silver-duty"],
  },
  {
    sourceName: "economictimes",
    sourceType: "news",
    domain: "economictimes.indiatimes.com",
    title: "India raises gold, silver import duty to 15% to curb imports, support rupee amid West Asia crisis",
    snippet: "India significantly raised customs duties on precious-metal imports, keeping jewellery stocks and bullion demand in focus.",
    url: "https://economictimes.indiatimes.com",
    relatedSummaryIds: ["gold-silver-duty"],
  },
  {
    sourceName: "reuters",
    sourceType: "news",
    domain: "reuters.com",
    title: "Indian shares open higher after four sessions of losses",
    snippet: "Indian shares opened higher after four sessions of steep losses while elevated crude prices and persistent foreign outflows remained key overhangs.",
    url: "https://www.reuters.com",
    relatedSummaryIds: ["markets-open-higher"],
  },
  {
    sourceName: "economictimes",
    sourceType: "news",
    domain: "economictimes.indiatimes.com",
    title: "Air India terminates flights to multiple destinations as fuel price bites",
    snippet: "Airline capacity cuts put attention on aviation costs, ATF inflation, and demand resilience across travel-linked businesses.",
    url: "https://economictimes.indiatimes.com",
    relatedSummaryIds: ["air-india-fuel"],
  },
  {
    sourceName: "business-standard",
    sourceType: "news",
    domain: "business-standard.com",
    title: "Berger Paints Q4 result: Profit rises on better margins, board approves dividend",
    snippet: "Berger Paints' quarterly update showed margin improvement, revenue growth, and a stronger bottom-line performance.",
    url: "https://www.business-standard.com",
    relatedSummaryIds: ["berger-paints-q4"],
  },
  {
    sourceName: "moneycontrol",
    sourceType: "market-data",
    domain: "moneycontrol.com",
    title: "Berger Paints share price reacts to Q4 earnings and management continuity",
    snippet: "Investors tracked the earnings beat, dividend announcement, and reappointment of senior leadership.",
    url: "https://www.moneycontrol.com",
    relatedSummaryIds: ["berger-paints-q4"],
  },
  {
    sourceName: "livemint",
    sourceType: "news",
    domain: "livemint.com",
    title: "Dixon Technologies Q4 profit slips as margin pressure weighs on electronics manufacturing",
    snippet: "Dixon's weaker profitability shifted focus to operating leverage, order visibility, and premium valuation support.",
    url: "https://www.livemint.com",
    relatedSummaryIds: ["dixon-tech-q4"],
  },
  {
    sourceName: "cnbctv18",
    sourceType: "news",
    domain: "cnbctv18.com",
    title: "Dixon Technologies earnings miss puts spotlight on EMS growth durability",
    snippet: "The market read focused on whether electronics manufacturing momentum can offset near-term margin compression.",
    url: "https://www.cnbctv18.com",
    relatedSummaryIds: ["dixon-tech-q4"],
  },
  {
    sourceName: "ndtvprofit",
    sourceType: "news",
    domain: "ndtvprofit.com",
    title: "Dr Reddy's Q4 PAT drops sharply on North America weakness",
    snippet: "North America softness and weaker operating performance weighed on Dr Reddy's quarterly profit after tax.",
    url: "https://www.ndtvprofit.com",
    relatedSummaryIds: ["dr-reddy-q4"],
  },
  {
    sourceName: "financialexpress",
    sourceType: "news",
    domain: "financialexpress.com",
    title: "Dr Reddy's Laboratories result: Investors watch US generics pricing and margin recovery",
    snippet: "Management commentary around US pricing, launch cadence, and gross margin recovery remains central to the stock setup.",
    url: "https://www.financialexpress.com",
    relatedSummaryIds: ["dr-reddy-q4"],
  },
  {
    sourceName: "thehindubusinessline",
    sourceType: "news",
    domain: "thehindubusinessline.com",
    title: "Market opens higher; banks and select large caps steady after four-day slide",
    snippet: "Indian equities attempted a rebound as domestic investors looked past the recent selloff and tracked global risk cues.",
    url: "https://www.thehindubusinessline.com",
    relatedSummaryIds: ["markets-open-higher"],
  },
  {
    sourceName: "nseindia",
    sourceType: "exchange",
    domain: "nseindia.com",
    title: "Index snapshot: Nifty 50, Bank Nifty, sectoral breadth",
    snippet: "Exchange-level index and breadth data supported the read-through on broad-market participation and sector leadership.",
    url: "https://www.nseindia.com",
    relatedSummaryIds: ["markets-open-higher"],
  },
  {
    sourceName: "bseindia",
    sourceType: "exchange",
    domain: "bseindia.com",
    title: "BSE market statistics and Sensex constituent movement",
    snippet: "BSE market data helped confirm the recovery tone in benchmark constituents and broader cash-market activity.",
    url: "https://www.bseindia.com",
    relatedSummaryIds: ["markets-open-higher"],
  },
  {
    sourceName: "zeebusiness",
    sourceType: "news",
    domain: "zeebiz.com",
    title: "Jewellery stocks in focus after import duty hike; Titan and Senco watched",
    snippet: "The duty change moved attention to jewellery demand, inventory gains, and listed retail jewellery names.",
    url: "https://www.zeebiz.com",
    relatedSummaryIds: ["gold-silver-duty"],
  },
  {
    sourceName: "business-today",
    sourceType: "news",
    domain: "businesstoday.in",
    title: "Aviation stocks watch fuel-price risk as Air India trims weekly flights",
    snippet: "Higher jet fuel costs can pressure airline margins and ripple through travel, hotels, and airport-linked sectors.",
    url: "https://www.businesstoday.in",
    relatedSummaryIds: ["air-india-fuel"],
  },
];

export const MARKET_DATA_NOTICE = MOCK_MARKET_DATA_NOTICE;
export const MARKET_HEATMAP_TILES: MarketHeatmapTile[] = getHeatmapData(50);

export const MARKET_DEVELOPMENTS: MarketDevelopment[] = [
  {
    id: "sensex-nifty-four-day-streak",
    title: "Sensex, Nifty Break Four-Day Losing Streak Wednesday",
    summary:
      "Indian benchmark indices opened higher on May 13 after the U.S. and China jointly agreed to bar shipping tolls in the Strait of Hormuz. The Sensex began at 74,631.05 and the Nifty 50 opened at 23,382.90, ending a four-session slide.",
    timeAgo: "1 hour ago",
    sources: [
      { name: "Economic Times", domain: "economictimes.indiatimes.com", url: "https://economictimes.indiatimes.com" },
      { name: "Reuters", domain: "reuters.com", url: "https://www.reuters.com" },
    ],
    aiQuery:
      "Explain why Sensex and Nifty broke their four-day losing streak. Cover market context, key drivers, affected sectors, FII flows, crude oil impact, rupee impact, and what investors should watch next.",
    answer: {
      shortAnswer:
        "Sensex and Nifty snapped a four-day losing streak as traders covered shorts, crude-risk pressure eased modestly, and large-cap banks helped stabilize index breadth.",
      lead:
        "The rebound was less a clean risk-on reset and more a relief move after several sessions of selling. Benchmark buyers returned where earnings visibility and domestic liquidity looked sturdier, while crude, rupee pressure, and foreign flows remained the variables that could quickly test the bounce.",
      sections: [
        {
          title: "Market Context",
          body:
            "The four-day decline had already pushed sentiment into defensive territory, so even a modest improvement in global shipping and crude-risk headlines was enough to invite tactical buying. Opening gains in the Sensex and Nifty 50 signal that investors were willing to rebuild exposure, but the move still needs breadth confirmation beyond the heaviest index constituents.",
          citations: ["Economic Times", "Reuters"],
        },
        {
          title: "Key Drivers",
          body:
            "The strongest near-term driver was relief around energy and shipping risk. For India, lower perceived disruption risk can soften the import-cost narrative, support margins for oil-sensitive sectors, and reduce pressure on the rupee. Short covering after the selloff likely amplified the first move higher.",
          citations: ["Reuters"],
        },
        {
          title: "Affected Sectors",
          body:
            "Private banks, autos, capital goods, and select domestic cyclicals benefit first when macro stress cools. IT remains more stock-specific because its driver is global client spending, not only domestic risk appetite. Energy and OMC-linked names still need crude and refining spreads to settle before the signal becomes durable.",
        },
        {
          title: "FII Flows And Rupee Impact",
          body:
            "Foreign flows remain the key vulnerability. If FIIs continue selling, the index rebound can fade even when domestic institutions absorb supply. A weaker rupee can help exporters but raises import-cost and inflation concerns, making the quality of flows more important than the opening index print.",
        },
        {
          title: "What To Watch Next",
          body:
            "Watch Brent crude, USD/INR, FII cash-market flow, Bank Nifty breadth, and whether midcaps join the move. A healthy rally should broaden through banks and domestic cyclicals rather than rely only on a few large index weights.",
        },
      ],
    },
    tone: "positive",
  },
  {
    id: "it-shares-openai-enterprise",
    title: "IT Shares Tumble Following OpenAI Enterprise Investment...",
    summary:
      "The Nifty IT index dropped 3.7% on Tuesday to its lowest close in three years after OpenAI announced over $4 billion in funding for an enterprise AI deployment firm, raising concerns about margin pressure on traditional Indian software services.",
    timeAgo: "6 hours ago",
    sources: [
      { name: "Economic Times", domain: "economictimes.indiatimes.com", url: "https://economictimes.indiatimes.com" },
      { name: "CNBC", domain: "cnbc.com", url: "https://www.cnbc.com" },
    ],
    aiQuery:
      "Explain why Indian IT shares are falling after OpenAI's enterprise AI investment. Cover impact on Indian IT companies, margin pressure, client spending risk, affected stocks, and what investors should watch next.",
    answer: {
      shortAnswer:
        "Indian IT shares fell because investors read OpenAI's enterprise push as a direct challenge to traditional services pricing, margins, and discretionary tech budgets.",
      lead:
        "The selloff reflects a valuation reset more than a single-day earnings event. If AI tools compress project timelines or shift client budgets toward automation platforms, Indian IT vendors may face slower revenue growth, tougher pricing, and higher reinvestment needs at the same time.",
      sections: [
        {
          title: "Market Context",
          body:
            "Nifty IT was already trading with weak demand expectations and cautious global client spending. A large enterprise AI investment sharpened the market's concern that consulting, application maintenance, and low-complexity outsourcing work could see pricing pressure faster than expected.",
          citations: ["Economic Times", "CNBC"],
        },
        {
          title: "Impact On Indian IT Companies",
          body:
            "Large IT services firms can benefit from AI implementation work, but the transition is not automatically margin-accretive. Clients may demand productivity pass-throughs, reduce headcount-linked billing, and consolidate vendors around platforms that show measurable automation savings.",
        },
        {
          title: "Margin Pressure",
          body:
            "The margin risk comes from two sides: lower pricing for repeatable services and higher spending on AI talent, partnerships, and internal tooling. Companies with stronger consulting depth and platform-led offerings are better positioned than firms dependent on commoditized run-the-business work.",
        },
        {
          title: "Affected Stocks",
          body:
            "The market will likely differentiate between large-cap IT names with deep client relationships and mid-tier firms with more concentrated service lines. Infosys, TCS, Wipro, HCLTech, Tech Mahindra, Coforge, and Persistent can all be repriced depending on management commentary around AI-led productivity.",
        },
        {
          title: "What To Watch Next",
          body:
            "Watch deal wins, BFSI and retail client budgets, AI revenue disclosure, headcount trends, utilization, and whether management teams guide for pricing concessions. A recovery needs evidence that AI is expanding project scope rather than only reducing billable effort.",
        },
      ],
    },
    tone: "negative",
  },
  {
    id: "fii-outflows-8400-crore",
    title: "FII Outflows Exceeding ₹8,400 Crore Weigh on Equities",
    summary:
      "Foreign institutional investors offloaded more than ₹8,400 crore in Tuesday's session, compounding pressure from elevated crude oil prices and a weakening rupee. India VIX rose to 19.28, up 3.94%, signaling heightened market volatility.",
    timeAgo: "2 hours ago",
    sources: [
      { name: "Economic Times", domain: "economictimes.indiatimes.com", url: "https://economictimes.indiatimes.com" },
      { name: "NewsOnAir", domain: "newsonair.gov.in", url: "https://newsonair.gov.in" },
    ],
    aiQuery:
      "Explain how FII outflows exceeding ₹8,400 crore are affecting Indian equities. Cover crude oil, rupee weakness, India VIX, market sentiment, affected sectors, and what investors should watch next.",
    answer: {
      shortAnswer:
        "FII selling above ₹8,400 crore adds pressure to Indian equities by tightening liquidity, weakening sentiment, and amplifying concerns around crude, the rupee, and volatility.",
      lead:
        "Foreign institutional selling matters because it can turn macro stress into direct equity supply. When outflows coincide with elevated crude and rupee weakness, investors demand a higher risk premium from import-heavy sectors, richly valued cyclicals, and foreign-owned large caps.",
      sections: [
        {
          title: "Market Context",
          body:
            "The FII selloff landed while Indian equities were already dealing with global risk aversion, higher energy prices, and currency pressure. That combination raises the cost of capital and makes investors less forgiving of expensive valuations or weak earnings visibility.",
          citations: ["Economic Times", "NewsOnAir"],
        },
        {
          title: "FII Trends",
          body:
            "Large single-session outflows can pressure index heavyweights because foreign investors are concentrated in liquid large caps. Domestic institutions may cushion the move, but persistent FII selling can still weigh on multiples and delay any durable rebound.",
          citations: ["Economic Times"],
        },
        {
          title: "Crude, Rupee, And India VIX",
          body:
            "Higher crude hurts India's import bill and can pressure the rupee. A weaker rupee can feed inflation concerns and reduce foreign investor appetite. The India VIX move toward 19 signals that traders are paying more for protection and expecting wider index swings.",
        },
        {
          title: "Affected Sectors",
          body:
            "Banks, NBFCs, autos, airlines, OMCs, and other import-sensitive sectors can feel the pressure first. IT and pharma may get some currency translation support, but that is not enough if global risk appetite is deteriorating.",
        },
        {
          title: "Investor Implications",
          body:
            "The key is whether selling remains a one-day risk event or becomes a flow trend. Watch daily FII/DII data, USD/INR, Brent crude, India VIX, Bank Nifty, and breadth outside the top five index weights.",
        },
      ],
    },
    tone: "negative",
  },
  {
    id: "gold-silver-duty-jewellery",
    title: "Gold & Silver Import Duty Hiked to 15%, Jewellery Stocks in Focus",
    summary:
      "Higher import duty on gold and silver pushed jewellery and organised retail names back into focus. Investors are watching whether margin discipline, wedding-season demand, and inventory gains offset weaker discretionary demand.",
    timeAgo: "3 hours ago",
    sources: [
      { name: "Moneycontrol", domain: "moneycontrol.com", url: "https://www.moneycontrol.com" },
      { name: "Business Standard", domain: "business-standard.com", url: "https://www.business-standard.com" },
    ],
    aiQuery:
      "Explain how higher gold and silver import duty affects Indian jewellery stocks. Cover margins, inventory gains, demand risk, organised retailers, and what investors should watch next.",
    answer: {
      shortAnswer:
        "The duty hike can support inventory gains for some jewellers, but it also raises end-prices and tests demand elasticity in discretionary categories.",
      lead:
        "Jewellery stocks can react positively when policy changes improve near-term inventory value or formal-sector positioning. The durability of the move depends on whether demand holds after higher landed costs flow into retail prices.",
      sections: [
        {
          title: "Market Context",
          body:
            "Organised jewellery retailers are watched closely during duty changes because they can benefit from inventory revaluation and better compliance-led share gains. Smaller unorganised players may face more working-capital pressure.",
          citations: ["Moneycontrol", "Business Standard"],
        },
        {
          title: "What To Watch Next",
          body:
            "Watch gross margins, gold price volatility, wedding-season demand, inventory days, and management commentary on whether higher prices are delaying purchases.",
        },
      ],
    },
    tone: "neutral",
  },
  {
    id: "berger-paints-q4-profit",
    title: "Berger Paints Q4 FY26: Net Profit Jumps 27.8% YoY",
    summary:
      "Berger Paints reported stronger quarterly profit as input costs moderated and decorative demand improved. The market is watching whether margin recovery can hold against competitive pressure in paints.",
    timeAgo: "4 hours ago",
    sources: [
      { name: "CNBC TV18", domain: "cnbctv18.com", url: "https://www.cnbctv18.com" },
      { name: "BSE", domain: "bseindia.com", url: "https://www.bseindia.com" },
    ],
    aiQuery:
      "Explain Berger Paints Q4 FY26 profit growth. Cover volume growth, margin recovery, input costs, competitive pressure, and what investors should watch next.",
    answer: {
      shortAnswer:
        "Berger Paints' profit growth points to margin recovery, but investors still need evidence that volume growth can withstand competitive intensity.",
      lead:
        "Paint companies are being judged on both demand and margin quality. A strong profit print helps sentiment, but the market will look for sustained volume growth and pricing discipline before rewarding the move fully.",
      sections: [
        {
          title: "Result Read",
          body:
            "The profit jump suggests lower input-cost pressure and better operating leverage. If decorative demand stays healthy, margin recovery can support earnings upgrades.",
          citations: ["CNBC TV18", "BSE"],
        },
        {
          title: "What To Watch Next",
          body:
            "Watch volume growth, dealer commentary, raw material inflation, ad spending, and competitive pricing from larger and newer paint players.",
        },
      ],
    },
    tone: "positive",
  },
  {
    id: "dixon-q4-profit-slump",
    title: "Dixon Technologies Q4 FY26: Net Profit Slumps 36% YoY",
    summary:
      "Dixon Technologies' quarterly profit decline put electronics manufacturing margins back under scrutiny. Investors are watching order book quality, segment mix, and whether operating leverage improves next quarter.",
    timeAgo: "5 hours ago",
    sources: [
      { name: "Economic Times", domain: "economictimes.indiatimes.com", url: "https://economictimes.indiatimes.com" },
      { name: "NSE", domain: "nseindia.com", url: "https://www.nseindia.com" },
    ],
    aiQuery:
      "Explain Dixon Technologies Q4 FY26 profit decline. Cover EMS margins, order book quality, segment mix, operating leverage, and what investors should watch next.",
    answer: {
      shortAnswer:
        "Dixon's profit decline raises questions about mix and margin quality, even if the longer-term electronics manufacturing story remains intact.",
      lead:
        "EMS stocks can trade at premium valuations when growth visibility is high. A profit miss forces investors to separate revenue momentum from margin conversion and assess whether the weakness is temporary or structural.",
      sections: [
        {
          title: "Result Read",
          body:
            "The decline suggests that revenue growth did not translate cleanly into profit. Segment mix, component costs, and execution timing can all affect operating leverage in EMS businesses.",
          citations: ["Economic Times", "NSE"],
        },
        {
          title: "What To Watch Next",
          body:
            "Watch management commentary on order book conversion, mobile and consumer electronics mix, margin guidance, and working-capital movement.",
        },
      ],
    },
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
    points: [22, 21, 23, 22, 25, 27, 26, 29, 32, 35, 34, 38, 41, 43, 42, 45, 49, 52, 51, 54],
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
    points: [24, 25, 24, 27, 28, 27, 31, 33, 32, 36, 38, 37, 40, 43, 45, 44, 47, 50, 49, 52],
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
    points: [18, 19, 18, 20, 19, 21, 23, 22, 24, 25, 27, 26, 29, 31, 30, 33, 34, 36, 35, 38],
  },
];

export const EARNINGS_DAYS: EarningsDay[] = [
  { day: "Mon", date: "May 4", calls: 25, totalResults: 42, highImpact: 4, portfolioWatchlist: 3, reported: 14, upcoming: 28, intensity: 62 },
  { day: "Tue", date: "May 5", calls: 19, totalResults: 37, highImpact: 3, portfolioWatchlist: 4, reported: 18, upcoming: 19, intensity: 55 },
  { day: "Wed", date: "May 6", calls: 21, totalResults: 46, highImpact: 5, portfolioWatchlist: 6, reported: 22, upcoming: 24, intensity: 78, active: true },
  { day: "Thu", date: "May 7", calls: 29, totalResults: 58, highImpact: 7, portfolioWatchlist: 5, reported: 16, upcoming: 42, intensity: 86 },
  { day: "Fri", date: "May 8", calls: 36, totalResults: 63, highImpact: 6, portfolioWatchlist: 7, reported: 20, upcoming: 43, intensity: 92 },
  { day: "Mon", date: "May 11", calls: 18, totalResults: 34, highImpact: 3, portfolioWatchlist: 4, reported: 8, upcoming: 26, intensity: 48 },
];

export const EARNINGS_EVENTS: EarningsEvent[] = [
  {
    id: "reliance-q4",
    company: "Reliance Industries",
    ticker: "RELIANCE",
    exchange: "NSE",
    sector: "Energy / Consumer",
    dateLabel: "Today",
    dateGroup: "Today",
    time: "4:00 PM IST",
    callTime: "6:00 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "High impact",
    portfolioRelevance: "High portfolio overlap",
    watchlistRelevance: "Tracked energy bellwether",
    estimate: "PAT +8.4% YoY",
    revenueGrowth: 7.8,
    profitGrowth: 8.4,
    expectedMove: "+/-2.4%",
    thesis: "A cleaner O2C print can offset concern around retail margin normalization.",
    whyItMatters: "Reliance can move portfolio returns through crude, refining, retail, and Jio commentary at the same time.",
    watchFor: "Refining spread, retail margin, and Jio ARPU.",
    streetFocus: "O2C EBITDA, retail margin bridge, Jio ARPU, net debt.",
    readThrough: "OMCs, telecom ARPU names, broad index heavyweights.",
    evidenceLabel: "Desk setup",
    sourceStatus: "Desk context",
    tags: ["Portfolio", "Watchlist", "Index weight"],
    consensusMetrics: [
      { label: "O2C EBITDA", value: "+5.8% YoY", tone: "positive" },
      { label: "Retail margin", value: "flat QoQ", tone: "neutral" },
      { label: "Jio ARPU", value: "INR 184", tone: "positive" },
    ],
    notes: ["Refining spread and retail commentary are the key swing factors.", "Jio ARPU and subscriber quality remain the cleaner read-through."],
  },
  {
    id: "tcs-q4",
    company: "Tata Consultancy Services",
    ticker: "TCS",
    exchange: "NSE",
    sector: "IT Services",
    dateLabel: "Thu",
    dateGroup: "This Week",
    time: "6:30 PM IST",
    callTime: "7:30 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "High impact",
    portfolioRelevance: "Portfolio IT exposure",
    watchlistRelevance: "Sector bellwether",
    estimate: "EPS 2.8% above consensus",
    revenueGrowth: 5.6,
    profitGrowth: 7.2,
    expectedMove: "+/-1.9%",
    thesis: "The result needs stronger order commentary to overcome cautious US discretionary spending.",
    whyItMatters: "TCS sets the demand tone for Indian IT and helps confirm whether currency support is enough.",
    watchFor: "Order book, BFSI demand, and margin guidance.",
    streetFocus: "Large deals, BFSI run-rate, attrition, margin band.",
    readThrough: "Infosys, HCL Tech, Wipro, midcap IT.",
    evidenceLabel: "Consensus setup",
    sourceStatus: "Consensus context",
    tags: ["IT demand", "Portfolio", "Bellwether"],
    consensusMetrics: [
      { label: "CC growth", value: "+1.1% QoQ", tone: "neutral" },
      { label: "EBIT margin", value: "25.1%", tone: "positive" },
      { label: "Deal TCV", value: "INR 820B", tone: "neutral" },
    ],
    notes: ["Watch order book, BFSI demand, and margin guidance.", "Rupee softness can help reported margins if demand holds."],
  },
  {
    id: "hdfc-bank-q4",
    company: "HDFC Bank",
    ticker: "HDFCBANK",
    exchange: "NSE",
    sector: "Private Banks",
    dateLabel: "Next Mon",
    dateGroup: "Next Week",
    time: "3:30 PM IST",
    callTime: "5:00 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "High impact",
    portfolioRelevance: "Core bank holding",
    watchlistRelevance: "Bank Nifty confirmation",
    estimate: "NIM stabilisation",
    revenueGrowth: 11.4,
    profitGrowth: 9.2,
    expectedMove: "+/-2.0%",
    thesis: "Deposit-cost commentary decides whether private-bank leadership can broaden.",
    whyItMatters: "HDFC Bank can confirm whether bank leadership is durable or only index-heavy.",
    watchFor: "Deposit growth, NIM stability, and asset quality.",
    streetFocus: "CASA share, credit growth, merged-book margin, slippages.",
    readThrough: "ICICI Bank, SBI, Bank Nifty breadth.",
    evidenceLabel: "Bank setup",
    sourceStatus: "Desk context",
    tags: ["Banks", "Portfolio", "Next week"],
    consensusMetrics: [
      { label: "NIM", value: "3.55%", tone: "neutral" },
      { label: "Credit growth", value: "+13% YoY", tone: "positive" },
      { label: "GNPA", value: "1.2%", tone: "positive" },
    ],
    notes: ["Deposit growth and net interest margin are the key investor questions.", "Asset quality is expected to remain stable."],
  },
  {
    id: "infosys-today",
    company: "Infosys",
    ticker: "INFY",
    exchange: "NSE",
    sector: "IT Services",
    dateLabel: "Today",
    dateGroup: "Today",
    time: "5:00 PM IST",
    callTime: "6:15 PM IST",
    quarter: "Q4 FY26",
    status: "Reported",
    impact: "Medium impact",
    portfolioRelevance: "Portfolio IT exposure",
    watchlistRelevance: "Guidance watch",
    estimate: "EPS 4.28",
    actual: "EPS 5.03",
    surprise: 17.5,
    revenueGrowth: 6.4,
    profitGrowth: 8.1,
    expectedMove: "+/-2.1%",
    actualMove: 1.35,
    thesis: "The beat was useful, but cautious guidance keeps the upgrade path selective.",
    whyItMatters: "Infosys is the cleaner check on whether deal wins can offset cautious guidance.",
    watchFor: "BFSI spending recovery and large deal conversion.",
    streetFocus: "FY27 growth band, BFSI budgets, margin bridge.",
    readThrough: "TCS setup, midcap IT demand, rupee-sensitive exporters.",
    evidenceLabel: "Reported result",
    sourceStatus: "Filed result",
    tags: ["Reported today", "IT", "Portfolio"],
    consensusMetrics: [
      { label: "EPS", value: "5.03", tone: "positive" },
      { label: "Revenue YoY", value: "+6.4%", tone: "positive" },
      { label: "Guidance", value: "cautious", tone: "neutral" },
    ],
    resultSnapshot: {
      result: "Beat",
      revenueYoY: "+6.4%",
      patYoY: "+8.1%",
      margin: "+40 bps",
      priceReaction: 1.35,
      readThrough: "Deal wins improved, but discretionary US demand still needs confirmation.",
    },
    notes: ["Guidance remained cautious but deal wins improved sequentially.", "The stock reaction depends on whether BFSI spending recovery broadens."],
  },
  {
    id: "icici-bank-q4",
    company: "ICICI Bank",
    ticker: "ICICIBANK",
    exchange: "NSE",
    sector: "Private Banks",
    dateLabel: "Fri",
    dateGroup: "This Week",
    time: "3:45 PM IST",
    callTime: "5:30 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "High impact",
    portfolioRelevance: "Private-bank concentration",
    watchlistRelevance: "Tracked bank leader",
    estimate: "PAT +10.6% YoY",
    revenueGrowth: 12.1,
    profitGrowth: 10.6,
    expectedMove: "+/-1.8%",
    thesis: "A stable NIM and benign credit cost would keep the bank leadership trade intact.",
    whyItMatters: "ICICI Bank is the market's cleaner private-bank quality check after HDFC Bank.",
    watchFor: "Deposit pricing, loan mix, credit cost, and unsecured asset quality.",
    streetFocus: "NIM, retail growth, provisions, branch productivity.",
    readThrough: "HDFC Bank, Axis Bank, Bank Nifty leadership.",
    evidenceLabel: "Bank setup",
    sourceStatus: "Desk context",
    tags: ["Banks", "Watchlist", "Concentration"],
    consensusMetrics: [
      { label: "NIM", value: "4.25%", tone: "positive" },
      { label: "Credit cost", value: "54 bps", tone: "positive" },
      { label: "PAT YoY", value: "+10.6%", tone: "positive" },
    ],
    notes: ["NIM delivery and credit cost can confirm private-bank leadership.", "Unsecured book commentary is the main risk check."],
  },
  {
    id: "sbi-q4",
    company: "State Bank of India",
    ticker: "SBIN",
    exchange: "NSE",
    sector: "Public Banks",
    dateLabel: "Fri",
    dateGroup: "This Week",
    time: "2:30 PM IST",
    callTime: "4:30 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "Medium impact",
    portfolioRelevance: "Bank sector read-through",
    watchlistRelevance: "PSU bank breadth",
    estimate: "PAT +6.0% YoY",
    revenueGrowth: 8.8,
    profitGrowth: 6.0,
    expectedMove: "+/-2.2%",
    thesis: "Credit cost and treasury gains decide whether PSU-bank beta extends.",
    whyItMatters: "SBI can shift the read from private-bank quality to broader banking risk appetite.",
    watchFor: "Slippages, deposit growth, treasury income, loan growth.",
    streetFocus: "NII growth, provisions, CASA mix, corporate book.",
    readThrough: "PSU banks, credit cycle beta, domestic cyclicals.",
    evidenceLabel: "Bank setup",
    sourceStatus: "Desk context",
    tags: ["Banks", "PSU beta", "This week"],
    consensusMetrics: [
      { label: "NII", value: "+8.8% YoY", tone: "positive" },
      { label: "GNPA", value: "2.3%", tone: "neutral" },
      { label: "Treasury", value: "watch", tone: "neutral" },
    ],
    notes: ["Treasury income can flatter the print.", "Asset quality commentary matters more than headline profit."],
  },
  {
    id: "maruti-q4",
    company: "Maruti Suzuki",
    ticker: "MARUTI",
    exchange: "NSE",
    sector: "Auto",
    dateLabel: "Thu",
    dateGroup: "This Week",
    time: "1:45 PM IST",
    callTime: "4:00 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "High impact",
    portfolioRelevance: "Auto-cycle read",
    watchlistRelevance: "High-impact auto setup",
    estimate: "PAT +15.0% YoY",
    revenueGrowth: 13.2,
    profitGrowth: 15.0,
    expectedMove: "+/-2.7%",
    thesis: "Premium mix and commodity relief need to offset softer small-car demand.",
    whyItMatters: "Maruti is the clearest read on domestic auto demand, premiumization, and rural recovery.",
    watchFor: "Volume mix, commodity costs, discounting, and EV commentary.",
    streetFocus: "UV mix, realization, raw material costs, export commentary.",
    readThrough: "Auto ancillaries, Tata Motors domestic PV, two-wheeler demand.",
    evidenceLabel: "Auto setup",
    sourceStatus: "Desk context",
    tags: ["Auto", "Watchlist", "High impact"],
    consensusMetrics: [
      { label: "Volume", value: "+7.6% YoY", tone: "positive" },
      { label: "EBITDA margin", value: "12.4%", tone: "positive" },
      { label: "Discounts", value: "rising", tone: "negative" },
    ],
    notes: ["Volume mix, commodity costs, and EV commentary are the swing variables.", "UV demand must stay firm for the premium valuation to hold."],
  },
  {
    id: "bharti-airtel-q4",
    company: "Bharti Airtel",
    ticker: "BHARTIARTL",
    exchange: "NSE",
    sector: "Telecom",
    dateLabel: "Fri",
    dateGroup: "This Week",
    time: "6:00 PM IST",
    callTime: "7:00 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "Medium impact",
    portfolioRelevance: "Defensive growth read",
    watchlistRelevance: "Tracked telecom leader",
    estimate: "ARPU +3.5% QoQ",
    revenueGrowth: 10.4,
    profitGrowth: 12.8,
    expectedMove: "+/-1.7%",
    thesis: "ARPU resilience can keep the telecom upgrade cycle alive.",
    whyItMatters: "Airtel connects defensive earnings growth with tariff and subscriber-quality expectations.",
    watchFor: "ARPU, churn, 5G capex, tariff action signals.",
    streetFocus: "India mobile ARPU, Africa margins, capex intensity.",
    readThrough: "Telecom towers, digital infrastructure, consumer defensives.",
    evidenceLabel: "Telecom setup",
    sourceStatus: "Desk context",
    tags: ["Telecom", "Watchlist", "ARPU"],
    consensusMetrics: [
      { label: "ARPU", value: "INR 218", tone: "positive" },
      { label: "Churn", value: "stable", tone: "neutral" },
      { label: "EBITDA", value: "+11.2% YoY", tone: "positive" },
    ],
    notes: ["ARPU and tariff language matter more than headline revenue.", "Capex commentary can affect free-cash-flow expectations."],
  },
  {
    id: "lt-q4",
    company: "Larsen & Toubro",
    ticker: "LT",
    exchange: "NSE",
    sector: "Capital Goods",
    dateLabel: "Next Tue",
    dateGroup: "Next Week",
    time: "5:15 PM IST",
    callTime: "6:30 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "Medium impact",
    portfolioRelevance: "Capex cycle exposure",
    watchlistRelevance: "Industrial order watch",
    estimate: "Order inflow +12% YoY",
    revenueGrowth: 14.8,
    profitGrowth: 12.2,
    expectedMove: "+/-1.6%",
    thesis: "Execution quality needs to validate the long-cycle capex trade.",
    whyItMatters: "L&T is the key listed proxy for domestic capex, infrastructure, and industrial execution.",
    watchFor: "Order inflow, core margins, working capital, Middle East exposure.",
    streetFocus: "Core E&C margin, order book, hydrocarbon orders.",
    readThrough: "Capital goods, cement demand, infra lenders.",
    evidenceLabel: "Capex setup",
    sourceStatus: "Desk context",
    tags: ["Capex", "Next week", "Industrials"],
    consensusMetrics: [
      { label: "Order inflow", value: "+12% YoY", tone: "positive" },
      { label: "Core margin", value: "8.9%", tone: "neutral" },
      { label: "Working cap", value: "watch", tone: "neutral" },
    ],
    notes: ["Order inflow quality matters more than headline backlog.", "Middle East execution and working capital are the risk checks."],
  },
  {
    id: "tatamotors-recent",
    company: "Tata Motors",
    ticker: "TATAMOTORS",
    exchange: "NSE",
    sector: "Auto / Exports",
    dateLabel: "Apr 30",
    dateGroup: "Recent",
    time: "4:30 PM IST",
    callTime: "5:45 PM IST",
    quarter: "Q4 FY26",
    status: "Reported",
    impact: "High impact",
    portfolioRelevance: "Momentum holding",
    watchlistRelevance: "Tracked auto leader",
    estimate: "PAT +12.0% YoY",
    actual: "PAT +18.6% YoY",
    surprise: 6.6,
    revenueGrowth: 14.2,
    profitGrowth: 18.6,
    expectedMove: "+/-3.0%",
    actualMove: 2.25,
    thesis: "JLR margin strength kept the momentum case alive, but export sensitivity remains high.",
    whyItMatters: "Tata Motors is a major upside contributor, but the read depends on JLR margins holding.",
    watchFor: "JLR margin, EV volume, and commodity cost pressure.",
    streetFocus: "JLR EBIT margin, domestic PV demand, EV profitability.",
    readThrough: "Auto exporters, EV supply chain, premium discretionary demand.",
    evidenceLabel: "Reported result",
    sourceStatus: "Filed result",
    tags: ["Reported", "Auto", "Momentum"],
    consensusMetrics: [
      { label: "JLR margin", value: "8.9%", tone: "positive" },
      { label: "PAT YoY", value: "+18.6%", tone: "positive" },
      { label: "EV commentary", value: "better", tone: "positive" },
    ],
    resultSnapshot: {
      result: "Beat",
      revenueYoY: "+14.2%",
      patYoY: "+18.6%",
      margin: "+90 bps",
      priceReaction: 2.25,
      readThrough: "JLR strength supports the auto momentum basket, but export demand remains the swing factor.",
    },
    notes: ["JLR margins were stronger than expected.", "EV commentary improved, but export sensitivity remains high."],
  },
  {
    id: "hul-q4",
    company: "Hindustan Unilever",
    ticker: "HINDUNILVR",
    exchange: "NSE",
    sector: "FMCG",
    dateLabel: "Next Wed",
    dateGroup: "Next Week",
    time: "4:00 PM IST",
    callTime: "5:30 PM IST",
    quarter: "Q4 FY26",
    status: "Upcoming",
    impact: "Medium impact",
    portfolioRelevance: "Consumer defensive read",
    watchlistRelevance: "Staples margin watch",
    estimate: "Volume +4.0% YoY",
    revenueGrowth: 5.8,
    profitGrowth: 6.2,
    expectedMove: "+/-1.4%",
    thesis: "Rural volume recovery must show up before staples can regain leadership.",
    whyItMatters: "HUL tests whether FMCG defensives can move from margin support back to volume-led growth.",
    watchFor: "Rural demand, premium mix, ad spend, raw material benefits.",
    streetFocus: "Underlying volume growth, gross margin, category pricing.",
    readThrough: "FMCG, rural consumption, paint and discretionary demand.",
    evidenceLabel: "Staples setup",
    sourceStatus: "Desk context",
    tags: ["FMCG", "Next week", "Defensive"],
    consensusMetrics: [
      { label: "UVG", value: "+4.0%", tone: "neutral" },
      { label: "Gross margin", value: "+70 bps", tone: "positive" },
      { label: "Ad spend", value: "rising", tone: "neutral" },
    ],
    notes: ["Rural volume and premium mix decide the quality of the print.", "Margin recovery alone may not be enough for a rerating."],
  },
  {
    id: "sunpharma-q4",
    company: "Sun Pharmaceutical Industries",
    ticker: "SUNPHARMA",
    exchange: "NSE",
    sector: "Pharma",
    dateLabel: "Thu",
    dateGroup: "This Week",
    time: "4:45 PM IST",
    callTime: "6:00 PM IST",
    quarter: "Q4 FY26",
    status: "Reported",
    impact: "Medium impact",
    portfolioRelevance: "Healthcare read-through",
    watchlistRelevance: "US pharma risk check",
    estimate: "PAT +9.5% YoY",
    actual: "PAT +7.4% YoY",
    surprise: -2.1,
    revenueGrowth: 8.9,
    profitGrowth: 7.4,
    expectedMove: "+/-1.8%",
    actualMove: -0.85,
    thesis: "Specialty growth remains intact, but US generics pricing pressure limits the clean upside read.",
    whyItMatters: "Sun Pharma is the healthcare quality check for specialty pharma versus US generics pressure.",
    watchFor: "US generics pricing, specialty sales, remediation costs, and margin recovery.",
    streetFocus: "Specialty ramp, US generics erosion, R&D intensity.",
    readThrough: "Dr Reddy's, Cipla, pharma margins, healthcare defensives.",
    evidenceLabel: "Reported result",
    sourceStatus: "Filed result",
    tags: ["Pharma", "Reported", "US generics"],
    consensusMetrics: [
      { label: "Specialty", value: "+13% YoY", tone: "positive" },
      { label: "PAT YoY", value: "+7.4%", tone: "neutral" },
      { label: "US generics", value: "pressure", tone: "negative" },
    ],
    resultSnapshot: {
      result: "Mixed",
      revenueYoY: "+8.9%",
      patYoY: "+7.4%",
      margin: "-30 bps",
      priceReaction: -0.85,
      readThrough: "Specialty growth helps, but US generics pricing keeps the sector read selective.",
    },
    notes: ["US generics pricing kept the result from becoming a clean beat.", "Specialty sales are still the positive offset."],
  },
];

export const EARNINGS_THEMES: EarningsTheme[] = [
  {
    id: "bank-margin-cost",
    title: "Bank margins versus deposit cost",
    summary: "Private banks need NIM stability and clean slippage commentary to keep Bank Nifty leadership credible.",
    sectors: ["Private Banks", "Public Banks"],
    tickers: ["HDFCBANK", "ICICIBANK", "SBIN"],
    tone: "positive",
  },
  {
    id: "it-demand-bfsi",
    title: "IT demand and BFSI budgets",
    summary: "TCS and Infosys need order conversion, not just rupee help, to revive a broader IT trade.",
    sectors: ["IT Services"],
    tickers: ["TCS", "INFY"],
    tone: "neutral",
  },
  {
    id: "auto-mix-margin",
    title: "Auto mix and margin durability",
    summary: "Maruti and Tata Motors are testing whether premium mix, JLR margins, and commodity relief can coexist.",
    sectors: ["Auto"],
    tickers: ["MARUTI", "TATAMOTORS"],
    tone: "positive",
  },
  {
    id: "defensive-quality",
    title: "Defensive quality under scrutiny",
    summary: "HUL, Sun Pharma, and Airtel need volume, specialty, and ARPU evidence rather than defensive status alone.",
    sectors: ["FMCG", "Pharma", "Telecom"],
    tickers: ["HINDUNILVR", "SUNPHARMA", "BHARTIARTL"],
    tone: "neutral",
  },
];

export const EARNINGS_FORCE_NAMES: EarningsForceName[] = [
  {
    ticker: "TATAMOTORS",
    company: "Tata Motors",
    exchange: "NSE",
    price: 1016.4,
    move: 2.25,
    expectedMove: "+/-3.0%",
    volume: "14.8M",
    reason: "Post-result momentum stayed firm after the JLR margin beat.",
    points: [22, 24, 23, 27, 31, 30, 34, 38, 42, 45, 47, 50],
  },
  {
    ticker: "ICICIBANK",
    company: "ICICI Bank",
    exchange: "NSE",
    price: 1194.8,
    move: 1.86,
    expectedMove: "+/-1.8%",
    volume: "9.2M",
    reason: "Bank leadership is being priced ahead of margin and credit-cost commentary.",
    points: [28, 29, 31, 30, 33, 36, 35, 38, 41, 43, 46, 48],
  },
  {
    ticker: "MARUTI",
    company: "Maruti Suzuki",
    exchange: "NSE",
    price: 12780.5,
    move: 1.12,
    expectedMove: "+/-2.7%",
    volume: "1.1M",
    reason: "Options imply demand for a cleaner volume-mix and commodity-cost result.",
    points: [35, 34, 36, 37, 39, 38, 40, 42, 41, 44, 46, 49],
  },
  {
    ticker: "SUNPHARMA",
    company: "Sun Pharmaceutical",
    exchange: "NSE",
    price: 1634.2,
    move: -0.85,
    expectedMove: "+/-1.8%",
    volume: "3.6M",
    reason: "Mixed specialty strength versus US generics pressure keeps positioning selective.",
    points: [44, 43, 45, 42, 41, 39, 40, 38, 37, 36, 35, 34],
  },
];

export const SCREENER_PRESETS = [
  "All",
  "Quality compounders",
  "Value opportunities",
  "Momentum leaders",
  "Low debt",
  "High ROE",
  "Large-cap safety",
  "Earnings momentum",
  "Dividend",
] as const;

export const SCREENER_ROWS: ScreenerRow[] = getScreenerRows(50);

export const SCREENER_ROW_CONTEXT: Record<string, ScreenerRowContext> = {
  RELIANCE: {
    reason: "Large-cap energy and consumer exposure with crude sensitivity now visible.",
    riskNote: "O2C margins and crude volatility can offset Jio and retail strength.",
    nextCatalyst: "Q4 commentary on refining spread, retail margins, and Jio ARPU.",
    themeTags: ["Large-cap", "Crude sensitivity", "Consumer scale"],
  },
  TCS: {
    reason: "High ROE, low debt, and dividend support, but momentum is not yet strong.",
    riskNote: "US discretionary tech spending and BFSI demand remain the swing factors.",
    nextCatalyst: "Order book and margin guidance in Q4 commentary.",
    themeTags: ["Quality", "Low debt", "Dividend"],
  },
  HDFCBANK: {
    reason: "Large-cap bank with improving NIM stabilisation and low balance-sheet risk.",
    riskNote: "Adds to private-bank concentration if paired with ICICI Bank.",
    nextCatalyst: "Deposit growth and net interest margin trend.",
    themeTags: ["Large-cap", "Financials", "Safety"],
  },
  ICICIBANK: {
    reason: "Bank leadership, positive 1M momentum, and improving profitability.",
    riskNote: "The stock is highly tied to the private-bank cycle.",
    nextCatalyst: "Credit growth, deposit cost, and asset-quality commentary.",
    themeTags: ["Momentum", "Financials", "Quality"],
  },
  INFY: {
    reason: "Low debt and high ROE, but weak 1M and 1Y price trend.",
    riskNote: "Guidance risk remains until US demand broadens beyond currency support.",
    nextCatalyst: "Deal wins and BFSI recovery commentary.",
    themeTags: ["Quality", "Dividend", "IT demand"],
  },
  LT: {
    reason: "Capex-linked growth, healthy profit expansion, and strong 1Y trend.",
    riskNote: "Execution and order conversion matter more than broad market beta.",
    nextCatalyst: "Order inflow and margin delivery.",
    themeTags: ["Capex", "Momentum", "Industrials"],
  },
  TATAMOTORS: {
    reason: "Strong 1M/1Y momentum with earnings acceleration after JLR margin strength.",
    riskNote: "Higher beta from exports, commodity costs, and EV demand expectations.",
    nextCatalyst: "JLR margin, domestic PV volume, and EV commentary.",
    themeTags: ["Momentum", "Auto", "Earnings momentum"],
  },
  BHARTIARTL: {
    reason: "Strong 1Y trend and earnings growth tied to ARPU upgrades.",
    riskNote: "Debt and valuation make tariff execution important.",
    nextCatalyst: "ARPU, tariff action, and subscriber quality.",
    themeTags: ["Telecom", "Momentum", "Earnings growth"],
  },
  ASIANPAINT: {
    reason: "High ROE and low debt, but valuation remains premium versus growth.",
    riskNote: "Margin pressure and weak 1Y trend reduce near-term urgency.",
    nextCatalyst: "Volume growth and raw-material margin commentary.",
    themeTags: ["Quality", "Low debt", "Consumer"],
  },
  ZOMATO: {
    reason: "Strong price momentum and rapid profit growth from a high-growth internet name.",
    riskNote: "Valuation is stretched and can reprice quickly if margins disappoint.",
    nextCatalyst: "Quick-commerce margin and order-frequency update.",
    themeTags: ["Momentum", "Consumer internet", "High growth"],
  },
  ADANIGREEN: {
    reason: "High growth and utilities theme exposure, but leverage is elevated.",
    riskNote: "Debt/equity is high, so financing cost and execution risk matter.",
    nextCatalyst: "Capacity addition, debt refinancing, and tariff visibility.",
    themeTags: ["Renewables", "High growth", "Leverage risk"],
  },
};

const WATCHLIST_NOTES: Record<string, string> = {
  INFY: "Watch guidance tone and BFSI demand.",
  ICICIBANK: "Leadership name for Bank Nifty confirmation.",
  RELIANCE: "Track crude, refining spread, and Jio commentary.",
  TATAMOTORS: "Momentum name; confirm JLR margin trend.",
  BHARTIARTL: "ARPU and tariff action remain the main catalysts.",
  ZOMATO: "High momentum; watch quick-commerce margins.",
};

const WATCHLIST_ALERT_TICKERS = new Set(["INFY", "RELIANCE", "ZOMATO"]);

const roundWorkspaceMetric = (value: number) => Number(value.toFixed(2));

export const WATCHLIST_ITEMS: WatchlistItem[] = getWatchlistItems().map((stock) => ({
  ticker: stock.ticker,
  name: stock.name,
  exchange: stock.exchange,
  sector: stock.sector,
  price: stock.price,
  oneDay: stock.changePercent,
  fiveDay: roundWorkspaceMetric(stock.changePercent * 1.65 + stock.oneMonth * 0.16),
  oneMonth: stock.oneMonth,
  sixMonth: roundWorkspaceMetric(stock.oneYear * 0.46 + stock.oneMonth * 0.82),
  ytd: roundWorkspaceMetric(stock.oneYear * 0.36 + stock.oneMonth * 0.42),
  alert: WATCHLIST_ALERT_TICKERS.has(stock.ticker),
  note: WATCHLIST_NOTES[stock.ticker] ?? `${stock.sector} constituent in the NIFTY 50 universe.`,
  points: stock.sparkline,
}));

export const WATCHLIST_ITEM_CONTEXT: Record<string, WatchlistItemContext> = {
  INFY: {
    reasonWatched: "Quality IT name, but guidance risk keeps it on watch.",
    alertReason: "Alert when guidance tone or BFSI demand changes.",
    riskCluster: "IT demand",
    latestSignal: "Deal wins improved, but discretionary spending remains selective.",
    relatedEarnings: "Recent result already reported; guidance follow-through is the next check.",
  },
  ICICIBANK: {
    reasonWatched: "Leadership name for confirming private-bank breadth.",
    alertReason: "Alert if Bank Nifty leadership narrows or deposit costs rise.",
    riskCluster: "Private banks",
    latestSignal: "Outperformed broader financials as credit growth steadied.",
    relatedEarnings: "Bank commentary matters for the full financials sleeve.",
  },
  RELIANCE: {
    reasonWatched: "Portfolio drag and macro swing name tied to crude and consumer scale.",
    alertReason: "Alert around O2C margins, crude moves, and Jio ARPU commentary.",
    riskCluster: "Crude / O2C",
    latestSignal: "Crude relief helps India, but refining spread visibility is uneven.",
    relatedEarnings: "Reports today; refining and retail commentary are high impact.",
  },
  TATAMOTORS: {
    reasonWatched: "Momentum leader with higher-beta JLR and EV exposure.",
    alertReason: "Alert if JLR margin or export-demand commentary weakens.",
    riskCluster: "Auto exports",
    latestSignal: "Strong recent result kept momentum intact.",
    relatedEarnings: "Recent JLR margin surprise still drives the stock read.",
  },
  BHARTIARTL: {
    reasonWatched: "Telecom ARPU upgrade cycle and defensive growth exposure.",
    alertReason: "Alert on tariff action, ARPU changes, or regulatory pressure.",
    riskCluster: "Telecom ARPU",
    latestSignal: "Telecom names firmed as upgrade-cycle confidence improved.",
    relatedEarnings: "Watch sector commentary more than a single event.",
  },
  ZOMATO: {
    reasonWatched: "High-momentum consumer internet name with quick-commerce upside.",
    alertReason: "Alert if quick-commerce margins or valuation sentiment turn.",
    riskCluster: "High-growth valuation",
    latestSignal: "Momentum extended on quick-commerce margin optimism.",
    relatedEarnings: "Margins and order frequency are the next useful checks.",
  },
};

export const EARNINGS_EVENT_CONTEXT: Record<string, EarningsEventContext> = {
  "reliance-q4": {
    importance: "High impact",
    relevance: ["Portfolio relevant", "Watchlist relevant", "Sector bellwether"],
    theme: "Energy / consumer",
    whyItMatters: "Reliance can move portfolio returns through crude, retail, and Jio commentary at the same time.",
    watchFor: "Refining spread, retail margin, and Jio ARPU.",
  },
  "tcs-q4": {
    importance: "High impact",
    relevance: ["Portfolio relevant", "Sector bellwether"],
    theme: "IT services",
    whyItMatters: "TCS sets the demand tone for Indian IT and helps confirm whether currency support is enough.",
    watchFor: "Order book, BFSI demand, and margin guidance.",
  },
  "hdfc-bank-q4": {
    importance: "High impact",
    relevance: ["Portfolio relevant", "Sector bellwether"],
    theme: "Private banks",
    whyItMatters: "HDFC Bank can confirm whether bank leadership is durable or only index-heavy.",
    watchFor: "Deposit growth, NIM stability, and asset quality.",
  },
  "infosys-today": {
    importance: "Medium impact",
    relevance: ["Portfolio relevant", "Watchlist relevant"],
    theme: "IT services",
    whyItMatters: "Infosys is the cleaner check on whether deal wins can offset cautious guidance.",
    watchFor: "BFSI spending recovery and large deal conversion.",
  },
  "icici-bank-q4": {
    importance: "High impact",
    relevance: ["Portfolio relevant", "Watchlist relevant", "Bank leadership"],
    theme: "Private banks",
    whyItMatters: "ICICI Bank is the cleanest check on whether private-bank leadership can broaden.",
    watchFor: "Deposit pricing, credit cost, and unsecured asset quality.",
  },
  "sbi-q4": {
    importance: "Medium impact",
    relevance: ["Sector relevant", "Bank breadth"],
    theme: "Public banks",
    whyItMatters: "SBI can shift the read from private-bank quality toward broader banking beta.",
    watchFor: "Slippages, treasury income, and deposit growth.",
  },
  "maruti-q4": {
    importance: "High impact",
    relevance: ["Watchlist relevant", "Sector bellwether", "Auto demand"],
    theme: "Auto",
    whyItMatters: "Maruti is the direct read on domestic auto demand, premiumization, and rural recovery.",
    watchFor: "Volume mix, commodity costs, discounts, and EV commentary.",
  },
  "bharti-airtel-q4": {
    importance: "Medium impact",
    relevance: ["Watchlist relevant", "Defensive growth"],
    theme: "Telecom",
    whyItMatters: "Airtel ties defensive earnings growth to tariff and subscriber-quality expectations.",
    watchFor: "ARPU, churn, capex, and tariff language.",
  },
  "lt-q4": {
    importance: "Medium impact",
    relevance: ["Capex cycle", "Industrial read-through"],
    theme: "Capital goods",
    whyItMatters: "L&T is the key listed proxy for domestic capex and infrastructure execution.",
    watchFor: "Order inflow, core margins, working capital, and Middle East exposure.",
  },
  "tatamotors-recent": {
    importance: "High impact",
    relevance: ["Portfolio relevant", "Watchlist relevant"],
    theme: "Auto / exports",
    whyItMatters: "Tata Motors is a major upside contributor, but the read depends on JLR margins holding.",
    watchFor: "JLR margin, EV volume, and commodity cost pressure.",
  },
  "hul-q4": {
    importance: "Medium impact",
    relevance: ["Consumer defensive", "Next week"],
    theme: "FMCG",
    whyItMatters: "HUL tests whether FMCG defensives can move from margin support back to volume-led growth.",
    watchFor: "Rural demand, premium mix, ad spend, and raw material benefits.",
  },
  "sunpharma-q4": {
    importance: "Medium impact",
    relevance: ["Healthcare read-through", "Watchlist relevant"],
    theme: "Pharma",
    whyItMatters: "Sun Pharma is the healthcare quality check for specialty pharma versus US generics pressure.",
    watchFor: "US generics pricing, specialty sales, remediation costs, and margin recovery.",
  },
};

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
