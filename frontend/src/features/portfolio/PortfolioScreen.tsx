import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Bell, ChevronDown, Maximize2, RefreshCw, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { GlobalBrandNav } from "../../app/GlobalBrandNav";
import type { AppView } from "../../app/routes";
import { DetailedSparkline } from "../../components/charts/DetailedSparkline";
import {
  NIFTY_50_PERFORMANCE,
  PORTFOLIO_ALLOCATION_COLORS,
  PORTFOLIO_AI_NEWS,
  PORTFOLIO_AI_TRUST,
  PORTFOLIO_COCKPIT,
  PORTFOLIO_DAY_RETURN_PERCENT,
  PORTFOLIO_HOLDING_CONTEXT,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_INVESTED_VALUE,
  PORTFOLIO_PERFORMANCE,
  PORTFOLIO_SUGGESTED_PLAYS,
} from "./portfolioData";
import {
  formatPortfolioCurrency,
  formatPortfolioTapePrice,
  formatSignedPortfolioCurrency,
  formatSignedPortfolioMove,
  formatSignedPortfolioPercent,
} from "./portfolioFormatters";
import { MarketSummary } from "./MarketSummary";
import { PortfolioPerformanceChart } from "./PortfolioPerformanceChart";
import {
  EARNINGS_DAYS,
  EARNINGS_EVENTS,
  MARKET_BREADTH,
  MARKET_DATA_NOTICE,
  MARKET_DEVELOPMENTS,
  MARKET_HEATMAP_TILES,
  MARKET_INDEX_CARDS,
  MARKET_MOVERS,
  MARKET_SUMMARY_ITEMS,
  MARKET_SUMMARY_SOURCES,
  MARKET_STANDOUTS,
  EARNINGS_EVENT_CONTEXT,
  SCREENER_PRESETS,
  SCREENER_ROW_CONTEXT,
  SCREENER_ROWS,
  SECTOR_PERFORMANCE,
  WATCHLIST_ITEM_CONTEXT,
  WATCHLIST_ITEMS,
  WATCHLIST_MOVEMENTS,
  WATCHLIST_NEWS,
  type EarningsEvent,
  type MarketHeatmapTile,
  type MarketIndexCard,
  type MarketDevelopment,
  type MarketMover,
  type MarketStandout,
  type ScreenerRow,
  type WorkspaceTone,
} from "./portfolioWorkspaceData";

interface FinanceNavigationProps {
  onHome: () => void;
  onMarkets: () => void;
  onEarnings: (query?: string) => void;
  onFunds: () => void;
  onScreener: (query?: string) => void;
  onWatchlist: () => void;
  onPortfolio: () => void;
  onAnswer: (request: { id?: string; query: string; title?: string; summary?: string }) => void | Promise<void>;
}

type PortfolioScreenProps = FinanceNavigationProps;

interface ScreenerScreenProps extends FinanceNavigationProps {
  initialQuery?: string;
}

interface EarningsScreenProps extends FinanceNavigationProps {
  initialQuery?: string;
}

type EarningsFilter = "Today" | "This Week" | "Next Week" | "Recent";
type ScreenerPreset = (typeof SCREENER_PRESETS)[number];
type SortDirection = "asc" | "desc";

const EARNINGS_FILTERS: EarningsFilter[] = ["Today", "This Week", "Next Week", "Recent"];
const WATCHLIST_FILTERS = ["Watched", "Alerts", "All"] as const;
type WatchlistFilter = (typeof WATCHLIST_FILTERS)[number];
const WATCHLIST_TRACKED_STORAGE_KEY = "sov-finance-watchlist-tracked";
const WATCHLIST_ALERTS_STORAGE_KEY = "sov-finance-watchlist-alerts";
const DEFAULT_TRACKED_TICKERS = WATCHLIST_ITEMS.slice(0, 4).map((item) => item.ticker);
const DEFAULT_ALERT_TICKERS = WATCHLIST_ITEMS.filter((item) => item.alert).map((item) => item.ticker);

function loadStoredTickerSet(storageKey: string, fallbackTickers: string[]) {
  if (typeof window === "undefined") return new Set(fallbackTickers);

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) return new Set(fallbackTickers);

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return new Set(fallbackTickers);

    const validTickers = new Set(WATCHLIST_ITEMS.map((item) => item.ticker));
    return new Set(parsedValue.filter((ticker): ticker is string => typeof ticker === "string" && validTickers.has(ticker)));
  } catch {
    return new Set(fallbackTickers);
  }
}

function persistTickerSet(storageKey: string, tickers: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(tickers)));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

const SCREENER_COLUMNS: Array<{ key: keyof ScreenerRow; label: string; className?: string }> = [
  { key: "marketCapCr", label: "M Cap", className: "is-numeric" },
  { key: "price", label: "Price", className: "is-numeric" },
  { key: "pe", label: "P/E", className: "is-numeric" },
  { key: "oneMonth", label: "1M", className: "is-numeric" },
  { key: "oneYear", label: "1Y", className: "is-numeric" },
  { key: "profitGrowth", label: "Profit", className: "is-numeric" },
  { key: "roe", label: "ROE", className: "is-numeric" },
  { key: "debtEquity", label: "D/E", className: "is-numeric" },
];

function formatPercent(value: number, maximumFractionDigits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(maximumFractionDigits)}%`;
}

function formatCompactCrores(value: number) {
  if (value >= 100000) return `${(value / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L Cr`;
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

interface HeatmapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeatmapTileLayout extends HeatmapRect {
  stock: MarketHeatmapTile;
  labelLevel: "full" | "medium" | "compact" | "micro";
}

interface HeatmapSectorLayout extends HeatmapRect {
  sector: string;
  industries: string;
  totalWeight: number;
  weightedMove: number;
  tiles: HeatmapTileLayout[];
}

interface HeatmapLayout {
  sectors: HeatmapSectorLayout[];
  tiles: HeatmapTileLayout[];
}

interface WeightedHeatmapItem<T> {
  item: T;
  area: number;
}

function sumWeighted<T>(items: T[], getWeight: (item: T) => number) {
  return items.reduce((sum, item) => sum + Math.max(getWeight(item), 0.001), 0);
}

function heatmapWeight(stock: MarketHeatmapTile) {
  return Math.max(stock.marketCapCr, 1);
}

function insetHeatmapRect(rect: HeatmapRect, horizontalGap: number, verticalGap = horizontalGap): HeatmapRect {
  return {
    x: rect.x + horizontalGap,
    y: rect.y + verticalGap,
    width: Math.max(rect.width - horizontalGap * 2, 0.08),
    height: Math.max(rect.height - verticalGap * 2, 0.08),
  };
}

function getWorstHeatmapRatio<T>(row: Array<WeightedHeatmapItem<T>>, sideLength: number) {
  if (!row.length) return Number.POSITIVE_INFINITY;

  const rowArea = row.reduce((sum, entry) => sum + entry.area, 0);
  const minArea = Math.min(...row.map((entry) => entry.area));
  const maxArea = Math.max(...row.map((entry) => entry.area));
  const sideSquared = sideLength * sideLength;

  return Math.max((sideSquared * maxArea) / (rowArea * rowArea), (rowArea * rowArea) / (sideSquared * minArea));
}

function layoutHeatmapRow<T>(row: Array<WeightedHeatmapItem<T>>, rect: HeatmapRect) {
  const rowArea = row.reduce((sum, entry) => sum + entry.area, 0);
  const output: Array<{ item: T; rect: HeatmapRect }> = [];

  if (rect.width >= rect.height) {
    const rowWidth = rowArea / Math.max(rect.height, 0.001);
    let nextY = rect.y;

    row.forEach((entry, index) => {
      const itemHeight = index === row.length - 1 ? rect.y + rect.height - nextY : entry.area / Math.max(rowWidth, 0.001);
      output.push({ item: entry.item, rect: { x: rect.x, y: nextY, width: rowWidth, height: Math.max(itemHeight, 0.001) } });
      nextY += itemHeight;
    });

    return {
      output,
      remainingRect: { x: rect.x + rowWidth, y: rect.y, width: Math.max(rect.width - rowWidth, 0.001), height: rect.height },
    };
  }

  const rowHeight = rowArea / Math.max(rect.width, 0.001);
  let nextX = rect.x;

  row.forEach((entry, index) => {
    const itemWidth = index === row.length - 1 ? rect.x + rect.width - nextX : entry.area / Math.max(rowHeight, 0.001);
    output.push({ item: entry.item, rect: { x: nextX, y: rect.y, width: Math.max(itemWidth, 0.001), height: rowHeight } });
    nextX += itemWidth;
  });

  return {
    output,
    remainingRect: { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: Math.max(rect.height - rowHeight, 0.001) },
  };
}

function buildWeightedRects<T>(
  items: T[],
  rect: HeatmapRect,
  getWeight: (item: T) => number,
): Array<{ item: T; rect: HeatmapRect }> {
  if (!items.length) return [];

  const totalWeight = sumWeighted(items, getWeight);
  const totalArea = rect.width * rect.height;
  const remainingItems = items.map((item) => ({
    item,
    area: (Math.max(getWeight(item), 0.001) / Math.max(totalWeight, 0.001)) * totalArea,
  }));
  const output: Array<{ item: T; rect: HeatmapRect }> = [];
  let remainingRect = rect;
  let row: Array<WeightedHeatmapItem<T>> = [];

  while (remainingItems.length) {
    const nextItem = remainingItems[0];
    const sideLength = Math.min(remainingRect.width, remainingRect.height);
    const currentRatio = getWorstHeatmapRatio(row, sideLength);
    const nextRatio = getWorstHeatmapRatio([...row, nextItem], sideLength);

    if (!row.length || nextRatio <= currentRatio) {
      row.push(nextItem);
      remainingItems.shift();
    } else {
      const rowLayout = layoutHeatmapRow(row, remainingRect);
      output.push(...rowLayout.output);
      remainingRect = rowLayout.remainingRect;
      row = [];
    }
  }

  if (row.length) {
    output.push(...layoutHeatmapRow(row, remainingRect).output);
  }

  return output;
}

function getHeatmapLabelLevel(rect: HeatmapRect): HeatmapTileLayout["labelLevel"] {
  const area = rect.width * rect.height;
  const shortSide = Math.min(rect.width, rect.height);

  if (area >= 96 && shortSide >= 4.8) return "full";
  if (area >= 38 && shortSide >= 3.1) return "medium";
  if (area >= 12 && shortSide >= 1.9) return "compact";
  return "micro";
}

function getWeightedMove(stocks: MarketHeatmapTile[]) {
  const totalWeight = sumWeighted(stocks, heatmapWeight);
  return stocks.reduce((sum, stock) => sum + stock.changePercent * heatmapWeight(stock), 0) / Math.max(totalWeight, 0.001);
}

function buildNiftyHeatmapLayout(stocks: MarketHeatmapTile[]): HeatmapLayout {
  const sectors = Array.from(
    stocks.reduce((sectorMap, stock) => {
      const existing = sectorMap.get(stock.sector) ?? [];
      existing.push(stock);
      sectorMap.set(stock.sector, existing);
      return sectorMap;
    }, new Map<string, MarketHeatmapTile[]>()),
  )
    .map(([sector, sectorStocks]) => ({
      sector,
      stocks: [...sectorStocks].sort((a, b) => heatmapWeight(b) - heatmapWeight(a)),
      totalWeight: sumWeighted(sectorStocks, heatmapWeight),
      weightedMove: getWeightedMove(sectorStocks),
    }))
    .sort((a, b) => b.totalWeight - a.totalWeight);

  const sectorRects = buildWeightedRects(sectors, { x: 0, y: 0, width: 100, height: 100 }, (sector) => sector.totalWeight);

  const sectorLayouts = sectorRects.map(({ item: sector, rect }) => {
    const industries = Array.from(
      sector.stocks.reduce((industryMap, stock) => {
        industryMap.set(stock.industry, (industryMap.get(stock.industry) ?? 0) + heatmapWeight(stock));
        return industryMap;
      }, new Map<string, number>()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([industry]) => industry)
      .join(" / ");
    const headerHeight = rect.height >= 7.6 && rect.width >= 7 ? Math.min(3.4, Math.max(1.7, rect.height * 0.11)) : 0;
    const bodyRect = insetHeatmapRect(
      {
        x: rect.x,
        y: rect.y + headerHeight,
        width: rect.width,
        height: Math.max(rect.height - headerHeight, 0.1),
      },
      0.08,
      0.08,
    );
    const tileRects = buildWeightedRects(sector.stocks, bodyRect, heatmapWeight);
    const tiles = tileRects.map(({ item: stock, rect: tileRect }) => {
      const insetRect = insetHeatmapRect(tileRect, 0.04, 0.04);
      return {
        ...insetRect,
        stock,
        labelLevel: getHeatmapLabelLevel(insetRect),
      };
    });

    return {
      ...insetHeatmapRect(rect, 0.08, 0.08),
      sector: sector.sector,
      industries,
      totalWeight: sector.totalWeight,
      weightedMove: sector.weightedMove,
      tiles,
    };
  });

  return {
    sectors: sectorLayouts,
    tiles: sectorLayouts.flatMap((sector) => sector.tiles),
  };
}

function formatCompactVolume(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
  if (value >= 100000) return `${(value / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} L`;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function heatmapToneStyles(value: number) {
  const clampedValue = Math.max(-3, Math.min(3, value));
  const absValue = Math.abs(clampedValue);

  if (absValue < 0.08) {
    return {
      "--heatmap-bg": "#333332",
      "--heatmap-border": "rgba(255, 255, 255, 0.07)",
      "--heatmap-accent": "rgba(235, 235, 230, 0.68)",
      "--heatmap-text": "rgba(245, 245, 240, 0.84)",
    } as React.CSSProperties;
  }

  if (clampedValue > 0) {
    const tone =
      absValue >= 2
        ? { bg: "#5a8f46", border: "rgba(176, 218, 145, 0.24)", accent: "rgba(234, 246, 223, 0.86)" }
        : absValue >= 1
          ? { bg: "#3f6d35", border: "rgba(154, 196, 128, 0.2)", accent: "rgba(226, 240, 216, 0.8)" }
          : { bg: "#334f2f", border: "rgba(135, 176, 110, 0.17)", accent: "rgba(215, 233, 205, 0.74)" };

    return {
      "--heatmap-bg": tone.bg,
      "--heatmap-border": tone.border,
      "--heatmap-accent": tone.accent,
      "--heatmap-text": "rgba(244, 249, 240, 0.9)",
    } as React.CSSProperties;
  }

  const tone =
    absValue >= 2
      ? { bg: "#a44e61", border: "rgba(229, 142, 161, 0.26)", accent: "rgba(255, 229, 234, 0.86)" }
      : absValue >= 1
        ? { bg: "#783d49", border: "rgba(216, 128, 146, 0.2)", accent: "rgba(248, 218, 224, 0.8)" }
        : { bg: "#553036", border: "rgba(190, 107, 123, 0.17)", accent: "rgba(237, 203, 211, 0.74)" };

  return {
    "--heatmap-bg": tone.bg,
    "--heatmap-border": tone.border,
    "--heatmap-accent": tone.accent,
    "--heatmap-text": "rgba(250, 239, 241, 0.9)",
  } as React.CSSProperties;
}

function formatScreenerMetric(row: ScreenerRow, key: keyof ScreenerRow) {
  if (key === "marketCapCr") return formatCompactCrores(row.marketCapCr);
  if (key === "price") return formatPortfolioTapePrice(row.price);
  if (key === "pe") return row.pe.toFixed(1);
  if (key === "debtEquity") return row.debtEquity.toFixed(2);
  if (["oneDay", "oneMonth", "oneYear", "revenueGrowth", "profitGrowth", "roe", "dividendYield"].includes(key)) {
    return formatPercent(Number(row[key]));
  }

  return String(row[key]);
}

function toneClass(value: number | WorkspaceTone) {
  if (typeof value === "number") {
    if (value > 0) return "is-positive";
    if (value < 0) return "is-negative";
    return "is-neutral";
  }
  if (value === "positive") return "is-positive";
  if (value === "negative") return "is-negative";
  return "is-neutral";
}

function includesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function companyInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function TickerMovePill({ ticker, move }: { ticker: string; move: number }) {
  return (
    <span className={`portfolio-ticker-pill ${toneClass(move)}`}>
      <strong>{ticker}</strong>
      {formatPercent(move)}
    </span>
  );
}

function CompanyAvatar({ name, ticker }: { name: string; ticker: string }) {
  return (
    <span className="portfolio-company-avatar" aria-hidden="true">
      {companyInitials(name || ticker)}
    </span>
  );
}

function sourceInitials(name: string) {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function sourceFaviconUrl(domain?: string) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function RecentDevelopmentSourceIcon({ source }: { source: MarketDevelopment["sources"][number] }) {
  const [hasImageError, setHasImageError] = useState(false);
  const iconUrl = sourceFaviconUrl(source.domain);

  return (
    <span className="portfolio-development-source-icon" aria-hidden="true">
      {iconUrl && !hasImageError ? <img src={iconUrl} alt="" loading="lazy" onError={() => setHasImageError(true)} /> : sourceInitials(source.name)}
    </span>
  );
}

function PanelHeading({ eyebrow, title, meta }: { eyebrow?: string; title: string; meta?: string }) {
  return (
    <header className="portfolio-workspace-panel-heading">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {meta ? <strong>{meta}</strong> : null}
    </header>
  );
}

function MetricTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: WorkspaceTone }) {
  return (
    <div className={`portfolio-workspace-metric ${toneClass(tone)}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FinanceDisclaimer() {
  return (
    <p className="portfolio-finance-disclaimer">
      Financial information is sample data for product demonstration only and is not intended for trading, investment, tax, legal, accounting, or
      other advice.
    </p>
  );
}

function EarningsRail() {
  const highImpactEvents = EARNINGS_EVENTS.filter((event) => {
    const context = EARNINGS_EVENT_CONTEXT[event.id];
    return context?.importance === "High impact";
  }).slice(0, 3);

  return (
    <>
      <section className="portfolio-workspace-panel portfolio-earnings-focus-rail">
        <PanelHeading eyebrow="Earnings focus" title="Portfolio/watchlist events" meta="This week" />
        <div className="portfolio-alert-list">
          {highImpactEvents.map((event) => {
            const context = EARNINGS_EVENT_CONTEXT[event.id];

            return (
              <article key={event.id}>
                <strong>
                  {event.ticker} / {event.status}
                </strong>
                <p>{context?.watchFor ?? event.notes[0]}</p>
              </article>
            );
          })}
        </div>
      </section>
      <FinanceDisclaimer />
    </>
  );
}

function WorkspaceLayout({
  label,
  children,
  rail,
  fullWidth,
  continuation,
}: {
  label: string;
  children: React.ReactNode;
  rail: React.ReactNode;
  fullWidth?: React.ReactNode;
  continuation?: React.ReactNode;
}) {
  return (
    <section className="portfolio-finance-grid" aria-label={label}>
      <div className="portfolio-finance-main">{children}</div>
      <aside className="portfolio-finance-rail" aria-label={`${label} intelligence rail`}>
        {rail}
      </aside>
      {fullWidth ? <div className="portfolio-finance-full-span">{fullWidth}</div> : null}
      {continuation ? <div className="portfolio-finance-main portfolio-finance-main-continuation">{continuation}</div> : null}
    </section>
  );
}

function MarketIndexTile({ item }: { item: MarketIndexCard }) {
  return (
    <article className="portfolio-index-card">
      <div>
        <span>{item.name}</span>
        <h3>{item.symbol}</h3>
      </div>
      <div className="portfolio-index-card-values">
        <strong>{item.value}</strong>
        <em className={toneClass(item.changePercent)}>
          {formatPercent(item.changePercent)} {item.changeValue}
        </em>
      </div>
      <DetailedSparkline
        className="portfolio-mini-sparkline"
        data={item.points}
        trend={item.changePercent >= 0 ? "up" : "down"}
        ariaLabel={`${item.symbol} intraday trend chart`}
      />
    </article>
  );
}

function MoverList({ items }: { items: MarketMover[] }) {
  return (
    <div className="portfolio-mover-list">
      {items.map((item) => (
        <article key={item.ticker} className="portfolio-mover-row">
          <div>
            <strong>{item.name}</strong>
            <span>
              {item.ticker} / {item.exchange} / {item.sector}
            </span>
          </div>
          <div>
            <strong>{formatPortfolioTapePrice(item.price)}</strong>
            <em className={toneClass(item.move)}>{formatPercent(item.move)}</em>
          </div>
        </article>
      ))}
    </div>
  );
}

function MarketMoversPanel() {
  const [activeMoverTab, setActiveMoverTab] = useState<keyof typeof MARKET_MOVERS>("gainers");

  return (
    <section className="portfolio-workspace-panel">
      <PanelHeading eyebrow="Market movers" title="Live Indian movers" meta="Sample data" />
      <div className="portfolio-segmented-control" aria-label="Market mover category">
        {(["gainers", "losers", "active"] as Array<keyof typeof MARKET_MOVERS>).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeMoverTab === tab ? "is-active" : ""}
            aria-pressed={activeMoverTab === tab}
            onClick={() => setActiveMoverTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <MoverList items={MARKET_MOVERS[activeMoverTab]} />
    </section>
  );
}

function SectorPerformancePanel() {
  const maxMove = Math.max(...SECTOR_PERFORMANCE.map((sector) => Math.abs(sector.move)));

  return (
    <section className="portfolio-workspace-panel">
      <PanelHeading eyebrow="Sectors" title="Sector performance" />
      <div className="portfolio-sector-list">
        {SECTOR_PERFORMANCE.map((sector) => (
          <article key={sector.sector} className="portfolio-sector-row">
            <div>
              <strong>{sector.sector}</strong>
              <span>{sector.breadth}</span>
            </div>
            <div className="portfolio-sector-bar" aria-hidden="true">
              <span className={toneClass(sector.move)} style={{ width: `${(Math.abs(sector.move) / maxMove) * 100}%` }} />
            </div>
            <em className={toneClass(sector.move)}>{formatPercent(sector.move)}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeatmapLegend() {
  const steps = [
    "loss-strong",
    "loss",
    "loss-soft",
    "flat",
    "gain-soft",
    "gain",
    "gain-strong",
  ];

  return (
    <div className="portfolio-heatmap-legend" aria-label="Heatmap color legend">
      <strong>-3%</strong>
      <div>
        {steps.map((step) => (
          <span key={step} className={step} aria-hidden="true" />
        ))}
      </div>
      <strong>+3%</strong>
    </div>
  );
}

const NIFTY_HEATMAP_TIMESTAMP = "May 8, 2026, 12:37 PM GMT+5:30";

function NiftyHeatmapSurface({
  expanded = false,
  onExpand,
  onClose,
}: {
  expanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}) {
  const stocks = MARKET_HEATMAP_TILES;
  const layout = useMemo(() => buildNiftyHeatmapLayout(stocks), [stocks]);
  const [tooltip, setTooltip] = useState<{ stock: MarketHeatmapTile; x: number; y: number } | null>(null);

  const updateTooltipPosition = (xPosition: number, yPosition: number, stock: MarketHeatmapTile) => {
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    const x = Math.max(12, Math.min(xPosition, viewportWidth - 286));
    const y = Math.max(12, Math.min(yPosition, viewportHeight - 184));
    setTooltip({ stock, x, y });
  };

  const updateTooltipFromPointer = (event: React.MouseEvent<HTMLElement>, stock: MarketHeatmapTile) => {
    updateTooltipPosition(event.clientX + 14, event.clientY + 14, stock);
  };

  const updateTooltipFromElement = (element: HTMLElement, stock: MarketHeatmapTile) => {
    const rect = element.getBoundingClientRect();
    updateTooltipPosition(rect.left + Math.min(rect.width, 220) + 12, rect.top + Math.min(rect.height, 80), stock);
  };

  return (
    <div className={`portfolio-heatmap-surface ${expanded ? "is-expanded" : ""}`}>
      <header className="portfolio-heatmap-header">
        <div className="portfolio-heatmap-title-block">
          <h2>NIFTY 50 Heatmap</h2>
          {!expanded ? <p>Size by market cap. Color by 1D move.</p> : null}
        </div>
        <button
          type="button"
          className="portfolio-heatmap-action"
          onClick={expanded ? onClose : onExpand}
          aria-label={expanded ? "Close expanded NIFTY 50 heatmap" : "Expand NIFTY 50 heatmap"}
        >
          {expanded ? <X size={22} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
        </button>
      </header>

      <div className="portfolio-heatmap-content">
        <div
          className="portfolio-heatmap-stage"
          role="img"
          aria-label="NIFTY 50 stock heatmap grouped by sector, sized by market cap, and colored by one day percent move"
        >
          {layout.sectors.map((sector) => (
            <section
              key={sector.sector}
              className="portfolio-heatmap-sector"
              style={{
                left: `${sector.x}%`,
                top: `${sector.y}%`,
                width: `${sector.width}%`,
                height: `${sector.height}%`,
              }}
              aria-label={`${sector.sector} sector, ${formatPercent(sector.weightedMove)} weighted move`}
            >
              <div className="portfolio-heatmap-sector-label">
                <strong>{sector.sector}</strong>
                {sector.industries ? <span>{sector.industries}</span> : null}
              </div>
            </section>
          ))}

          {layout.tiles.map((tile) => {
            const stock = tile.stock;
            const style = {
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: `${tile.width}%`,
              height: `${tile.height}%`,
              ...heatmapToneStyles(stock.changePercent),
            } as React.CSSProperties;
            const displayTicker = expanded ? stock.symbol : stock.ticker;

            return (
              <button
                key={stock.ticker}
                type="button"
                className={`portfolio-heatmap-tile label-${tile.labelLevel}`}
                style={style}
                onMouseEnter={(event) => {
                  updateTooltipFromPointer(event, stock);
                }}
                onMouseMove={(event) => updateTooltipFromPointer(event, stock)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(event) => updateTooltipFromElement(event.currentTarget, stock)}
                onBlur={() => setTooltip(null)}
                onClick={(event) => updateTooltipFromElement(event.currentTarget, stock)}
                aria-label={`${stock.name}, ${formatPercent(stock.changePercent)}, ${stock.sector}, market cap ${formatCompactCrores(stock.marketCapCr)}`}
              >
                <strong>{displayTicker}</strong>
                {tile.labelLevel === "full" || tile.labelLevel === "medium" ? <span>{stock.name}</span> : null}
                <em>{formatPercent(stock.changePercent)}</em>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="portfolio-heatmap-footer">
        <div className="portfolio-heatmap-footer-left">
          <HeatmapLegend />
          <time dateTime="2026-05-08T12:37:00+05:30">{NIFTY_HEATMAP_TIMESTAMP}</time>
        </div>
        <span>{MARKET_DATA_NOTICE}</span>
      </footer>

      {tooltip ? (
        <div
          className="portfolio-heatmap-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="status"
          aria-live="polite"
        >
          <header>
            <strong>{tooltip.stock.symbol}</strong>
            <em className={toneClass(tooltip.stock.changePercent)}>{formatPercent(tooltip.stock.changePercent)}</em>
          </header>
          <p>{tooltip.stock.name}</p>
          <dl>
            <div>
              <dt>Sector</dt>
              <dd>{tooltip.stock.sector}</dd>
            </div>
            <div>
              <dt>Industry</dt>
              <dd>{tooltip.stock.industry}</dd>
            </div>
            <div>
              <dt>Market cap</dt>
              <dd>{formatCompactCrores(tooltip.stock.marketCapCr)}</dd>
            </div>
            <div>
              <dt>Volume</dt>
              <dd>{formatCompactVolume(tooltip.stock.volume)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function MarketHeatmapPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedHeatmap =
    isExpanded && typeof document !== "undefined"
      ? createPortal(
          <div className="portfolio-heatmap-modal" role="dialog" aria-modal="true" aria-label="Expanded NIFTY 50 heatmap">
            <div className="portfolio-heatmap-modal-backdrop" onClick={() => setIsExpanded(false)} aria-hidden="true" />
            <section className="portfolio-heatmap-modal-card">
              <NiftyHeatmapSurface expanded onClose={() => setIsExpanded(false)} />
            </section>
          </div>,
          document.body,
        )
      : null;

  useEffect(() => {
    if (!isExpanded) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };

    document.body.classList.add("portfolio-heatmap-modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("portfolio-heatmap-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <>
      <section className="portfolio-workspace-panel portfolio-heatmap-panel">
        <NiftyHeatmapSurface onExpand={() => setIsExpanded(true)} />
      </section>
      {expandedHeatmap}
    </>
  );
}

function MarketDevelopmentGrid({ onAnswer }: { onAnswer: FinanceNavigationProps["onAnswer"] }) {
  const [openingDevelopmentId, setOpeningDevelopmentId] = useState<string | null>(null);
  const openingDevelopmentRef = useRef<string | null>(null);

  const handleOpenDevelopment = (item: MarketDevelopment) => {
    if (openingDevelopmentRef.current) return;

    openingDevelopmentRef.current = item.id;
    setOpeningDevelopmentId(item.id);

    try {
      const result = onAnswer({
        id: item.id,
        query: item.aiQuery,
        title: item.title,
        summary: item.summary,
      });

      if (result && typeof result.finally === "function") {
        result.finally(() => {
          openingDevelopmentRef.current = null;
          setOpeningDevelopmentId(null);
        });
      }
    } catch (error) {
      openingDevelopmentRef.current = null;
      setOpeningDevelopmentId(null);
      throw error;
    }
  };

  return (
    <section className="portfolio-recent-developments-section">
      <header className="portfolio-recent-developments-heading">
        <h2>Recent Developments</h2>
        <strong>Updated 12 minutes ago</strong>
      </header>
      <div className="portfolio-development-grid">
        {MARKET_DEVELOPMENTS.map((item) => {
          const isOpening = openingDevelopmentId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`portfolio-development-card ${isOpening ? "is-opening" : ""}`}
              aria-label={`Open AI explanation for ${item.title}`}
              aria-busy={isOpening}
              disabled={openingDevelopmentId !== null}
              onClick={() => void handleOpenDevelopment(item)}
            >
              <span className="portfolio-development-meta">
                <span className="portfolio-development-source-stack" aria-hidden="true">
                  {item.sources.slice(0, 2).map((source) => (
                    <RecentDevelopmentSourceIcon key={`${item.id}-${source.name}`} source={source} />
                  ))}
                </span>
                <time>{item.timeAgo}</time>
              </span>
              <strong>{item.title}</strong>
              <span className="portfolio-development-divider" aria-hidden="true" />
              <p>{item.summary}</p>
              <span className="portfolio-development-opening" aria-hidden={!isOpening}>
                {isOpening ? "Opening answer" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const STANDOUT_CHART_WIDTH = 180;
const STANDOUT_CHART_HEIGHT = 78;
const STANDOUT_CHART_PADDING_X = 5;
const STANDOUT_CHART_PADDING_TOP = 9;
const STANDOUT_CHART_PADDING_BOTTOM = 11;

interface StandoutChartPoint {
  x: number;
  y: number;
  value: number;
}

function normalizeStandoutSeries(points: number[]) {
  const values = points.filter((point) => Number.isFinite(point));
  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0], values[0]];
  return [0, 0];
}

function getStandoutControlPoint(
  current: StandoutChartPoint,
  previous: StandoutChartPoint | undefined,
  next: StandoutChartPoint | undefined,
  reverse = false,
) {
  const previousPoint = previous ?? current;
  const nextPoint = next ?? current;
  const smoothing = 0.16;
  const angle = Math.atan2(nextPoint.y - previousPoint.y, nextPoint.x - previousPoint.x) + (reverse ? Math.PI : 0);
  const length = Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y) * smoothing;

  return {
    x: current.x + Math.cos(angle) * length,
    y: current.y + Math.sin(angle) * length,
  };
}

function standoutCubicCommand(points: StandoutChartPoint[], index: number) {
  const currentPoint = points[index];
  const nextPoint = points[index + 1];
  const startControl = getStandoutControlPoint(currentPoint, points[index - 1], nextPoint);
  const endControl = getStandoutControlPoint(nextPoint, currentPoint, points[index + 2], true);

  return `C ${startControl.x.toFixed(2)} ${startControl.y.toFixed(2)}, ${endControl.x.toFixed(2)} ${endControl.y.toFixed(2)}, ${nextPoint.x.toFixed(2)} ${nextPoint.y.toFixed(2)}`;
}

function buildStandoutPath(points: StandoutChartPoint[]) {
  return [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`]
    .concat(points.slice(0, -1).map((_, index) => standoutCubicCommand(points, index)))
    .join(" ");
}

function MarketStandoutSparkline({ item }: { item: MarketStandout }) {
  const values = normalizeStandoutSeries(item.points);
  const baselineValue = values[0];
  const minValue = Math.min(...values, baselineValue);
  const maxValue = Math.max(...values, baselineValue);
  const rawRange = Math.max(maxValue - minValue, 1);
  const paddedMin = minValue - rawRange * 0.14;
  const paddedMax = maxValue + rawRange * 0.12;
  const paddedRange = Math.max(paddedMax - paddedMin, 1);
  const chartHeight = STANDOUT_CHART_HEIGHT - STANDOUT_CHART_PADDING_TOP - STANDOUT_CHART_PADDING_BOTTOM;
  const chartWidth = STANDOUT_CHART_WIDTH - STANDOUT_CHART_PADDING_X * 2;
  const chartBottom = STANDOUT_CHART_HEIGHT - STANDOUT_CHART_PADDING_BOTTOM;
  const chartRight = STANDOUT_CHART_WIDTH - STANDOUT_CHART_PADDING_X;
  const yForValue = (value: number) => STANDOUT_CHART_PADDING_TOP + (1 - (value - paddedMin) / paddedRange) * chartHeight;
  const baselineY = Math.min(Math.max(yForValue(baselineValue), STANDOUT_CHART_PADDING_TOP + 4), chartBottom - 4);

  const coordinates = values.map((value, index) => ({
    value,
    x: STANDOUT_CHART_PADDING_X + (index / Math.max(values.length - 1, 1)) * chartWidth,
    y: yForValue(value),
  }));
  const fullPath = buildStandoutPath(coordinates);
  const areaPath = `${fullPath} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${chartBottom} L ${coordinates[0].x.toFixed(2)} ${chartBottom} Z`;
  const endPoint = coordinates[coordinates.length - 1];
  const gradientId = `standout-area-${item.ticker.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()}`;
  const isPositive = item.move >= 0;
  const segments = coordinates.slice(0, -1).map((point, index) => ({
    key: `${item.ticker}-${index}`,
    tone: coordinates[index + 1].value >= baselineValue ? "positive" : "negative",
    path: `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${standoutCubicCommand(coordinates, index)}`,
  }));

  return (
    <svg
      className={`portfolio-standout-sparkline ${isPositive ? "is-positive" : "is-negative"}`}
      viewBox={`0 0 ${STANDOUT_CHART_WIDTH} ${STANDOUT_CHART_HEIGHT}`}
      role="img"
      aria-label={`Intraday price trend for ${item.company}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1={STANDOUT_CHART_PADDING_TOP} y2={chartBottom} gradientUnits="userSpaceOnUse">
          <stop offset="0%" />
          <stop offset="58%" />
          <stop offset="100%" />
        </linearGradient>
      </defs>
      <path className="portfolio-standout-sparkline-reference" d={`M ${STANDOUT_CHART_PADDING_X} ${baselineY.toFixed(2)} H ${chartRight}`} aria-hidden="true" />
      <path className="portfolio-standout-sparkline-area" d={areaPath} fill={`url(#${gradientId})`} aria-hidden="true" />
      <path className="portfolio-standout-sparkline-glow" d={fullPath} aria-hidden="true" />
      {segments.map((segment) => (
        <path key={segment.key} className={`portfolio-standout-sparkline-line is-${segment.tone}`} d={segment.path} aria-hidden="true" />
      ))}
      <circle className="portfolio-standout-sparkline-end-halo" cx={endPoint.x.toFixed(2)} cy={endPoint.y.toFixed(2)} r="3.6" aria-hidden="true" />
      <circle className="portfolio-standout-sparkline-end" cx={endPoint.x.toFixed(2)} cy={endPoint.y.toFixed(2)} r="1.75" aria-hidden="true" />
    </svg>
  );
}

function StandoutMetricStrip({ item }: { item: MarketStandout }) {
  const metrics = [
    { label: "Volume", value: item.volume },
    { label: "Market cap", value: item.marketCap },
    { label: "P/E", value: item.pe },
    { label: "Dividend", value: item.dividendYield },
  ];

  return (
    <div className="portfolio-standout-metrics" aria-label={`${item.company} market metrics`}>
      {metrics.map((metric) => (
        <div key={metric.label} className="portfolio-standout-metric">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

function MarketStandoutsPanel() {
  return (
    <section className="portfolio-workspace-panel portfolio-standouts-panel">
      <PanelHeading eyebrow="Standouts" title="Names moving with force" />
      <div className="portfolio-standout-list">
        {MARKET_STANDOUTS.map((item) => (
          <article key={item.ticker} className="portfolio-standout-card">
            <div className="portfolio-standout-header">
              <div className="portfolio-standout-identity">
                <span>
                  {item.ticker} / {item.exchange}
                </span>
                <strong>{item.company}</strong>
              </div>
              <div className="portfolio-standout-price">
                <strong>{formatPortfolioTapePrice(item.price)}</strong>
                <em className={toneClass(item.move)}>{formatPercent(item.move)}</em>
              </div>
            </div>
            <MarketStandoutSparkline item={item} />
            <StandoutMetricStrip item={item} />
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketRail() {
  return (
    <>
      <section className="portfolio-workspace-panel portfolio-market-pulse-panel">
        <PanelHeading title="Market breadth" meta="Closed / IST" />
        <div className="portfolio-breadth-grid">
          <MetricTile label="Advances" value={MARKET_BREADTH.advances.toLocaleString("en-IN")} tone="positive" />
          <MetricTile label="Declines" value={MARKET_BREADTH.declines.toLocaleString("en-IN")} tone="negative" />
          <MetricTile label="52W highs" value={MARKET_BREADTH.highs52Week.toString()} tone="positive" />
          <MetricTile label="52W lows" value={MARKET_BREADTH.lows52Week.toString()} tone="negative" />
        </div>
        <div className="portfolio-flow-strip">
          <span>FII flow</span>
          <strong>{formatPortfolioCurrency(MARKET_BREADTH.fiiFlowCr * 10000000)}</strong>
          <span>DII flow</span>
          <strong>{formatPortfolioCurrency(MARKET_BREADTH.diiFlowCr * 10000000)}</strong>
        </div>
      </section>
      <FinanceDisclaimer />
    </>
  );
}

function IndianMarketsTab({ onAnswer }: { onAnswer: FinanceNavigationProps["onAnswer"] }) {
  return (
    <WorkspaceLayout label="Indian Markets" rail={<MarketRail />}>
      <section className="portfolio-workspace-panel portfolio-market-overview-panel">
        <PanelHeading eyebrow="Overview" title="Indian market overview" meta="NSE / BSE" />
        <div className="portfolio-index-grid">
          {MARKET_INDEX_CARDS.slice(0, 4).map((item) => (
            <MarketIndexTile key={item.symbol} item={item} />
          ))}
        </div>
      </section>

      <MarketSummary items={MARKET_SUMMARY_ITEMS} sources={MARKET_SUMMARY_SOURCES} />

      <MarketHeatmapPanel />

      <section className="portfolio-workspace-split">
        <MarketMoversPanel />
        <SectorPerformancePanel />
      </section>

      <MarketDevelopmentGrid onAnswer={onAnswer} />
      <MarketStandoutsPanel />
    </WorkspaceLayout>
  );
}

function EarningsCard({
  event,
  onScreener,
  onWatchlist,
}: {
  event: EarningsEvent;
  onScreener: (query: string) => void;
  onWatchlist: () => void;
}) {
  const context = EARNINGS_EVENT_CONTEXT[event.id];

  return (
    <article className={`portfolio-earnings-card portfolio-earnings-feed-card ${event.status === "Reported" ? "is-reported" : "is-upcoming"}`}>
      <CompanyAvatar name={event.company} ticker={event.ticker} />
      <div className="portfolio-earnings-feed-body">
        <div className="portfolio-earnings-company">
          <div>
            <strong>{event.company}</strong>
            <span>
              {event.ticker} / {event.quarter} / {event.time}
            </span>
          </div>
          <div className="portfolio-earnings-badge-stack">
            <em>{event.status}</em>
            {context ? <em className={context.importance === "High impact" ? "is-high-impact" : ""}>{context.importance}</em> : null}
          </div>
        </div>
        {context ? (
          <div className="portfolio-quick-chip-row portfolio-earnings-relevance-row">
            {context.relevance.slice(0, 2).map((item) => (
              <span key={`${event.id}-${item}`}>{item}</span>
            ))}
            <span>{context.theme}</span>
          </div>
        ) : null}
        <ul>
          {event.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        {context ? (
          <div className="portfolio-earnings-why">
            <div>
              <span>Why it matters</span>
              <p>{context.whyItMatters}</p>
            </div>
            <div>
              <span>Watch for</span>
              <p>{context.watchFor}</p>
            </div>
          </div>
        ) : null}
        <div className="portfolio-earnings-metrics">
          <MetricTile label="Estimate" value={event.estimate} />
          <MetricTile label="Actual" value={event.actual ?? event.dateLabel} tone={event.actual ? "positive" : "neutral"} />
          <MetricTile label="Revenue" value={formatPercent(event.revenueGrowth)} tone={event.revenueGrowth >= 0 ? "positive" : "negative"} />
          <MetricTile label="Profit" value={formatPercent(event.profitGrowth)} tone={event.profitGrowth >= 0 ? "positive" : "negative"} />
          {event.surprise !== undefined ? (
            <MetricTile label="Surprise" value={formatPercent(event.surprise)} tone={event.surprise >= 0 ? "positive" : "negative"} />
          ) : null}
        </div>
        <div className="portfolio-action-card-buttons portfolio-compact-action-row">
          <button
            type="button"
            aria-label={`Open ${event.company} in Screener`}
            title={`Open ${event.company} in Screener`}
            onClick={() => onScreener(event.ticker)}
          >
            Open screener
          </button>
          <button
            type="button"
            aria-label={`Open Watchlist for ${event.company} context`}
            title={`Open Watchlist for ${event.company} context`}
            onClick={onWatchlist}
          >
            Open watchlist
          </button>
        </div>
      </div>
    </article>
  );
}

function EarningsTab({
  earningsFilter,
  onEarningsFilterChange,
  query,
  onQueryChange,
  onScreener,
  onWatchlist,
}: {
  earningsFilter: EarningsFilter;
  onEarningsFilterChange: (filter: EarningsFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onScreener: (query: string) => void;
  onWatchlist: () => void;
}) {
  const trimmedQuery = query.trim();
  const filteredEvents = EARNINGS_EVENTS.filter((event) => {
    if (trimmedQuery) return true;
    if (earningsFilter === "This Week") return event.dateGroup === "Today" || event.dateGroup === "This Week";
    return event.dateGroup === earningsFilter;
  }).filter(
    (event) =>
      !query ||
      includesSearch(event.company, query) ||
      includesSearch(event.ticker, query) ||
      event.notes.some((note) => includesSearch(note, query)) ||
      EARNINGS_EVENT_CONTEXT[event.id]?.relevance.some((item) => includesSearch(item, query)) ||
      includesSearch(EARNINGS_EVENT_CONTEXT[event.id]?.theme ?? "", query),
  );
  const highAttentionEvents = filteredEvents.filter((event) => {
    const context = EARNINGS_EVENT_CONTEXT[event.id];
    return context?.importance === "High impact" || context?.relevance.some((item) => /portfolio|watchlist/i.test(item));
  });
  const calendarEvents = filteredEvents.filter((event) => !highAttentionEvents.includes(event));
  const reportedEvents = EARNINGS_EVENTS.filter((event) => event.status === "Reported");
  const todayEvents = EARNINGS_EVENTS.filter((event) => event.dateGroup === "Today");
  const nextHighImpact = EARNINGS_EVENTS.find((event) => EARNINGS_EVENT_CONTEXT[event.id]?.importance === "High impact" && event.status === "Upcoming");

  const renderEventGroup = (title: string, meta: string, events: EarningsEvent[]) =>
    events.length ? (
      <section className="portfolio-earnings-group" aria-label={title}>
        <PanelHeading eyebrow="Earnings group" title={title} meta={meta} />
        <div className="portfolio-earnings-list portfolio-earnings-feed">
          {events.map((event) => (
            <EarningsCard key={event.id} event={event} onScreener={onScreener} onWatchlist={onWatchlist} />
          ))}
        </div>
      </section>
    ) : null;

  return (
    <WorkspaceLayout label="Earnings" rail={<EarningsRail />}>
      <section className="portfolio-workspace-panel portfolio-earnings-command-panel">
        <PanelHeading eyebrow="Calendar" title="Earnings calendar" meta="Indian companies" />
        <div className="portfolio-product-metric-strip">
          <MetricTile label="Today" value={`${todayEvents.length} events`} />
          <MetricTile label="Reported" value={`${reportedEvents.length} recent`} tone="positive" />
          <MetricTile label="Next high impact" value={nextHighImpact?.ticker ?? "None"} tone="negative" />
        </div>
        <div className="portfolio-earnings-day-strip" role="list" aria-label="Earnings calendar days">
          {EARNINGS_DAYS.map((day) => (
            <div
              key={day.date}
              role="listitem"
              className={`portfolio-earnings-day-chip${day.active ? " is-active" : ""}`}
              aria-current={day.active ? "date" : undefined}
              aria-label={`${day.day} ${day.date}, ${day.calls} calls${day.active ? ", current market day" : ""}`}
            >
              <span>{day.day}</span>
              <strong>{day.date}</strong>
              <em>{day.calls} calls</em>
            </div>
          ))}
        </div>
        <div className="portfolio-filter-bar portfolio-earnings-filter-bar">
          <label className="portfolio-search-control">
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search earnings</span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search earnings, companies, notes..." />
          </label>
          <div className="portfolio-segmented-control" aria-label="Earnings date filters">
            {EARNINGS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={filter === earningsFilter ? "is-active" : ""}
                aria-pressed={filter === earningsFilter}
                onClick={() => onEarningsFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading
          eyebrow="Companies"
          title={trimmedQuery ? "Search-matched results" : "Important results"}
          meta={`${filteredEvents.length} shown`}
        />
        {renderEventGroup("High attention", "Portfolio / watchlist relevant", highAttentionEvents)}
        {renderEventGroup("Calendar matches", "Other results", calendarEvents)}
        {filteredEvents.length === 0 ? (
          <div className="portfolio-empty-state" role="status">
            <strong>No earnings match this view.</strong>
            <p>Clear the search or choose another date filter to bring companies back. The next high-impact event is {nextHighImpact?.ticker ?? "not available"}.</p>
          </div>
        ) : null}
      </section>
    </WorkspaceLayout>
  );
}

function ScreenerTab({
  query,
  onQueryChange,
  sector,
  onSectorChange,
  preset,
  onPresetChange,
  sortKey,
  sortDirection,
  onSortChange,
  selectedTicker,
  onSelectedTickerChange,
  trackedTickers,
  feedbackMessage,
  onAddToWatchlist,
  onOpenEarnings,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  sector: string;
  onSectorChange: (value: string) => void;
  preset: ScreenerPreset;
  onPresetChange: (preset: ScreenerPreset) => void;
  sortKey: keyof ScreenerRow;
  sortDirection: SortDirection;
  onSortChange: (key: keyof ScreenerRow) => void;
  selectedTicker: string | null;
  onSelectedTickerChange: (ticker: string) => void;
  trackedTickers: Set<string>;
  feedbackMessage: string;
  onAddToWatchlist: (row: ScreenerRow) => void;
  onOpenEarnings: (query: string) => void;
}) {
  const sectors = useMemo(() => ["All", ...Array.from(new Set(SCREENER_ROWS.map((row) => row.sector)))], []);

  const presetMatchesRow = (row: ScreenerRow) => {
    if (preset === "All") return true;
    if (preset === "Quality compounders") return row.roe >= 18 && row.debtEquity <= 0.8 && row.profitGrowth >= 7;
    if (preset === "Value opportunities") return row.pe <= 20 && row.oneYear >= 0;
    if (preset === "Momentum leaders") return row.oneMonth >= 3 && row.oneYear >= 20;
    if (preset === "Low debt") return row.debtEquity <= 0.4;
    if (preset === "High ROE") return row.roe >= 20;
    if (preset === "Large-cap safety") return row.marketCapCr >= 500000 && row.debtEquity <= 0.5;
    if (preset === "Earnings momentum") return row.profitGrowth >= 12 && row.revenueGrowth >= 10;
    if (preset === "Dividend") return row.dividendYield >= 1;
    return true;
  };

  const matchReasonForRow = (row: ScreenerRow) => {
    const context = SCREENER_ROW_CONTEXT[row.ticker];
    if (query.trim()) return `Search match: ${row.ticker} / ${row.sector}`;
    if (preset === "Quality compounders") return `ROE ${formatPercent(row.roe)} + D/E ${row.debtEquity.toFixed(2)}`;
    if (preset === "Value opportunities") return `P/E ${row.pe.toFixed(1)} with non-negative 1Y trend`;
    if (preset === "Momentum leaders") return `1M ${formatPercent(row.oneMonth)} + 1Y ${formatPercent(row.oneYear)}`;
    if (preset === "Low debt") return `Debt/equity ${row.debtEquity.toFixed(2)}`;
    if (preset === "High ROE") return `ROE ${formatPercent(row.roe)}`;
    if (preset === "Large-cap safety") return `${formatCompactCrores(row.marketCapCr)} market cap + lower leverage`;
    if (preset === "Earnings momentum") return `Profit growth ${formatPercent(row.profitGrowth)}`;
    if (preset === "Dividend") return `Dividend yield ${formatPercent(row.dividendYield)}`;
    return context?.reason ?? "Fits the current frontend sample screen.";
  };

  const filteredRows = useMemo(() => {
    const rows = SCREENER_ROWS.filter((row) => {
      const hasQuery = Boolean(query.trim());
      const matchesQuery =
        !query ||
        includesSearch(row.name, query) ||
        includesSearch(row.ticker, query) ||
        includesSearch(row.sector, query);
      const matchesSector = sector === "All" || row.sector === sector;
      const matchesPreset = hasQuery || presetMatchesRow(row);

      return matchesQuery && matchesSector && matchesPreset;
    });

    return [...rows].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      const multiplier = sortDirection === "asc" ? 1 : -1;

      if (typeof first === "string" && typeof second === "string") return first.localeCompare(second) * multiplier;
      return (Number(first) - Number(second)) * multiplier;
    });
  }, [preset, query, sector, sortDirection, sortKey]);

  const signalForRow = (row: ScreenerRow) => {
    if (row.oneMonth >= 5 && row.oneYear >= 20) return "Momentum";
    if (row.roe >= 20 && row.debtEquity <= 0.4) return "Quality";
    if (row.profitGrowth >= 12 && row.revenueGrowth >= 10) return "Earnings";
    if (row.dividendYield >= 1) return "Yield";
    return "Watch";
  };

  const selectedRow = filteredRows.find((row) => row.ticker === selectedTicker) ?? filteredRows[0] ?? null;
  const selectedContext = selectedRow ? SCREENER_ROW_CONTEXT[selectedRow.ticker] : null;

  return (
    <WorkspaceLayout
      label="Screener"
      rail={
        <>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Screener read" title="Current filter" />
            <p className="portfolio-rail-copy">
              Showing {filteredRows.length} Indian-market names. Saved watchlist actions are browser-local only.
            </p>
            <div className="portfolio-rail-mini-table">
              <div>
                <span>Sort</span>
                <strong>
                  {String(sortKey)} / {sortDirection}
                </strong>
              </div>
              <div>
                <span>Sector</span>
                <strong>{sector}</strong>
              </div>
            </div>
          </section>
          {selectedRow && selectedContext ? (
            <section className="portfolio-workspace-panel portfolio-quick-read-panel">
              <PanelHeading eyebrow="Quick read" title={`${selectedRow.ticker} setup`} meta="Local preview" />
              <p className="portfolio-rail-copy">{selectedContext.reason}</p>
              <div className="portfolio-quick-chip-row">
                {selectedContext.themeTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="portfolio-rail-mini-table">
                <div>
                  <span>Risk note</span>
                  <strong>{selectedContext.riskNote}</strong>
                </div>
                <div>
                  <span>Next catalyst</span>
                  <strong>{selectedContext.nextCatalyst}</strong>
                </div>
              </div>
              <div className="portfolio-action-card-buttons portfolio-compact-action-row">
                <button
                  type="button"
                  aria-label={
                    trackedTickers.has(selectedRow.ticker)
                      ? `${selectedRow.name} is already saved in your local watchlist`
                      : `Add ${selectedRow.name} to your local watchlist`
                  }
                  aria-pressed={trackedTickers.has(selectedRow.ticker)}
                  title={
                    trackedTickers.has(selectedRow.ticker)
                      ? "Already saved in this browser. Click to confirm local saved state."
                      : "Save this name to your browser-only watchlist."
                  }
                  onClick={() => onAddToWatchlist(selectedRow)}
                >
                  {trackedTickers.has(selectedRow.ticker) ? "Saved locally" : "Add to watchlist"}
                </button>
                <button
                  type="button"
                  aria-label={`Open related earnings for ${selectedRow.name}`}
                  title={`Open related earnings for ${selectedRow.name}`}
                  onClick={() => onOpenEarnings(selectedRow.ticker)}
                >
                  Related earnings
                </button>
              </div>
            </section>
          ) : null}
        </>
      }
    >
      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Screener" title="Indian equity screener" meta={`${filteredRows.length} results`} />
        <div className="portfolio-filter-bar">
          <label className="portfolio-search-control">
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search screener</span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search stocks, sectors..." />
          </label>
          <label className="portfolio-select-control">
            <SlidersHorizontal aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Select sector</span>
            <select value={sector} onChange={(event) => onSectorChange(event.target.value)}>
              {sectors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="portfolio-preset-row">
          {SCREENER_PRESETS.map((item) => (
            <button
              key={item}
              type="button"
              className={item === preset ? "is-active" : ""}
              aria-pressed={item === preset}
              title={`Show ${item} screener preset`}
              onClick={() => onPresetChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {feedbackMessage ? (
          <p className="portfolio-interaction-feedback" role="status" aria-live="polite">
            {feedbackMessage}
          </p>
        ) : null}
      </section>

      <section className="portfolio-workspace-panel portfolio-table-panel">
        <table className="portfolio-workspace-table portfolio-screener-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Sector</th>
              {SCREENER_COLUMNS.map((column) => {
                const isActiveSort = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    className={column.className}
                    aria-sort={isActiveSort ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <button
                      type="button"
                      className={isActiveSort ? "is-active" : ""}
                      onClick={() => onSortChange(column.key)}
                      aria-label={`Sort screener by ${column.label}${isActiveSort ? `, currently ${sortDirection}` : ""}`}
                      aria-pressed={isActiveSort}
                      title={`Sort screener by ${column.label}`}
                    >
                      {column.label}
                      {isActiveSort ? <span className="portfolio-sort-indicator">{sortDirection === "asc" ? "Asc" : "Desc"}</span> : null}
                    </button>
                  </th>
                );
              })}
              <th>Why matched</th>
              <th>Signal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isTracked = trackedTickers.has(row.ticker);

              return (
                <tr key={row.ticker} className={selectedRow?.ticker === row.ticker ? "is-selected" : ""}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>
                      {row.ticker} / {row.exchange}
                    </span>
                  </td>
                  <td>{row.sector}</td>
                  {SCREENER_COLUMNS.map((column) => (
                    <td
                      key={`${row.ticker}-${column.key}`}
                      className={`${column.className ?? ""} ${["oneDay", "oneMonth", "oneYear", "profitGrowth"].includes(column.key) ? toneClass(Number(row[column.key])) : ""}`}
                    >
                      {formatScreenerMetric(row, column.key)}
                    </td>
                  ))}
                  <td>
                    <span className="portfolio-table-reason">{matchReasonForRow(row)}</span>
                  </td>
                  <td>
                    <em className="portfolio-table-signal">{signalForRow(row)}</em>
                  </td>
                  <td>
                    <div className="portfolio-table-button-group">
                      <button
                        type="button"
                        aria-label={`Open quick read for ${row.name}`}
                        title={`Open quick read for ${row.name}`}
                        onClick={() => onSelectedTickerChange(row.ticker)}
                      >
                        Quick read
                      </button>
                      <button
                        type="button"
                        aria-label={isTracked ? `${row.name} is already saved in your local watchlist` : `Add ${row.name} to your local watchlist`}
                        aria-pressed={isTracked}
                        title={
                          isTracked
                            ? "Already saved in this browser. Click to confirm local saved state."
                            : "Save this name to your browser-only watchlist."
                        }
                        onClick={() => onAddToWatchlist(row)}
                      >
                        {isTracked ? "Saved" : "Watch"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={SCREENER_COLUMNS.length + 5} className="portfolio-empty-row">
                  No screener matches. Try another search, sector, or saved screen.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </WorkspaceLayout>
  );
}

function WatchlistTab({
  query,
  onQueryChange,
  trackedTickers,
  alertTickers,
  feedbackMessage,
  onToggleTracked,
  onToggleAlert,
  onScreener,
  onEarnings,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  trackedTickers: Set<string>;
  alertTickers: Set<string>;
  feedbackMessage: string;
  onToggleTracked: (ticker: string) => void;
  onToggleAlert: (ticker: string) => void;
  onScreener: (query: string) => void;
  onEarnings: (query: string) => void;
}) {
  const [watchlistFilter, setWatchlistFilter] = useState<WatchlistFilter>("Watched");
  const visibleItems = WATCHLIST_ITEMS.filter((item) => {
    const matchesQuery =
      !query ||
      includesSearch(item.name, query) ||
      includesSearch(item.ticker, query) ||
      includesSearch(item.sector, query);
    const matchesFilter =
      watchlistFilter === "All" ||
      (watchlistFilter === "Watched" && trackedTickers.has(item.ticker)) ||
      (watchlistFilter === "Alerts" && alertTickers.has(item.ticker));
    return matchesQuery && matchesFilter;
  });
  const trackedItems = WATCHLIST_ITEMS.filter((item) => trackedTickers.has(item.ticker));
  const topMover = [...trackedItems].sort((a, b) => b.oneDay - a.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const laggard = [...trackedItems].sort((a, b) => a.oneDay - b.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const activeAlerts = WATCHLIST_ITEMS.filter((item) => alertTickers.has(item.ticker));
  const biggestRiskCluster =
    trackedItems.reduce<Record<string, number>>((clusters, item) => {
      const cluster = WATCHLIST_ITEM_CONTEXT[item.ticker]?.riskCluster ?? item.sector;
      clusters[cluster] = (clusters[cluster] ?? 0) + 1;
      return clusters;
    }, {});
  const riskCluster = Object.entries(biggestRiskCluster).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No cluster yet";
  const relevantNews = WATCHLIST_NEWS.find((news) => trackedTickers.has(news.ticker)) ?? WATCHLIST_NEWS[0];

  return (
    <WorkspaceLayout
      label="Watchlist"
      rail={
        <>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Pulse" title="Watchlist pulse" meta={`${trackedItems.length} tracked`} />
            <div className="portfolio-rail-mini-table">
              <div>
                <span>Top mover</span>
                <strong>
                  {topMover.ticker} {formatPercent(topMover.oneDay)}
                </strong>
              </div>
              <div>
                <span>Main drag</span>
                <strong>
                  {laggard.ticker} {formatPercent(laggard.oneDay)}
                </strong>
              </div>
              <div>
                <span>Alerts</span>
                <strong>{activeAlerts.length} active</strong>
              </div>
              <div>
                <span>Risk cluster</span>
                <strong>{riskCluster}</strong>
              </div>
            </div>
          </section>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Alerts" title="Active alerts" />
            <div className="portfolio-alert-list">
              {activeAlerts.map((item) => (
                <article key={item.ticker}>
                  <strong>{item.ticker}</strong>
                  <p>{WATCHLIST_ITEM_CONTEXT[item.ticker]?.alertReason ?? item.note}</p>
                </article>
              ))}
              {activeAlerts.length === 0 ? (
                <p className="portfolio-rail-copy">No local alerts are enabled right now.</p>
              ) : null}
            </div>
          </section>
          <FinanceDisclaimer />
        </>
      }
    >
      <section className="portfolio-workspace-panel portfolio-read-panel portfolio-watchlist-read-panel">
        <PanelHeading eyebrow="My Watchlist" title="Indian markets stayed broad, but leadership is concentrated" meta="Updated 9m ago" />
        <p>
          <TickerMovePill ticker={topMover.ticker} move={topMover.oneDay} /> is the strongest tracked name today, while{" "}
          <TickerMovePill ticker={laggard.ticker} move={laggard.oneDay} /> is the cleanest weak spot. The list is currently most sensitive to
          {` ${riskCluster.toLowerCase()}, crude, IT guidance, and high-momentum consumer internet names.`}
        </p>
        <div className="portfolio-product-metric-strip">
          <MetricTile label="Biggest mover" value={`${topMover.ticker} ${formatPercent(topMover.oneDay)}`} tone={topMover.oneDay >= 0 ? "positive" : "negative"} />
          <MetricTile label="Highest alert" value={activeAlerts[0]?.ticker ?? "None"} tone={activeAlerts.length ? "negative" : "neutral"} />
          <MetricTile label="Relevant news" value={relevantNews.ticker} />
        </div>
        <div className="portfolio-source-row">
          <span>49 sources</span>
          <span>Updated 9 minutes ago</span>
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-watchlist-command-panel">
        <PanelHeading eyebrow="Watchlist" title="Tracked Indian assets" meta={`${trackedTickers.size} tracked`} />
        <div className="portfolio-filter-bar">
          <label className="portfolio-search-control">
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search watchlist</span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search and star an asset..." />
          </label>
          <div className="portfolio-segmented-control" aria-label="Watchlist filters">
            {WATCHLIST_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={watchlistFilter === filter ? "is-active" : ""}
                aria-pressed={watchlistFilter === filter}
                onClick={() => setWatchlistFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        {feedbackMessage ? (
          <p className="portfolio-interaction-feedback" role="status" aria-live="polite">
            {feedbackMessage}
          </p>
        ) : null}
      </section>

      <section className="portfolio-workspace-panel portfolio-table-panel">
        <table className="portfolio-workspace-table portfolio-watchlist-return-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Price</th>
              <th>1D</th>
              <th>1M</th>
              <th>Alert / reason</th>
              <th>Latest signal</th>
            </tr>
          </thead>
          <tbody>
          {visibleItems.map((item) => {
            const isTracked = trackedTickers.has(item.ticker);
            const hasAlert = alertTickers.has(item.ticker);
            const context = WATCHLIST_ITEM_CONTEXT[item.ticker];

            return (
              <tr key={item.ticker} className={isTracked ? "is-tracked" : ""}>
                <td>
                  <div className="portfolio-watchlist-asset-cell">
                    <CompanyAvatar name={item.name} ticker={item.ticker} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.ticker} / {item.exchange} / {item.sector}
                      </span>
                    </div>
                    <div className="portfolio-table-actions">
                      <button
                        type="button"
                        className={`portfolio-icon-action ${isTracked ? "is-active" : ""}`}
                        aria-label={`${isTracked ? "Remove" : "Add"} ${item.name} ${isTracked ? "from" : "to"} watchlist`}
                        aria-pressed={isTracked}
                        title={`${isTracked ? "Remove" : "Add"} ${item.name} ${isTracked ? "from" : "to"} your local watchlist`}
                        onClick={() => onToggleTracked(item.ticker)}
                      >
                        <Star aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`portfolio-icon-action ${hasAlert ? "is-active" : ""}`}
                        aria-label={`${hasAlert ? "Disable" : "Enable"} alert for ${item.name}`}
                        aria-pressed={hasAlert}
                        title={`${hasAlert ? "Disable" : "Enable"} local alert for ${item.name}`}
                        onClick={() => onToggleAlert(item.ticker)}
                      >
                        <Bell aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="portfolio-icon-text-action"
                        aria-label={`Open ${item.name} in Screener`}
                        title={`Open ${item.name} in Screener`}
                        onClick={() => onScreener(item.ticker)}
                      >
                        Screen
                      </button>
                    </div>
                  </div>
                </td>
                <td className="is-numeric">{formatPortfolioTapePrice(item.price)}</td>
                <td className={`is-numeric ${toneClass(item.oneDay)}`}>{formatPercent(item.oneDay)}</td>
                <td className={`is-numeric ${toneClass(item.oneMonth)}`}>{formatPercent(item.oneMonth)}</td>
                <td>
                  <span className="portfolio-table-reason">{hasAlert ? context?.alertReason : context?.reasonWatched}</span>
                </td>
                <td>
                  <div className="portfolio-table-note-cell">
                    <span>{context?.latestSignal ?? item.note}</span>
                    <button
                      type="button"
                      aria-label={`Open related earnings for ${item.name}`}
                      title={`Open related earnings for ${item.name}`}
                      onClick={() => onEarnings(item.ticker)}
                    >
                      Related earnings
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {visibleItems.length === 0 ? (
            <tr>
              <td colSpan={6} className="portfolio-empty-row">
                {trackedTickers.size === 0 && watchlistFilter === "Watched"
                  ? "Your local watchlist is empty. Search or switch to All, then star Indian assets to build it."
                  : "No watchlist matches. Search another Indian asset or clear the filter."}
              </td>
            </tr>
          ) : null}
          </tbody>
        </table>
      </section>

      <section className="portfolio-workspace-split">
        <section className="portfolio-workspace-panel portfolio-watchlist-movers-panel">
          <PanelHeading eyebrow="Watchlist movers" title="Intraday movement" meta="1D" />
          <div className="portfolio-watchlist-mover-chart">
            {visibleItems.slice(0, 4).map((item) => (
              <article key={item.ticker}>
                <DetailedSparkline
                  className="portfolio-mini-sparkline"
                  data={item.points}
                  trend={item.oneDay >= 0 ? "up" : "down"}
                  ariaLabel={`${item.name} intraday trend chart`}
                />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {formatPortfolioTapePrice(item.price)} / <em className={toneClass(item.oneDay)}>{formatPercent(item.oneDay)}</em>
                  </span>
                  <p>{WATCHLIST_ITEM_CONTEXT[item.ticker]?.reasonWatched ?? item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolio-workspace-panel">
          <PanelHeading eyebrow="Notable movement" title="Why it moved" />
          <div className="portfolio-movement-timeline">
            {WATCHLIST_MOVEMENTS.map((item) => (
              <article key={`${item.ticker}-${item.date}`}>
                <time>
                  <strong>{item.date}</strong>
                  {item.time}
                </time>
                <div>
                  <TickerMovePill ticker={item.ticker} move={item.move} />
                  <p>{item.summary}</p>
                  <span>{item.sources} sources</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Watchlist news" title="Latest tracked headlines" />
        <div className="portfolio-watchlist-news-grid">
          {WATCHLIST_NEWS.map((item) => (
            <article key={`${item.ticker}-${item.headline}`}>
              <span>
                {item.source} / {item.time}
              </span>
              <strong>{item.headline}</strong>
              <em>{item.ticker}</em>
            </article>
          ))}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

interface PortfolioEvidenceDrawerContent {
  title: string;
  sourceCount: number;
  freshness: string;
  assumptions: string[];
  supportingSignals: string[];
  confidence: string;
  wouldChange: string;
}

const PORTFOLIO_STAGES = ["Overview", "Portfolio Analysis"] as const;
type PortfolioStage = (typeof PORTFOLIO_STAGES)[number];

function getPortfolioStageId(stage: PortfolioStage) {
  return `portfolio-stage-${stage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function getSuggestedPlay(playId: string) {
  return PORTFOLIO_SUGGESTED_PLAYS.find((play) => play.id === playId) ?? PORTFOLIO_SUGGESTED_PLAYS[0];
}

function getHoldingContribution(holding: (typeof PORTFOLIO_HOLDINGS)[number]) {
  return holding.value * (holding.dayMove / 100);
}

function getPerformanceReturnPercent(series: typeof PORTFOLIO_PERFORMANCE) {
  const firstPoint = series[0];
  const latestPoint = series[series.length - 1];
  if (!firstPoint || !latestPoint) return 0;
  return ((latestPoint.value - firstPoint.value) / firstPoint.value) * 100;
}

function getSectorExposureRows() {
  return [
    { label: "Financials", match: /Financials/i },
    { label: "Auto", match: /Auto/i },
    { label: "IT", match: /IT Services/i },
    { label: "Energy", match: /Energy/i },
    { label: "Industrials", match: /Industrials/i },
  ].map((sector) => ({
    label: sector.label,
    value: PORTFOLIO_HOLDINGS.filter((holding) => sector.match.test(holding.sector)).reduce((sum, holding) => sum + holding.allocation, 0),
  }));
}

function getContributionRows() {
  return PORTFOLIO_HOLDINGS.map((holding) => ({
    ticker: holding.ticker,
    name: holding.name,
    move: holding.dayMove,
    contribution: getHoldingContribution(holding),
  })).sort((first, second) => second.contribution - first.contribution);
}

function getFirstSentence(text: string) {
  const [firstSentence] = text.split(/(?<=\.)\s+/);
  return firstSentence || text;
}

function buildTrustEvidence(freshness = PORTFOLIO_COCKPIT.status.lastUpdated): PortfolioEvidenceDrawerContent {
  return {
    title: "AI evidence level",
    sourceCount: PORTFOLIO_COCKPIT.status.sourceCount,
    freshness,
    assumptions: PORTFOLIO_AI_TRUST.assumptions,
    supportingSignals: PORTFOLIO_AI_TRUST.changedToday,
    confidence: PORTFOLIO_COCKPIT.status.evidenceLevel,
    wouldChange: PORTFOLIO_AI_TRUST.needsConfirmation.join("; "),
  };
}

function buildActionEvidence(action: (typeof PORTFOLIO_COCKPIT.actions)[number], freshness: string): PortfolioEvidenceDrawerContent {
  const play = getSuggestedPlay(action.playId);

  return {
    title: action.title,
    sourceCount: PORTFOLIO_COCKPIT.status.sourceCount,
    freshness,
    assumptions: PORTFOLIO_AI_TRUST.assumptions,
    supportingSignals: [action.why, ...play.logic],
    confidence: action.confidence,
    wouldChange: play.wouldChange ?? "The view changes if affected holdings stop confirming the current signal.",
  };
}

function buildRiskEvidence(card: (typeof PORTFOLIO_COCKPIT.riskStrip)[number], freshness: string): PortfolioEvidenceDrawerContent {
  return {
    title: card.headline,
    sourceCount: PORTFOLIO_COCKPIT.status.sourceCount,
    freshness,
    assumptions: PORTFOLIO_AI_TRUST.assumptions,
    supportingSignals: [card.metric, card.whyItMatters, `Affected: ${card.affectedHoldings.join(", ")}`],
    confidence: PORTFOLIO_COCKPIT.status.evidenceLevel,
    wouldChange: "This becomes less important if exposure falls or a broader set of holdings starts leading the account.",
  };
}

function buildMarketDriverEvidence(driver: (typeof PORTFOLIO_COCKPIT.marketDrivers)[number], freshness: string): PortfolioEvidenceDrawerContent {
  return {
    title: driver.headline,
    sourceCount: driver.sources.length,
    freshness,
    assumptions: PORTFOLIO_AI_TRUST.assumptions,
    supportingSignals: [driver.explanation, `Sources: ${driver.sources.join(", ")}`, `Affected: ${driver.affectedHoldings.join(", ")}`],
    confidence: driver.impactDirection === "Mixed" ? "Medium" : "Medium-high",
    wouldChange: "The read changes if the driver stops affecting the named holdings or a stronger company-specific signal appears.",
  };
}

function buildHoldingEvidence(ticker: string, freshness: string): PortfolioEvidenceDrawerContent {
  const holding = PORTFOLIO_HOLDINGS.find((item) => item.ticker === ticker);
  const decision = PORTFOLIO_COCKPIT.holdingDecisions[ticker];
  const context = PORTFOLIO_HOLDING_CONTEXT[ticker];

  return {
    title: `${ticker} holding logic`,
    sourceCount: PORTFOLIO_COCKPIT.status.sourceCount,
    freshness,
    assumptions: PORTFOLIO_AI_TRUST.assumptions,
    supportingSignals: [
      decision?.detail ?? "No decision detail available.",
      context?.signal ?? "",
      context?.nextCheck ? `Next check: ${context.nextCheck}` : "",
      holding ? `Weight: ${holding.allocation.toFixed(1)}% / 1D move: ${formatSignedPortfolioMove(holding.dayMove)}` : "",
    ].filter(Boolean),
    confidence: holding?.risk === "High" ? "High" : "Medium",
    wouldChange: context?.nextCheck ?? "The view changes when new company evidence changes the risk/reward.",
  };
}

function PortfolioHeader({
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  isPortfolioSyncing,
  portfolioSyncStatus,
  onRefresh,
  onOpenEvidence,
}: {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPortfolioSyncing: boolean;
  portfolioSyncStatus: string;
  onRefresh: () => void;
  onOpenEvidence: () => void;
}) {
  return (
    <header className="portfolio-finance-header portfolio-cockpit-header">
      <div className="portfolio-finance-header-title">
        <span className="portfolio-section-kicker">Sovereign Lens Finance</span>
        <h1>Portfolio</h1>
        <p>Personal exposure, holdings, performance, and local AI read.</p>
      </div>
      <form className="portfolio-finance-search portfolio-cockpit-search" role="search" aria-label="Search portfolio workspace" onSubmit={onSearchSubmit}>
        <Search aria-hidden="true" />
        <input value={searchValue} onChange={(event) => onSearchValueChange(event.target.value)} placeholder="Search Indian stocks, sectors, funds..." />
      </form>
      <div className="portfolio-cockpit-status-row">
        <button type="button" className="portfolio-ai-status-pill" aria-label="Open AI evidence level" onClick={onOpenEvidence}>
          <span>{PORTFOLIO_COCKPIT.status.view}</span>
          <strong>{PORTFOLIO_COCKPIT.status.sourceCount} sources</strong>
          <em>{portfolioSyncStatus}</em>
          <b>{PORTFOLIO_COCKPIT.status.evidenceLevel}</b>
        </button>
        <button
          type="button"
          className={`portfolio-status-sync-button${isPortfolioSyncing ? " is-syncing" : ""}`}
          aria-label="Refresh local portfolio view"
          aria-busy={isPortfolioSyncing}
          title="Refresh local portfolio view"
          onClick={onRefresh}
        >
          <RefreshCw aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function PortfolioSummaryGrid({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  portfolioSyncStatus,
  onOpenEvidence,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  portfolioSyncStatus: string;
  onOpenEvidence: () => void;
}) {
  const cards = [
    {
      label: "Current Portfolio Value",
      value: formatPortfolioCurrency(totalValue),
      note: portfolioSyncStatus,
      tone: "neutral",
    },
    {
      label: "Invested Value",
      value: formatPortfolioCurrency(PORTFOLIO_INVESTED_VALUE),
      note: "Local sample holdings",
      tone: "neutral",
    },
    {
      label: "Total Gain / Loss",
      value: `${formatSignedPortfolioCurrency(totalReturn)} (${formatSignedPortfolioPercent(totalReturnPercent)})`,
      note: "Since invested value",
      tone: totalReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "Today's P&L",
      value: `${formatSignedPortfolioCurrency(oneDayReturn)} (${formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT)})`,
      note: "1D local mark",
      tone: oneDayReturn >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <section className="portfolio-summary-area" aria-label="Portfolio value summary">
      <div className="portfolio-summary-grid">
        {cards.map((card) => (
          <article key={card.label} className={`portfolio-summary-card is-${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <em>{card.note}</em>
          </article>
        ))}
      </div>
      <button type="button" className="portfolio-evidence-summary-bar" onClick={onOpenEvidence}>
        <span>AI Evidence Level</span>
        <strong>{PORTFOLIO_COCKPIT.status.evidenceLevel}</strong>
        <em>{PORTFOLIO_COCKPIT.status.sourceCount} sources</em>
        <b>Assumptions available</b>
      </button>
    </section>
  );
}

function AIActionQueue({
  freshness,
  onOpenEvidence,
  onFunds,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
  onFunds: () => void;
}) {
  const [expandedActionId, setExpandedActionId] = useState(PORTFOLIO_COCKPIT.actions[0]?.id ?? "");

  const handleActionClick = (action: (typeof PORTFOLIO_COCKPIT.actions)[number]) => {
    if (action.ctaType === "funds") {
      onFunds();
      return;
    }

    onOpenEvidence(buildActionEvidence(action, freshness));
  };

  return (
    <section className="portfolio-action-queue-panel" aria-label="Portfolio action queue">
      <header>
        <span>Recommended Plays</span>
        <h2>What should I do today?</h2>
      </header>
      <div className="portfolio-action-queue-list">
        {PORTFOLIO_COCKPIT.actions.map((action) => {
          const isExpanded = expandedActionId === action.id;

          return (
            <article key={action.id} className={`portfolio-cockpit-action-card risk-${action.riskLevel.toLowerCase()}${isExpanded ? " is-expanded" : " is-collapsed"}`}>
              <button
                type="button"
                className="portfolio-action-card-summary"
                aria-expanded={isExpanded}
                onClick={() => setExpandedActionId(isExpanded ? "" : action.id)}
              >
                <span className={`portfolio-risk-pill risk-${action.riskLevel.toLowerCase()}`}>{action.riskLevel}</span>
                <strong>{action.title}</strong>
                <em>{action.assetType}</em>
                <ChevronDown aria-hidden="true" />
              </button>
              <p>{action.why}</p>
              <div className="portfolio-reason-chip-row" aria-label={`${action.title} affected holdings`}>
                {action.affectedHoldings.map((ticker) => (
                  <span key={ticker}>{ticker}</span>
                ))}
              </div>
              {isExpanded ? (
                <>
                  <dl>
                    <div>
                      <dt>Confidence</dt>
                      <dd>{action.confidence}</dd>
                    </div>
                    <div>
                      <dt>Main risk</dt>
                      <dd>{action.mainRisk}</dd>
                    </div>
                  </dl>
                  <button type="button" className="portfolio-action-card-cta" onClick={() => handleActionClick(action)}>
                    {action.ctaLabel}
                    {action.ctaType === "funds" ? <ArrowUpRight aria-hidden="true" /> : null}
                  </button>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="portfolio-action-queue-note">No broker execution. Local AI decision support only.</p>
    </section>
  );
}

function PortfolioReadCard() {
  return (
    <section className="portfolio-read-card" aria-labelledby="portfolio-read-heading">
      <header>
        <span>AI portfolio memo</span>
        <h2 id="portfolio-read-heading">{PORTFOLIO_COCKPIT.read.title}</h2>
      </header>
      <p>{PORTFOLIO_COCKPIT.read.summary}</p>
      <div className="portfolio-read-facts">
        {PORTFOLIO_COCKPIT.read.facts.map((fact) => (
          <article key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
            <p>{fact.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RiskConcentrationStrip({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <section className="portfolio-risk-strip" aria-label="Risk and concentration strip">
      {PORTFOLIO_COCKPIT.riskStrip.map((card) => (
        <article key={card.id}>
          <span>{card.label}</span>
          <strong>{card.headline}</strong>
          <em>{card.metric}</em>
          <p>{card.whyItMatters}</p>
          <div className="portfolio-reason-chip-row">
            {card.affectedHoldings.map((ticker) => (
              <span key={ticker}>{ticker}</span>
            ))}
          </div>
          <button type="button" onClick={() => onOpenEvidence(buildRiskEvidence(card, freshness))}>
            View details
          </button>
        </article>
      ))}
    </section>
  );
}

function HoldingsExposureTable({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  const [holdingFilter, setHoldingFilter] = useState("All");
  const filters = ["All", "Concentration risk", "Positive contributors", "Negative contributors", "Needs confirmation"];
  const visibleHoldings = PORTFOLIO_HOLDINGS.filter((holding) => {
    const decision = PORTFOLIO_COCKPIT.holdingDecisions[holding.ticker];
    const context = PORTFOLIO_HOLDING_CONTEXT[holding.ticker];
    const contribution = getHoldingContribution(holding);

    if (holdingFilter === "Concentration risk") return /financials|private banks/i.test(`${holding.sector} ${context?.exposureCluster ?? ""}`);
    if (holdingFilter === "Positive contributors") return contribution >= 0;
    if (holdingFilter === "Negative contributors") return contribution < 0;
    if (holdingFilter === "Needs confirmation") return /track|watch|wait|confirm/i.test(`${decision?.action ?? ""} ${decision?.keyRisk ?? ""}`);
    return true;
  });

  const handleHoldingRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, ticker: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpenEvidence(buildHoldingEvidence(ticker, freshness));
  };

  return (
    <section className="portfolio-workspace-panel portfolio-holdings-exposure-panel" aria-label="Decision-oriented holdings exposure">
      <PanelHeading eyebrow="Holdings & risk" title="Holdings decision table" meta="Row opens AI logic" />
      <div className="portfolio-holding-filter-row" aria-label="Holdings filters">
        {filters.map((filter) => (
          <button key={filter} type="button" className={holdingFilter === filter ? "is-active" : ""} aria-pressed={holdingFilter === filter} onClick={() => setHoldingFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>
      <div className="portfolio-holdings-table-shell">
        <table className="portfolio-holdings-table portfolio-decision-table">
          <thead>
            <tr>
              <th>Holding</th>
              <th>Weight</th>
              <th>Value</th>
              <th>1D</th>
              <th>Contribution</th>
              <th>Role</th>
              <th>Risk</th>
              <th>AI View</th>
            </tr>
          </thead>
          <tbody>
            {visibleHoldings.map((holding) => {
              const decision = PORTFOLIO_COCKPIT.holdingDecisions[holding.ticker];
              const context = PORTFOLIO_HOLDING_CONTEXT[holding.ticker];
              const contribution = getHoldingContribution(holding);

              return (
                <tr
                  key={holding.ticker}
                  className={`portfolio-holding-row risk-${holding.risk.toLowerCase()}`}
                  tabIndex={0}
                  aria-label={`Open ${holding.ticker} holding logic`}
                  onClick={() => onOpenEvidence(buildHoldingEvidence(holding.ticker, freshness))}
                  onKeyDown={(event) => handleHoldingRowKeyDown(event, holding.ticker)}
                >
                  <td data-label="Holding">
                    <strong>{holding.ticker}</strong>
                    <span>{holding.name}</span>
                  </td>
                  <td data-label="Weight">{holding.allocation.toFixed(1)}%</td>
                  <td data-label="Value">{formatPortfolioCurrency(holding.value)}</td>
                  <td data-label="1D" className={holding.dayMove >= 0 ? "is-positive" : "is-negative"}>
                    {formatSignedPortfolioMove(holding.dayMove)}
                  </td>
                  <td data-label="Contribution" className={contribution >= 0 ? "is-positive" : "is-negative"}>
                    {formatSignedPortfolioCurrency(contribution)}
                  </td>
                  <td data-label="Role">
                    <span className="portfolio-table-chip">{context?.exposureCluster ?? holding.sector}</span>
                  </td>
                  <td data-label="Risk">
                    <span className={`portfolio-table-chip risk-${holding.risk.toLowerCase()}`}>{holding.risk}</span>
                  </td>
                  <td data-label="AI view">
                    <div className="portfolio-table-action-cell">
                      <span>{decision?.verdict}</span>
                      <ArrowUpRight aria-hidden="true" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PortfolioChartsSection() {
  return (
    <section className="portfolio-charts-section portfolio-performance-view" aria-label="Portfolio charts">
      <article className="portfolio-workspace-panel portfolio-chart-card portfolio-performance-card">
        <PanelHeading eyebrow="Performance" title="Portfolio vs NIFTY 50" meta="Indexed view" />
        <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
      </article>
      <div className="portfolio-performance-side">
        <article className="portfolio-workspace-panel portfolio-chart-card portfolio-allocation-card">
          <PanelHeading eyebrow="Allocation" title="Allocation" meta="Equity 100%" />
          <PortfolioAllocationView />
        </article>
        <article className="portfolio-workspace-panel portfolio-chart-card portfolio-contribution-card">
          <PanelHeading eyebrow="Contribution" title="Return drivers" meta="1D P&L" />
          <PortfolioContributionBars compact />
        </article>
      </div>
    </section>
  );
}

function MarketImpactStream({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <section className="portfolio-market-impact-section" aria-labelledby="portfolio-market-impact-heading">
      <PanelHeading eyebrow="Market impact stream" title="Market drivers affecting your portfolio" />
      <div className="portfolio-market-driver-grid">
        {PORTFOLIO_COCKPIT.marketDrivers.map((driver) => (
          <article key={driver.id} className={`portfolio-market-driver-card is-${driver.impactDirection.toLowerCase()}`}>
            <div className="portfolio-market-driver-topline">
              <span>{driver.theme}</span>
              <em>{driver.impactDirection}</em>
            </div>
            <strong>{driver.headline}</strong>
            <p>{getFirstSentence(driver.explanation)}</p>
            <div className="portfolio-reason-chip-row">
              {driver.affectedHoldings.map((ticker) => (
                <span key={ticker}>{ticker}</span>
              ))}
            </div>
            <div className="portfolio-market-driver-actions">
              <button type="button" onClick={() => onOpenEvidence(buildMarketDriverEvidence(driver, freshness))}>
                Expand
              </button>
              <button type="button" onClick={() => onOpenEvidence(buildMarketDriverEvidence(driver, freshness))}>
                Sources
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioStageTabs({
  activeStage,
  onStageChange,
}: {
  activeStage: PortfolioStage;
  onStageChange: (stage: PortfolioStage) => void;
}) {
  return (
    <nav className="portfolio-stage-tabs" role="tablist" aria-label="Portfolio workspace sections">
      {PORTFOLIO_STAGES.map((stage) => {
        const isActive = activeStage === stage;
        const panelId = getPortfolioStageId(stage);

        return (
          <button
            key={stage}
            id={`${panelId}-tab`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            className={isActive ? "is-active" : ""}
            onClick={() => onStageChange(stage)}
          >
            {stage}
          </button>
        );
      })}
    </nav>
  );
}

function PortfolioStatusStrip({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  freshness,
  onOpenEvidence,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  freshness: string;
  onOpenEvidence: () => void;
}) {
  const displayFreshness = freshness.replace(/^Local view updated\s*/i, "");
  const statusItems = [
    { label: "Portfolio value", value: formatPortfolioCurrency(totalValue), tone: "neutral" },
    { label: "Today's P&L", value: formatSignedPortfolioCurrency(oneDayReturn), helper: formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT), tone: oneDayReturn >= 0 ? "positive" : "negative" },
    { label: "Total return", value: formatSignedPortfolioCurrency(totalReturn), helper: formatSignedPortfolioPercent(totalReturnPercent), tone: totalReturn >= 0 ? "positive" : "negative" },
  ];

  return (
    <section className="portfolio-status-strip" aria-label="Portfolio status today">
      {statusItems.map((item) => (
        <div key={item.label} className={`is-${item.tone}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.helper ? <em>{item.helper}</em> : null}
        </div>
      ))}
      <button type="button" className="portfolio-status-evidence" onClick={onOpenEvidence}>
        <span>Evidence</span>
        <strong>{PORTFOLIO_COCKPIT.status.evidenceLevel}</strong>
        <em>{PORTFOLIO_COCKPIT.status.sourceCount} sources</em>
      </button>
      <div>
        <span>Updated</span>
        <strong>{displayFreshness}</strong>
      </div>
    </section>
  );
}

function PrimaryActionModule({
  freshness,
  onOpenEvidence,
  onShowHoldings,
  onFunds,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
  onShowHoldings: () => void;
  onFunds: () => void;
}) {
  const [primaryAction, ...otherActions] = PORTFOLIO_COCKPIT.actions;
  const relianceDriver = PORTFOLIO_COCKPIT.marketDrivers.find((driver) => driver.affectedHoldings.includes("RELIANCE"));

  const handleCompactAction = (action: (typeof PORTFOLIO_COCKPIT.actions)[number]) => {
    if (action.ctaType === "funds") {
      onFunds();
      return;
    }

    onOpenEvidence(buildActionEvidence(action, freshness));
  };

  const watchRows = [
    ...otherActions.slice(0, 1).map((action) => ({
      id: action.id,
      label: action.title,
      holdings: action.affectedHoldings,
      onClick: () => handleCompactAction(action),
    })),
    relianceDriver
      ? {
          id: relianceDriver.id,
          label: "Reliance crude / O2C drag",
          holdings: relianceDriver.affectedHoldings,
          onClick: () => onOpenEvidence(buildMarketDriverEvidence(relianceDriver, freshness)),
        }
      : null,
    ...otherActions.slice(1).map((action) => ({
      id: action.id,
      label: action.title,
      holdings: action.affectedHoldings,
      onClick: () => handleCompactAction(action),
    })),
  ].filter((row): row is { id: string; label: string; holdings: string[]; onClick: () => void } => Boolean(row));

  if (!primaryAction) return null;

  return (
    <section className="portfolio-primary-action-module" aria-label="Today's primary portfolio action">
      <div className="portfolio-primary-action-main">
        <header>
          <div>
            <span>Today's primary portfolio action</span>
            <h2>{primaryAction.title}</h2>
          </div>
          <span className={`portfolio-risk-pill risk-${primaryAction.riskLevel.toLowerCase()}`}>{primaryAction.riskLevel}</span>
        </header>

        <p>
          <strong>Reason:</strong> {primaryAction.why}
        </p>

        <div className="portfolio-primary-action-facts">
          <article>
            <span>Risk</span>
            <strong>{primaryAction.mainRisk}</strong>
          </article>
          <article>
            <span>Confidence</span>
            <strong>{primaryAction.confidence}</strong>
          </article>
          <article>
            <span>Action type</span>
            <strong>Watch / rebalance consideration only</strong>
          </article>
        </div>

        <div className="portfolio-primary-action-holdings" aria-label="Affected holdings">
          <span>Affected</span>
          <div className="portfolio-reason-chip-row">
            {primaryAction.affectedHoldings.map((ticker) => (
              <span key={ticker}>{ticker}</span>
            ))}
          </div>
        </div>

        <div className="portfolio-primary-action-buttons">
          <button type="button" className="is-primary" onClick={() => onOpenEvidence(buildActionEvidence(primaryAction, freshness))}>
            View reasoning
          </button>
          <button type="button" onClick={onShowHoldings}>
            Show affected holdings
          </button>
        </div>
      </div>

      <aside className="portfolio-other-watches" aria-label="Other watches">
        <h3>Also watch</h3>
        {watchRows.map((row) => (
          <button key={row.id} type="button" onClick={row.onClick}>
            <strong>{row.label}</strong>
            <em>{row.holdings.join(", ")}</em>
          </button>
        ))}
      </aside>
    </section>
  );
}

function PortfolioDiagnosis() {
  const [driver, drag, cluster, confirmation] = PORTFOLIO_COCKPIT.read.facts;
  const diagnosisItems = [
    { label: "Main driver", value: driver?.value ?? "Private banks + Tata Motors" },
    { label: "Main drag", value: drag?.value ?? "Reliance" },
    { label: "Risk cluster", value: cluster?.value ?? "Financials sleeve 32%" },
    { label: "Next check", value: confirmation?.value ?? "Bank breadth + JLR margin" },
  ];

  return (
    <section className="portfolio-diagnosis-module" aria-labelledby="portfolio-diagnosis-heading">
      <header>
        <span>Portfolio diagnosis</span>
        <h2 id="portfolio-diagnosis-heading">What changed today</h2>
      </header>
      <div className="portfolio-diagnosis-grid">
        {diagnosisItems.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
      <p>Today's upside is being carried by private-bank leadership and Tata Motors momentum, while Reliance remains the clean drag from crude and O2C uncertainty.</p>
    </section>
  );
}

function TodayMovedBy({ oneDayReturn }: { oneDayReturn: number }) {
  const rows = PORTFOLIO_HOLDINGS.map((holding) => ({
    ticker: holding.ticker,
    name: holding.name,
    move: holding.dayMove,
    contribution: getHoldingContribution(holding),
  }));
  const positiveRows = rows.filter((row) => row.contribution >= 0).sort((first, second) => second.contribution - first.contribution).slice(0, 3);
  const negativeRows = rows.filter((row) => row.contribution < 0).sort((first, second) => first.contribution - second.contribution).slice(0, 2);
  const maxContribution = Math.max(...rows.map((row) => Math.abs(row.contribution)), 1);

  const renderRows = (items: typeof positiveRows) =>
    items.map((row) => {
      const isPositive = row.contribution >= 0;

      return (
        <article key={row.ticker} className={isPositive ? "is-positive" : "is-negative"}>
          <div>
            <strong>{row.ticker}</strong>
            <span>{formatSignedPortfolioMove(row.move)}</span>
          </div>
          <div className="portfolio-today-moved-track" aria-hidden="true">
            <span style={{ width: `${((Math.abs(row.contribution) / maxContribution) * 100).toFixed(1)}%` }} />
          </div>
          <em>{formatSignedPortfolioCurrency(row.contribution)}</em>
        </article>
      );
    });

  return (
    <section className="portfolio-today-moved-module" aria-labelledby="portfolio-today-moved-heading">
      <header>
        <div>
          <span>Today moved by</span>
          <h2 id="portfolio-today-moved-heading">Today's P&L</h2>
        </div>
        <strong className={oneDayReturn >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioCurrency(oneDayReturn)}</strong>
      </header>
      <div className="portfolio-today-moved-columns">
        <section aria-label="Positive contributors">
          <h3>Positive contributors</h3>
          <div>{renderRows(positiveRows)}</div>
        </section>
        <section aria-label="Negative contributors">
          <h3>Negative contributors</h3>
          <div>{renderRows(negativeRows)}</div>
        </section>
      </div>
    </section>
  );
}

function MarketSignalRows({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <section className="portfolio-market-signal-list" aria-labelledby="portfolio-market-signal-heading">
      <header>
        <span>Market signals</span>
        <h2 id="portfolio-market-signal-heading">Affecting your portfolio</h2>
      </header>
      <div>
        {PORTFOLIO_COCKPIT.marketDrivers.map((driver) => (
          <article key={driver.id} className={`is-${driver.impactDirection.toLowerCase()}`}>
            <button type="button" className="portfolio-market-signal-main" onClick={() => onOpenEvidence(buildMarketDriverEvidence(driver, freshness))}>
              <em>{driver.impactDirection}</em>
              <span>{driver.theme}</span>
              <strong>{driver.headline}</strong>
              <div className="portfolio-reason-chip-row">
                {driver.affectedHoldings.map((ticker) => (
                  <span key={ticker}>{ticker}</span>
                ))}
              </div>
            </button>
            <button type="button" className="portfolio-market-signal-source" onClick={() => onOpenEvidence(buildMarketDriverEvidence(driver, freshness))}>
              Sources
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioContributionBars({ compact = false }: { compact?: boolean }) {
  const rows = getContributionRows();
  const maxContribution = Math.max(...rows.map((row) => Math.abs(row.contribution)), 1);

  return (
    <div className={`portfolio-ranked-contribution-bars${compact ? " is-compact" : ""}`} aria-label="Ranked contribution bars">
      {rows.map((row) => {
        const isPositive = row.contribution >= 0;

        return (
          <article key={row.ticker} className={isPositive ? "is-positive" : "is-negative"}>
            <div>
              <strong>{row.ticker}</strong>
              <span>{formatSignedPortfolioMove(row.move)}</span>
            </div>
            <div className="portfolio-ranked-contribution-track" aria-hidden="true">
              <span style={{ width: `${((Math.abs(row.contribution) / maxContribution) * 100).toFixed(1)}%` }} />
            </div>
            <em>{formatSignedPortfolioCurrency(row.contribution)}</em>
          </article>
        );
      })}
    </div>
  );
}

function PortfolioAllocationView() {
  const holdings = [...PORTFOLIO_HOLDINGS].sort((first, second) => second.allocation - first.allocation);
  const [activeTicker, setActiveTicker] = useState(holdings[0]?.ticker ?? "");
  const activeHolding = holdings.find((holding) => holding.ticker === activeTicker) ?? holdings[0];

  return (
    <div className="portfolio-allocation-strip-view" onMouseLeave={() => setActiveTicker(holdings[0]?.ticker ?? "")}>
      <div className="portfolio-allocation-summary">
        <span>Equity 100% / Fund 0%</span>
        <strong>{activeHolding ? `${activeHolding.ticker} ${activeHolding.allocation.toFixed(1)}%` : "7 direct holdings"}</strong>
      </div>

      <div className="portfolio-allocation-strip" aria-label="Stacked allocation by holding">
        {holdings.map((holding) => (
          <button
            key={holding.ticker}
            type="button"
            aria-label={`${holding.ticker} ${holding.allocation.toFixed(1)} percent allocation`}
            className={holding.ticker === activeTicker ? "is-active" : ""}
            style={
              {
                "--allocation-share": `${holding.allocation}`,
                "--allocation-color": PORTFOLIO_ALLOCATION_COLORS[holding.ticker] ?? "#d2c4a3",
              } as CSSProperties
            }
            onMouseEnter={() => setActiveTicker(holding.ticker)}
            onFocus={() => setActiveTicker(holding.ticker)}
            onClick={() => setActiveTicker(holding.ticker)}
          />
        ))}
      </div>

      <div className="portfolio-allocation-ledger">
        {holdings.map((holding) => (
          <button
            key={holding.ticker}
            type="button"
            className={holding.ticker === activeTicker ? "is-active" : ""}
            style={{ "--allocation-color": PORTFOLIO_ALLOCATION_COLORS[holding.ticker] ?? "#d2c4a3" } as CSSProperties}
            onMouseEnter={() => setActiveTicker(holding.ticker)}
            onFocus={() => setActiveTicker(holding.ticker)}
            onClick={() => setActiveTicker(holding.ticker)}
          >
            <span aria-hidden="true" />
            <strong>{holding.ticker}</strong>
            <em>{holding.allocation.toFixed(1)}%</em>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectorExposureBars() {
  const sectorRows = getSectorExposureRows();
  const maxValue = Math.max(...sectorRows.map((row) => row.value), 1);

  return (
    <section className="portfolio-sector-exposure" aria-label="Exposure by sector">
      <header>
        <span>Exposure by sector</span>
        <strong>Concentration lens</strong>
      </header>
      <div>
        {sectorRows.map((row) => (
          <article key={row.label}>
            <span>{row.label}</span>
            <div aria-hidden="true">
              <span style={{ width: `${((row.value / maxValue) * 100).toFixed(1)}%` }} />
            </div>
            <strong>{row.value.toFixed(1)}%</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnalysisSummaryStrip() {
  const portfolioReturn = getPerformanceReturnPercent(PORTFOLIO_PERFORMANCE);
  const niftyReturn = getPerformanceReturnPercent(NIFTY_50_PERFORMANCE);
  const alpha = portfolioReturn - niftyReturn;
  const largestSector = [...getSectorExposureRows()].sort((first, second) => second.value - first.value)[0];
  const contributionRows = getContributionRows();
  const biggestPositive = contributionRows.find((row) => row.contribution >= 0);
  const biggestDrag = [...contributionRows].reverse().find((row) => row.contribution < 0);
  const items = [
    {
      label: "Portfolio return",
      value: formatSignedPortfolioPercent(portfolioReturn),
      tone: portfolioReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "NIFTY 50 return",
      value: formatSignedPortfolioPercent(niftyReturn),
      tone: niftyReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "Alpha",
      value: formatSignedPortfolioPercent(alpha),
      tone: alpha >= 0 ? "positive" : "negative",
    },
    {
      label: "Largest sleeve",
      value: largestSector ? `${largestSector.label} ${largestSector.value.toFixed(1)}%` : "n/a",
      tone: "neutral",
    },
    {
      label: "Biggest positive driver",
      value: biggestPositive ? `${biggestPositive.ticker} ${formatSignedPortfolioCurrency(biggestPositive.contribution)}` : "n/a",
      tone: "positive",
    },
    {
      label: "Biggest drag",
      value: biggestDrag ? `${biggestDrag.ticker} ${formatSignedPortfolioCurrency(biggestDrag.contribution)}` : "n/a",
      tone: "negative",
    },
  ];

  return (
    <section className="portfolio-analysis-summary-strip" aria-label="Portfolio analysis summary">
      {items.map((item) => (
        <article key={item.label} className={`is-${item.tone}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

function PortfolioAnalysisView({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <div className="portfolio-analysis-view">
      <AnalysisSummaryStrip />
      <PortfolioChartsSection />
      <SectorExposureBars />
      <HoldingsExposureTable freshness={freshness} onOpenEvidence={onOpenEvidence} />
    </div>
  );
}

function RiskRadar({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  const severityByRiskId: Record<string, "High" | "Medium"> = {
    "financials-concentration": "High",
    "tata-motors-momentum": "Medium",
    "currency-crude": "Medium",
  };

  return (
    <section className="portfolio-risk-radar" aria-labelledby="portfolio-risk-radar-heading">
      <header>
        <span>Risk map</span>
        <h2 id="portfolio-risk-radar-heading">Where portfolio risk sits</h2>
      </header>
      <div className="portfolio-risk-radar-grid">
        {PORTFOLIO_COCKPIT.riskStrip.map((card) => {
          const severity = severityByRiskId[card.id] ?? "Medium";

          return (
            <article key={card.id}>
              <div className="portfolio-risk-map-main">
                <em className={`severity-${severity.toLowerCase()}`}>{severity}</em>
                <strong>{card.headline}</strong>
                <p>{card.whyItMatters}</p>
              </div>
              <div className="portfolio-reason-chip-row">
                {card.affectedHoldings.map((ticker) => (
                  <span key={ticker}>{ticker}</span>
                ))}
              </div>
              <button type="button" aria-label={`View ${card.headline} details`} onClick={() => onOpenEvidence(buildRiskEvidence(card, freshness))}>
                Details
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function OverviewPortfolioView({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  freshness,
  onOpenEvidence,
  onShowHoldings,
  onFunds,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
  onShowHoldings: () => void;
  onFunds: () => void;
}) {
  return (
    <div className="portfolio-today-view">
      <PortfolioStatusStrip
        totalValue={totalValue}
        oneDayReturn={oneDayReturn}
        totalReturn={totalReturn}
        totalReturnPercent={totalReturnPercent}
        freshness={freshness}
        onOpenEvidence={() => onOpenEvidence(buildTrustEvidence(freshness))}
      />
      <div className="portfolio-overview-hero-grid">
        <PrimaryActionModule freshness={freshness} onOpenEvidence={onOpenEvidence} onShowHoldings={onShowHoldings} onFunds={onFunds} />
        <TodayMovedBy oneDayReturn={oneDayReturn} />
      </div>
      <PortfolioDiagnosis />
      <div className="portfolio-overview-lower-grid">
        <RiskRadar freshness={freshness} onOpenEvidence={onOpenEvidence} />
        <MarketSignalRows freshness={freshness} onOpenEvidence={onOpenEvidence} />
      </div>
    </div>
  );
}

function PortfolioEvidenceTab({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <section className="portfolio-evidence-tab" aria-labelledby="portfolio-evidence-tab-heading">
      <header>
        <div>
          <span>Evidence</span>
          <h2 id="portfolio-evidence-tab-heading">AI view support</h2>
        </div>
        <button type="button" onClick={() => onOpenEvidence(buildTrustEvidence(freshness))}>
          Open drawer
        </button>
      </header>

      <div className="portfolio-evidence-overview">
        <article>
          <span>Sources count</span>
          <strong>{PORTFOLIO_COCKPIT.status.sourceCount}</strong>
        </article>
        <article>
          <span>Freshness</span>
          <strong>{freshness}</strong>
        </article>
        <article>
          <span>Evidence level</span>
          <strong>{PORTFOLIO_COCKPIT.status.evidenceLevel}</strong>
        </article>
      </div>

      <div className="portfolio-evidence-grid">
        <section>
          <h3>Assumptions</h3>
          <ul>
            {PORTFOLIO_AI_TRUST.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Signals used</h3>
          <ul>
            {PORTFOLIO_AI_TRUST.changedToday.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>What would change the AI view</h3>
          <ul>
            {PORTFOLIO_AI_TRUST.needsConfirmation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <FinanceDisclaimer />
    </section>
  );
}

function EvidenceDrawer({
  content,
  onClose,
}: {
  content: PortfolioEvidenceDrawerContent | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!content) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, onClose]);

  if (!content || typeof document === "undefined") return null;

  return createPortal(
    <div className="portfolio-evidence-drawer-layer" role="presentation">
      <button type="button" className="portfolio-evidence-drawer-backdrop" aria-label="Close evidence drawer" onClick={onClose} />
      <aside className="portfolio-evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="portfolio-evidence-drawer-title">
        <header>
          <div>
            <span>AI evidence</span>
            <h2 id="portfolio-evidence-drawer-title">{content.title}</h2>
          </div>
          <button type="button" aria-label="Close evidence drawer" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="portfolio-evidence-drawer-metrics">
          <article>
            <span>Sources</span>
            <strong>{content.sourceCount}</strong>
          </article>
          <article>
            <span>Freshness</span>
            <strong>{content.freshness}</strong>
          </article>
          <article>
            <span>Confidence</span>
            <strong>{content.confidence}</strong>
          </article>
        </div>
        <section>
          <h3>Assumptions</h3>
          <ul>
            {content.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Supporting signals</h3>
          <ul>
            {content.supportingSignals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>What would change the view</h3>
          <p>{content.wouldChange}</p>
        </section>
        <FinanceDisclaimer />
      </aside>
    </div>,
    document.body,
  );
}

function YourPortfolioTab({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  portfolioSyncStatus,
  onFunds,
  onOpenEvidence,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  portfolioSyncStatus: string;
  onFunds: () => void;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  const [activeStage, setActiveStage] = useState<PortfolioStage>("Overview");
  const panelId = getPortfolioStageId(activeStage);

  return (
    <section className="portfolio-dashboard portfolio-staged-workspace" aria-label="Portfolio dashboard">
      <PortfolioStageTabs activeStage={activeStage} onStageChange={setActiveStage} />

      <section id={panelId} className="portfolio-stage-panel" role="tabpanel" aria-labelledby={`${panelId}-tab`}>
        {activeStage === "Overview" ? (
          <OverviewPortfolioView
            totalValue={totalValue}
            oneDayReturn={oneDayReturn}
            totalReturn={totalReturn}
            totalReturnPercent={totalReturnPercent}
            freshness={portfolioSyncStatus}
            onOpenEvidence={onOpenEvidence}
            onShowHoldings={() => setActiveStage("Portfolio Analysis")}
            onFunds={onFunds}
          />
        ) : null}

        {activeStage === "Portfolio Analysis" ? <PortfolioAnalysisView freshness={portfolioSyncStatus} onOpenEvidence={onOpenEvidence} /> : null}
      </section>
    </section>
  );
}

function FinanceScreenShell({
  activeView,
  label,
  pageTitle,
  pageSubtitle,
  pageMeta,
  searchLabel,
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  children,
  onHome,
  onMarkets,
  onEarnings,
  onFunds,
  onScreener,
  onWatchlist,
  onPortfolio,
}: FinanceNavigationProps & {
  activeView: AppView;
  label: string;
  pageTitle: string;
  pageSubtitle: string;
  pageMeta?: string;
  searchLabel: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  const financeAppRef = useRef<HTMLElement | null>(null);

  return (
    <main ref={financeAppRef} className={`app-shell portfolio-app portfolio-app-view-${activeView}`}>
      <GlobalBrandNav
        activeView={activeView}
        onHome={onHome}
        onMarkets={onMarkets}
        onEarnings={onEarnings}
        onFunds={onFunds}
        onScreener={onScreener}
        onWatchlist={onWatchlist}
        onPortfolio={onPortfolio}
      />

      <section className="portfolio-screen portfolio-workspace-screen" aria-label={label}>
        <div className="portfolio-background-grid" aria-hidden="true" />

        <header className="portfolio-finance-header">
          <div className="portfolio-finance-header-title">
            <span className="portfolio-section-kicker">Sovereign Lens Finance</span>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
            {pageMeta ? <span className="portfolio-page-meta">{pageMeta}</span> : null}
          </div>
          <form className="portfolio-finance-search" role="search" aria-label={searchLabel} onSubmit={onSearchSubmit}>
            <Search aria-hidden="true" />
            <input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search Indian stocks, sectors, funds..."
            />
          </form>
          <div className="portfolio-market-status" aria-label="Market status">
            <div className="portfolio-sentiment-bars" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <div>
              <strong>Bullish Sentiment</strong>
              <span>Markets Closed - 6 May 2026, IST</span>
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

export function IndianMarketsScreen(props: FinanceNavigationProps) {
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();
    if (!query) return;

    props.onScreener(query);
  };

  return (
    <FinanceScreenShell
      {...props}
      activeView="markets"
      label="Indian Markets screen"
      pageTitle="Indian Markets"
      pageSubtitle="Benchmarks, breadth, movers, and sector context for NSE and BSE."
      pageMeta="NSE / BSE context"
      searchLabel="Search Indian Markets workspace"
      searchValue={workspaceSearchQuery}
      onSearchValueChange={setWorkspaceSearchQuery}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <IndianMarketsTab onAnswer={props.onAnswer} />
    </FinanceScreenShell>
  );
}

export function EarningsScreen({ initialQuery = "", ...props }: EarningsScreenProps) {
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState(initialQuery);
  const [earningsFilter, setEarningsFilter] = useState<EarningsFilter>("This Week");
  const [earningsQuery, setEarningsQuery] = useState(initialQuery);

  useEffect(() => {
    setWorkspaceSearchQuery(initialQuery);
    setEarningsQuery(initialQuery);
  }, [initialQuery]);

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();

    setEarningsQuery(query);
  };

  return (
    <FinanceScreenShell
      {...props}
      activeView="earnings"
      label="Earnings screen"
      pageTitle="Earnings"
      pageSubtitle="Upcoming and recent results with date filters and company notes."
      pageMeta="Indian companies"
      searchLabel="Search earnings workspace"
      searchValue={workspaceSearchQuery}
      onSearchValueChange={setWorkspaceSearchQuery}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <EarningsTab
        earningsFilter={earningsFilter}
        onEarningsFilterChange={setEarningsFilter}
        query={earningsQuery}
        onQueryChange={setEarningsQuery}
        onScreener={props.onScreener}
        onWatchlist={props.onWatchlist}
      />
    </FinanceScreenShell>
  );
}

export function ScreenerScreen({ initialQuery = "", ...props }: ScreenerScreenProps) {
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState(initialQuery);
  const [screenerQuery, setScreenerQuery] = useState(initialQuery);
  const [screenerSector, setScreenerSector] = useState("All");
  const [screenerPreset, setScreenerPreset] = useState<ScreenerPreset>("Quality compounders");
  const [screenerSort, setScreenerSort] = useState<{ key: keyof ScreenerRow; direction: SortDirection }>({
    key: "oneYear",
    direction: "desc",
  });
  const [selectedScreenerTicker, setSelectedScreenerTicker] = useState<string | null>(initialQuery.toUpperCase() || null);
  const [trackedTickers, setTrackedTickers] = useState(() => loadStoredTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, DEFAULT_TRACKED_TICKERS));
  const [screenerFeedback, setScreenerFeedback] = useState("");

  useEffect(() => {
    setWorkspaceSearchQuery(initialQuery);
    setScreenerQuery(initialQuery);
    if (initialQuery) setSelectedScreenerTicker(initialQuery.toUpperCase());
  }, [initialQuery]);

  useEffect(() => {
    persistTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, trackedTickers);
  }, [trackedTickers]);

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();

    setScreenerQuery(query);
    props.onScreener(query || undefined);
  };

  const handleScreenerSort = (key: keyof ScreenerRow) => {
    setScreenerSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handleAddScreenerToWatchlist = (row: ScreenerRow) => {
    setTrackedTickers((current) => {
      const next = new Set(current);
      const wasTracked = next.has(row.ticker);
      next.add(row.ticker);
      setScreenerFeedback(
        wasTracked
          ? `${row.name} is already saved in this browser watchlist.`
          : `${row.name} added to your local watchlist. Saved in this browser only.`,
      );
      return next;
    });
  };

  return (
    <FinanceScreenShell
      {...props}
      activeView="screener"
      label="Screener screen"
      pageTitle="Screener"
      pageSubtitle="Stock discovery and screen building for Indian market names."
      pageMeta={`${screenerPreset} screen`}
      searchLabel="Search screener workspace"
      searchValue={workspaceSearchQuery}
      onSearchValueChange={setWorkspaceSearchQuery}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <ScreenerTab
        query={screenerQuery}
        onQueryChange={setScreenerQuery}
        sector={screenerSector}
        onSectorChange={setScreenerSector}
        preset={screenerPreset}
        onPresetChange={setScreenerPreset}
        sortKey={screenerSort.key}
        sortDirection={screenerSort.direction}
        onSortChange={handleScreenerSort}
        selectedTicker={selectedScreenerTicker}
        onSelectedTickerChange={setSelectedScreenerTicker}
        trackedTickers={trackedTickers}
        feedbackMessage={screenerFeedback}
        onAddToWatchlist={handleAddScreenerToWatchlist}
        onOpenEarnings={props.onEarnings}
      />
    </FinanceScreenShell>
  );
}

export function WatchlistScreen(props: FinanceNavigationProps) {
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [watchlistQuery, setWatchlistQuery] = useState("");
  const [trackedTickers, setTrackedTickers] = useState(() => loadStoredTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, DEFAULT_TRACKED_TICKERS));
  const [alertTickers, setAlertTickers] = useState(() => loadStoredTickerSet(WATCHLIST_ALERTS_STORAGE_KEY, DEFAULT_ALERT_TICKERS));
  const [watchlistFeedback, setWatchlistFeedback] = useState("");

  useEffect(() => {
    persistTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, trackedTickers);
  }, [trackedTickers]);

  useEffect(() => {
    persistTickerSet(WATCHLIST_ALERTS_STORAGE_KEY, alertTickers);
  }, [alertTickers]);

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWatchlistQuery(workspaceSearchQuery.trim());
  };

  const toggleTrackedTicker = (ticker: string) => {
    const item = WATCHLIST_ITEMS.find((watchlistItem) => watchlistItem.ticker === ticker);
    const itemName = item?.name ?? ticker;

    setTrackedTickers((current) => {
      const next = new Set(current);
      const isRemoving = next.has(ticker);
      if (isRemoving) next.delete(ticker);
      else next.add(ticker);
      setWatchlistFeedback(
        `${itemName} ${isRemoving ? "removed from" : "added to"} your local watchlist. Saved in this browser.`,
      );
      return next;
    });
  };

  const toggleAlertTicker = (ticker: string) => {
    const item = WATCHLIST_ITEMS.find((watchlistItem) => watchlistItem.ticker === ticker);
    const itemName = item?.name ?? ticker;

    setAlertTickers((current) => {
      const next = new Set(current);
      const isDisabling = next.has(ticker);
      if (isDisabling) next.delete(ticker);
      else next.add(ticker);
      setWatchlistFeedback(
        `${itemName} local alert ${isDisabling ? "disabled" : "enabled"}. Saved in this browser only.`,
      );
      return next;
    });
  };

  return (
    <FinanceScreenShell
      {...props}
      activeView="watchlist"
      label="Watchlist screen"
      pageTitle="Watchlist"
      pageSubtitle="Tracked assets, browser-saved alerts, and daily movement context."
      pageMeta="Saved in this browser"
      searchLabel="Search watchlist workspace"
      searchValue={workspaceSearchQuery}
      onSearchValueChange={setWorkspaceSearchQuery}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <WatchlistTab
        query={watchlistQuery}
        onQueryChange={setWatchlistQuery}
        trackedTickers={trackedTickers}
        alertTickers={alertTickers}
        feedbackMessage={watchlistFeedback}
        onToggleTracked={toggleTrackedTicker}
        onToggleAlert={toggleAlertTicker}
        onScreener={props.onScreener}
        onEarnings={props.onEarnings}
      />
    </FinanceScreenShell>
  );
}

export function PortfolioScreen({ onHome, onMarkets, onEarnings, onFunds, onScreener, onWatchlist, onPortfolio }: PortfolioScreenProps) {
  const portfolioAppRef = useRef<HTMLElement | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState("Local view updated 2m ago");
  const [isPortfolioSyncing, setIsPortfolioSyncing] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [evidenceDrawer, setEvidenceDrawer] = useState<PortfolioEvidenceDrawerContent | null>(null);

  const totalValue = PORTFOLIO_HOLDINGS.reduce((sum, holding) => sum + holding.value, 0);
  const oneDayReturn = totalValue * (PORTFOLIO_DAY_RETURN_PERCENT / 100);
  const totalReturn = totalValue - PORTFOLIO_INVESTED_VALUE;
  const totalReturnPercent = (totalReturn / PORTFOLIO_INVESTED_VALUE) * 100;

  useEffect(
    () => () => {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    },
    [],
  );

  const scrollPortfolioDown = () => {
    const portfolioApp = portfolioAppRef.current;
    if (!portfolioApp) return;

    portfolioApp.scrollBy({
      top: Math.max(portfolioApp.clientHeight * 0.72, 360),
      behavior: "smooth",
    });
  };

  const handlePortfolioSync = () => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);

    setIsPortfolioSyncing(true);
    setPortfolioSyncStatus("Refreshing local view...");
    syncTimerRef.current = window.setTimeout(() => {
      setIsPortfolioSyncing(false);
      setPortfolioSyncStatus("Local view updated just now");
    }, 720);
  };

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();
    if (!query) return;

    onScreener(query);
  };

  return (
    <main ref={portfolioAppRef} className="app-shell portfolio-app portfolio-app-view-portfolio">
      <GlobalBrandNav
        activeView="portfolio"
        onHome={onHome}
        onMarkets={onMarkets}
        onEarnings={onEarnings}
        onFunds={onFunds}
        onScreener={onScreener}
        onWatchlist={onWatchlist}
        onPortfolio={onPortfolio}
      />

      <section className="portfolio-screen portfolio-workspace-screen" aria-label="Synced portfolio screen">
        <div className="portfolio-background-grid" aria-hidden="true" />

        <PortfolioHeader
          searchValue={workspaceSearchQuery}
          onSearchValueChange={setWorkspaceSearchQuery}
          onSearchSubmit={handleWorkspaceSearch}
          isPortfolioSyncing={isPortfolioSyncing}
          portfolioSyncStatus={portfolioSyncStatus}
          onRefresh={handlePortfolioSync}
          onOpenEvidence={() => setEvidenceDrawer(buildTrustEvidence(portfolioSyncStatus))}
        />

        <YourPortfolioTab
          totalValue={totalValue}
          oneDayReturn={oneDayReturn}
          totalReturn={totalReturn}
          totalReturnPercent={totalReturnPercent}
          portfolioSyncStatus={portfolioSyncStatus}
          onFunds={onFunds}
          onOpenEvidence={setEvidenceDrawer}
        />

        <button type="button" className="portfolio-scroll-cue" aria-label="Scroll portfolio screen down" onClick={scrollPortfolioDown}>
          <span />
        </button>
      </section>
      <EvidenceDrawer content={evidenceDrawer} onClose={() => setEvidenceDrawer(null)} />
    </main>
  );
}
