import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getBootstrapData } from "./api";
import globeTextureUrl from "./assets/globe-premium-dark.svg";
import { MarketTape } from "./features/market-tape/MarketTape";
import { GLOBAL_MARKET_TAPE } from "./features/market-tape/marketTapeData";
import { FundsScreen } from "./funds/FundsScreen";
import { GlobeMonitor } from "./globe-monitor/GlobeMonitor";
import { InsightCompanion } from "./InsightCompanion";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Cpu, Target } from "lucide-react";
import type { BootstrapData, Coordinates, MarketPoint, MarketTapeBasket, PulseAlert, Sector } from "./types";

interface SectorTheme {
  accent: string;
  rgb: string;
  onAccent: string;
}

type ConflictSeverity = "Watch" | "Elevated" | "High" | "Critical";
type LensMode = "global" | "pulse" | "news" | "country" | "sectors";
type DashboardIconKind = "globe" | "pulse" | "news" | "country" | "grid" | "audio" | "settings" | "signal" | "assist";

interface LensRailItem {
  mode: LensMode;
  icon: DashboardIconKind;
  title: string;
  subtitle: string;
}

interface ConflictTransmission {
  label: string;
  lat: number;
  lng: number;
  type: "risk" | "route";
}

interface ConflictDatum {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  severity: ConflictSeverity;
  intensity: string;
  shortDescription: string;
  reportedImpact: string;
  marketChannels: string[];
  latest: string;
  updated: string;
  confidence: string;
  humanitarianImpact: string;
  source: string;
  transmission: ConflictTransmission[];
}

interface NewsSectorLink {
  id: string;
  label: string;
  signal: string;
}

interface GeotaggedNewsItem {
  id: string;
  conflictId: string;
  title: string;
  location: string;
  region: string;
  lat: number;
  lng: number;
  severity: ConflictSeverity;
  time: string;
  source: string;
  summary: string;
  aiInsight: string;
  marketRead: string;
  imageUrl: string;
  sectors: NewsSectorLink[];
}

interface NewsVisualDatum extends GeotaggedNewsItem {
  selected: boolean;
  hovered: boolean;
}

interface ScreenNewsPin extends NewsVisualDatum {
  x: number;
  y: number;
  visible: boolean;
}

type PaneKey = "sectors" | "pulse" | "country";
type AppView = "lens" | "news" | "article" | "funds" | "portfolio";

interface PortfolioHolding {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  price: number;
  value: number;
  allocation: number;
  dayMove: number;
  risk: "Low" | "Medium" | "High";
}

interface PortfolioPerformancePoint {
  label: string;
  value: number;
}

interface PortfolioRecommendationReason {
  icon: "chip" | "risk" | "goal";
  text: string;
  emphasis?: string;
}

interface PortfolioSuggestedPlay {
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

const DEFAULT_COLLAPSED_PANES: Record<PaneKey, boolean> = {
  sectors: false,
  pulse: false,
  country: false,
};

const SECTOR_THEMES: Record<string, SectorTheme> = {
  semiconductors: {
    accent: "#00f5ff",
    rgb: "0, 245, 255",
    onAccent: "#001012",
  },
  hydrocarbons: {
    accent: "#d59652",
    rgb: "213, 150, 82",
    onAccent: "#140b03",
  },
  "critical-minerals": {
    accent: "#a8d9ad",
    rgb: "168, 217, 173",
    onAccent: "#06120d",
  },
};

const FALLBACK_SECTOR_THEME = SECTOR_THEMES.semiconductors;
const STABLE_COLOR = "#9fcdb6";
const AMBER_COLOR = "#c6a66f";
const RISK_COLOR = "#d28d8d";
const API_IMAGE_EARTH = globeTextureUrl;
const MAX_RENDER_PIXEL_RATIO = 2;
const PIN_PROJECTION_INTERVAL_MS = 120;
const PIN_POSITION_EPSILON = 0.75;
const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", shares: 38, price: 875.28, value: 33260.64, allocation: 18.4, dayMove: 1.6, risk: "Medium" },
  { ticker: "TSM", name: "Taiwan Semi", sector: "Foundry", shares: 120, price: 147.62, value: 17714.4, allocation: 9.8, dayMove: -0.7, risk: "High" },
  { ticker: "XOM", name: "Exxon Mobil", sector: "Energy", shares: 155, price: 118.04, value: 18296.2, allocation: 10.1, dayMove: 0.4, risk: "Medium" },
  { ticker: "LMT", name: "Lockheed Martin", sector: "Defense", shares: 28, price: 463.92, value: 12989.76, allocation: 7.2, dayMove: 0.9, risk: "Low" },
  { ticker: "ZIM", name: "ZIM Integrated", sector: "Shipping", shares: 520, price: 21.34, value: 11096.8, allocation: 6.1, dayMove: 2.8, risk: "High" },
  { ticker: "SPY", name: "S&P 500 ETF", sector: "Broad ETF", shares: 165, price: 521.41, value: 86032.65, allocation: 47.6, dayMove: 0.2, risk: "Low" },
];

const PORTFOLIO_MARKET_TAPE: MarketTapeBasket = {
  label: "Portfolio Holdings Tape",
  items: PORTFOLIO_HOLDINGS.map((holding) => ({
    label: holding.ticker,
    value: formatPortfolioTapePrice(holding.price),
    move: formatSignedPortfolioMove(holding.dayMove),
    direction: holding.dayMove >= 0 ? "up" : "down",
  })),
};

const PORTFOLIO_INVESTED_VALUE = 184350.58;
const PORTFOLIO_DAY_RETURN_PERCENT = 0.7;
const PORTFOLIO_ALLOCATION_COLORS: Record<string, string> = {
  NVDA: "#ecd76e",
  TSM: "#ff86a8",
  XOM: "#ffb35c",
  LMT: "#66ead7",
  ZIM: "#9d8cff",
  SPY: "#74e59c",
};
const PORTFOLIO_DONUT_SEGMENT_GAP = 0.38;

const PORTFOLIO_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 162400 },
  { label: "Feb", value: 166900 },
  { label: "Mar", value: 164200 },
  { label: "Apr", value: 171800 },
  { label: "May", value: 176400 },
  { label: "Jun", value: 180940 },
];

const NIFTY_50_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 162400 },
  { label: "Feb", value: 164150 },
  { label: "Mar", value: 163300 },
  { label: "Apr", value: 166850 },
  { label: "May", value: 169450 },
  { label: "Jun", value: 172980 },
];

const PORTFOLIO_AI_NEWS = [
  { source: "Reuters", title: "Red Sea detours keep freight and energy risk bid", tickers: "ZIM, XOM", severity: "High" },
  { source: "Bloomberg", title: "Taiwan supplier checks lift chip continuity premium", tickers: "NVDA, TSM", severity: "High" },
  { source: "CNBC", title: "Defense names hold bid as budget language firms", tickers: "LMT", severity: "Medium" },
];

const PORTFOLIO_SUGGESTED_PLAYS: PortfolioSuggestedPlay[] = [
  {
    id: "trim-concentration",
    context: "Portfolio",
    priority: "High",
    riskLabel: "High risk",
    headline: "Reduce SPY concentration",
    analysis: "SPY dominates account behavior; market beta now drives too much of the portfolio result.",
    command: "Cap allocation at 35% before adding more broad equity.",
    explanation:
      "SPY owns many stocks, but your account still depends heavily on one instrument. This brief flags account-level concentration, not SPY quality.",
    logic: [
      "SPY is diversified internally, but it is not diversified at the account level when it controls nearly half of total allocation.",
      "The portfolio's day-to-day behavior now tracks broad market beta more than individual security selection.",
      "A 35% cap keeps broad equity exposure while creating room for non-correlated holdings or targeted risk budgets.",
    ],
    primaryAction: "Set cap target",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "SPY = 47.6% allocation", emphasis: "47.6%" },
      { icon: "risk", text: "Main risk: one ETF drives behavior" },
      { icon: "goal", text: "Goal: lower single-instrument exposure", emphasis: "lower single-instrument" },
    ],
  },
  {
    id: "watch-shipping-beta",
    context: "Stock",
    priority: "High",
    riskLabel: "High risk",
    headline: "Confirm freight signal before adding ZIM",
    analysis: "ZIM is reacting to route stress; the premium can fade if freight rates stop confirming.",
    command: "Wait for freight-rate confirmation before increasing exposure.",
    explanation:
      "Shipping stocks can move quickly with insurance, route, and freight-rate changes. This brief treats ZIM as news-sensitive rather than a stable core holding.",
    logic: [
      "ZIM is a high-beta expression of freight stress, not a calm compounder. The signal needs confirmation from route premiums and insurance costs.",
      "If Red Sea rerouting pressure fades, the price premium can unwind faster than portfolio risk models usually expect.",
      "Waiting for freight-rate confirmation reduces the chance of adding exposure after the news premium has already peaked.",
    ],
    primaryAction: "Track freight",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "ZIM = 6.1% allocation", emphasis: "6.1%" },
      { icon: "risk", text: "Main risk: freight premium reverses" },
      { icon: "goal", text: "Goal: confirm before adding exposure", emphasis: "confirm" },
    ],
  },
  {
    id: "add-etf-buffer",
    context: "ETF / Fund",
    priority: "Medium",
    riskLabel: "Medium risk",
    headline: "Reduce chip concentration with a broad fund buffer",
    analysis: "A broad fund can reduce single-theme dependence while keeping market exposure.",
    command: "Compare one broad ETF or mutual fund against current chip exposure.",
    explanation:
      "A buffer is a risk-control tool, not a forecast. It helps keep market participation while lowering dependence on one sector headline.",
    logic: [
      "NVDA and TSM create a meaningful single-theme dependency even though they sit in different parts of the chip supply chain.",
      "A broad fund buffer keeps the account invested while lowering sensitivity to Taiwan, foundry continuity, and semiconductor headline shocks.",
      "This recommendation is defensive sizing logic, not a bearish call on chips.",
    ],
    primaryAction: "Compare funds",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "NVDA + TSM = 28.2% exposure", emphasis: "28.2%" },
      { icon: "risk", text: "Main risk: Taiwan / chip headlines" },
      { icon: "goal", text: "Goal: lower concentration", emphasis: "lower concentration" },
    ],
  },
];

const MARKET_TAPE_BY_SECTOR: Record<string, MarketTapeBasket> = {
  hydrocarbons: {
    label: "Hydrocarbons Risk Tape",
    items: [
      { label: "Brent Crude", value: "$88.12", move: "-0.31%", direction: "down" },
      { label: "WTI", value: "$83.47", move: "-0.22%", direction: "down" },
      { label: "Nat Gas", value: "$2.71", move: "+1.84%", direction: "up" },
      { label: "OPEC Basket", value: "$87.06", move: "+0.11%", direction: "up" },
      { label: "Shipping Insurance", value: "312 bps", move: "+14 bp", direction: "up" },
      { label: "XLE", value: "94.18", move: "+0.46%", direction: "up" },
      { label: "US10Y", value: "4.61%", move: "+6 bp", direction: "up" },
    ],
  },
  semiconductors: {
    label: "Semiconductors Risk Tape",
    items: [
      { label: "NVIDIA", value: "874.15", move: "-0.74%", direction: "down" },
      { label: "TSM", value: "142.82", move: "-1.12%", direction: "down" },
      { label: "SOXX", value: "228.40", move: "-0.63%", direction: "down" },
      { label: "TAIEX", value: "20,102", move: "-1.80%", direction: "down" },
      { label: "Nasdaq 100", value: "18,084.70", move: "-0.27%", direction: "down" },
      { label: "ASML", value: "941.20", move: "+0.35%", direction: "up" },
      { label: "DXY", value: "106.42", move: "+0.18%", direction: "up" },
    ],
  },
  "critical-minerals": {
    label: "Critical Minerals Risk Tape",
    items: [
      { label: "REMX", value: "45.62", move: "+0.92%", direction: "up" },
      { label: "LIT", value: "42.18", move: "-0.38%", direction: "down" },
      { label: "AUD/USD", value: "0.6524", move: "+0.21%", direction: "up" },
      { label: "China PMI", value: "50.8", move: "+0.3", direction: "up" },
      { label: "Copper", value: "$4.52", move: "+0.58%", direction: "up" },
      { label: "DXY", value: "106.42", move: "+0.18%", direction: "up" },
    ],
  },
};

const SEVERITY_RANK: Record<ConflictSeverity, number> = {
  Watch: 1,
  Elevated: 2,
  High: 3,
  Critical: 4,
};

const ACTIVE_CONFLICTS: ConflictDatum[] = [
  {
    id: "red-sea",
    name: "Red Sea",
    region: "Red Sea",
    lat: 16.8,
    lng: 41.6,
    severity: "High",
    intensity: "High",
    shortDescription: "Maritime security threats",
    reportedImpact: "Severe shipping disruption risk",
    marketChannels: ["Oil", "Freight", "Insurance", "India energy imports"],
    latest: "Vessel routing remains cautious as security monitoring intensifies.",
    updated: "12m ago",
    confidence: "Medium",
    humanitarianImpact: "Regional maritime access pressure",
    source: "Shipping advisories / regional monitors",
    transmission: [
      { label: "Suez Canal", lat: 30.2, lng: 32.5, type: "route" },
      { label: "Europe shipping", lat: 43.8, lng: 10.5, type: "risk" },
      { label: "India energy imports", lat: 22.5, lng: 72.8, type: "risk" },
      { label: "Brent / freight exposure", lat: 51.5, lng: -0.1, type: "risk" },
    ],
  },
  {
    id: "taiwan-strait",
    name: "Taiwan Strait",
    region: "Taiwan Strait",
    lat: 24.2,
    lng: 119.7,
    severity: "Elevated",
    intensity: "Elevated",
    shortDescription: "Cross-strait tensions",
    reportedImpact: "Semiconductor continuity risk",
    marketChannels: ["Semiconductors", "TAIEX", "Shipping", "Asia FX"],
    latest: "Air and maritime activity keeps chip supply hedges bid.",
    updated: "25m ago",
    confidence: "Medium",
    humanitarianImpact: "Civilian readiness pressure",
    source: "Regional defense releases / market monitors",
    transmission: [
      { label: "TSMC supply chain", lat: 24.8, lng: 121, type: "risk" },
      { label: "Japan electronics", lat: 35.7, lng: 139.7, type: "route" },
      { label: "US chip demand", lat: 37.3, lng: -121.9, type: "risk" },
    ],
  },
  {
    id: "gaza-israel",
    name: "Gaza / Israel",
    region: "Eastern Mediterranean",
    lat: 31.5,
    lng: 34.5,
    severity: "High",
    intensity: "High",
    shortDescription: "Regional escalation",
    reportedImpact: "Severe humanitarian and regional risk",
    marketChannels: ["Oil", "Defense", "Regional FX"],
    latest: "Ceasefire talks remain fragile as border operations continue.",
    updated: "38m ago",
    confidence: "Medium",
    humanitarianImpact: "Reported casualties and displacement remain severe",
    source: "UN / official health ministry / conflict tracker",
    transmission: [
      { label: "Eastern Med energy", lat: 34.4, lng: 32.8, type: "risk" },
      { label: "Regional FX", lat: 25.2, lng: 55.3, type: "risk" },
      { label: "Defense exposure", lat: 38.9, lng: -77, type: "route" },
    ],
  },
  {
    id: "ukraine",
    name: "Ukraine",
    region: "Eastern Europe",
    lat: 49,
    lng: 31,
    severity: "Elevated",
    intensity: "Elevated",
    shortDescription: "Ongoing conflict",
    reportedImpact: "Energy, grain, and defense exposure",
    marketChannels: ["Wheat", "Gas", "Defense", "Europe risk"],
    latest: "Infrastructure risk remains the primary market transmission channel.",
    updated: "1h ago",
    confidence: "High",
    humanitarianImpact: "Reported humanitarian impact remains substantial",
    source: "Official releases / humanitarian trackers",
    transmission: [
      { label: "Europe gas", lat: 50.1, lng: 14.4, type: "risk" },
      { label: "Black Sea grain", lat: 44.6, lng: 33.5, type: "route" },
      { label: "Defense supply", lat: 52.5, lng: 13.4, type: "risk" },
    ],
  },
  {
    id: "sudan",
    name: "Sudan",
    region: "Northeast Africa",
    lat: 15.5,
    lng: 32.5,
    severity: "Watch",
    intensity: "Watch",
    shortDescription: "Humanitarian access stress",
    reportedImpact: "Aid access and regional spillover risk",
    marketChannels: ["Regional FX", "Gold routes", "Aid logistics"],
    latest: "Humanitarian access remains constrained across several corridors.",
    updated: "2h ago",
    confidence: "Medium",
    humanitarianImpact: "Reported displacement remains severe",
    source: "UN / humanitarian monitors",
    transmission: [
      { label: "Red Sea logistics", lat: 19.6, lng: 37.2, type: "route" },
      { label: "Gold route risk", lat: 25.2, lng: 55.3, type: "risk" },
    ],
  },
  {
    id: "myanmar",
    name: "Myanmar",
    region: "Southeast Asia",
    lat: 21.9,
    lng: 95.9,
    severity: "Watch",
    intensity: "Watch",
    shortDescription: "Internal conflict pressure",
    reportedImpact: "Land-route and humanitarian pressure",
    marketChannels: ["Rare earths", "Regional logistics", "Thailand FX"],
    latest: "Border pressure continues to affect local logistics corridors.",
    updated: "3h ago",
    confidence: "Medium",
    humanitarianImpact: "Reported displacement remains elevated",
    source: "Conflict tracker / humanitarian monitors",
    transmission: [
      { label: "Thailand logistics", lat: 13.7, lng: 100.5, type: "route" },
      { label: "Critical minerals", lat: 25, lng: 98.8, type: "risk" },
    ],
  },
];

const DEFAULT_NEWS_ID = "red-sea-freight";

function newsImageDataUri(primary: string, secondary: string, accent: string, motif: "shipping" | "strait" | "city" | "grid" | "border") {
  const motifPath = {
    shipping: `<path d="M48 132h352l-42 48H92z" fill="${accent}" opacity=".38"/><path d="M112 112h164l28 20H92z" fill="#f6efe8" opacity=".72"/><path d="M82 184c48-18 94-18 138 0s90 18 138 0" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="8" stroke-linecap="round"/>`,
    strait: `<path d="M120 56c64 64 46 136 0 224" fill="none" stroke="#f7efe7" stroke-opacity=".42" stroke-width="28" stroke-linecap="round"/><path d="M320 36c-78 88-46 160 10 240" fill="none" stroke="${accent}" stroke-opacity=".48" stroke-width="22" stroke-linecap="round"/><circle cx="238" cy="154" r="28" fill="#fff" opacity=".62"/>`,
    city: `<path d="M72 254h336" stroke="#fff" stroke-opacity=".34" stroke-width="8"/><path d="M104 124h48v130h-48zM174 82h64v172h-64zM260 112h50v142h-50zM330 62h44v192h-44z" fill="#f9f1e7" opacity=".52"/><circle cx="306" cy="90" r="46" fill="${accent}" opacity=".34"/>`,
    grid: `<path d="M76 78h306v172H76z" fill="#0b0e10" opacity=".42"/><path d="M96 102h266M96 132h266M96 162h266M96 192h266M96 222h266M130 92v166M178 92v166M226 92v166M274 92v166M322 92v166" stroke="#fff" stroke-opacity=".22" stroke-width="4"/><path d="M96 222l78-60 52 28 94-78 42 26" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    border: `<path d="M92 88c74-34 132-24 174 30 48 62 96 64 142 8" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="14" stroke-linecap="round"/><path d="M84 218c68-50 128-50 180 0 44 42 92 42 146 0" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/><circle cx="224" cy="160" r="54" fill="#fff" opacity=".18"/>`,
  }[motif];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset=".58" stop-color="${secondary}"/><stop offset="1" stop-color="#080a0c"/></linearGradient><radialGradient id="r" cx=".72" cy=".28" r=".55"><stop offset="0" stop-color="${accent}" stop-opacity=".72"/><stop offset=".52" stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="480" height="300" fill="url(#g)"/><rect width="480" height="300" fill="url(#r)"/><path d="M0 242c78-38 154-42 228-12s158 22 252-28v98H0z" fill="#050607" opacity=".42"/>${motifPath}<g opacity=".22">${Array.from({ length: 36 }, (_, index) => {
    const x = 34 + (index % 12) * 36;
    const y = 38 + Math.floor(index / 12) * 78;
    return `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`;
  }).join("")}</g></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const GEO_NEWS_FEED: GeotaggedNewsItem[] = [
  {
    id: DEFAULT_NEWS_ID,
    conflictId: "red-sea",
    title: "Red Sea security posture keeps freight insurance bid",
    location: "Bab el-Mandeb corridor",
    region: "Red Sea",
    lat: 16.8,
    lng: 41.6,
    severity: "High",
    time: "12m ago",
    source: "Shipping advisories / regional monitors",
    summary: "Rerouting remains the base case for exposed cargo while insurers keep war-risk premia elevated.",
    aiInsight:
      "The pressure point is not a single vessel delay. The route premium flows into landed energy costs, Asia-Europe inventory planning, and India-facing import buffers before physical scarcity appears.",
    marketRead: "Freight, crude optionality, and insurance spreads are the first signals to watch.",
    imageUrl: newsImageDataUri("#172023", "#513028", "#e96048", "shipping"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Route premium" },
      { id: "semiconductors", label: "Semiconductors", signal: "Asia-Europe lead times" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Battery inputs in transit" },
    ],
  },
  {
    id: "taiwan-air-maritime",
    conflictId: "taiwan-strait",
    title: "Taiwan Strait activity widens chip continuity hedge",
    location: "Taiwan Strait",
    region: "Indo-Pacific",
    lat: 24.2,
    lng: 119.7,
    severity: "Elevated",
    time: "25m ago",
    source: "Regional defense releases / market monitors",
    summary: "Air and maritime activity is keeping Taiwan-linked suppliers and Korea memory names under a wider risk lens.",
    aiInsight:
      "The investable read-through is broader than Taiwan beta. A short disruption window can hit substrate allocation, Japan specialty chemicals, Korea memory pricing, and US AI server delivery schedules.",
    marketRead: "TAIEX, SOXX, KRW, and supplier lead-time commentary should move first.",
    imageUrl: newsImageDataUri("#101f28", "#273d46", "#dc9d52", "strait"),
    sectors: [
      { id: "semiconductors", label: "Semiconductors", signal: "Foundry concentration" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Electronics inputs" },
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "LNG route risk" },
    ],
  },
  {
    id: "eastern-med-fragile",
    conflictId: "gaza-israel",
    title: "Eastern Mediterranean talks stay fragile",
    location: "Gaza / Israel",
    region: "Eastern Mediterranean",
    lat: 31.5,
    lng: 34.5,
    severity: "High",
    time: "38m ago",
    source: "UN / regional conflict trackers",
    summary: "Border operations and fragile talks continue to hold regional energy, defense, and FX channels in focus.",
    aiInsight:
      "The risk is a transmission chain. Diplomatic breakdown can push regional FX hedging, defense procurement expectations, and Eastern Mediterranean gas optionality without an immediate oil supply shock.",
    marketRead: "Watch Gulf FX, defense baskets, LNG headlines, and shipping insurance.",
    imageUrl: newsImageDataUri("#1d1918", "#4a342f", "#e96048", "city"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Gas optionality" },
      { id: "semiconductors", label: "Semiconductors", signal: "Defense electronics" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Battery supply redundancy" },
    ],
  },
  {
    id: "ukraine-infrastructure",
    conflictId: "ukraine",
    title: "Ukraine infrastructure risk keeps Europe energy hedge alive",
    location: "Ukraine / Black Sea",
    region: "Eastern Europe",
    lat: 49,
    lng: 31,
    severity: "Elevated",
    time: "1h ago",
    source: "Official releases / humanitarian trackers",
    summary: "Infrastructure exposure remains the key channel for gas, grain, and European industrial sentiment.",
    aiInsight:
      "The direct battlefield read matters less to markets than the asset class it threatens. Power assets, Black Sea grain routes, and European gas storage expectations keep the risk premium sticky.",
    marketRead: "European gas, wheat, defense primes, and EUR industrials carry the cleanest signal.",
    imageUrl: newsImageDataUri("#141b20", "#263136", "#dc9d52", "grid"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Gas storage sensitivity" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Industrial input security" },
      { id: "semiconductors", label: "Semiconductors", signal: "Defense demand" },
    ],
  },
  {
    id: "myanmar-border",
    conflictId: "myanmar",
    title: "Myanmar border pressure disrupts rare-earth logistics",
    location: "Northern Myanmar",
    region: "Southeast Asia",
    lat: 21.9,
    lng: 95.9,
    severity: "Watch",
    time: "3h ago",
    source: "Conflict tracker / humanitarian monitors",
    summary: "Border pressure is keeping rare-earth and land-route logistics fragile across the Thailand and China corridor.",
    aiInsight:
      "This is a low-noise, high-leverage node. If border throughput deteriorates, battery and magnet supply chains feel it through processing bottlenecks before broad commodity screens react.",
    marketRead: "Rare earth processors, Thailand logistics, and China battery inputs are the early tells.",
    imageUrl: newsImageDataUri("#111c17", "#253229", "#b29b67", "border"),
    sectors: [
      { id: "critical-minerals", label: "Critical Minerals", signal: "Rare-earth logistics" },
      { id: "semiconductors", label: "Semiconductors", signal: "Magnet and tool inputs" },
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Regional transport costs" },
    ],
  },
];

interface EventArchiveRow {
  id: string;
  eventType: string;
  region: string;
  location: string;
  leaders: string;
  impact: string;
  dateOccurred: string;
  live?: boolean;
}

interface HorizonEvent {
  id: string;
  label: string;
  location: string;
  date: string;
}

const NEWS_DASHBOARD_PATH = "/news-pulse";
const NEWS_ARTICLE_PREFIX = `${NEWS_DASHBOARD_PATH}/`;
const FUNDS_PATH = "/funds";
const PORTFOLIO_PATH = "/portfolio";

const PREMIUM_ORANGE_THEME: SectorTheme = {
  accent: "#e88931",
  rgb: "232, 137, 49",
  onAccent: "#170a02",
};

const HORIZON_EVENTS: HorizonEvent[] = [
  { id: "opec-review", label: "OPEC+ output guidance window", location: "Vienna", date: "17 Jun 2026" },
  { id: "g20-finance", label: "G20 finance deputies track", location: "New Delhi", date: "05 Jul 2026" },
  { id: "cop-brief", label: "Climate finance implementation brief", location: "Brasilia", date: "11 Aug 2026" },
];

const EVENT_ARCHIVE_ROWS: EventArchiveRow[] = [
  {
    id: "eu-defense-pact",
    eventType: "Geopolitical",
    region: "Europe",
    location: "Paris",
    leaders: "Macron, Scholz",
    impact: "Major treaty",
    dateOccurred: "18 Nov 2025",
  },
  {
    id: "middle-east-corridor",
    eventType: "Resource Conflict",
    region: "Middle East",
    location: "Jerusalem",
    leaders: "Multiple parties",
    impact: "Low intensity",
    dateOccurred: "23 Jul 2025",
  },
  {
    id: "americas-trade",
    eventType: "Trade Agreement",
    region: "Americas",
    location: "Mexico City",
    leaders: "Trade envoys",
    impact: "High economic impact",
    dateOccurred: "14 Nov 2025",
  },
  {
    id: "indo-pacific-chip",
    eventType: "Technology Controls",
    region: "Indo-Pacific",
    location: "Taipei",
    leaders: "Regulators",
    impact: "Supply-chain premium",
    dateOccurred: "04 Dec 2025",
  },
  {
    id: "africa-food",
    eventType: "Food Security",
    region: "Africa",
    location: "Nairobi",
    leaders: "Regional bloc",
    impact: "Humanitarian watch",
    dateOccurred: "09 Jan 2026",
  },
];

const LENS_RAIL_ITEMS: LensRailItem[] = [
  { mode: "global", icon: "globe", title: "Global", subtitle: "View" },
  { mode: "pulse", icon: "pulse", title: "Conflict", subtitle: "Pulse" },
  { mode: "news", icon: "news", title: "News", subtitle: "Pulse" },
  { mode: "country", icon: "country", title: "Country", subtitle: "File" },
  { mode: "sectors", icon: "grid", title: "Sector", subtitle: "Grid" },
];

function routeToView(pathname: string): AppView {
  if (pathname.startsWith(NEWS_ARTICLE_PREFIX)) return "article";
  if (pathname === FUNDS_PATH) return "funds";
  if (pathname === PORTFOLIO_PATH) return "portfolio";
  return pathname === NEWS_DASHBOARD_PATH ? "news" : "lens";
}

function newsArticlePath(newsId: string) {
  return `${NEWS_ARTICLE_PREFIX}${encodeURIComponent(newsId)}`;
}

function newsIdFromArticlePath(pathname: string) {
  if (!pathname.startsWith(NEWS_ARTICLE_PREFIX)) return null;
  const encodedId = pathname.slice(NEWS_ARTICLE_PREFIX.length).split("/")[0];
  if (!encodedId) return null;
  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
}

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

function compactNumber(value: number, suffix: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
}

function scoreColor(score: number) {
  if (score >= 7) return RISK_COLOR;
  if (score >= 4) return AMBER_COLOR;
  return STABLE_COLOR;
}

function scoreClass(score: number) {
  if (score >= 7) return "risk";
  if (score >= 4) return "amber";
  return "stable";
}

function formatMove(move: number) {
  return `${move > 0 ? "+" : ""}${move.toFixed(1)}%`;
}

function formatAlertAge(ageMinutes: number) {
  if (ageMinutes < 1) return "Now";
  if (ageMinutes < 60) return `${ageMinutes} min ago`;
  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours}h ago`;
  return `${Math.round(ageHours / 24)}d ago`;
}

function sectorTheme(sectorId?: string) {
  return sectorId ? SECTOR_THEMES[sectorId] ?? FALLBACK_SECTOR_THEME : FALLBACK_SECTOR_THEME;
}

function angularDistanceDegrees(a: Coordinates, b: Coordinates) {
  const toRad = Math.PI / 180;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const deltaLat = (b.lat - a.lat) * toRad;
  const deltaLng = (b.lng - a.lng) * toRad;
  const hav =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return (2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))) / toRad;
}

function screenNewsPinsEqual(left: ScreenNewsPin[], right: ScreenNewsPin[]) {
  if (left.length !== right.length) return false;
  return left.every((leftPin, index) => {
    const rightPin = right[index];
    return (
      leftPin.id === rightPin.id &&
      leftPin.selected === rightPin.selected &&
      leftPin.hovered === rightPin.hovered &&
      leftPin.visible === rightPin.visible &&
      Math.abs(leftPin.x - rightPin.x) < PIN_POSITION_EPSILON &&
      Math.abs(leftPin.y - rightPin.y) < PIN_POSITION_EPSILON
    );
  });
}

function Sparkline({ points }: { points: MarketPoint[] }) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const d = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 48 - ((point.value - min) / range) * 36;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 100 56" role="img" aria-label="Market index line chart">
      <path className="sparkline-grid" d="M 0 12 H 100 M 0 30 H 100 M 0 48 H 100" />
      <path className="sparkline-line" d={d} />
      {points.map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * 100;
        const y = 48 - ((point.value - min) / range) * 36;
        return <circle key={point.label} cx={x} cy={y} r={1.8} />;
      })}
    </svg>
  );
}

function GlobalBrandNav({
  activeView,
  onHome,
  onFunds,
  onPortfolio,
}: {
  activeView: AppView;
  onHome: () => void;
  onFunds: () => void;
  onPortfolio: () => void;
}) {
  const isLensActive = activeView !== "funds" && activeView !== "portfolio";

  return (
    <nav className="global-brand-nav" aria-label="Primary navigation">
      <div className="global-brand-shell">
        <button type="button" className="global-brand-button" onClick={onHome} aria-label="Go to Sovereign Lens home">
          <span className="global-brand-mark">SOV</span>
          <span className="global-brand-wordmark">
            <span>Sovereign</span>
            <strong>Lens</strong>
          </span>
        </button>

        <div className="global-nav-links" aria-label="Workspace sections">
          <button
            type="button"
            className={`global-nav-link global-nav-link-lens${isLensActive ? " is-active" : ""}`}
            aria-label="Open global intelligence lens"
            aria-current={isLensActive ? "page" : undefined}
            onClick={onHome}
          >
            <span>Lens</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-funds${activeView === "funds" ? " is-active" : ""}`}
            aria-label="Open funds"
            aria-current={activeView === "funds" ? "page" : undefined}
            onClick={onFunds}
          >
            <span>Funds</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-portfolio${activeView === "portfolio" ? " is-active" : ""}`}
            aria-label="Open your portfolio"
            aria-current={activeView === "portfolio" ? "page" : undefined}
            onClick={onPortfolio}
          >
            <span>Portfolio</span>
          </button>
        </div>

        <div className="global-nav-actions" aria-label="Account actions">
          <button type="button" className="global-nav-login" aria-label="Log in">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

function archiveRowFromAlert(alert: PulseAlert, index: number): EventArchiveRow {
  const locationByRegion: Record<string, string> = {
    "Taiwan Strait": "Taipei / Strait",
    "Persian Gulf": "Hormuz corridor",
    "US, EU, China": "Washington / Brussels",
  };
  const leaderByRegion: Record<string, string> = {
    "Taiwan Strait": "Regional commands",
    "Persian Gulf": "Shipping insurers",
    "US, EU, China": "Trade regulators",
  };

  return {
    id: `live-${alert.id}`,
    eventType: alert.severity === "High Risk" ? "Security Flash" : index % 2 === 0 ? "Policy Shift" : "Market Signal",
    region: alert.region,
    location: locationByRegion[alert.region] ?? alert.region,
    leaders: leaderByRegion[alert.region] ?? "Analyst desk",
    impact: alert.impact,
    dateOccurred: formatAlertAge(alert.age_minutes),
    live: true,
  };
}

function NewsDashboard({ data, onBack }: { data: BootstrapData; onBack: () => void }) {
  const archiveRows = useMemo(
    () => [...data.globalPulse.alerts.map(archiveRowFromAlert), ...EVENT_ARCHIVE_ROWS],
    [data.globalPulse.alerts],
  );

  return (
    <main
      className="events-dashboard-shell"
      style={
        {
          "--accent": PREMIUM_ORANGE_THEME.accent,
          "--accent-rgb": PREMIUM_ORANGE_THEME.rgb,
          "--accent-on": PREMIUM_ORANGE_THEME.onAccent,
        } as React.CSSProperties
      }
    >
      <header className="events-dashboard-topbar">
        <button type="button" className="events-wordmark" onClick={onBack}>
          <span>Global</span>
          <strong>Events</strong>
          <span>Pulse</span>
        </button>
        <span className="events-topbar-rule" aria-hidden="true" />
        <p>Worldwide event analysis</p>
        <button type="button" className="events-back-button" onClick={onBack}>
          Lens
        </button>
        <label className="events-search">
          <span className="sr-only">Search events, regions, or topics</span>
          <input type="search" placeholder="Search events, regions, or topics..." />
          <span className="events-search-icon" aria-hidden="true" />
        </label>
      </header>

      <section className="events-panel events-history-panel" aria-label="Upcoming events">
        <div>
          <h2>Upcoming Events</h2>
          <p>Significant global political or economic milestones to watch next</p>
        </div>
        <div className="upcoming-events-list">
          {HORIZON_EVENTS.map((event) => (
            <article key={event.id} className="upcoming-event-card">
              <time>{event.date}</time>
              <strong>{event.label}</strong>
              <small>{event.location}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="events-globe-stage" aria-label="Global events map">
        <div className="events-globe">
          <div className="events-globe-map" style={{ backgroundImage: `url(${API_IMAGE_EARTH})` }} />
          <span className="events-map-node node-north-america" aria-hidden="true" />
          <span className="events-map-node node-caribbean" aria-hidden="true" />
          <span className="events-map-node node-south-america" aria-hidden="true" />
          <span className="events-map-node node-atlantic" aria-hidden="true" />
          <span className="events-map-node node-europe" aria-hidden="true" />
          <span className="events-map-node node-asia" aria-hidden="true" />
        </div>
        <article className="events-map-callout">
          <time>Nov 10, 2024</time>
          <h1>G20 Summit: Climate Deal Reached</h1>
          <p>Rio de Janeiro, Brazil</p>
        </article>
      </section>

      <section className="events-panel events-archive-panel" aria-label="Global event archive">
        <header>
          <div>
            <h2>Global Event Archive</h2>
            <p>A comprehensive list of recent global events, from diplomatic summits to natural disasters</p>
          </div>
          <div className="archive-sort-controls" aria-label="Archive sort order">
            <button type="button">Newest</button>
            <button type="button">Oldest</button>
          </div>
        </header>

        <div className="events-table-wrap">
          <table>
            <caption className="sr-only">Global event archive</caption>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Region</th>
                <th>Location</th>
                <th>Key Leaders</th>
                <th>Impact Level</th>
                <th>Date Occurred</th>
              </tr>
            </thead>
            <tbody>
              {archiveRows.map((row) => (
                <tr key={row.id} className={row.live ? "is-live" : undefined}>
                  <td>{row.eventType}</td>
                  <td>{row.region}</td>
                  <td>{row.location}</td>
                  <td>{row.leaders}</td>
                  <td>{row.impact}</td>
                  <td>{row.dateOccurred}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function NewsArticleView({
  news,
  sectors,
  selectedSectorId,
  onBack,
  onOpenFeed,
  onSectorSelect,
}: {
  news: GeotaggedNewsItem;
  sectors: Sector[];
  selectedSectorId: string;
  onBack: () => void;
  onOpenFeed: () => void;
  onSectorSelect: (sectorId: string) => void;
}) {
  const knownSectors = new Set(sectors.map((sector) => sector.id));

  return (
    <main
      className="news-article-shell"
      style={
        {
          "--accent": PREMIUM_ORANGE_THEME.accent,
          "--accent-rgb": PREMIUM_ORANGE_THEME.rgb,
          "--accent-on": PREMIUM_ORANGE_THEME.onAccent,
        } as React.CSSProperties
      }
    >
      <header className="news-article-topbar">
        <button type="button" className="events-wordmark" onClick={onBack}>
          <span>Sovereign</span>
          <strong>Lens</strong>
        </button>
        <span className="events-topbar-rule" aria-hidden="true" />
        <p>Full news article</p>
        <button type="button" className="events-back-button" onClick={onOpenFeed}>
          News Feed
        </button>
      </header>

      <article className={`news-article-card severity-${severityClass(news.severity)}`}>
        <div className="news-article-kicker">
          <span>{news.region}</span>
          <time>{news.time}</time>
          <strong>{news.severity}</strong>
        </div>
        <h1>{news.title}</h1>
        <p className="news-article-location">{news.location}</p>

        <div className="news-article-body">
          <p>{news.summary}</p>
          <p>{news.aiInsight}</p>
          <p>{news.marketRead}</p>
        </div>

        <dl className="news-article-facts">
          <div>
            <dt>Source</dt>
            <dd>{news.source}</dd>
          </div>
          <div>
            <dt>Geotag</dt>
            <dd>
              {news.lat.toFixed(1)}, {news.lng.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt>Conflict link</dt>
            <dd>{news.conflictId.split("-").join(" ")}</dd>
          </div>
        </dl>

        <section className="news-article-sectors" aria-label="Connected sectors">
          <h2>Connected sectors</h2>
          <div>
            {news.sectors.map((sector) => (
              <button
                key={`${news.id}-${sector.id}`}
                type="button"
                className={sector.id === selectedSectorId ? "is-active" : undefined}
                onClick={() => {
                  if (knownSectors.has(sector.id)) onSectorSelect(sector.id);
                }}
              >
                <strong>{sector.label}</strong>
                <span>{sector.signal}</span>
              </button>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

function severityClass(severity: ConflictSeverity) {
  return severity.toLowerCase();
}

function RemovedConflictCard({ conflict, onClose }: { conflict: ConflictDatum; onClose: () => void }) {
  return (
    <aside className={`conflict-card severity-${severityClass(conflict.severity)}`} aria-label={`${conflict.name} conflict brief`}>
      <button type="button" className="conflict-card-close" aria-label="Close conflict brief" onClick={onClose}>
        x
      </button>
      <div className="conflict-card-heading">
        <div>
          <p className="eyebrow">{conflict.region}</p>
          <h2>{conflict.name}</h2>
          <span>{conflict.shortDescription}</span>
        </div>
        <strong>{conflict.severity}</strong>
      </div>
      <dl className="conflict-card-grid">
        <div>
          <dt>Intensity</dt>
          <dd>{conflict.intensity}</dd>
        </div>
        <div>
          <dt>Reported impact</dt>
          <dd>{conflict.reportedImpact}</dd>
        </div>
        <div>
          <dt>Market channels</dt>
          <dd>{conflict.marketChannels.join(" · ")}</dd>
        </div>
        <div>
          <dt>Latest</dt>
          <dd>{conflict.latest}</dd>
        </div>
        <div>
          <dt>Reported humanitarian impact</dt>
          <dd>{conflict.humanitarianImpact}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{conflict.source}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{conflict.updated}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{conflict.confidence}</dd>
        </div>
      </dl>
      <div className="conflict-card-actions" aria-label="Conflict detail views">
        <button type="button">Timeline</button>
        <button type="button">Market impact</button>
        <button type="button">Sources</button>
      </div>
    </aside>
  );
}

function CompactConflictCard({ conflict, onClose }: { conflict: ConflictDatum; onClose: () => void }) {
  return (
    <aside className={`conflict-card severity-${severityClass(conflict.severity)}`} aria-label={`${conflict.name} conflict brief`}>
      <button type="button" className="conflict-card-close" aria-label="Close conflict brief" onClick={onClose}>
        x
      </button>
      <div className="conflict-card-heading">
        <div>
          <p className="eyebrow">{conflict.region}</p>
          <h2>{conflict.name}</h2>
          <span>{conflict.shortDescription}</span>
        </div>
        <strong>{conflict.severity}</strong>
      </div>
      <dl className="conflict-card-grid">
        <div>
          <dt>Impact</dt>
          <dd>{conflict.reportedImpact}</dd>
        </div>
        <div>
          <dt>Latest</dt>
          <dd>{conflict.latest}</dd>
        </div>
        <div>
          <dt>Market channels</dt>
          <dd>{conflict.marketChannels.slice(0, 3).join(" · ")}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{conflict.updated}</dd>
        </div>
      </dl>
    </aside>
  );
}

function GlobeNewsPins({
  globeRef,
  newsVisuals,
  viewportWidth,
  viewportHeight,
  onHover,
  onSelect,
  onOpenArticle,
}: {
  globeRef: { current: any };
  newsVisuals: NewsVisualDatum[];
  viewportWidth: number;
  viewportHeight: number;
  onHover: (id: string | null) => void;
  onSelect: (news: GeotaggedNewsItem) => void;
  onOpenArticle: (news: GeotaggedNewsItem) => void;
}) {
  const [pins, setPins] = useState<ScreenNewsPin[]>([]);

  useEffect(() => {
    let frameId = 0;
    let active = true;
    let lastProjectionAt = 0;

    const projectPins = (timestamp: number) => {
      if (!active) return;

      if (timestamp - lastProjectionAt >= PIN_PROJECTION_INTERVAL_MS || lastProjectionAt === 0) {
        lastProjectionAt = timestamp;
        const globe = globeRef.current;
        if (globe) {
          const pov = globe.pointOfView?.() ?? { lat: 0, lng: 0 };
          const nextPins = newsVisuals.map((news) => {
            const coords = globe.getScreenCoords?.(news.lat, news.lng, news.selected ? 0.18 : 0.12) ?? { x: -100, y: -100 };
            return {
              ...news,
              x: Number.isFinite(coords.x) ? coords.x : -100,
              y: Number.isFinite(coords.y) ? coords.y : -100,
              visible: angularDistanceDegrees({ lat: news.lat, lng: news.lng }, { lat: pov.lat, lng: pov.lng }) < 98,
            };
          });
          setPins((current) => (screenNewsPinsEqual(current, nextPins) ? current : nextPins));
        }
      }

      frameId = window.requestAnimationFrame(projectPins);
    };

    frameId = window.requestAnimationFrame(projectPins);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [globeRef, newsVisuals, viewportHeight, viewportWidth]);

  return (
    <div className="news-globe-pin-layer" aria-label="Geotagged news locations">
      {pins.map((pin) => (
        <div
          key={pin.id}
          className={[
            "news-location-anchor",
            `severity-${severityClass(pin.severity)}`,
            pin.selected ? "is-selected" : "",
            pin.hovered ? "is-hovered" : "",
            pin.visible ? "" : "is-hidden",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ transform: `translate3d(${pin.x.toFixed(2)}px, ${pin.y.toFixed(2)}px, 0) translate(-50%, -50%)` }}
          onMouseEnter={() => onHover(pin.id)}
          onMouseLeave={() => onHover(null)}
        >
          <button
            type="button"
            className="news-location-dot"
            aria-label={`Open news summary: ${pin.title}`}
            onClick={() => onSelect(pin)}
          >
            <span className="news-pin-dot" aria-hidden="true" />
          </button>
          {pin.selected ? (
            <button
              type="button"
              className="news-map-summary-card"
              aria-label={`Read full article: ${pin.title}`}
              onClick={() => onOpenArticle(pin)}
            >
            <small>
              {pin.region} - {pin.time}
            </small>
            <strong>{pin.title}</strong>
            <span>{pin.summary}</span>
              <em>Open article</em>
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AiInsightPanel({
  news,
  sectors,
  selectedSectorId,
  onSectorSelect,
}: {
  news: GeotaggedNewsItem;
  sectors: Sector[];
  selectedSectorId: string;
  onSectorSelect: (sectorId: string) => void;
}) {
  const knownSectors = new Set(sectors.map((sector) => sector.id));

  return (
    <aside className="ai-insight-panel" aria-label="AI insight explainer">
      <div className="insight-message-row has-avatar">
        <img className="insight-avatar" src={news.imageUrl} alt="" />
        <article className="insight-message-card insight-status-card">
          <div className="insight-kicker-row">
            <p className="eyebrow">AI Insight</p>
            <span className={`severity-pill severity-${severityClass(news.severity)}`}>{news.severity}</span>
          </div>
          <h1>{news.location}</h1>
          <h2>{news.title}</h2>
        </article>
      </div>

      <article className="insight-message-card">
        <p className="insight-summary">{news.aiInsight}</p>
      </article>

      <article className="insight-message-card">
        <dl className="insight-signal-grid">
          <div>
            <dt>Region</dt>
            <dd>{news.region}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{news.time}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{news.source}</dd>
          </div>
        </dl>
        <div className="market-readout">
          <span>Market read</span>
          <p>{news.marketRead}</p>
        </div>
      </article>

      <article className="insight-message-card connected-sectors" aria-label="Connected sectors">
        <header>
          <span>Connected sectors</span>
        </header>
        <div className="connected-sector-list">
          {news.sectors.map((sector) => {
            const canActivate = knownSectors.has(sector.id);
            return (
              <button
                key={`${news.id}-${sector.id}`}
                type="button"
                className={sector.id === selectedSectorId ? "is-active" : undefined}
                onClick={() => {
                  if (canActivate) onSectorSelect(sector.id);
                }}
              >
                <strong>{sector.label}</strong>
                <span>{sector.signal}</span>
              </button>
            );
          })}
        </div>
      </article>
    </aside>
  );
}

function RelatedNewsPanel({
  items,
  selectedNewsId,
  hoveredNewsId,
  onSelect,
  onHover,
}: {
  items: GeotaggedNewsItem[];
  selectedNewsId: string;
  hoveredNewsId: string | null;
  onSelect: (news: GeotaggedNewsItem) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <aside className="related-news-panel" aria-label="Related geotagged news">
      <article className="news-feed-heading-card">
        <header>
          <div>
            <p className="eyebrow">Live News Feed</p>
            <h2>Related News</h2>
          </div>
          <span>{items.length} active</span>
        </header>
      </article>

      <div className="related-news-list">
        {items.map((item) => (
          <article key={item.id} className={item.id === selectedNewsId ? "is-selected" : undefined}>
            <button
              type="button"
              className={[`severity-${severityClass(item.severity)}`, item.id === hoveredNewsId ? "is-hovered" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onHover(null)}
            >
              <img className="news-card-image" src={item.imageUrl} alt="" />
              <span className="news-card-copy">
                <small>
                  {item.region} - {item.time}
                </small>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </span>
              <span className={`news-card-dot severity-${severityClass(item.severity)}`} aria-hidden="true" />
              <span className="news-card-location">{item.location}</span>
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}

function DashboardGlyph({ kind }: { kind: DashboardIconKind }) {
  switch (kind) {
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 12h17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 3.5c2.6 2.4 4 5.3 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.3-4-8.5s1.4-6.1 4-8.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.4 7.8c1.7 1 3.6 1.5 5.6 1.5s3.9-.5 5.6-1.5M6.4 16.2c1.7-1 3.6-1.5 5.6-1.5s3.9.5 5.6 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "pulse":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 13h4.6l2-5.5 3.1 10 2.2-6h7.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.7 7.6c.9-1.2 2.9-1.4 4-.1 1.1 1.2.8 3.1-.3 4.1l-2.8 2.5-2.8-2.5c-1.1-1-.9-2.9-.3-4.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "news":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4.5h12.5a1.5 1.5 0 0 1 1.5 1.5v11.5a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V6a1.5 1.5 0 0 1 1-1.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 8h7M8 11h7M8 14h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="13.5" y="13.2" width="3.4" height="3.4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "country":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 18.5h8M6.2 14.8h11.6M7.5 11.1h9M10 4.5v2.7M12 3.2v3.4M14 4.1v3.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6.8 19.2h10.4a1.2 1.2 0 0 0 1.1-1.7l-2.4-5.4H8.1l-2.4 5.4a1.2 1.2 0 0 0 1.1 1.7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14M5 12h14M5 18h14M6 5v14M12 5v14M18 5v14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "audio":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 8 7.2 10.3H4.8v3.4h2.4L10 16V8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M13.5 9.2a4.1 4.1 0 0 1 0 5.6M16.2 7a7.2 7.2 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 1.4 2.4 2.8.5-.5 2.8 2 2-2 2 .5 2.8-2.8.5L12 21l-1.4-2.4-2.8-.5.5-2.8-2-2 2-2-.5-2.8 2.8-.5L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "signal":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 18.5V13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.3 10.6a4.3 4.3 0 0 1 7.4 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5.5 8a7.8 7.8 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12" cy="19.2" r="1.2" fill="currentColor" />
        </svg>
      );
    case "assist":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.8c4 0 7.2 2.8 7.2 6.4 0 2.4-1.3 4.2-3.4 5.3v3.5l-3.3-2.1h-.5c-4 0-7.2-2.8-7.2-6.4S8 3.8 12 3.8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="9.3" cy="10.2" r="0.9" fill="currentColor" />
          <circle cx="12" cy="10.2" r="0.9" fill="currentColor" />
          <circle cx="14.7" cy="10.2" r="0.9" fill="currentColor" />
        </svg>
      );
  }
}

function formatUsdScale(valueBn: number) {
  if (valueBn >= 1000) return `$${(valueBn / 1000).toFixed(1)}T`;
  return `$${valueBn.toFixed(0)}B`;
}

function formatPopulationScale(valueMn: number) {
  if (valueMn >= 1000) return `${(valueMn / 1000).toFixed(1)}B`;
  return `${valueMn.toFixed(0)}M`;
}

function formatPortfolioCurrency(value: number) {
  return `$${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPortfolioTapePrice(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSignedPortfolioCurrency(value: number) {
  return `${value > 0 ? "+" : ""}${formatPortfolioCurrency(value)}`;
}

function formatSignedPortfolioMove(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatSignedPortfolioPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function PortfolioPerformanceChart({ points, benchmarkPoints }: { points: PortfolioPerformancePoint[]; benchmarkPoints: PortfolioPerformancePoint[] }) {
  const [activeIndex, setActiveIndex] = useState(points.length - 1);
  const values = [...points, ...benchmarkPoints].map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const chartCoordinates = (series: PortfolioPerformancePoint[]) =>
    series.map((point, index) => ({
      ...point,
      x: 7 + (index / Math.max(series.length - 1, 1)) * 86,
      y: 56 - ((point.value - min) / range) * 42,
    }));

  const coordinates = chartCoordinates(points);
  const benchmarkCoordinates = chartCoordinates(benchmarkPoints);
  const chartPath = (series: typeof coordinates) =>
    series.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");

  const path = chartPath(coordinates);
  const benchmarkPath = chartPath(benchmarkCoordinates);
  const areaPath = `${path} L 93 59 L 7 59 Z`;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const activePoint = coordinates[safeActiveIndex] ?? coordinates[coordinates.length - 1];
  const activeBenchmarkPoint = benchmarkCoordinates[safeActiveIndex] ?? benchmarkCoordinates[benchmarkCoordinates.length - 1];
  const latestBenchmarkPoint = benchmarkCoordinates[benchmarkCoordinates.length - 1];
  const activeGainLoss = activePoint.value - PORTFOLIO_INVESTED_VALUE;
  const activeGainLossPercent = (activeGainLoss / PORTFOLIO_INVESTED_VALUE) * 100;
  const activePortfolioReturnPercent = activeGainLossPercent;
  const activeBenchmarkReturnPercent = ((activeBenchmarkPoint.value - benchmarkPoints[0].value) / benchmarkPoints[0].value) * 100;
  const activeAlphaPercent = activePortfolioReturnPercent - activeBenchmarkReturnPercent;
  const activeMoveClass = activeGainLoss >= 0 ? "is-positive" : "is-negative";
  const activeAlphaClass = activeAlphaPercent >= 0 ? "is-positive" : "is-negative";

  const handleChartPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const constrainedX = Math.min(Math.max(cursorX, 7), 93);
    const nextIndex = Math.round(((constrainedX - 7) / 86) * Math.max(points.length - 1, 1));
    const clampedIndex = Math.min(Math.max(nextIndex, 0), points.length - 1);
    setActiveIndex((currentIndex) => (currentIndex === clampedIndex ? currentIndex : clampedIndex));
  };

  return (
    <div
      className="portfolio-performance-stack"
      style={
        {
          "--trace-left": `${activePoint.x.toFixed(2)}%`,
          "--trace-top": `${((activePoint.y / 72) * 100).toFixed(2)}%`,
        } as React.CSSProperties
      }
    >
      <svg
        className="portfolio-performance-chart"
        viewBox="0 0 100 72"
        role="img"
        aria-label="Portfolio performance compared with Nifty 50"
        onPointerMove={handleChartPointerMove}
        onPointerLeave={() => setActiveIndex(points.length - 1)}
      >
        <defs>
          <linearGradient id="portfolioPerformanceArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(116, 229, 156, 0.2)" />
            <stop offset="64%" stopColor="rgba(236, 215, 110, 0.08)" />
            <stop offset="100%" stopColor="rgba(255, 242, 209, 0.012)" />
          </linearGradient>
          <linearGradient id="portfolioPerformanceLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ecd76e" />
            <stop offset="48%" stopColor="#fff2d1" />
            <stop offset="100%" stopColor="#74e59c" />
          </linearGradient>
        </defs>
        <path className="portfolio-chart-grid" d="M 7 16 H 93 M 7 35 H 93 M 7 54 H 93" />
        <path className="portfolio-chart-baseline" d="M 7 59 H 93" />
        <path className="portfolio-chart-area" d={areaPath} />
        <path className="portfolio-chart-benchmark-line" d={benchmarkPath} />
        <text className="portfolio-chart-benchmark-label" x="90.8" y={Math.max(12, latestBenchmarkPoint.y - 2.2).toFixed(2)} textAnchor="end">
          Nifty 50
        </text>
        <path className="portfolio-chart-line-glass" d={path} />
        <path className="portfolio-chart-line" d={path} />
        <path className="portfolio-chart-active-guide" d={`M ${activePoint.x.toFixed(2)} 14 V 59`} />
        <text className="portfolio-chart-axis-label" x="7" y="67">
          Jan
        </text>
        <text className="portfolio-chart-axis-label" x="93" y="67" textAnchor="end">
          Jun
        </text>
        <rect className="portfolio-chart-hitbox" x="0" y="0" width="100" height="72" />
      </svg>

      <div className="portfolio-performance-callout" aria-label={`${activePoint.label} portfolio performance summary`}>
        <div>
          <span>Portfolio Value</span>
          <strong>{formatPortfolioCurrency(activePoint.value)}</strong>
        </div>
        <div className={activeMoveClass}>
          <span>Gain/Loss</span>
          <strong>
            {formatSignedPortfolioCurrency(activeGainLoss)} ({formatSignedPortfolioPercent(activeGainLossPercent)})
          </strong>
        </div>
        <div className={activeAlphaClass}>
          <span>Alpha vs Nifty</span>
          <strong>{formatSignedPortfolioPercent(activeAlphaPercent)}</strong>
        </div>
      </div>
    </div>
  );
}

function PortfolioCompositionDonut({ holdings }: { holdings: PortfolioHolding[] }) {
  const topHolding = [...holdings].sort((a, b) => b.allocation - a.allocation)[0];
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const totalAllocation = holdings.reduce((sum, holding) => sum + holding.allocation, 0);
  const activeHolding = activeTicker ? holdings.find((holding) => holding.ticker === activeTicker) ?? null : null;
  const fundAllocation = holdings
    .filter((holding) => /etf|fund/i.test(holding.sector) || /etf|fund/i.test(holding.name))
    .reduce((sum, holding) => sum + holding.allocation, 0);
  const equityAllocation = Math.max(totalAllocation - fundAllocation, 0);
  let cumulativeAllocation = 0;

  const segments = holdings.map((holding) => {
    const normalizedShare = (holding.allocation / totalAllocation) * 100;
    const segmentGap = Math.min(PORTFOLIO_DONUT_SEGMENT_GAP, normalizedShare * 0.22);
    const visibleShare = Math.max(normalizedShare - segmentGap, 0.1);
    const start = cumulativeAllocation;
    cumulativeAllocation += normalizedShare;
    const midAngle = ((start + normalizedShare / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    const isActive = holding.ticker === activeTicker;
    const lift = isActive ? 1.65 : 0;

    return {
      holding,
      color: PORTFOLIO_ALLOCATION_COLORS[holding.ticker] ?? "#fff2d1",
      dashArray: `${visibleShare} ${100 - visibleShare}`,
      dashOffset: -(start + segmentGap / 2),
      liftX: Math.cos(midAngle) * lift,
      liftY: Math.sin(midAngle) * lift,
      isActive,
    };
  });

  return (
    <div className="portfolio-donut-composition" onMouseLeave={() => setActiveTicker(null)} onBlur={() => setActiveTicker(null)}>
      <div className="portfolio-donut-stage">
        <svg className="portfolio-donut-chart" viewBox="0 0 112 112" role="img" aria-label="Interactive stock allocation donut chart">
          <circle className="portfolio-donut-track" cx="56" cy="56" r="42" />
          {segments.map((segment) => (
            <g
              key={segment.holding.ticker}
              className={`portfolio-donut-segment-shell${segment.isActive ? " is-active" : ""}`}
              tabIndex={0}
              aria-label={`${segment.holding.name} ${segment.holding.allocation.toFixed(1)} percent of portfolio`}
              onMouseEnter={() => setActiveTicker(segment.holding.ticker)}
              onFocus={() => setActiveTicker(segment.holding.ticker)}
              style={
                {
                  transform: `translate(${segment.liftX.toFixed(2)}px, ${segment.liftY.toFixed(2)}px)`,
                } as React.CSSProperties
              }
            >
              <circle
                className="portfolio-donut-segment"
                cx="56"
                cy="56"
                r="42"
                pathLength={100}
                transform="rotate(-90 56 56)"
                style={
                  {
                    stroke: segment.color,
                    strokeDasharray: segment.dashArray,
                    strokeDashoffset: segment.dashOffset,
                    "--segment-aura": segment.color,
                  } as React.CSSProperties
                }
              />
              <circle
                className="portfolio-donut-segment-sheen"
                cx="56"
                cy="56"
                r="42"
                pathLength={100}
                transform="rotate(-90 56 56)"
                style={
                  {
                    strokeDasharray: segment.dashArray,
                    strokeDashoffset: segment.dashOffset,
                  } as React.CSSProperties
                }
              />
            </g>
          ))}
        </svg>
        <div className="portfolio-donut-center" aria-live="polite">
          {activeHolding ? (
            <>
              <span>{activeHolding.ticker}</span>
              <strong>{activeHolding.allocation.toFixed(1)}%</strong>
              <small>{activeHolding.name}</small>
            </>
          ) : (
            <div className="portfolio-donut-mix-lines">
              <small>Equity {equityAllocation.toFixed(0)}%</small>
              <small>Fund {fundAllocation.toFixed(0)}%</small>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function portfolioRecommendationReasonIcon(icon: PortfolioRecommendationReason["icon"]) {
  const iconClassName = "portfolio-recommendation-reason-icon";

  if (icon === "risk") return <AlertTriangle className={iconClassName} aria-hidden="true" />;
  if (icon === "goal") return <Target className={iconClassName} aria-hidden="true" />;
  return <Cpu className={iconClassName} aria-hidden="true" />;
}

function portfolioRecommendationReasonText(reason: PortfolioRecommendationReason): ReactNode {
  if (!reason.emphasis || !reason.text.includes(reason.emphasis)) return reason.text;

  const [before, after] = reason.text.split(reason.emphasis);

  return (
    <>
      {before}
      <mark>{reason.emphasis}</mark>
      {after}
    </>
  );
}

function PortfolioRecommendationCard({
  play,
  isExpanded,
  isInteractive,
  onToggleLogic,
}: {
  play: PortfolioSuggestedPlay;
  isExpanded: boolean;
  isInteractive: boolean;
  onToggleLogic: () => void;
}) {
  return (
    <article className={`portfolio-recommendation-card risk-${play.priority.toLowerCase()}${isExpanded ? " is-flipped" : ""}`}>
      <div className="portfolio-recommendation-face portfolio-recommendation-front" aria-hidden={isExpanded}>
        <div className="portfolio-recommendation-meta">
          <span className="portfolio-recommendation-risk">{play.riskLabel}</span>
          <span className="portfolio-recommendation-context">{play.context}</span>
        </div>

        <div className="portfolio-recommendation-copy">
          <h3>{play.headline}</h3>
          <p>{play.analysis}</p>
        </div>

        <div className="portfolio-recommendation-why">
          <span>Why this matters</span>
          <div>
            {play.reasons.map((reason) => (
              <p key={reason.text}>
                {portfolioRecommendationReasonIcon(reason.icon)}
                <span>{portfolioRecommendationReasonText(reason)}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="portfolio-recommendation-action">
          <span>Suggested action</span>
          <p>{play.command}</p>
          <div className="portfolio-recommendation-actions">
            <button type="button" className="portfolio-recommendation-action-button is-primary" tabIndex={isInteractive && !isExpanded ? 0 : -1}>
              <span>{play.primaryAction}</span>
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              className="portfolio-recommendation-action-button is-secondary"
              aria-expanded={isExpanded}
              disabled={!isInteractive}
              tabIndex={isInteractive && !isExpanded ? 0 : -1}
              onClick={onToggleLogic}
            >
              {play.secondaryAction}
            </button>
          </div>
        </div>
      </div>

      <div className="portfolio-recommendation-face portfolio-recommendation-back" aria-hidden={!isExpanded}>
        <div className="portfolio-logic-header">
          <span>portfolio AI logic</span>
          <em>{play.context}</em>
        </div>

        <div className="portfolio-logic-copy">
          <h3>{play.headline}</h3>
          <p>{play.explanation}</p>
        </div>

        <div className="portfolio-logic-stream" aria-label="Recommendation logic">
          {play.logic.map((line, index) => (
            <p
              key={line}
              style={
                {
                  animationDelay: `${180 + index * 140}ms`,
                } as React.CSSProperties
              }
            >
              {line}
            </p>
          ))}
        </div>

        <div className="portfolio-logic-footer">
          <button
            type="button"
            className="portfolio-recommendation-action-button is-secondary"
            disabled={!isInteractive}
            tabIndex={isInteractive && isExpanded ? 0 : -1}
            onClick={onToggleLogic}
          >
            Back to play
          </button>
        </div>
      </div>
    </article>
  );
}


function PortfolioScreen({ onHome, onFunds, onPortfolio }: { onHome: () => void; onFunds: () => void; onPortfolio: () => void }) {
  const portfolioAppRef = useRef<HTMLElement | null>(null);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState("Synced 2m ago");
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [activePlayIndex, setActivePlayIndex] = useState(2);
  const [playCycleDirection, setPlayCycleDirection] = useState<"next" | "previous" | null>(null);
  const totalValue = PORTFOLIO_HOLDINGS.reduce((sum, holding) => sum + holding.value, 0);
  const oneDayReturn = totalValue * (PORTFOLIO_DAY_RETURN_PERCENT / 100);
  const totalReturn = totalValue - PORTFOLIO_INVESTED_VALUE;
  const totalReturnPercent = (totalReturn / PORTFOLIO_INVESTED_VALUE) * 100;
  const topHolding = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.allocation - a.allocation)[0];
  const highRiskHoldings = PORTFOLIO_HOLDINGS.filter((holding) => holding.risk === "High");
  const activeSuggestedPlay = PORTFOLIO_SUGGESTED_PLAYS[activePlayIndex];

  useEffect(() => {
    if (!playCycleDirection) return;

    const cycleTimer = window.setTimeout(() => setPlayCycleDirection(null), 620);
    return () => window.clearTimeout(cycleTimer);
  }, [activePlayIndex, playCycleDirection]);

  const scrollPortfolioDown = () => {
    const portfolioApp = portfolioAppRef.current;
    if (!portfolioApp) return;

    portfolioApp.scrollBy({
      top: Math.max(portfolioApp.clientHeight * 0.72, 360),
      behavior: "smooth",
    });
  };

  const cycleSuggestedPlay = (direction: "next" | "previous") => {
    setExpandedPlayId(null);
    setPlayCycleDirection(direction);
    setActivePlayIndex((currentIndex) => {
      const offset = direction === "next" ? 1 : -1;
      return (currentIndex + offset + PORTFOLIO_SUGGESTED_PLAYS.length) % PORTFOLIO_SUGGESTED_PLAYS.length;
    });
  };

  const showPreviousPlay = () => cycleSuggestedPlay("previous");
  const showNextPlay = () => cycleSuggestedPlay("next");

  return (
    <main ref={portfolioAppRef} className="app-shell portfolio-app">
      <GlobalBrandNav activeView="portfolio" onHome={onHome} onFunds={onFunds} onPortfolio={onPortfolio} />
      <MarketTape basket={PORTFOLIO_MARKET_TAPE} includeGlobalItems={false} statusLabel="Live Prices" />

      <section className="portfolio-screen" aria-label="Synced portfolio screen">
        <div className="portfolio-background-grid" aria-hidden="true" />

        <section className="portfolio-hero-grid" aria-label="Portfolio overview">
          <section className="portfolio-dashboard portfolio-hero-dashboard" aria-label="Portfolio dashboard summary">
            <header className="portfolio-section-header">
              <div>
                <h1>Your Portfolio</h1>
              </div>
              <div className="portfolio-sync-cluster" aria-label="Portfolio sync controls">
                <button
                  type="button"
                  className="portfolio-sync-button"
                  aria-label="Sync portfolio"
                  title="Sync portfolio"
                  onClick={() => setPortfolioSyncStatus("Synced just now")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11a8 8 0 0 0-14.2-5.1L4 8" />
                    <path d="M4 4v4h4" />
                    <path d="M4 13a8 8 0 0 0 14.2 5.1L20 16" />
                    <path d="M20 20v-4h-4" />
                  </svg>
                </button>
                <strong aria-live="polite">{portfolioSyncStatus}</strong>
              </div>
            </header>

            <div className="portfolio-value-panel">
              <div className="portfolio-value-topline">
                <div className="portfolio-current-value">
                  <span>Current Portfolio Value</span>
                  <strong>{formatPortfolioCurrency(totalValue)}</strong>
                </div>
              </div>

              <span className="portfolio-value-divider" aria-hidden="true" />

              <div className="portfolio-metric-row">
                <div className="portfolio-metric">
                  <span>Invested value</span>
                  <strong>{formatPortfolioCurrency(PORTFOLIO_INVESTED_VALUE)}</strong>
                </div>
                <div className="portfolio-metric is-positive">
                  <span>1D returns</span>
                  <strong>
                    {formatSignedPortfolioCurrency(oneDayReturn)} ({formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT)})
                  </strong>
                </div>
                <div className="portfolio-metric is-negative">
                  <span>Total returns</span>
                  <strong>
                    {formatSignedPortfolioCurrency(totalReturn)} ({formatSignedPortfolioPercent(totalReturnPercent)})
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <aside className="portfolio-ai-panel" aria-label="Portfolio AI intelligence">
            <header>
              <div className="portfolio-ai-title-row">
                <h2>portfolio AI</h2>
                <InsightCompanion className="portfolio-ai-companion" />
              </div>
            </header>

            <div className="portfolio-ai-summary">
              <p>
                Your account is synced. The main live risk is concentrated in freight, energy, and Taiwan-linked semiconductor exposure.
              </p>
              <p>
                {topHolding.ticker} is the largest allocation at {topHolding.allocation.toFixed(1)}%, while {highRiskHoldings.map((holding) => holding.ticker).join(" and ")} carry the highest news sensitivity.
              </p>
            </div>

            <section className="portfolio-ai-block" aria-label="News affecting portfolio">
              <span>News Affecting Portfolio</span>
              <div>
                {PORTFOLIO_AI_NEWS.slice(0, 1).map((item) => (
                  <article key={item.title}>
                    <small>{item.source}</small>
                    <strong>{item.title}</strong>
                    <p>{item.tickers}</p>
                    <em>{item.severity}</em>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="portfolio-lower-grid" aria-label="Portfolio detail">
          <section className="portfolio-dashboard portfolio-main-dashboard" aria-label="Portfolio holdings and performance">
            <div className="portfolio-dashboard-grid">
              <article className="portfolio-glass-panel portfolio-performance-panel">
                <div className="portfolio-panel-heading">
                  <span>Performance</span>
                  <strong>6M trajectory</strong>
                </div>
                <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
              </article>

              <article className="portfolio-glass-panel portfolio-composition-panel">
                <div className="portfolio-panel-heading">
                  <span>Composition</span>
                  <strong>Allocation</strong>
                </div>
                <PortfolioCompositionDonut holdings={PORTFOLIO_HOLDINGS} />
              </article>
            </div>

            <article className="portfolio-glass-panel portfolio-holdings-panel">
              <div className="portfolio-panel-heading">
                <span>Holdings</span>
                <strong>Stock-wise value</strong>
              </div>
              <table className="portfolio-holdings-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Sector</th>
                    <th>Value</th>
                    <th>Alloc.</th>
                    <th>Move</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_HOLDINGS.map((holding) => (
                    <tr key={holding.ticker} className={`portfolio-holding-row risk-${holding.risk.toLowerCase()}`}>
                      <td>
                        <strong>{holding.ticker}</strong>
                        <span>{holding.name}</span>
                      </td>
                      <td>{holding.sector}</td>
                      <td>{formatPortfolioCurrency(holding.value)}</td>
                      <td>{holding.allocation.toFixed(1)}%</td>
                      <td className={holding.dayMove >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioMove(holding.dayMove)}</td>
                      <td>
                        <em className={`portfolio-risk-pill risk-${holding.risk.toLowerCase()}`}>{holding.risk}</em>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>

          <aside className="portfolio-insight-column" aria-label="Portfolio action panels">
            <section className="portfolio-ai-block portfolio-risk-stock-block" aria-label="High risk stocks">
              <span>High-Risk Stocks</span>
              <div className="portfolio-risk-grid">
                {highRiskHoldings.map((holding) => (
                  <article key={holding.ticker}>
                    <strong>{holding.ticker}</strong>
                    <p>{holding.sector} / {holding.allocation.toFixed(1)}% allocation</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="portfolio-ai-block portfolio-recommendations-block" aria-label="Suggested plays">
              <div className="portfolio-suggested-header">
                <span>Recommended Plays</span>
              </div>
              <div className="portfolio-suggested-list">
                <button type="button" className="portfolio-stack-arrow portfolio-stack-arrow-prev" aria-label="Previous recommendation" onClick={showPreviousPlay}>
                  <ChevronLeft aria-hidden="true" />
                </button>

                <div className={`portfolio-card-stack${playCycleDirection ? ` is-cycling-${playCycleDirection}` : ""}`} aria-live="polite">
                  {PORTFOLIO_SUGGESTED_PLAYS.map((play, index) => {
                    const stackPosition = (index - activePlayIndex + PORTFOLIO_SUGGESTED_PLAYS.length) % PORTFOLIO_SUGGESTED_PLAYS.length;
                    const isActive = stackPosition === 0;

                    return (
                      <div
                        key={play.id}
                        className={`portfolio-highlight-recommendation priority-${play.priority.toLowerCase()} stack-position-${stackPosition}${isActive ? " is-active" : ""}`}
                        aria-hidden={!isActive}
                      >
                        <PortfolioRecommendationCard
                          play={play}
                          isExpanded={isActive && expandedPlayId === play.id}
                          isInteractive={isActive}
                          onToggleLogic={() => setExpandedPlayId((currentId) => (currentId === play.id ? null : play.id))}
                        />
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="portfolio-stack-arrow portfolio-stack-arrow-next" aria-label="Next recommendation" onClick={showNextPlay}>
                  <ChevronRight aria-hidden="true" />
                </button>

                <div className="portfolio-stack-counter" aria-label={`Recommendation ${activePlayIndex + 1} of ${PORTFOLIO_SUGGESTED_PLAYS.length}`}>
                  {PORTFOLIO_SUGGESTED_PLAYS.map((play, index) => (
                    <span key={play.id} className={index === activePlayIndex ? "is-active" : ""} />
                  ))}
                </div>

                <span className="portfolio-stack-sr-status">
                  {activeSuggestedPlay ? `${activeSuggestedPlay.headline}, ${activeSuggestedPlay.riskLabel}` : ""}
                </span>
              </div>
            </section>
          </aside>
        </section>

        <button type="button" className="portfolio-scroll-cue" aria-label="Scroll portfolio screen down" onClick={scrollPortfolioDown}>
          <span />
        </button>
      </section>
    </main>
  );
}

function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [selectedNewsId, setSelectedNewsId] = useState(() => newsIdFromArticlePath(window.location.pathname) ?? DEFAULT_NEWS_ID);
  const [activeView, setActiveView] = useState<AppView>(() => routeToView(window.location.pathname));

  useEffect(() => {
    if (activeView === "funds" || data) return;

    getBootstrapData()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [activeView, data]);

  useEffect(() => {
    const onPopState = () => {
      const articleNewsId = newsIdFromArticlePath(window.location.pathname);
      if (articleNewsId) setSelectedNewsId(articleNewsId);
      setActiveView(routeToView(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const sectors = data?.sectors ?? [];
  const selectedSector = sectors.find((sector) => sector.id === selectedSectorId) ?? sectors[0];
  const selectedNews = GEO_NEWS_FEED.find((news) => news.id === selectedNewsId) ?? GEO_NEWS_FEED[0];

  const selectSector = (sectorId: string) => {
    setSelectedSectorId(sectorId);
  };

  const navigateToNewsDashboard = () => {
    setActiveView("news");
    if (window.location.pathname !== NEWS_DASHBOARD_PATH) {
      window.history.pushState({}, "", NEWS_DASHBOARD_PATH);
    }
  };

  const navigateToNewsArticle = (news: GeotaggedNewsItem) => {
    setSelectedNewsId(news.id);
    setActiveView("article");
    const path = newsArticlePath(news.id);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  const navigateToLensDashboard = () => {
    setActiveView("lens");
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  };

  const navigateToFunds = () => {
    setActiveView("funds");
    if (window.location.pathname !== FUNDS_PATH) {
      window.history.pushState({}, "", FUNDS_PATH);
    }
  };

  const navigateToPortfolio = () => {
    setActiveView("portfolio");
    if (window.location.pathname !== PORTFOLIO_PATH) {
      window.history.pushState({}, "", PORTFOLIO_PATH);
    }
  };

  if (activeView === "funds") {
    return (
      <FundsScreen
        navigation={
          <GlobalBrandNav activeView="funds" onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />
        }
      />
    );
  }

  if (error) {
    return (
      <main className="app-shell error-shell">
        <div className="status-panel">
          <p className="eyebrow">API offline</p>
          <h1>Sovereign Lens cannot reach the intelligence feed.</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <div className="loading-panel">
          <span className="pulse-dot" />
          <p>Calibrating sovereign risk layers</p>
        </div>
      </main>
    );
  }

  if (activeView === "news") {
    return <NewsDashboard data={data} onBack={navigateToLensDashboard} />;
  }

  if (activeView === "article") {
    return (
      <NewsArticleView
        news={selectedNews}
        sectors={sectors}
        selectedSectorId={selectedSector?.id ?? selectedSectorId}
        onBack={navigateToLensDashboard}
        onOpenFeed={navigateToNewsDashboard}
        onSectorSelect={selectSector}
      />
    );
  }

  if (activeView === "portfolio") {
    return <PortfolioScreen onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />;
  }

  return (
    <main className="app-shell global-monitor-app">
      <GlobalBrandNav activeView={activeView} onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />
      <MarketTape basket={GLOBAL_MARKET_TAPE} />
      <GlobeMonitor />
    </main>
  );
}

export default App;
