import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowUpRight, Bell, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Plus, RefreshCw, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../../app/GlobalBrandNav";
import type { AppView } from "../../app/routes";
import { DetailedSparkline } from "../../components/charts/DetailedSparkline";
import { MarketTape } from "../market-tape/MarketTape";
import {
  INDIAN_MARKET_TAPE,
  WATCHLIST_MARKET_TAPE,
} from "../market-tape/marketTapeData";
import {
  NIFTY_50_PERFORMANCE,
  PORTFOLIO_MARKET_TAPE,
  PORTFOLIO_ALLOCATION_COLORS,
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

interface FinanceNavigationProps extends GlobalBrandNavHandlers {
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

const FINANCE_TAPE_BY_VIEW = {
  markets: { basket: INDIAN_MARKET_TAPE, statusLabel: "India Tape" },
  watchlist: { basket: WATCHLIST_MARKET_TAPE, statusLabel: "Watchlist Tape" },
} as const;

const FINANCE_VIEW_PLACEHOLDER: Partial<Record<AppView, string>> = {
  markets: "Search stocks, sectors, funds...",
  earnings: "Search companies, earnings, calls...",
  screener: "Search ticker, sector, or filter...",
  watchlist: "Search watchlist or alerts...",
};

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
  { key: "oneYear", label: "1Y", className: "is-numeric" },
  { key: "roe", label: "ROE", className: "is-numeric" },
];

const SCREENER_SCREEN_LIBRARY: Array<{ title: string; detail: string; preset: ScreenerPreset }> = [
  {
    title: "Promoter-quality proxy",
    detail: "High ROE, controlled leverage, durable profit screen.",
    preset: "Quality compounders",
  },
  {
    title: "Quarterly growers",
    detail: "Revenue and profit acceleration candidates.",
    preset: "Earnings momentum",
  },
  {
    title: "Low debt leaders",
    detail: "Balance-sheet resilience with lower D/E.",
    preset: "Low debt",
  },
  {
    title: "Momentum leaders",
    detail: "Names with strong 1M and 1Y price follow-through.",
    preset: "Momentum leaders",
  },
];

function formatPercent(value: number, maximumFractionDigits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(maximumFractionDigits)}%`;
}

function formatCompactCrores(value: number) {
  if (value >= 100000) return `${(value / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L Cr`;
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

function formatCompactFlowCrores(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN")}Cr`;
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

type HeatmapSectorLabelLevel = "full" | "compact" | "none";

interface HeatmapSectorLayout extends HeatmapRect {
  sector: string;
  industries: string;
  labelLevel: HeatmapSectorLabelLevel;
  headerHeight: number;
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

const HEATMAP_SECTOR_GUTTER_X = 0.18;
const HEATMAP_SECTOR_GUTTER_Y = 0.06;
const HEATMAP_SECTOR_BODY_GAP_X = 0.035;
const HEATMAP_SECTOR_BODY_GAP_Y = 0.025;
const HEATMAP_TILE_GAP_X = 0.035;
const HEATMAP_TILE_GAP_Y = 0.035;

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

  if (area >= 150 && rect.height >= 13 && rect.width >= 11 && shortSide >= 6) return "full";
  if (area >= 70 && rect.height >= 7 && rect.width >= 6 && shortSide >= 4) return "medium";
  if (area >= 24 && rect.height >= 4.6 && rect.width >= 4.5 && shortSide >= 2.8) return "compact";
  return "micro";
}

function getWeightedMove(stocks: MarketHeatmapTile[]) {
  const totalWeight = sumWeighted(stocks, heatmapWeight);
  return stocks.reduce((sum, stock) => sum + stock.changePercent * heatmapWeight(stock), 0) / Math.max(totalWeight, 0.001);
}

function getHeatmapSectorHeader(rect: HeatmapRect): { height: number; labelLevel: HeatmapSectorLabelLevel } {
  if (rect.width < 8 || rect.height < 10) {
    return { height: 0, labelLevel: "none" };
  }

  const canShowFullLabel = rect.width >= 18 && rect.height >= 15;
  const labelLevel: HeatmapSectorLabelLevel = canShowFullLabel ? "full" : "compact";
  const minHeight = canShowFullLabel ? 3.4 : 2.8;
  const maxHeight = canShowFullLabel ? 4.4 : 3.4;
  const height = Math.min(maxHeight, Math.max(minHeight, rect.height * 0.105));

  return { height: Math.min(height, rect.height * 0.32), labelLevel };
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
    const sectorFrame = insetHeatmapRect(rect, HEATMAP_SECTOR_GUTTER_X, HEATMAP_SECTOR_GUTTER_Y);
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
    const sectorHeader = getHeatmapSectorHeader(sectorFrame);
    const bodyRect = insetHeatmapRect(
      {
        x: sectorFrame.x,
        y: sectorFrame.y + sectorHeader.height,
        width: sectorFrame.width,
        height: Math.max(sectorFrame.height - sectorHeader.height, 0.1),
      },
      HEATMAP_SECTOR_BODY_GAP_X,
      HEATMAP_SECTOR_BODY_GAP_Y,
    );
    const tileRects = buildWeightedRects(sector.stocks, bodyRect, heatmapWeight);
    const tiles = tileRects.map(({ item: stock, rect: tileRect }) => {
      const insetRect = insetHeatmapRect(tileRect, HEATMAP_TILE_GAP_X, HEATMAP_TILE_GAP_Y);
      return {
        ...insetRect,
        stock,
        labelLevel: getHeatmapLabelLevel(insetRect),
      };
    });

    return {
      ...sectorFrame,
      sector: sector.sector,
      industries,
      labelLevel: sectorHeader.labelLevel,
      headerHeight: sectorHeader.height,
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
      "--heatmap-bg": "#343434",
      "--heatmap-border": "rgba(210, 210, 204, 0.13)",
      "--heatmap-accent": "rgba(235, 235, 230, 0.82)",
      "--heatmap-text": "rgba(244, 244, 239, 0.92)",
    } as React.CSSProperties;
  }

  if (clampedValue > 0) {
    const tone =
      absValue >= 2
        ? { bg: "#63ad49", border: "rgba(126, 207, 91, 0.46)", accent: "rgba(225, 252, 207, 0.96)" }
        : absValue >= 1
          ? { bg: "#4f8d3e", border: "rgba(111, 184, 82, 0.38)", accent: "rgba(219, 246, 204, 0.9)" }
          : { bg: "#385f32", border: "rgba(92, 148, 72, 0.3)", accent: "rgba(206, 231, 195, 0.82)" };

    return {
      "--heatmap-bg": tone.bg,
      "--heatmap-border": tone.border,
      "--heatmap-accent": tone.accent,
      "--heatmap-text": "rgba(246, 252, 242, 0.95)",
    } as React.CSSProperties;
  }

  const tone =
    absValue >= 2
      ? { bg: "#d25b75", border: "rgba(248, 116, 146, 0.46)", accent: "rgba(255, 225, 232, 0.96)" }
      : absValue >= 1
        ? { bg: "#9e4858", border: "rgba(222, 91, 116, 0.38)", accent: "rgba(251, 211, 219, 0.9)" }
        : { bg: "#713a43", border: "rgba(181, 79, 98, 0.3)", accent: "rgba(237, 197, 205, 0.82)" };

  return {
    "--heatmap-bg": tone.bg,
    "--heatmap-border": tone.border,
    "--heatmap-accent": tone.accent,
    "--heatmap-text": "rgba(255, 240, 244, 0.96)",
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
  const moveTone = toneClass(item.changePercent);
  const DirectionIcon = item.changePercent >= 0 ? ArrowUpRight : ArrowDownRight;
  const formattedPercent = formatPercent(item.changePercent);

  return (
    <article className="portfolio-index-card" aria-label={`${item.symbol} ${item.value}, ${formattedPercent}, ${item.changeValue}`}>
      <header className="markets-asset-card-header">
        <div className="markets-asset-identity">
          <h3>{item.symbol}</h3>
          <strong className="markets-asset-value">{item.value}</strong>
        </div>
        <div className={`markets-asset-move ${moveTone}`}>
          <strong className="markets-asset-percent">
            <DirectionIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>{formattedPercent}</span>
          </strong>
          <em className="markets-asset-change">{item.changeValue}</em>
        </div>
      </header>
      <DetailedSparkline
        className="portfolio-mini-sparkline"
        data={item.points}
        trend={item.changePercent >= 0 ? "up" : "down"}
        ariaLabel={`${item.symbol} intraday trend chart`}
      />
    </article>
  );
}

const MAX_VISIBLE_TOP_METRICS = 4;
const DEFAULT_TOP_METRIC_SYMBOLS = ["NIFTY 50", "SENSEX", "INDIA VIX", "USD/INR"];

function MarketTopMetricsRail() {
  const [selectedMetricSymbols, setSelectedMetricSymbols] = useState<string[]>(DEFAULT_TOP_METRIC_SYMBOLS);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedMetricSet = useMemo(() => new Set(selectedMetricSymbols), [selectedMetricSymbols]);
  const visibleMetrics = useMemo(
    () =>
      selectedMetricSymbols
        .map((symbol) => MARKET_INDEX_CARDS.find((item) => item.symbol === symbol))
        .filter((item): item is MarketIndexCard => Boolean(item)),
    [selectedMetricSymbols],
  );
  const isAtVisibleLimit = selectedMetricSymbols.length >= MAX_VISIBLE_TOP_METRICS;
  const availableMetricSlots = Math.max(0, MAX_VISIBLE_TOP_METRICS - selectedMetricSymbols.length);
  const pickerLimitHint = isAtVisibleLimit ? "Remove one to add another" : `${availableMetricSlots} slot${availableMetricSlots === 1 ? "" : "s"} open`;

  useEffect(() => {
    if (!isPickerOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPickerOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen]);

  const toggleMetric = (symbol: string) => {
    setSelectedMetricSymbols((currentSymbols) => {
      if (currentSymbols.includes(symbol)) {
        return currentSymbols.filter((currentSymbol) => currentSymbol !== symbol);
      }

      if (currentSymbols.length >= MAX_VISIBLE_TOP_METRICS) return currentSymbols;
      return [...currentSymbols, symbol];
    });
  };

  return (
    <aside className="markets-top-assets-rail" aria-labelledby="markets-top-metrics-heading">
      <section className="portfolio-market-overview-panel">
        <header className="markets-section-heading markets-top-metrics-heading">
          <h2 id="markets-top-metrics-heading">Top Metrics</h2>
          <div className="markets-indicator-picker" ref={pickerRef}>
            <button
              type="button"
              className="markets-indicator-picker-button"
              aria-label={`Choose top metrics, ${selectedMetricSymbols.length} of ${MAX_VISIBLE_TOP_METRICS} selected`}
              aria-expanded={isPickerOpen}
              aria-controls="markets-indicator-picker-menu"
              onClick={() => setIsPickerOpen((isOpen) => !isOpen)}
            >
              <SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>Indicators</span>
              <em>
                {selectedMetricSymbols.length}/{MAX_VISIBLE_TOP_METRICS}
              </em>
              <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>

            {isPickerOpen ? (
              <div id="markets-indicator-picker-menu" className="markets-indicator-picker-menu" role="group" aria-label="Choose visible top metrics">
                <div className="markets-indicator-picker-menu-header">
                  <div>
                    <span>Indicator stack</span>
                    <strong>
                      {selectedMetricSymbols.length}/{MAX_VISIBLE_TOP_METRICS} selected
                    </strong>
                  </div>
                  <small>{pickerLimitHint}</small>
                </div>
                <div className="markets-indicator-picker-options">
                  {MARKET_INDEX_CARDS.map((item) => {
                    const isSelected = selectedMetricSet.has(item.symbol);
                    const isBlocked = !isSelected && isAtVisibleLimit;
                    const optionTone = toneClass(item.changePercent);
                    const optionLabel = isSelected
                      ? `Remove ${item.symbol} from top metrics`
                      : isBlocked
                        ? `Remove one indicator before adding ${item.symbol}`
                        : `Add ${item.symbol} to top metrics`;
                    const optionClassName = [
                      "markets-indicator-option",
                      isSelected ? "is-selected" : "",
                      isBlocked ? "is-blocked" : "is-addable",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-disabled={isBlocked || undefined}
                        aria-label={optionLabel}
                        title={optionLabel}
                        className={optionClassName}
                        onClick={() => {
                          if (isBlocked) return;
                          toggleMetric(item.symbol);
                        }}
                      >
                        <span className="markets-indicator-option-state" aria-hidden="true" />
                        <strong>{item.symbol}</strong>
                        <span className="markets-indicator-option-meta">
                          <em className={optionTone}>{formatPercent(item.changePercent)}</em>
                          {isSelected ? (
                            <span className="markets-indicator-option-action is-remove" aria-hidden="true">
                              <X size={11} strokeWidth={2} />
                            </span>
                          ) : isBlocked ? (
                            <small>Remove one</small>
                          ) : (
                            <span className="markets-indicator-option-action is-add" aria-hidden="true">
                              <Plus size={11} strokeWidth={2} />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <div className="portfolio-index-grid" aria-label={`Selected top metrics, ${visibleMetrics.length} shown`}>
          {visibleMetrics.map((item) => (
            <MarketIndexTile key={item.symbol} item={item} />
          ))}
        </div>
      </section>
    </aside>
  );
}

function MoverList({ items }: { items: MarketMover[] }) {
  return (
    <div className="portfolio-mover-list">
      {items.map((item) => (
        <article key={item.ticker} className="portfolio-mover-row">
          <div>
            <strong>{item.name}</strong>
            <span>{item.ticker} / {item.sector}</span>
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
  const moverTabs = ["gainers", "losers", "active"] as const;
  const [activeMoverTab, setActiveMoverTab] = useState<keyof typeof MARKET_MOVERS>("gainers");
  const activeMoverIndex = moverTabs.indexOf(activeMoverTab);
  const moverTabStyle = { "--mover-active-index": String(activeMoverIndex) } as CSSProperties;

  return (
    <section className="portfolio-workspace-panel">
      <PanelHeading eyebrow="Market movers" title="Live Indian movers" />
      <div
        className={`portfolio-segmented-control portfolio-mover-tabs is-${activeMoverTab}`}
        style={moverTabStyle}
        role="group"
        aria-label="Market mover category"
      >
        {moverTabs.map((tab) => {
          const isActive = activeMoverTab === tab;

          return (
            <button
              key={tab}
              type="button"
              className={`portfolio-mover-tab is-mover-${tab}${isActive ? " is-active" : ""}`}
              data-mover-tab={tab}
              aria-pressed={isActive}
              aria-label={`Show ${tab} movers`}
              onClick={() => setActiveMoverTab(tab)}
            >
              {tab}
            </button>
          );
        })}
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

function HeatmapMarketDepthStrip() {
  const depthItems = [
    { label: "Adv", value: MARKET_BREADTH.advances.toLocaleString("en-IN"), tone: "positive" },
    { label: "Dec", value: MARKET_BREADTH.declines.toLocaleString("en-IN"), tone: "negative" },
    { label: "52W H/L", value: `${MARKET_BREADTH.highs52Week}/${MARKET_BREADTH.lows52Week}`, tone: "neutral" },
    { label: "FII", value: formatCompactFlowCrores(MARKET_BREADTH.fiiFlowCr), tone: "neutral" },
    { label: "DII", value: formatCompactFlowCrores(MARKET_BREADTH.diiFlowCr), tone: "neutral" },
  ];

  return (
    <div className="portfolio-heatmap-depth-strip" role="group" aria-label="Market depth">
      <span className="portfolio-heatmap-depth-caption">NSE depth</span>
      {depthItems.map((item) => (
        <span key={item.label} className={`portfolio-heatmap-depth-item is-${item.tone}`}>
          <b>{item.label}</b>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

const NIFTY_HEATMAP_TIMESTAMP = "May 8, 2026, 12:37 PM GMT+5:30";

function NiftyHeatmapHeader({
  expanded = false,
  onExpand,
  onClose,
}: {
  expanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}) {
  return (
    <header className="portfolio-heatmap-header" role="banner">
      <div className="portfolio-heatmap-title-block">
        <h2>NIFTY 50 Heatmap</h2>
        {!expanded ? <p>Size by market cap. Color by 1D move.</p> : null}
      </div>
      <HeatmapMarketDepthStrip />
      <button
        type="button"
        className="portfolio-heatmap-action"
        onClick={expanded ? onClose : onExpand}
        aria-label={expanded ? "Close expanded NIFTY 50 heatmap" : "Expand NIFTY 50 heatmap"}
      >
        {expanded ? <X size={22} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
      </button>
    </header>
  );
}

function NiftyHeatmapSurface({
  expanded = false,
  showHeader = true,
  onExpand,
  onClose,
}: {
  expanded?: boolean;
  showHeader?: boolean;
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
      {showHeader ? <NiftyHeatmapHeader expanded={expanded} onExpand={onExpand} onClose={onClose} /> : null}

      <div className="portfolio-heatmap-content">
        <div
          className="portfolio-heatmap-stage"
          role="img"
          aria-label="NIFTY 50 stock heatmap grouped by sector, sized by market cap, and colored by one day percent move"
        >
          {layout.sectors.map((sector) => (
            <section
              key={sector.sector}
              className={`portfolio-heatmap-sector is-label-${sector.labelLevel}`}
              style={{
                left: `${sector.x}%`,
                top: `${sector.y}%`,
                width: `${sector.width}%`,
                height: `${sector.height}%`,
                "--heatmap-sector-header": `${sector.headerHeight.toFixed(2)}%`,
                "--heatmap-sector-header-size": `${((sector.headerHeight / Math.max(sector.height, 0.01)) * 100).toFixed(2)}%`,
              } as React.CSSProperties}
              aria-label={`${sector.sector} sector, ${sector.industries ? `${sector.industries}, ` : ""}${formatPercent(sector.weightedMove)} weighted move`}
            >
              {sector.labelLevel !== "none" ? (
                <div className="portfolio-heatmap-sector-label" title={sector.industries ? `${sector.sector}: ${sector.industries}` : sector.sector}>
                  <strong>{sector.sector}</strong>
                </div>
              ) : null}
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
      <NiftyHeatmapHeader onExpand={() => setIsExpanded(true)} />
      <section className="portfolio-workspace-panel portfolio-heatmap-panel">
        <NiftyHeatmapSurface showHeader={false} />
      </section>
      {expandedHeatmap}
    </>
  );
}

const VISIBLE_MARKET_DEVELOPMENT_COUNT = 3;

function MarketDevelopmentGrid({ onAnswer }: { onAnswer: FinanceNavigationProps["onAnswer"] }) {
  const [openingDevelopmentId, setOpeningDevelopmentId] = useState<string | null>(null);
  const [developmentStartIndex, setDevelopmentStartIndex] = useState(0);
  const openingDevelopmentRef = useRef<string | null>(null);
  const visibleDevelopmentCount = Math.min(VISIBLE_MARKET_DEVELOPMENT_COUNT, MARKET_DEVELOPMENTS.length);
  const maxDevelopmentStartIndex = Math.max(MARKET_DEVELOPMENTS.length - visibleDevelopmentCount, 0);
  const visibleDevelopments = MARKET_DEVELOPMENTS.slice(developmentStartIndex, developmentStartIndex + visibleDevelopmentCount);
  const hasDevelopmentCycle = MARKET_DEVELOPMENTS.length > visibleDevelopmentCount;

  const handlePreviousDevelopmentSet = () => {
    if (!hasDevelopmentCycle) return;
    setDevelopmentStartIndex((currentIndex) => (currentIndex <= 0 ? maxDevelopmentStartIndex : currentIndex - 1));
  };

  const handleNextDevelopmentSet = () => {
    if (!hasDevelopmentCycle) return;
    setDevelopmentStartIndex((currentIndex) => (currentIndex >= maxDevelopmentStartIndex ? 0 : currentIndex + 1));
  };

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
    <section className="portfolio-recent-developments-section" aria-labelledby="markets-recent-developments-heading">
      <header className="portfolio-recent-developments-heading">
        <div>
          <h2 id="markets-recent-developments-heading">Recent Developments</h2>
          <span className="portfolio-recent-developments-meta">
            <strong>Updated 12 minutes ago</strong>
            <button
              type="button"
              className="portfolio-recent-developments-sync"
              aria-label="Refresh recent developments"
              title="Refresh recent developments"
              onClick={() => setDevelopmentStartIndex(0)}
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        </div>
      </header>
      <div className="markets-carousel-stage">
        <div className="portfolio-development-grid">
          {visibleDevelopments.map((item) => {
            const isOpening = openingDevelopmentId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`portfolio-development-card ${isOpening ? "is-opening" : ""}`}
                aria-label={`Open synthesis for ${item.title}`}
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
                  {isOpening ? "Opening synthesis" : ""}
                </span>
              </button>
            );
          })}
        </div>
        {hasDevelopmentCycle ? (
          <button className="markets-carousel-edge-button is-previous" type="button" onClick={handlePreviousDevelopmentSet} aria-label="Show previous recent development">
            <ChevronLeft size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}
        {hasDevelopmentCycle ? (
          <button className="markets-carousel-edge-button is-next" type="button" onClick={handleNextDevelopmentSet} aria-label="Show next recent development">
            <ChevronRight size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}
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

const VISIBLE_MARKET_STANDOUT_COUNT = 3;

function MarketStandoutsPanel() {
  const [standoutStartIndex, setStandoutStartIndex] = useState(0);
  const visibleStandoutCount = Math.min(VISIBLE_MARKET_STANDOUT_COUNT, MARKET_STANDOUTS.length);
  const maxStandoutStartIndex = Math.max(MARKET_STANDOUTS.length - visibleStandoutCount, 0);
  const visibleStandouts = MARKET_STANDOUTS.slice(standoutStartIndex, standoutStartIndex + visibleStandoutCount);
  const hasStandoutCycle = MARKET_STANDOUTS.length > visibleStandoutCount;

  const handlePreviousStandoutSet = () => {
    if (!hasStandoutCycle) return;
    setStandoutStartIndex((currentIndex) => (currentIndex <= 0 ? maxStandoutStartIndex : currentIndex - 1));
  };

  const handleNextStandoutSet = () => {
    if (!hasStandoutCycle) return;
    setStandoutStartIndex((currentIndex) => (currentIndex >= maxStandoutStartIndex ? 0 : currentIndex + 1));
  };

  return (
    <section className="portfolio-workspace-panel portfolio-standouts-panel" aria-label="Standouts">
      <PanelHeading eyebrow="Standouts" title="Names moving with force" />
      <div className="markets-carousel-stage">
        <div className="portfolio-standout-list">
          {visibleStandouts.map((item) => (
            <article key={item.ticker} className="portfolio-standout-card">
              <div className="portfolio-standout-header">
                <div className="portfolio-standout-identity">
                  <span>{item.ticker}</span>
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
        {hasStandoutCycle ? (
          <button className="markets-carousel-edge-button is-previous" type="button" onClick={handlePreviousStandoutSet} aria-label="Show previous standout">
            <ChevronLeft size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}
        {hasStandoutCycle ? (
          <button className="markets-carousel-edge-button is-next" type="button" onClick={handleNextStandoutSet} aria-label="Show next standout">
            <ChevronRight size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function IndianMarketsTab({ onAnswer }: { onAnswer: FinanceNavigationProps["onAnswer"] }) {
  return (
    <section className="markets-page-flow" aria-label="Indian Markets">
      <section className="markets-primary-workspace" aria-label="Indian market workspace">
        <section className="markets-summary-column" aria-label="Market summary workspace">
          <MarketSummary items={MARKET_SUMMARY_ITEMS} sources={MARKET_SUMMARY_SOURCES} />
        </section>

        <MarketTopMetricsRail />
      </section>

      <section className="markets-heatmap-section" aria-label="Full-width market heatmap">
        <MarketHeatmapPanel />
      </section>

      <section className="markets-lower-workspace" aria-label="Indian market lower workspace">
        <div className="markets-lower-main">
          <MarketDevelopmentGrid onAnswer={onAnswer} />
          <MarketStandoutsPanel />
        </div>
        <aside className="markets-lower-rail" aria-label="Market movers and sectors">
          <MarketMoversPanel />
          <SectorPerformancePanel />
        </aside>
      </section>
      <FinanceDisclaimer />
    </section>
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
            Inspect in screener
          </button>
          <button
            type="button"
            aria-label={`Open Watchlist for ${event.company} context`}
            title={`Open Watchlist for ${event.company} context`}
            onClick={onWatchlist}
          >
            Review watchlist
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
        <PanelHeading eyebrow="Calendar" title="Earnings calendar" />
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
  onQuerySubmit,
  isScreening,
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
  onQuerySubmit: () => void;
  isScreening: boolean;
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

  const queryMatchesRow = (row: ScreenerRow) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return true;
    if (includesSearch(row.name, trimmedQuery) || includesSearch(row.ticker, trimmedQuery) || includesSearch(row.sector, trimmedQuery)) {
      return true;
    }

    const normalizedQuery = trimmedQuery.toLowerCase();
    const queryRules: Array<(candidate: ScreenerRow) => boolean> = [];

    if (/\blow\s+(peg|p\/e|pe|valuation)\b|\bvalue\b/.test(normalizedQuery)) {
      queryRules.push((candidate) =>
        normalizedQuery.includes("peg")
          ? candidate.pe <= 25 && candidate.profitGrowth >= 10
          : candidate.pe <= 20,
      );
    }

    if (/\bhigh\s+roe\b|\broe\b|\bquality\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.roe >= 20);
    }

    if (/\blow\s+debt\b|\bdebt\b|\bleverage\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.debtEquity <= 0.4);
    }

    if (/\bgrowth\b|\bearnings\b|\bprofit\b|\bcompounder/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.profitGrowth >= 12 || candidate.revenueGrowth >= 10 || candidate.oneYear >= 20);
    }

    if (/\bmomentum\b|\bmovers?\b|\btrend\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.oneMonth >= 3 || candidate.oneYear >= 20);
    }

    if (/\bdividend\b|\byield\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.dividendYield >= 1);
    }

    if (/\blarge\s+cap\b|\blargecap\b|\bblue\s*chip\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.marketCapCr >= 500000);
    }

    if (/\bbank\b|\bfinancials?\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => candidate.sector === "Financial Services" || includesSearch(candidate.name, "bank"));
    }

    if (/\bsolar\b|\brenewable\b/.test(normalizedQuery)) {
      queryRules.push((candidate) => includesSearch(candidate.name, "solar") || includesSearch(candidate.name, "renewable"));
    }

    return queryRules.length > 0 && queryRules.every((rule) => rule(row));
  };

  const matchReasonForRow = (row: ScreenerRow) => {
    const context = SCREENER_ROW_CONTEXT[row.ticker];
    if (query.trim()) return `Query match: ${row.ticker} / ${row.sector}`;
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
      const matchesQuery = queryMatchesRow(row);
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
  const trimmedQuery = query.trim();
  const queryStatusText = isScreening
    ? "Screening local demo universe..."
    : trimmedQuery
      ? `${filteredRows.length} matches in the current demo universe.`
      : "Try: low debt banks, high ROE consumer, dividend yield, earnings momentum.";

  return (
    <WorkspaceLayout
      label="Screener"
      rail={
        <>
          <section className="portfolio-workspace-panel portfolio-screener-context-panel">
            <PanelHeading eyebrow="Screener context" title="Current screen" meta="Demo universe" />
            <p className="portfolio-rail-copy">
              {query.trim()
                ? `Search is filtering Indian-market names for "${query.trim()}".`
                : `Showing ${filteredRows.length} Indian-market names from the ${preset} screen.`}
              {" "}Saved watchlist actions are browser-local only.
            </p>
            <div className="portfolio-rail-mini-table">
              <div>
                <span>Results</span>
                <strong>{filteredRows.length} names</strong>
              </div>
              <div>
                <span>Sorted by</span>
                <strong>
                  {String(sortKey)} / {sortDirection}
                </strong>
              </div>
              <div>
                <span>Sector</span>
                <strong>{sector}</strong>
              </div>
            </div>
            <div className="portfolio-screener-library" aria-label="Saved screen presets">
              {SCREENER_SCREEN_LIBRARY.map((screen) => (
                <button
                  key={screen.title}
                  type="button"
                  className={preset === screen.preset ? "is-active" : ""}
                  aria-pressed={preset === screen.preset}
                  title={`Open ${screen.title} screen`}
                  onClick={() => onPresetChange(screen.preset)}
                >
                  <strong>{screen.title}</strong>
                  <span>{screen.detail}</span>
                </button>
              ))}
            </div>
            <div className="portfolio-screener-sector-cloud" aria-label="Browse sectors">
              <button
                type="button"
                className={sector === "All" ? "is-active" : ""}
                aria-pressed={sector === "All"}
                onClick={() => onSectorChange("All")}
              >
                All sectors
              </button>
              {sectors
                .filter((item) => item !== "All")
                .slice(0, 8)
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={sector === item ? "is-active" : ""}
                    aria-pressed={sector === item}
                    onClick={() => onSectorChange(item)}
                  >
                    {item}
                  </button>
                ))}
            </div>
          </section>
          {selectedRow && selectedContext ? (
            <section className="portfolio-workspace-panel portfolio-quick-read-panel">
              <PanelHeading eyebrow="Analyst note" title={`${selectedRow.ticker} setup`} meta="Local preview" />
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
                  Open earnings
                </button>
              </div>
            </section>
          ) : null}
        </>
      }
    >
      <section className="portfolio-screener-query-shell" aria-label="Screener query command">
        <div className="portfolio-screener-query-heading">
          <h2>Stock Screener</h2>
          <span>Demo universe, browser-local watchlist actions</span>
        </div>
        <form
          className={`portfolio-screener-query-composer${isScreening ? " is-screening" : ""}`}
          role="search"
          aria-label="Run screener query"
          onSubmit={(event) => {
            event.preventDefault();
            onQuerySubmit();
          }}
        >
          <label className="portfolio-screen-reader-only" htmlFor="screener-query-command">
            Screener query
          </label>
          <textarea
            id="screener-query-command"
            value={query}
            rows={2}
            placeholder="Describe a screen: low debt banks, high ROE consumer, dividend yield..."
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onQuerySubmit();
              }
            }}
          />
          <button
            type="submit"
            aria-label={isScreening ? "Screening local demo universe" : "Run screener query"}
            title={isScreening ? "Screening local demo universe" : "Run screener query"}
            disabled={isScreening}
          >
            {isScreening ? <span className="portfolio-screener-query-spinner" aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
          </button>
        </form>
        <div className={`portfolio-screener-query-preview${isScreening ? " is-screening" : ""}`} aria-live="polite">
          <span>{queryStatusText}</span>
          {!trimmedQuery && !isScreening ? (
            <div className="portfolio-screener-query-examples" aria-label="Example screener queries">
              <button type="button" onClick={() => onQueryChange("low debt banks")}>
                low debt banks
              </button>
              <button type="button" onClick={() => onQueryChange("high ROE")}>
                high ROE
              </button>
              <button type="button" onClick={() => onQueryChange("earnings momentum")}>
                earnings momentum
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Screener" title="Indian equity screens" meta={`${filteredRows.length} results, browser-local watchlist`} />
        <div className="portfolio-filter-bar portfolio-screener-control-bar">
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
          <div className="portfolio-screener-active-read">
            <span>Active screen</span>
            <strong>{query.trim() ? `Search: ${query.trim()}` : preset}</strong>
          </div>
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
                    <span>{row.ticker}</span>
                    <small className="portfolio-screener-row-note">{matchReasonForRow(row)}</small>
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
                        Inspect
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
                <td colSpan={SCREENER_COLUMNS.length + 4} className="portfolio-empty-row">
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

  return (
    <WorkspaceLayout
      label="Watchlist"
      rail={
        <>
          <section className="portfolio-workspace-panel portfolio-watchlist-pulse-panel">
            <PanelHeading eyebrow="Pulse" title="Watchlist pulse" meta={`${trackedItems.length} tracked`} />
            <div className="portfolio-watchlist-pulse-list">
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
          <section className="portfolio-workspace-panel portfolio-watchlist-alert-panel">
            <PanelHeading eyebrow="Alerts" title="Active alerts" />
            <div className="portfolio-watchlist-alert-list">
              {activeAlerts.map((item) => (
                <article key={item.ticker}>
                  <div>
                    <strong>{item.ticker}</strong>
                    <span>Local alert</span>
                  </div>
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
        <div className="portfolio-source-row">
          <span>Browser-only watchlist</span>
          <span>Demo market context</span>
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-watchlist-command-panel">
        <PanelHeading eyebrow="Watchlist" title="Tracked Indian assets" meta={`${trackedTickers.size} tracked`} />
        <div className="portfolio-filter-bar">
          <label className="portfolio-search-control">
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search watchlist</span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search watchlist or alerts..." />
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
                      <span>{item.ticker} / {item.sector}</span>
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
                        aria-label={`Inspect ${item.name} in Screener`}
                        title={`Inspect ${item.name} in Screener`}
                        onClick={() => onScreener(item.ticker)}
                      >
                        Inspect
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
                      Open earnings
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

function buildTrustEvidence(freshness = PORTFOLIO_COCKPIT.status.lastUpdated): PortfolioEvidenceDrawerContent {
  return {
    title: "Source context",
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
}: {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <header className="portfolio-finance-header portfolio-cockpit-header">
      <div className="portfolio-finance-header-title">
        <h1>Portfolio</h1>
      </div>
      <form className="portfolio-finance-search portfolio-cockpit-search" role="search" aria-label="Search portfolio workspace" onSubmit={onSearchSubmit}>
        <Search aria-hidden="true" />
        <input value={searchValue} onChange={(event) => onSearchValueChange(event.target.value)} placeholder="Search holdings, sectors, exposure..." />
      </form>
    </header>
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
      <PanelHeading eyebrow="Holdings & risk" title="Holdings decision table" meta={`Based on ${PORTFOLIO_COCKPIT.status.sourceCount} sources`} />
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

function PortfolioOverviewPerformanceBand({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  const primaryRisk = PORTFOLIO_COCKPIT.riskStrip[0];

  return (
    <section className="portfolio-overview-performance-band" aria-label="Portfolio performance and analyst read">
      <article className="portfolio-workspace-panel portfolio-chart-card portfolio-overview-chart-card">
        <PanelHeading eyebrow="Performance" title="Portfolio vs NIFTY 50" meta="Functional range" />
        <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
      </article>
      <aside className="portfolio-overview-chart-rail" aria-label="Performance interpretation">
        <span>Analyst read</span>
        <strong>{primaryRisk?.headline ?? "Portfolio breadth check"}</strong>
        <p>{primaryRisk?.whyItMatters ?? "Track whether the portfolio advance broadens beyond the current leadership names."}</p>
        <dl>
          <div>
            <dt>Evidence</dt>
            <dd>{PORTFOLIO_COCKPIT.status.sourceCount} sources</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{freshness}</dd>
          </div>
        </dl>
        <button type="button" onClick={() => onOpenEvidence(buildTrustEvidence(freshness))}>
          View evidence
        </button>
      </aside>
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
        <strong>Source context</strong>
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
    <section className="portfolio-primary-action-module" aria-label="What matters now">
      <div className="portfolio-primary-action-main">
        <header>
          <div>
            <span>What matters now</span>
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
            <span>Evidence cue</span>
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
            View evidence
          </button>
          <button type="button" onClick={onShowHoldings}>
            Inspect holdings
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
              Evidence
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
                View evidence
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
      <PortfolioOverviewPerformanceBand freshness={freshness} onOpenEvidence={onOpenEvidence} />
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
            <span>Evidence</span>
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
            <span>Evidence cue</span>
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
  hideSearch = false,
  searchLabel,
  searchPlaceholder,
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
  hideSearch?: boolean;
  searchLabel: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  const financeAppRef = useRef<HTMLElement | null>(null);
  const commandPlaceholder = searchPlaceholder ?? FINANCE_VIEW_PLACEHOLDER[activeView] ?? "Inspect ticker, sector, or event...";
  const tapeConfig = FINANCE_TAPE_BY_VIEW[activeView as keyof typeof FINANCE_TAPE_BY_VIEW];

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
      {tapeConfig ? (
        <MarketTape basket={tapeConfig.basket} includeGlobalItems={false} statusLabel={tapeConfig.statusLabel} />
      ) : null}

      <section className="portfolio-screen portfolio-workspace-screen" aria-label={label}>
        <div className="portfolio-background-grid" aria-hidden="true" />

        <header className={`portfolio-finance-header${hideSearch ? " is-search-hidden" : ""}`}>
          <div className="portfolio-finance-header-title">
            <h1>{pageTitle}</h1>
          </div>
          {hideSearch ? null : (
            <form className="portfolio-finance-search" role="search" aria-label={searchLabel} onSubmit={onSearchSubmit}>
              <Search aria-hidden="true" />
              <input
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
                placeholder={commandPlaceholder}
              />
            </form>
          )}
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
  const [isScreenerScreening, setIsScreenerScreening] = useState(false);
  const [screenerSector, setScreenerSector] = useState("All");
  const [screenerPreset, setScreenerPreset] = useState<ScreenerPreset>("Quality compounders");
  const [screenerSort, setScreenerSort] = useState<{ key: keyof ScreenerRow; direction: SortDirection }>({
    key: "oneYear",
    direction: "desc",
  });
  const [selectedScreenerTicker, setSelectedScreenerTicker] = useState<string | null>(initialQuery.toUpperCase() || null);
  const [trackedTickers, setTrackedTickers] = useState(() => loadStoredTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, DEFAULT_TRACKED_TICKERS));
  const [screenerFeedback, setScreenerFeedback] = useState("");
  const screenerRunTimer = useRef<number | null>(null);

  useEffect(() => {
    setWorkspaceSearchQuery(initialQuery);
    setScreenerQuery(initialQuery);
    if (initialQuery) setSelectedScreenerTicker(initialQuery.toUpperCase());
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (screenerRunTimer.current !== null) window.clearTimeout(screenerRunTimer.current);
    };
  }, []);

  useEffect(() => {
    persistTickerSet(WATCHLIST_TRACKED_STORAGE_KEY, trackedTickers);
  }, [trackedTickers]);

  const runScreenerQuery = () => {
    const query = workspaceSearchQuery.trim();

    setWorkspaceSearchQuery(query);
    setScreenerQuery(query);
    props.onScreener(query || undefined);
    setIsScreenerScreening(true);

    if (screenerRunTimer.current !== null) window.clearTimeout(screenerRunTimer.current);
    screenerRunTimer.current = window.setTimeout(() => {
      setIsScreenerScreening(false);
      screenerRunTimer.current = null;
    }, 720);
  };

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runScreenerQuery();
  };

  const handleWorkspaceSearchChange = (value: string) => {
    setWorkspaceSearchQuery(value);
    setScreenerQuery(value);
    setIsScreenerScreening(false);
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
      hideSearch
      searchLabel="Search screener workspace"
      searchValue={workspaceSearchQuery}
      onSearchValueChange={handleWorkspaceSearchChange}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <ScreenerTab
        query={screenerQuery}
        onQueryChange={handleWorkspaceSearchChange}
        onQuerySubmit={runScreenerQuery}
        isScreening={isScreenerScreening}
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
  const portfolioSyncStatus = "Local browser view";
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [evidenceDrawer, setEvidenceDrawer] = useState<PortfolioEvidenceDrawerContent | null>(null);

  const totalValue = PORTFOLIO_HOLDINGS.reduce((sum, holding) => sum + holding.value, 0);
  const oneDayReturn = totalValue * (PORTFOLIO_DAY_RETURN_PERCENT / 100);
  const totalReturn = totalValue - PORTFOLIO_INVESTED_VALUE;
  const totalReturnPercent = (totalReturn / PORTFOLIO_INVESTED_VALUE) * 100;

  const scrollPortfolioDown = () => {
    const portfolioApp = portfolioAppRef.current;
    if (!portfolioApp) return;

    portfolioApp.scrollBy({
      top: Math.max(portfolioApp.clientHeight * 0.72, 360),
      behavior: "smooth",
    });
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
      <MarketTape basket={PORTFOLIO_MARKET_TAPE} includeGlobalItems={false} statusLabel="Portfolio Tape" />

      <section className="portfolio-screen portfolio-workspace-screen" aria-label="Synced portfolio screen">
        <div className="portfolio-background-grid" aria-hidden="true" />

        <PortfolioHeader
          searchValue={workspaceSearchQuery}
          onSearchValueChange={setWorkspaceSearchQuery}
          onSearchSubmit={handleWorkspaceSearch}
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
