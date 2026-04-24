import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { MeshBasicMaterial } from "three";
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

type PaneKey = "sectors" | "pulse" | "country";

const DEFAULT_COLLAPSED_PANES: Record<PaneKey, boolean> = {
  sectors: true,
  pulse: true,
  country: true,
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
const MARKET_TAPE_ITEMS: MarketTapeItem[] = [
  { label: "Gold Spot", value: "$2,386.40", move: "+0.42%", direction: "up" },
  { label: "Brent Crude", value: "$88.12", move: "-0.31%", direction: "down" },
  { label: "S&P 500", value: "5,214.08", move: "+0.18%", direction: "up" },
  { label: "Nasdaq 100", value: "18,084.70", move: "-0.27%", direction: "down" },
  { label: "Nifty 50", value: "24,152.80", move: "+0.36%", direction: "up" },
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

function MarketTape({ items }: { items: MarketTapeItem[] }) {
  const tapeItems = [...items, ...items];

  return (
    <section className="market-tape" aria-label="Market tape">
      <div className="market-tape-viewport">
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
  const activeTheme = sectorTheme(selectedSector?.id ?? selectedSectorId);
  const countryFeatures = useMemo(() => buildCountryFeatures(countries), [countries]);
  const isoByNumeric = useMemo(() => new Map(countries.map((country) => [country.iso_numeric, country.iso3])), [countries]);
  const hiddenPolygonMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        visible: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );

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
        lat: 20,
        lng: 0,
        altitude: width < 780 ? 2.35 : 1.8,
      },
      2000,
    );
  }, [data, width]);

  const focusCountry = (country: Country, duration = 1400) => {
    globeRef.current?.pointOfView?.(
      {
        lat: country.coordinates.lat,
        lng: country.coordinates.lng,
        altitude: width < 780 ? 2.25 : 1.62,
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
        <span className="pane-toggle-icon" aria-hidden="true">{collapsed ? "+" : "-"}</span>
        <span className="pane-toggle-label">{label}</span>
        {meta ? <span className="pane-toggle-meta">{meta}</span> : null}
      </button>
    );
  };

  const sectorIsoSet = useMemo(() => {
    if (!selectedSector) return new Set<string>();
    return new Set([...selectedSector.power_nodes, ...selectedSector.consumption_nodes]);
  }, [selectedSector]);

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

    return [...globalTradeArcs, ...sectorArcs, ...tradeArcs];
  }, [activeTheme, countries, countryByIso, selectedCountry, selectedSector, tradeFlow]);

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

  const labels = useMemo<LabelDatum[]>(() => {
    if (!selectedSector) return [];
    const countryLabels = countries.map((country) => ({
      lat: country.coordinates.lat,
      lng: country.coordinates.lng,
      text: country.capital.toUpperCase(),
    }));
    const chokepointLabels = selectedSector.chokepoints.map((point) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      text: point.name.toUpperCase(),
    }));

    return [...countryLabels, ...chokepointLabels];
  }, [countries, selectedSector]);

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
          rendererConfig={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          globeImageUrl={API_IMAGE_EARTH}
          backgroundColor="#00050a"
          showAtmosphere
          atmosphereColor={activeTheme.accent}
          atmosphereAltitude={0.15}
          enablePointerInteraction
          lineHoverPrecision={0.35}
          showPointerCursor
          polygonsData={countryFeatures}
          polygonsTransitionDuration={0}
          polygonCapMaterial={() => hiddenPolygonMaterial}
          polygonSideMaterial={() => hiddenPolygonMaterial}
          polygonStrokeColor={() => false}
          polygonAltitude={0}
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
          arcStroke={0.12}
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
          pointRadius={() => 0.25}
          pointAltitude={0.012}
          pointLabel="label"
          pointResolution={8}
          pointsMerge
          pointsTransitionDuration={0}
          labelsData={labels}
          labelLat="lat"
          labelLng="lng"
          labelText="text"
          labelSize={0.8}
          labelDotRadius={0.15}
          labelIncludeDot
          labelAltitude={0.018}
          labelColor={() => "rgba(222, 230, 232, 0.68)"}
          labelResolution={1}
        />
      </div>

      <MarketTape items={MARKET_TAPE_ITEMS} />

      <section className={paneClassName("sector-rail", "sectors")} aria-label="Sector overlays">
        {paneToggle("sectors", "Supply Chain", selectedSector.name)}
        <div id="sectors-pane-content" className="pane-content pane-scroll" hidden={isPaneCollapsed("sectors")}>
          <p className="eyebrow">Supply chain overlay</p>
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

      <aside className={paneClassName("pulse-hud", "pulse")} aria-label="News pulse dashboard">
        {paneToggle("pulse", "News Pulse", "Live")}
        <div id="pulse-pane-content" className="pane-content pane-scroll" hidden={isPaneCollapsed("pulse")}>
          <div className="panel-title">
            <p className="eyebrow">News pulse</p>
            <strong>Last 90 minutes</strong>
          </div>
          <div className="alert-list">
            {data.globalPulse.alerts.map((alert) => (
              <article key={alert.id} className={`alert-item ${scoreClass(alert.severity === "High Risk" ? 8 : 5)}`}>
                <div className="alert-meta">
                  <span>{alert.region}</span>
                  <time dateTime={`PT${alert.age_minutes}M`}>{formatAlertAge(alert.age_minutes)}</time>
                </div>
                <p>{alert.headline}</p>
                <small>{alert.impact}</small>
              </article>
            ))}
          </div>
          <div className="movement-grid">
            {data.marketPulse.map((movement) => (
              <div key={movement.id} className="movement-item">
                <strong>{movement.instrument}</strong>
                <span className={movement.move_pct >= 0 ? "positive" : "negative"}>{formatMove(movement.move_pct)}</span>
                <small>{movement.trigger}</small>
              </div>
            ))}
          </div>
        </div>
      </aside>

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
