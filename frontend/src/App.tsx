import { useEffect, useMemo, useState } from "react";
import { getBootstrapData } from "./api";
import globeTextureUrl from "./assets/globe-premium-dark.svg";
import { GlobeMonitor } from "./globe-monitor/GlobeMonitor";
import type { BootstrapData, Coordinates, MarketPoint, PulseAlert, Sector } from "./types";

interface SectorTheme {
  accent: string;
  rgb: string;
  onAccent: string;
}

interface MarketTapeItem {
  label: string;
  value: string;
  move: string;
  direction: "up" | "down";
}

interface MarketTapeBasket {
  label: string;
  items: MarketTapeItem[];
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
type AppView = "lens" | "news" | "article";

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
const GLOBAL_MARKET_TAPE: MarketTapeBasket = {
  label: "Global Market + Risk Tape",
  items: [
    { label: "DXY", value: "106.42", move: "+0.18%", direction: "up" },
    { label: "US10Y", value: "4.61%", move: "+6 bp", direction: "up" },
    { label: "Gold Spot", value: "$2,386.40", move: "+0.42%", direction: "up" },
    { label: "Brent Crude", value: "$88.12", move: "-0.31%", direction: "down" },
    { label: "S&P 500", value: "5,214.08", move: "+0.18%", direction: "up" },
    { label: "Nasdaq 100", value: "18,084.70", move: "-0.27%", direction: "down" },
    { label: "Nifty 50", value: "24,152.80", move: "+0.36%", direction: "up" },
  ],
};

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

function MarketTape({ basket }: { basket: MarketTapeBasket }) {
  const globalLabels = new Set(GLOBAL_MARKET_TAPE.items.map((item) => item.label));
  const lensItems = basket.items.filter((item) => !globalLabels.has(item.label));
  const items = [...GLOBAL_MARKET_TAPE.items, ...lensItems];
  const tapeItems = [...items, ...items];

  return (
    <section className="market-tape" aria-label="Market and risk tape">
      <div className="market-tape-status">
        <span aria-hidden="true" />
        <strong>Live Markets</strong>
      </div>
      <div className="market-tape-viewport" aria-label="Global and active lens market tape">
        <div className="market-tape-track">
          {tapeItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className={`market-tape-item ${item.direction}`}
              aria-hidden={index >= items.length}
            >
              <span className="market-tape-label">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="market-tape-move">{item.move}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GlobalBrandNav({ onHome }: { onHome: () => void }) {
  return (
    <nav className="global-brand-nav" aria-label="Primary navigation">
      <button type="button" className="global-brand-button" onClick={onHome} aria-label="Go to Sovereign Lens home">
        <span>Sovereign</span>
        <strong>Lens</strong>
      </button>
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

function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [selectedNewsId, setSelectedNewsId] = useState(() => newsIdFromArticlePath(window.location.pathname) ?? DEFAULT_NEWS_ID);
  const [activeView, setActiveView] = useState<AppView>(() => routeToView(window.location.pathname));

  useEffect(() => {
    getBootstrapData()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

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

  return (
    <main className="app-shell global-monitor-app">
      <GlobalBrandNav onHome={navigateToLensDashboard} />
      <MarketTape basket={GLOBAL_MARKET_TAPE} />
      <GlobeMonitor />
    </main>
  );
}

export default App;
