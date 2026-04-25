import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { getBootstrapData } from "./api";
import countryBorderPaths from "./assets/country-border-paths.json";
import globeTextureUrl from "./assets/globe-premium-dark.svg";
import indiaBoundaryPaths from "./assets/india-boundary-paths.soi.json";
import { buildCountryFeatures, type GlobeCountryFeature } from "./geo";
import type { BootstrapData, Country, MarketPoint, Sector, TradeFlow } from "./types";

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
const ATLAS_BORDER_ALTITUDE = 0.064;
const INDIA_BORDER_ALTITUDE = 0.074;
const SELECTED_BORDER_STROKE = 0.82;
const LINKED_BORDER_STROKE = 0.66;
const INDIA_BORDER_STROKE = 0.7;
const DEFAULT_BORDER_STROKE = 0.58;
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
      material.depthWrite = false;
      material.depthTest = true;
      material.alphaToCoverage = true;
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
  const [tradeFlow, setTradeFlow] = useState<TradeFlow>("export");
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>("red-sea");
  const [collapsedPanes, setCollapsedPanes] = useState<Record<PaneKey, boolean>>(() => ({ ...DEFAULT_COLLAPSED_PANES }));

  useEffect(() => {
    getBootstrapData()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const countries = data?.countries ?? [];
  const sectors = data?.sectors ?? [];
  const countryByIso = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  const selectedCountry = countryByIso.get(selectedIso) ?? countries[0];
  const selectedSector = sectors.find((sector) => sector.id === selectedSectorId) ?? sectors[0];
  const selectedConflict = ACTIVE_CONFLICTS.find((conflict) => conflict.id === selectedConflictId);
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
    const liveBorderIsoSet = new Set<string>();
    if (highlightIso) liveBorderIsoSet.add(highlightIso);
    if (sectorHighlightsActive) {
      sectorIsoSet.forEach((iso3) => liveBorderIsoSet.add(iso3));
      tradeIsoSet.forEach((iso3) => liveBorderIsoSet.add(iso3));
    }
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
      if (!iso3 || !liveBorderIsoSet.has(iso3)) return [];
      return [withAltitude(path, iso3)];
    });
    const indiaPaths = liveBorderIsoSet.has("IND")
      ? INDIA_BOUNDARY_PATHS.map((path) => withAltitude(path, "IND", "survey-of-india"))
      : [];

    return [...atlasPaths, ...indiaPaths];
  }, [highlightIso, isoByNumeric, sectorHighlightsActive, sectorIsoSet, tradeIsoSet]);

  useEffect(() => {
    if (!globeRef.current) return;
    const frame = window.requestAnimationFrame(() => stabilizeBoundaryPathMaterials(globeRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [borderPaths, activeTheme.accent]);

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

  if (!data || !selectedCountry || !selectedSector) {
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
          "--accent": activeTheme.accent,
          "--accent-rgb": activeTheme.rgb,
          "--accent-on": activeTheme.onAccent,
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
          polygonStrokeColor={() => "rgba(135, 165, 169, 0.34)"}
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

      <MarketTape basket={activeTapeBasket} />

      <section className={paneClassName("sector-rail sectors-risk-panel", "sectors")} aria-label="Sectors at risk">
        {paneToggle("sectors", "Sectors At Risk", selectedSector.name)}
        <div id="sectors-pane-content" className="pane-content pane-scroll" hidden={isPaneCollapsed("sectors")}>
          <p className="eyebrow">Sector exposure</p>
          {sectors.map((sector) => (
            <button
              key={sector.id}
              className={sector.id === selectedSector.id ? "sector-button active" : "sector-button"}
              style={
                {
                  "--sector-accent": sectorTheme(sector.id).accent,
                  "--sector-rgb": sectorTheme(sector.id).rgb,
                  "--sector-on": sectorTheme(sector.id).onAccent,
                } as React.CSSProperties
              }
              onClick={() => selectSector(sector.id)}
            >
              <span>{sector.name}</span>
              <strong>{sector.sensitivity.toFixed(1)}</strong>
            </button>
          ))}
        </div>
      </section>

      <aside className={paneClassName("pulse-hud conflict-pulse-panel", "pulse")} aria-label="Conflict pulse dashboard">
        {paneToggle("pulse", "Conflict Pulse", "Live")}
        <div id="pulse-pane-content" className="pane-content pane-scroll" hidden={isPaneCollapsed("pulse")}>
          <div className="panel-title">
            <p className="eyebrow">Active conflicts</p>
            <strong>Live</strong>
          </div>
          <div className="conflict-list">
            {ACTIVE_CONFLICTS.slice(0, 4).map((conflict) => (
              <button
                key={conflict.id}
                type="button"
                className={`conflict-row severity-${severityClass(conflict.severity)} ${
                  selectedConflictId === conflict.id ? "active" : ""
                }`}
                onClick={() => selectConflict(conflict)}
              >
                <span>{conflict.name}</span>
                <strong>{conflict.severity}</strong>
                <small>{conflict.shortDescription}</small>
                <time>{conflict.updated}</time>
              </button>
            ))}
          </div>
          <button type="button" className="conflict-view-all">View all conflicts</button>
        </div>
      </aside>

      <aside className="news-pulse-panel" aria-label="News pulse dashboard">
        <div className="panel-title">
          <p className="eyebrow">News pulse</p>
          <strong>Live</strong>
        </div>
        <div className="news-list">
          {data.globalPulse.alerts.slice(0, 3).map((alert) => (
            <article key={alert.id} className={`news-row ${scoreClass(alert.severity === "High Risk" ? 8 : 5)}`}>
              <div>
                <span>{alert.region}</span>
                <p>{alert.headline}</p>
              </div>
              <time>{formatAlertAge(alert.age_minutes)}</time>
            </article>
          ))}
        </div>
      </aside>

      {selectedConflict ? <ConflictCard conflict={selectedConflict} onClose={() => setSelectedConflictId(null)} /> : null}

      <aside className={paneClassName("country-panel", "country")} aria-label="Country intelligence sidebar">
        {paneToggle("country", "Country File", selectedCountry.iso3)}
        <div id="country-pane-content" className="pane-content pane-scroll" hidden={isPaneCollapsed("country")}>
          <div className="country-heading">
            <img src={selectedCountry.flag} alt={`${selectedCountry.name} flag`} />
            <div>
              <p className="eyebrow">{selectedCountry.iso3} sovereign file</p>
              <h1>{selectedCountry.name}</h1>
              <span>{selectedCountry.capital}</span>
            </div>
          </div>

          <div className="score-block">
            <div>
              <p className="eyebrow">Tension score</p>
              <strong className={scoreClass(selectedCountry.tension_score)}>{selectedCountry.tension_score.toFixed(1)}</strong>
              <span>{selectedCountry.tension_label}</span>
            </div>
            <div className="score-meter" aria-hidden="true">
              <span
                style={{
                  width: `${selectedCountry.tension_score * 10}%`,
                  background: scoreColor(selectedCountry.tension_score),
                  color: scoreColor(selectedCountry.tension_score),
                }}
              />
            </div>
          </div>

          <dl className="metric-grid">
            <div>
              <dt>GDP</dt>
              <dd>{compactNumber(selectedCountry.gdp_usd_bn, "B")}</dd>
            </div>
            <div>
              <dt>Population</dt>
              <dd>{compactNumber(selectedCountry.population_mn, "M")}</dd>
            </div>
            <div>
              <dt>Growth</dt>
              <dd>{formatMove(selectedCountry.gdp_growth_pct)}</dd>
            </div>
            <div>
              <dt>GDP/capita</dt>
              <dd>${selectedCountry.gdp_per_capita_usd.toLocaleString()}</dd>
            </div>
            <div>
              <dt>GINI</dt>
              <dd>{selectedCountry.gini.toFixed(1)}</dd>
            </div>
            <div>
              <dt>FX vol</dt>
              <dd>{selectedCountry.fx.volatility_24h.toFixed(1)}%</dd>
            </div>
          </dl>

          <div className="breakdown">
            <span>Structural {selectedCountry.tension_breakdown.structural.toFixed(1)}</span>
            <span>Sentiment {selectedCountry.tension_breakdown.sentiment.toFixed(1)}</span>
            <span>Live {selectedCountry.tension_breakdown.live_trigger.toFixed(1)}</span>
          </div>

          <div className="badge-row">
            {selectedCountry.groups.map((group) => (
              <span key={group}>{group}</span>
            ))}
          </div>

          <section className="intelligence-section">
            <p className="eyebrow">Industry criticality</p>
            <ul>
              {selectedCountry.industry_criticality.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="market-card">
            <div className="market-heading">
              <div>
                <p className="eyebrow">Market index pulse</p>
                <strong>{selectedCountry.market_index.name}</strong>
              </div>
              <span className={selectedCountry.market_index.change_24h >= 0 ? "positive" : "negative"}>
                {formatMove(selectedCountry.market_index.change_24h)}
              </span>
            </div>
            <Sparkline points={selectedCountry.market_index.series} />
            <p className="fx-line">
              {selectedCountry.fx.pair} {selectedCountry.fx.rate.toLocaleString()}:
              {" "}
              {selectedCountry.fx.trigger}
            </p>
          </section>

          <section className="trade-section">
            <div className="trade-tabs">
              <button className={tradeFlow === "export" ? "active" : ""} onClick={() => selectTradeFlow("export")}>
                Exports
              </button>
              <button className={tradeFlow === "import" ? "active" : ""} onClick={() => selectTradeFlow("import")}>
                Imports
              </button>
            </div>
            {selectedCountry.trade_partners
              .filter((partner) => partner.flow === tradeFlow)
              .map((partner) => (
                <button
                  key={`${partner.flow}-${partner.iso3}`}
                  className="partner-row"
                  onClick={() => selectCountry(partner.iso3)}
                >
                  <span>{partner.name}</span>
                  <strong>{partner.share.toFixed(1)}%</strong>
                  <small>{partner.thesis}</small>
                </button>
              ))}
          </section>

          <blockquote>{selectedCountry.contrarian_insight}</blockquote>
        </div>
      </aside>
    </main>
  );
}

export default App;
