import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { getBootstrapData } from "./api";
import countryBorderPaths from "./assets/country-border-paths.json";
import globeTextureUrl from "./assets/globe-premium-dark.svg";
import indiaBoundaryPaths from "./assets/india-boundary-paths.soi.json";
import { buildCountryFeatures, type GlobeCountryFeature } from "./geo";
import type { BootstrapData, Country, MarketPoint, PulseAlert, Sector, TradeFlow } from "./types";

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  label: string;
  stroke?: number;
}

interface PointDatum {
  lat: number;
  lng: number;
  label: string;
  color: string;
  radius: number;
}

interface LabelDatum {
  lat: number;
  lng: number;
  text: string;
  kind?: "country" | "chokepoint" | "conflict";
  selected?: boolean;
}

interface RingDatum {
  lat: number;
  lng: number;
  color: string | string[];
  maxRadius: number;
  repeatPeriod: number;
  propagationSpeed: number;
}

interface BoundaryPathPoint {
  lat: number;
  lng: number;
  alt: number;
}

interface BoundaryPathDatum {
  points: BoundaryPathPoint[];
  area: number;
  id?: string;
  iso3?: string;
  source?: string;
}

interface RenderPathPoint extends BoundaryPathPoint {
  borderAlt: number;
}

interface RenderPathDatum extends BoundaryPathDatum {
  points: RenderPathPoint[];
}

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

interface ConflictVisualDatum extends ConflictDatum {
  selected: boolean;
  muted: boolean;
}

type PaneKey = "sectors" | "pulse" | "country";
type AppView = "lens" | "news";

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
const COUNTRY_BORDER_PATHS = (countryBorderPaths as { paths: BoundaryPathDatum[] }).paths;
const INDIA_BOUNDARY_PATHS = (indiaBoundaryPaths as { paths: BoundaryPathDatum[] }).paths;
const MAX_RENDER_PIXEL_RATIO = 2;
const ATLAS_BORDER_ALTITUDE = 0.088;
const INDIA_BORDER_ALTITUDE = 0.098;
const SELECTED_BORDER_STROKE = 0.82;
const LINKED_BORDER_STROKE = 0.66;
const INDIA_BORDER_STROKE = 0.48;
const DEFAULT_BORDER_STROKE = 0.34;
const BOUNDARY_RENDER_ORDER = 5;
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
  return pathname === NEWS_DASHBOARD_PATH ? "news" : "lens";
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

function rgba(theme: SectorTheme, alpha: number) {
  return `rgba(${theme.rgb}, ${alpha})`;
}

function stabilizeBoundaryPathMaterials(globe: any) {
  const scene = globe?.scene?.();
  if (!scene) return;

  scene.traverse?.((object: any) => {
    let current = object;
    let isBoundaryPath = false;
    while (current) {
      if (current.__globeObjType === "path") {
        isBoundaryPath = true;
        break;
      }
      current = current.parent;
    }
    if (!isBoundaryPath) return;

    object.renderOrder = BOUNDARY_RENDER_ORDER;
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach((material: any) => {
      material.transparent = true;
      material.depthWrite = false;
      material.depthTest = true;
      material.alphaToCoverage = true;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      material.polygonOffsetUnits = -1;
      material.needsUpdate = true;
    });
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

function severityClass(severity: ConflictSeverity) {
  return severity.toLowerCase();
}

function conflictRingColor(severity: ConflictSeverity) {
  if (severity === "Critical") return ["rgba(216, 82, 72, 0.58)", "rgba(216, 82, 72, 0.2)", "rgba(216, 82, 72, 0)"];
  if (severity === "High") return ["rgba(239, 104, 78, 0.56)", "rgba(222, 112, 72, 0.2)", "rgba(222, 112, 72, 0)"];
  if (severity === "Elevated") return ["rgba(214, 158, 85, 0.42)", "rgba(214, 158, 85, 0.15)", "rgba(214, 158, 85, 0)"];
  return ["rgba(189, 160, 102, 0.24)", "rgba(189, 160, 102, 0.08)", "rgba(189, 160, 102, 0)"];
}

function conflictMarkerPalette(severity: ConflictSeverity) {
  if (severity === "Critical") return { core: "#ff5b55", ring: "#f2a061", glow: "255, 91, 85" };
  if (severity === "High") return { core: "#ff7151", ring: "#e6a15b", glow: "255, 113, 81" };
  if (severity === "Elevated") return { core: "#dfa458", ring: "#c79755", glow: "223, 164, 88" };
  return { core: "#bfa064", ring: "#a88955", glow: "191, 160, 100" };
}

function createConflictMarkerTexture(conflict: ConflictVisualDatum) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const palette = conflictMarkerPalette(conflict.severity);
  const center = 128;
  const selected = conflict.selected;
  const mutedAlpha = conflict.muted ? 0.48 : 1;
  const glowRadius = selected ? 116 : conflict.severity === "High" || conflict.severity === "Critical" ? 82 : 58;
  const innerRadius = selected ? 26 : conflict.severity === "Watch" ? 12 : 17;

  context.clearRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(center, center, 2, center, center, glowRadius);
  glow.addColorStop(0, `rgba(${palette.glow}, ${0.62 * mutedAlpha})`);
  glow.addColorStop(0.34, `rgba(${palette.glow}, ${0.24 * mutedAlpha})`);
  glow.addColorStop(1, `rgba(${palette.glow}, 0)`);
  context.fillStyle = glow;
  context.beginPath();
  context.arc(center, center, glowRadius, 0, Math.PI * 2);
  context.fill();

  context.lineWidth = selected ? 5 : 3;
  context.strokeStyle = `rgba(${palette.glow}, ${0.62 * mutedAlpha})`;
  context.beginPath();
  context.arc(center, center, selected ? 46 : 31, 0, Math.PI * 2);
  context.stroke();

  if (selected) {
    context.lineWidth = 3;
    context.strokeStyle = `rgba(${palette.glow}, ${0.36 * mutedAlpha})`;
    context.beginPath();
    context.arc(center, center, 70, 0, Math.PI * 2);
    context.stroke();
  }

  context.lineWidth = 3;
  context.strokeStyle = `rgba(${palette.glow}, ${0.72 * mutedAlpha})`;
  context.beginPath();
  context.arc(center, center, innerRadius, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = palette.core;
  context.shadowColor = palette.core;
  context.shadowBlur = selected ? 34 : 18;
  context.beginPath();
  context.arc(center, center, selected ? 15 : 8, 0, Math.PI * 2);
  context.fill();

  if (selected) {
    context.shadowBlur = 14;
    context.fillStyle = "rgba(255, 238, 226, 0.96)";
    context.beginPath();
    context.arc(center, center, 6, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createConflictMarkerObject(conflict: ConflictVisualDatum) {
  const texture = createConflictMarkerTexture(conflict);
  const group = new THREE.Group();
  if (!texture) return group;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: conflict.muted ? 0.52 : 1,
    depthTest: !conflict.selected,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const size = conflict.selected ? 14 : conflict.severity === "High" || conflict.severity === "Critical" ? 6.4 : 4.6;
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = conflict.selected ? 20 : 6;
  group.add(sprite);
  return group;
}

function ConflictCard({ conflict, onClose }: { conflict: ConflictDatum; onClose: () => void }) {
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
  const globeRef = useRef<any>(null);
  const initialViewSet = useRef(false);
  const { width, height } = useWindowSize();
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState("IND");
  const [highlightIso, setHighlightIso] = useState<string | null>(null);
  const [sectorHighlightsActive, setSectorHighlightsActive] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [activeLensMode, setActiveLensMode] = useState<LensMode>("country");
  const [tradeFlow, setTradeFlow] = useState<TradeFlow>("export");
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>("red-sea");
  const [collapsedPanes, setCollapsedPanes] = useState<Record<PaneKey, boolean>>(() => ({ ...DEFAULT_COLLAPSED_PANES }));
  const [activeView, setActiveView] = useState<AppView>(() => routeToView(window.location.pathname));

  useEffect(() => {
    getBootstrapData()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    const onPopState = () => setActiveView(routeToView(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const countries = data?.countries ?? [];
  const sectors = data?.sectors ?? [];
  const countryByIso = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  const selectedCountry = countryByIso.get(selectedIso) ?? countries[0];
  const selectedSector = sectors.find((sector) => sector.id === selectedSectorId) ?? sectors[0];
  const selectedConflict = ACTIVE_CONFLICTS.find((conflict) => conflict.id === selectedConflictId);
  const countryLeadSector = selectedCountry?.industry_criticality[0] ?? selectedSector?.name ?? "Strategic sectors";
  const activeTheme = sectorTheme(selectedSector?.id ?? selectedSectorId);
  const activeTapeBasket = MARKET_TAPE_BY_SECTOR[selectedSector?.id ?? selectedSectorId] ?? GLOBAL_MARKET_TAPE;
  const countryFeatures = useMemo(() => buildCountryFeatures(countries), [countries]);
  const isoByNumeric = useMemo(() => new Map(countries.map((country) => [country.iso_numeric, country.iso3])), [countries]);
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.18;
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.rotateSpeed = 0.52;
      controls.zoomSpeed = 0.5;
      controls.enablePan = false;
    }
    globeRef.current.renderer?.().setPixelRatio(Math.min(window.devicePixelRatio, MAX_RENDER_PIXEL_RATIO));
  }, [data]);

  useEffect(() => {
    if (!data || !globeRef.current || initialViewSet.current) return;
    initialViewSet.current = true;
    globeRef.current.pointOfView?.(
      {
        lat: 24,
        lng: 43,
        altitude: width < 780 ? 2.08 : 1.62,
      },
      2000,
    );
  }, [data, width]);

  const focusCountry = (country: Country, duration = 1400) => {
    globeRef.current?.pointOfView?.(
      {
        lat: country.coordinates.lat,
        lng: country.coordinates.lng,
        altitude: width < 780 ? 1.96 : 1.38,
      },
      duration,
    );
  };

  const selectCountry = (iso3: string) => {
    const country = countryByIso.get(iso3);
    if (!country) return;
    setSelectedIso(iso3);
    setHighlightIso(iso3);
    focusCountry(country);
  };

  const selectSector = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    setSectorHighlightsActive(true);
  };

  const selectTradeFlow = (flow: TradeFlow) => {
    setTradeFlow(flow);
    setSectorHighlightsActive(true);
  };

  const focusConflict = (conflict: ConflictDatum, duration = 1300) => {
    globeRef.current?.pointOfView?.(
      {
        lat: conflict.lat,
        lng: conflict.lng,
        altitude: width < 780 ? 1.92 : 1.44,
      },
      duration,
    );
  };

  const selectConflict = (conflict: ConflictDatum) => {
    setSelectedConflictId(conflict.id);
    focusConflict(conflict);
  };

  const navigateToNewsDashboard = () => {
    setActiveView("news");
    if (window.location.pathname !== NEWS_DASHBOARD_PATH) {
      window.history.pushState({}, "", NEWS_DASHBOARD_PATH);
    }
  };

  const navigateToLensDashboard = () => {
    setActiveView("lens");
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  };

  const activateLensMode = (mode: LensMode) => {
    if (mode === "news") {
      navigateToNewsDashboard();
      return;
    }
    setActiveLensMode(mode);
    if (mode === "pulse" && !selectedConflictId) {
      setSelectedConflictId(ACTIVE_CONFLICTS[0]?.id ?? null);
    }
  };

  const isPaneCollapsed = (pane: PaneKey) => collapsedPanes[pane];

  const togglePane = (pane: PaneKey) => {
    setCollapsedPanes((current) => ({
      ...current,
      [pane]: !current[pane],
    }));
  };

  const paneClassName = (baseClass: string, pane: PaneKey) =>
    `${baseClass} collapsible-pane ${isPaneCollapsed(pane) ? "is-collapsed" : "is-expanded"}`;

  const paneToggle = (pane: PaneKey, label: string, meta?: string) => {
    const collapsed = isPaneCollapsed(pane);
    return (
      <button
        type="button"
        className="pane-toggle"
        aria-expanded={!collapsed}
        aria-controls={`${pane}-pane-content`}
        onClick={() => togglePane(pane)}
      >
        <span className={`pane-toggle-icon ${collapsed ? "is-plus" : "is-minus"}`} aria-hidden="true" />
        <span className="pane-toggle-label">{label}</span>
        {meta ? <span className="pane-toggle-meta">{meta}</span> : null}
      </button>
    );
  };

  const sectorIsoSet = useMemo(() => {
    if (!selectedSector) return new Set<string>();
    return new Set([...selectedSector.power_nodes, ...selectedSector.consumption_nodes]);
  }, [selectedSector]);

  const priorityConflictIds = useMemo(
    () =>
      new Set(
        [...ACTIVE_CONFLICTS]
          .sort((left, right) => SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity])
          .slice(0, 3)
          .map((conflict) => conflict.id),
      ),
    [],
  );

  const tradeIsoSet = useMemo(() => {
    if (!selectedCountry) return new Set<string>();
    return new Set(
      selectedCountry.trade_partners
        .filter((partner) => partner.flow === tradeFlow)
        .map((partner) => partner.iso3),
    );
  }, [selectedCountry, tradeFlow]);

  const arcs = useMemo<ArcDatum[]>(() => {
    if (!selectedCountry || !selectedSector) return [];
    const arcColor: [string, string] = [rgba(activeTheme, 0.02), rgba(activeTheme, 0.82)];
    const mutedArcColor: [string, string] = [rgba(activeTheme, 0), rgba(activeTheme, 0.42)];
    const routeKeys = new Set<string>();
    const addArc = (source: Country, target: Country, label: string, color: [string, string]) => {
      const key = `${source.iso3}-${target.iso3}-${label}`;
      if (routeKeys.has(key)) return [];
      routeKeys.add(key);
      return [
        {
          startLat: source.coordinates.lat,
          startLng: source.coordinates.lng,
          endLat: target.coordinates.lat,
          endLng: target.coordinates.lng,
          color,
          label,
        },
      ];
    };

    const globalTradeArcs = countries.flatMap((country) =>
      country.trade_partners.flatMap((partner) => {
        const target = countryByIso.get(partner.iso3);
        if (!target) return [];
        const isSelectedRoute = country.iso3 === selectedCountry.iso3 || target.iso3 === selectedCountry.iso3;
        return addArc(country, target, `${country.iso3} ${partner.flow} ${target.iso3}`, isSelectedRoute ? arcColor : mutedArcColor);
      }),
    );

    const sectorArcs = selectedSector.arcs.flatMap((arc) => {
      const source = countryByIso.get(arc.source);
      const target = countryByIso.get(arc.target);
      if (!source || !target) return [];
      return addArc(source, target, `${source.iso3} sector ${target.iso3}`, arcColor);
    });

    const tradeArcs = selectedCountry.trade_partners
      .filter((partner) => partner.flow === tradeFlow)
      .flatMap((partner) => {
        const target = countryByIso.get(partner.iso3);
        if (!target) return [];
        const exportMode = partner.flow === "export";
        return addArc(
          exportMode ? selectedCountry : target,
          exportMode ? target : selectedCountry,
          `${selectedCountry.iso3} ${partner.flow} link: ${partner.name}`,
          arcColor,
        );
      });

    const conflictArcs = selectedConflict
      ? selectedConflict.transmission.map((target) => ({
          startLat: selectedConflict.lat,
          startLng: selectedConflict.lng,
          endLat: target.lat,
          endLng: target.lng,
          color:
            target.type === "route"
              ? (["rgba(0, 245, 255, 0.02)", "rgba(0, 245, 255, 0.28)"] as [string, string])
              : (["rgba(213, 150, 82, 0.02)", "rgba(213, 150, 82, 0.34)"] as [string, string]),
          label: `${selectedConflict.name} transmission: ${target.label}`,
          stroke: 0.045,
        }))
      : [];

    return [...globalTradeArcs, ...sectorArcs, ...tradeArcs, ...conflictArcs];
  }, [activeTheme, countries, countryByIso, selectedConflict, selectedCountry, selectedSector, tradeFlow]);

  const points = useMemo<PointDatum[]>(() => {
    if (!selectedCountry || !selectedSector) return [];
    const nodePoints = countries.map((country) => ({
      lat: country.coordinates.lat,
      lng: country.coordinates.lng,
      label: `${country.capital} node`,
      color: activeTheme.accent,
      radius: 0.25,
    }));

    const chokepoints = selectedSector.chokepoints.map((point) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      label: point.name,
      color: activeTheme.accent,
      radius: 0.22,
    }));

    return [
      ...nodePoints,
      ...chokepoints,
      {
        lat: selectedCountry.coordinates.lat,
        lng: selectedCountry.coordinates.lng,
        label: `${selectedCountry.name} selected`,
        color: activeTheme.accent,
        radius: 0.25,
      },
    ];
  }, [activeTheme, countries, selectedCountry, selectedSector]);

  const conflictVisuals = useMemo<ConflictVisualDatum[]>(
    () =>
      ACTIVE_CONFLICTS.map((conflict) => {
        const selected = conflict.id === selectedConflictId;
        return {
          ...conflict,
          selected,
          muted: Boolean(selectedConflictId && !selected),
        };
      }),
    [selectedConflictId],
  );

  const conflictRings = useMemo<RingDatum[]>(
    () =>
      ACTIVE_CONFLICTS.filter((conflict) => conflict.severity !== "Watch" || conflict.id === selectedConflictId).flatMap((conflict) => {
        const selected = conflict.id === selectedConflictId;
        const critical = conflict.severity === "Critical";
        const primaryRing = {
          lat: conflict.lat,
          lng: conflict.lng,
          color: conflictRingColor(conflict.severity),
          maxRadius: selected ? 8.4 : critical ? 3.1 : conflict.severity === "High" ? 2.7 : 1.9,
          repeatPeriod: selected ? 3100 : critical ? 3400 : 4300,
          propagationSpeed: selected ? 1.8 : critical ? 0.72 : 0.52,
        };
        if (!selected) return [primaryRing];
        return [
          primaryRing,
          {
            lat: conflict.lat,
            lng: conflict.lng,
            color: conflictRingColor(conflict.severity),
            maxRadius: 11.4,
            repeatPeriod: 4700,
            propagationSpeed: 2.25,
          },
        ];
      }),
    [selectedConflictId],
  );

  const labels = useMemo<LabelDatum[]>(() => {
    if (!selectedSector) return [];
    const focusIsoSet = new Set(["IND", "USA", "ARE", "SAU", "TWN"]);
    const countryLabels = countries
      .filter((country) => focusIsoSet.has(country.iso3))
      .map((country) => ({
        lat: country.coordinates.lat,
        lng: country.coordinates.lng,
        text: country.capital.toUpperCase(),
        kind: "country" as const,
      }));
    const chokepointLabels = selectedSector.chokepoints.slice(0, 1).map((point) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      text: point.name.toUpperCase(),
      kind: "chokepoint" as const,
    }));
    const conflictLabels = ACTIVE_CONFLICTS.filter(
      (conflict) => conflict.id === selectedConflictId || priorityConflictIds.has(conflict.id),
    ).map((conflict) => {
      const selected = conflict.id === selectedConflictId;
      return {
        lat: conflict.lat + (selected ? 0.15 : 0),
        lng: conflict.lng + (selected ? 3.4 : 1.1),
        text: conflict.name,
        kind: "conflict" as const,
        selected,
      };
    });

    return [...countryLabels, ...chokepointLabels, ...conflictLabels];
  }, [countries, priorityConflictIds, selectedConflictId, selectedSector]);

  const borderPaths = useMemo<RenderPathDatum[]>(() => {
    const withAltitude = (path: BoundaryPathDatum, iso3?: string, source?: string): RenderPathDatum => ({
      ...path,
      iso3,
      source: source ?? path.source,
      points: path.points.map((point) => ({
        ...point,
        borderAlt: source === "survey-of-india" ? INDIA_BORDER_ALTITUDE : ATLAS_BORDER_ALTITUDE,
      })),
    });
    const atlasPaths = COUNTRY_BORDER_PATHS.flatMap((path) => {
      if (path.id === "356") return [];
      const iso3 = path.id ? isoByNumeric.get(path.id) : undefined;
      if (!iso3) return [];
      return [withAltitude(path, iso3)];
    });
    const indiaPaths = INDIA_BOUNDARY_PATHS.map((path) => withAltitude(path, "IND", "survey-of-india"));

    return [...atlasPaths, ...indiaPaths];
  }, [isoByNumeric]);

  useEffect(() => {
    if (!globeRef.current) return;
    const frame = window.requestAnimationFrame(() => stabilizeBoundaryPathMaterials(globeRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [borderPaths]);

  const handlePolygonClick = (feature: object) => {
    const iso3 = (feature as GlobeCountryFeature).properties.iso3;
    if (!iso3 || !countryByIso.has(iso3)) return;
    selectCountry(iso3);
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

  if (!selectedCountry || !selectedSector) {
    return (
      <main className="app-shell">
        <div className="loading-panel">
          <span className="pulse-dot" />
          <p>Calibrating sovereign risk layers</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="app-shell"
      style={
        {
          "--accent": PREMIUM_ORANGE_THEME.accent,
          "--accent-rgb": PREMIUM_ORANGE_THEME.rgb,
          "--accent-on": PREMIUM_ORANGE_THEME.onAccent,
        } as React.CSSProperties
      }
      >
      <div className="globe-stage" aria-label="Interactive 3D geopolitical risk globe">
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          globeImageUrl={API_IMAGE_EARTH}
          backgroundColor="rgba(0, 5, 10, 0)"
          showAtmosphere
          atmosphereColor={activeTheme.accent}
          atmosphereAltitude={0.15}
          enablePointerInteraction
          lineHoverPrecision={0.35}
          showPointerCursor
          polygonsData={countryFeatures}
          polygonsTransitionDuration={0}
          polygonCapColor={() => "rgba(58, 79, 86, 0.72)"}
          polygonSideColor={() => "rgba(3, 16, 20, 0.34)"}
          polygonStrokeColor={() => "rgba(135, 165, 169, 0)"}
          polygonAltitude={0.012}
          polygonCapCurvatureResolution={1}
          onPolygonClick={handlePolygonClick}
          pathsData={borderPaths}
          pathPoints="points"
          pathPointLat={(point: object) => (point as BoundaryPathPoint).lat}
          pathPointLng={(point: object) => (point as BoundaryPathPoint).lng}
          pathPointAlt={(point: object) => (point as RenderPathPoint).borderAlt}
          pathResolution={1}
          pathColor={(path: object) => {
            const borderPath = path as BoundaryPathDatum;
            if (borderPath.iso3 === highlightIso) return rgba(activeTheme, 0.82);
            if (sectorHighlightsActive && borderPath.iso3 && (sectorIsoSet.has(borderPath.iso3) || tradeIsoSet.has(borderPath.iso3))) {
              return rgba(activeTheme, 0.56);
            }
            return "rgba(218, 226, 226, 0.28)";
          }}
          pathStroke={(path: object) => {
            const borderPath = path as BoundaryPathDatum;
            if (borderPath.iso3 === highlightIso) return SELECTED_BORDER_STROKE;
            if (sectorHighlightsActive && borderPath.iso3 && (sectorIsoSet.has(borderPath.iso3) || tradeIsoSet.has(borderPath.iso3))) {
              return LINKED_BORDER_STROKE;
            }
            if (borderPath.source === "survey-of-india") return INDIA_BORDER_STROKE;
            return DEFAULT_BORDER_STROKE;
          }}
          pathTransitionDuration={0}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(arc: object) => (arc as ArcDatum).color}
          arcStroke={(arc: object) => (arc as ArcDatum).stroke ?? 0.12}
          arcAltitude={0.2}
          arcCurveResolution={32}
          arcCircularResolution={1}
          arcDashLength={0.4}
          arcDashGap={4}
          arcDashInitialGap={(arc: object) => ((arc as ArcDatum).label.length % 17) / 17}
          arcDashAnimateTime={2600}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius={(point: object) => (point as PointDatum).radius}
          pointAltitude={() => 0.012}
          pointLabel="label"
          pointResolution={8}
          pointsTransitionDuration={0}
          objectsData={conflictVisuals}
          objectLat="lat"
          objectLng="lng"
          objectAltitude={(object: object) => ((object as ConflictVisualDatum).selected ? 0.07 : 0.052)}
          // react-globe.gl uses this singular prop at runtime, while its types currently expose a plural name.
          {...({ objectFacesSurface: false } as any)}
          objectThreeObject={(object: object) => createConflictMarkerObject(object as ConflictVisualDatum)}
          objectLabel={(object: object) => {
            const conflict = object as ConflictVisualDatum;
            return `${conflict.name}: ${conflict.severity}`;
          }}
          onObjectClick={(object: object) => selectConflict(object as ConflictDatum)}
          ringsData={conflictRings}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius="maxRadius"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringAltitude={0.036}
          ringResolution={48}
          labelsData={labels}
          labelLat="lat"
          labelLng="lng"
          labelText="text"
          labelSize={(label: object) => {
            const item = label as LabelDatum;
            if (item.kind !== "conflict") return 0.46;
            return item.selected ? 0.9 : 0.66;
          }}
          labelDotRadius={(label: object) => ((label as LabelDatum).kind === "conflict" ? 0.03 : 0.08)}
          labelIncludeDot={(label: object) => (label as LabelDatum).kind !== "conflict"}
          labelAltitude={(label: object) => ((label as LabelDatum).kind === "conflict" ? 0.066 : 0.018)}
          labelColor={(label: object) => {
            const item = label as LabelDatum;
            if (item.kind !== "conflict") return "rgba(222, 230, 232, 0.52)";
            return item.selected ? "rgba(255, 232, 216, 0.96)" : "rgba(231, 221, 204, 0.72)";
          }}
          labelResolution={1}
        />
      </div>

      <header className="home-dashboard-topbar" aria-label="Sovereign Lens navigation">
        <div className="home-wordmark" aria-label="Sovereign Lens">
          <span>Sovereign</span>
          <strong>Lens</strong>
        </div>
        <span className="home-topbar-rule" aria-hidden="true" />
        <p>Geopolitical risk command</p>
        <button
          type="button"
          className="home-news-button"
          aria-label="Open News Pulse dashboard"
          onClick={navigateToNewsDashboard}
        >
          News Pulse
        </button>
        <label className="home-search">
          <span className="sr-only">Search countries, sectors, or conflicts</span>
          <input type="search" placeholder="Search countries, sectors, or conflicts..." />
          <span className="events-search-icon" aria-hidden="true" />
        </label>
      </header>

      <MarketTape basket={activeTapeBasket} />
    </main>
  );
}

export default App;
