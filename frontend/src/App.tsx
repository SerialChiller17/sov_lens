import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { getBootstrapData } from "./api";
import { buildCountryFeatures, type GlobeCountryFeature } from "./geo";
import type { BootstrapData, Country, MarketPoint, Sector, TradeFlow } from "./types";

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label: string;
  stroke: number;
  altitude: number;
}

interface PointDatum {
  lat: number;
  lng: number;
  label: string;
  color: string;
  radius: number;
}

const EXPORT_COLOR = "#00ffff";
const IMPORT_COLOR = "#ff8c00";
const STABLE_COLOR = "#2dff88";
const AMBER_COLOR = "#ffb000";
const RISK_COLOR = "#ff3355";
const DIM_COLOR = "rgba(120, 136, 132, 0.16)";
const API_IMAGE_EARTH = "//unpkg.com/three-globe/example/img/earth-night.jpg";
const API_IMAGE_SKY = "//unpkg.com/three-globe/example/img/night-sky.png";

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

function App() {
  const globeRef = useRef<any>(null);
  const { width, height } = useWindowSize();
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState("IND");
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [tradeFlow, setTradeFlow] = useState<TradeFlow>("export");

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
  const countryFeatures = useMemo(() => buildCountryFeatures(countries), [countries]);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
    }
  }, [data]);

  useEffect(() => {
    if (!selectedCountry || !globeRef.current) return;
    globeRef.current.pointOfView?.(
      {
        lat: selectedCountry.coordinates.lat,
        lng: selectedCountry.coordinates.lng,
        altitude: width < 780 ? 2.2 : 1.55,
      },
      900,
    );
  }, [selectedCountry, width]);

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
    const sectorArcs = selectedSector.arcs.flatMap((arc) => {
      const source = countryByIso.get(arc.source);
      const target = countryByIso.get(arc.target);
      if (!source || !target) return [];
      return [
        {
          startLat: source.coordinates.lat,
          startLng: source.coordinates.lng,
          endLat: target.coordinates.lat,
          endLng: target.coordinates.lng,
          color: selectedSector.color,
          label: `${source.iso3} to ${target.iso3}`,
          stroke: 0.45 + arc.intensity,
          altitude: 0.18 + arc.intensity * 0.22,
        },
      ];
    });

    const tradeArcs = selectedCountry.trade_partners
      .filter((partner) => partner.flow === tradeFlow)
      .flatMap((partner) => {
        const target = countryByIso.get(partner.iso3);
        if (!target) return [];
        const exportMode = partner.flow === "export";
        return [
          {
            startLat: exportMode ? selectedCountry.coordinates.lat : target.coordinates.lat,
            startLng: exportMode ? selectedCountry.coordinates.lng : target.coordinates.lng,
            endLat: exportMode ? target.coordinates.lat : selectedCountry.coordinates.lat,
            endLng: exportMode ? target.coordinates.lng : selectedCountry.coordinates.lng,
            color: exportMode ? EXPORT_COLOR : IMPORT_COLOR,
            label: `${selectedCountry.iso3} ${partner.flow} link: ${partner.name}`,
            stroke: 0.95,
            altitude: 0.28,
          },
        ];
      });

    return [...sectorArcs, ...tradeArcs];
  }, [countryByIso, selectedCountry, selectedSector, tradeFlow]);

  const points = useMemo<PointDatum[]>(() => {
    if (!selectedCountry || !selectedSector) return [];
    const nodePoints = [...selectedSector.power_nodes, ...selectedSector.consumption_nodes].flatMap((iso3) => {
      const country = countryByIso.get(iso3);
      if (!country) return [];
      return [
        {
          lat: country.coordinates.lat,
          lng: country.coordinates.lng,
          label: `${country.name} node`,
          color: selectedSector.power_nodes.includes(iso3) ? "#ffffff" : selectedSector.color,
          radius: selectedSector.power_nodes.includes(iso3) ? 0.42 : 0.28,
        },
      ];
    });

    const chokepoints = selectedSector.chokepoints.map((point) => ({
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      label: point.name,
      color: RISK_COLOR,
      radius: 0.34,
    }));

    return [
      ...nodePoints,
      ...chokepoints,
      {
        lat: selectedCountry.coordinates.lat,
        lng: selectedCountry.coordinates.lng,
        label: `${selectedCountry.name} selected`,
        color: EXPORT_COLOR,
        radius: 0.5,
      },
    ];
  }, [countryByIso, selectedCountry, selectedSector]);

  const polygonColor = (feature: object) => {
    const iso3 = (feature as GlobeCountryFeature).properties.iso3;
    if (!iso3) return "rgba(62, 72, 68, 0.18)";
    const country = countryByIso.get(iso3);
    if (!country) return "rgba(62, 72, 68, 0.18)";

    const selected = iso3 === selectedIso;
    const sectorLinked = sectorIsoSet.has(iso3);
    const tradeLinked = tradeIsoSet.has(iso3);
    const hovered = iso3 === hoverIso;
    const activeColor = scoreColor(country.tension_score);

    if (selected) return `${activeColor}ee`;
    if (tradeLinked) return tradeFlow === "export" ? "rgba(0, 255, 255, 0.9)" : "rgba(255, 140, 0, 0.9)";
    if (sectorLinked) return `${selectedSector?.color ?? activeColor}cc`;
    if (hovered) return `${activeColor}bb`;
    if (selectedSector || selectedCountry) return DIM_COLOR;
    return `${activeColor}aa`;
  };

  const handlePolygonClick = (feature: object) => {
    const iso3 = (feature as GlobeCountryFeature).properties.iso3;
    if (!iso3 || !countryByIso.has(iso3)) return;
    setSelectedIso(iso3);
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
    <main className="app-shell">
      <div className="globe-stage" aria-label="Interactive 3D geopolitical risk globe">
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          globeImageUrl={API_IMAGE_EARTH}
          backgroundImageUrl={API_IMAGE_SKY}
          showAtmosphere
          atmosphereColor="#d6fff6"
          atmosphereAltitude={0.18}
          polygonsData={countryFeatures}
          polygonCapColor={polygonColor}
          polygonSideColor={() => "rgba(0, 0, 0, 0.18)"}
          polygonStrokeColor={(feature: object) => {
            const iso3 = (feature as GlobeCountryFeature).properties.iso3;
            if (iso3 === selectedIso || iso3 === hoverIso) return "#ffffff";
            if (iso3 && sectorIsoSet.has(iso3)) return selectedSector.color;
            return "rgba(210, 255, 243, 0.18)";
          }}
          polygonAltitude={(feature: object) => {
            const iso3 = (feature as GlobeCountryFeature).properties.iso3;
            if (iso3 === selectedIso) return 0.035;
            if (iso3 && (tradeIsoSet.has(iso3) || sectorIsoSet.has(iso3))) return 0.025;
            return 0.008;
          }}
          onPolygonClick={handlePolygonClick}
          onPolygonHover={(feature: object | null) => {
            const iso3 = feature ? (feature as GlobeCountryFeature).properties.iso3 : null;
            setHoverIso(iso3 ?? null);
          }}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcStroke="stroke"
          arcAltitude="altitude"
          arcDashLength={0.45}
          arcDashGap={0.18}
          arcDashAnimateTime={2200}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="radius"
          pointAltitude={0.045}
          pointLabel="label"
        />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <strong>Sovereign Lens</strong>
            <span>Geopolitical risk x market flow</span>
          </div>
        </div>
        <div className="status-strip">
          <span>Structural: {data.globalPulse.last_structural_update}</span>
          <span>Sentiment: {data.globalPulse.last_sentiment_update}</span>
        </div>
      </header>

      <section className="sector-rail" aria-label="Sector overlays">
        <p className="eyebrow">Supply chain overlay</p>
        {sectors.map((sector) => (
          <button
            key={sector.id}
            className={sector.id === selectedSector.id ? "sector-button active" : "sector-button"}
            style={{ "--accent": sector.color } as React.CSSProperties}
            onClick={() => setSelectedSectorId(sector.id)}
          >
            <span>{sector.name}</span>
            <strong>{sector.sensitivity.toFixed(1)}</strong>
          </button>
        ))}
      </section>

      <aside className="pulse-hud" aria-label="Global pulse dashboard">
        <div className="panel-title">
          <p className="eyebrow">Global pulse</p>
          <strong>Last 90 minutes</strong>
        </div>
        <div className="alert-list">
          {data.globalPulse.alerts.map((alert) => (
            <article key={alert.id} className={`alert-item ${scoreClass(alert.severity === "High Risk" ? 8 : 5)}`}>
              <span>{alert.region}</span>
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
      </aside>

      <aside className="country-panel" aria-label="Country intelligence sidebar">
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
            <span style={{ width: `${selectedCountry.tension_score * 10}%`, background: scoreColor(selectedCountry.tension_score) }} />
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
            <button className={tradeFlow === "export" ? "active" : ""} onClick={() => setTradeFlow("export")}>
              Exports
            </button>
            <button className={tradeFlow === "import" ? "active" : ""} onClick={() => setTradeFlow("import")}>
              Imports
            </button>
          </div>
          {selectedCountry.trade_partners
            .filter((partner) => partner.flow === tradeFlow)
            .map((partner) => (
              <button
                key={`${partner.flow}-${partner.iso3}`}
                className="partner-row"
                onClick={() => countryByIso.has(partner.iso3) && setSelectedIso(partner.iso3)}
              >
                <span>{partner.name}</span>
                <strong>{partner.share.toFixed(1)}%</strong>
                <small>{partner.thesis}</small>
              </button>
            ))}
        </section>

        <blockquote>{selectedCountry.contrarian_insight}</blockquote>
      </aside>

      <section className="sector-panel" aria-label="Selected sector intelligence">
        <div>
          <p className="eyebrow">Active sector</p>
          <h2>{selectedSector.name}</h2>
        </div>
        <p>{selectedSector.brief}</p>
        <div className="sector-facts">
          <span>{selectedSector.market_value}</span>
          <span>{selectedSector.systemic_multiplier}</span>
          <span>{selectedSector.equity_proxy}</span>
        </div>
        <strong>{selectedSector.alpha}</strong>
      </section>

      <footer className="legend-bar">
        <span><i className="legend stable" />Stable 1-3</span>
        <span><i className="legend amber" />Developing 4-6</span>
        <span><i className="legend risk" />High Risk 7-10</span>
        <span><i className="legend export" />Exports</span>
        <span><i className="legend import" />Imports</span>
      </footer>
    </main>
  );
}

export default App;
