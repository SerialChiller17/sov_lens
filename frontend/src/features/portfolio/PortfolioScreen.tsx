import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Car,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Factory,
  Filter,
  Flame,
  HeartPulse,
  Landmark,
  MoveDiagonal2,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../../app/GlobalBrandNav";
import { EARNINGS_PATH, type AppView } from "../../app/routes";
import { DetailedSparkline } from "../../components/charts/DetailedSparkline";
import { AnimatedSearchPrompt } from "../../components/search/AnimatedSearchPrompt";
import { MarketTape } from "../market-tape/MarketTape";
import {
  EARNINGS_MARKET_TAPE,
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
  EARNINGS_FORCE_NAMES,
  EARNINGS_THEMES,
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
  STOCKS_IN_NEWS,
  WATCHLIST_ITEM_CONTEXT,
  WATCHLIST_ITEMS,
  WATCHLIST_MOVEMENTS,
  WATCHLIST_NEWS,
  type EarningsEvent,
  type EarningsForceName,
  type MarketHeatmapTile,
  type MarketIndexCard,
  type MarketDevelopment,
  type MarketMover,
  type MarketNewsItem,
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
  initialSelectedTicker?: string;
  initialSelectedDate?: string;
}

type EarningsFilter = "Today" | "This Week" | "Next Week" | "Recent";
type ScreenerPreset = (typeof SCREENER_PRESETS)[number];
type SortDirection = "asc" | "desc";
type MoverTabKey = "gainers" | "losers" | "active";
type WatchlistItem = (typeof WATCHLIST_ITEMS)[number];

const EARNINGS_FILTERS: EarningsFilter[] = ["Today", "This Week", "Next Week", "Recent"];
const MOVER_TABS: MoverTabKey[] = ["gainers", "losers", "active"];
const MOVER_TAB_LABELS: Record<MoverTabKey, string> = {
  gainers: "Gainers",
  losers: "Losers",
  active: "Active",
};
const EARNINGS_CALENDAR_YEAR = 2026;
const EARNINGS_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const EARNINGS_WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WATCHLIST_FILTERS = ["Watched", "Alerts", "All"] as const;
type WatchlistFilter = (typeof WATCHLIST_FILTERS)[number];
const WATCHLIST_RANGES = ["1D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;
type WatchlistRange = (typeof WATCHLIST_RANGES)[number];
const WATCHLIST_TRACKED_STORAGE_KEY = "sov-finance-watchlist-tracked";
const WATCHLIST_ALERTS_STORAGE_KEY = "sov-finance-watchlist-alerts";
const DEFAULT_TRACKED_TICKERS = WATCHLIST_ITEMS.slice(0, 4).map((item) => item.ticker);
const DEFAULT_ALERT_TICKERS = WATCHLIST_ITEMS.filter((item) => item.alert).map((item) => item.ticker);
const ACTIVE_EARNINGS_DATE = EARNINGS_DAYS.find((day) => day.active)?.date ?? "May 6";
const EARNINGS_PERPLEXITY_DAYS = [
  { day: "Sun", date: "May 3" },
  ...EARNINGS_DAYS.slice(0, 5).map(({ day, date }) => ({ day, date })),
  { day: "Sat", date: "May 9" },
];
const EARNINGS_EVENT_DATE_MAP: Record<string, string> = {
  Today: ACTIVE_EARNINGS_DATE,
  Thu: "May 7",
  Fri: "May 8",
  "Next Mon": "May 11",
  "Next Tue": "May 12",
  "Next Wed": "May 13",
  "Apr 30": "Apr 30",
};
const EARNINGS_ASK_SUGGESTIONS = [
  {
    id: "reliance-earnings-question",
    kind: "company",
    label: "Reliance Industries",
    detail: "RELIANCE / NSE",
    query: "What should I watch in Reliance earnings?",
  },
  {
    id: "infosys-guidance-question",
    kind: "company",
    label: "Infosys",
    detail: "INFY / NSE",
    query: "How important is Infosys guidance for Indian IT?",
  },
  {
    id: "tcs-margin-question",
    kind: "company",
    label: "Tata Consultancy Services",
    detail: "TCS / NSE",
    query: "What could move TCS after its earnings call?",
  },
  {
    id: "private-bank-nim",
    kind: "query",
    label: "private bank NIM commentary",
    detail: "",
    query: "private bank NIM commentary",
  },
  {
    id: "auto-margin-bridge",
    kind: "query",
    label: "auto earnings margin bridge",
    detail: "",
    query: "auto earnings margin bridge",
  },
  {
    id: "it-deal-wins",
    kind: "query",
    label: "IT services deal wins and margin risk",
    detail: "",
    query: "IT services deal wins and margin risk",
  },
] as const;

const FINANCE_TAPE_BY_VIEW = {
  earnings: { basket: EARNINGS_MARKET_TAPE, statusLabel: "Earnings Tape" },
  markets: { basket: INDIAN_MARKET_TAPE, statusLabel: "India Tape" },
  watchlist: { basket: WATCHLIST_MARKET_TAPE, statusLabel: "Watchlist Tape" },
} as const;

const FINANCE_VIEW_PLACEHOLDER: Partial<Record<AppView, string>> = {
  markets: "Search stocks, sectors, funds...",
  earnings: "Search companies, earnings, calls...",
  screener: "Search ticker, sector, or filter...",
  watchlist: "Search watchlist or alerts...",
};

const FINANCE_VIEW_SEARCH_PROMPTS: Partial<Record<AppView, string[]>> = {
  markets: [
    "Which sectors are leading the NIFTY 50 today?",
    "Find stocks with rising volume and positive news",
    "Which banks are outperforming the index?",
    "Show weak stocks despite market strength",
  ],
  earnings: [
    "Search companies, earnings, calls...",
    "Inspect RELIANCE setup...",
    "Find banks reporting this week...",
    "Watch IT margin guidance...",
  ],
  screener: [
    "Find low debt banks with improving ROE",
    "Show profitable consumer stocks with strong momentum",
    "Which NIFTY names have high ROE and low leverage?",
    "Screen for dividend yield with stable earnings",
  ],
  watchlist: [
    "Which watched names have fresh alerts?",
    "Show watchlist stocks with positive news flow",
    "Which tracked stocks are near 52-week highs?",
    "Find alerts in banks and consumer cyclicals",
  ],
};

const PORTFOLIO_SEARCH_PROMPTS = [
  "Which holdings are driving today's P&L?",
  "Show portfolio exposure to banks and energy",
  "Which holdings need evidence review today?",
  "Find names with negative contribution this week",
];

const WATCHLIST_SEARCH_PROMPTS = [
  "Which watchlist names have active alerts?",
  "Find tracked stocks with positive news today",
  "Show consumer cyclicals in my watchlist",
  "Which watched names moved against the market?",
];

const WATCHLIST_ASK_SUGGESTIONS = [
  "Compare RELIANCE and ICICIBANK watchlist risk",
  "Which watched Indian equities have earnings pressure?",
  "Find banks and IT names with improving momentum",
  "What moved the weakest watchlist stock today?",
] as const;

interface SharedMoverItem {
  key: string;
  name: string;
  ticker: string;
  meta: string;
  move: number;
  price?: number;
}

type SharedMoverItemsByTab = Record<MoverTabKey, SharedMoverItem[]>;

const WATCHLIST_SECTOR_THEME_ROWS = [
  { label: "Private Banks", tickers: ["ICICIBANK"], score: "Positive breadth" },
  { label: "Energy / Consumer", tickers: ["RELIANCE"], score: "Margin watch" },
  { label: "IT Services", tickers: ["INFY"], score: "Guidance risk" },
  { label: "Auto / Telecom", tickers: ["TATAMOTORS", "BHARTIARTL"], score: "Demand read" },
] as const;

const SCREENER_SEARCH_PROMPTS = [
  "Find low debt banks with improving ROE",
  "Show high ROE consumer stocks with positive momentum",
  "Which stocks have rising margins and low leverage?",
  "Screen for dividend yield with stable earnings",
];

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

  if (area >= 165 && rect.height >= 13 && rect.width >= 11 && shortSide >= 6) return "full";
  if (area >= 78 && rect.height >= 7.5 && rect.width >= 6.2 && shortSide >= 4) return "medium";
  if (area >= 30 && rect.height >= 4.8 && rect.width >= 4.6 && shortSide >= 3) return "compact";
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
      "--heatmap-bg": "#333331",
      "--heatmap-border": "rgba(214, 214, 207, 0.08)",
      "--heatmap-accent": "rgba(230, 230, 224, 0.74)",
      "--heatmap-text": "rgba(239, 239, 234, 0.88)",
    } as React.CSSProperties;
  }

  if (clampedValue > 0) {
    const tone =
      absValue >= 2
        ? { bg: "#6aa24a", border: "rgba(139, 190, 96, 0.24)", accent: "rgba(224, 244, 210, 0.88)" }
        : absValue >= 1
          ? { bg: "#568944", border: "rgba(118, 164, 82, 0.2)", accent: "rgba(215, 237, 202, 0.82)" }
          : { bg: "#3e6135", border: "rgba(90, 124, 66, 0.18)", accent: "rgba(198, 220, 188, 0.74)" };

    return {
      "--heatmap-bg": tone.bg,
      "--heatmap-border": tone.border,
      "--heatmap-accent": tone.accent,
      "--heatmap-text": "rgba(242, 248, 237, 0.88)",
    } as React.CSSProperties;
  }

  const tone =
    absValue >= 2
      ? { bg: "#bf576b", border: "rgba(214, 107, 128, 0.25)", accent: "rgba(250, 220, 226, 0.88)" }
      : absValue >= 1
        ? { bg: "#8e4351", border: "rgba(174, 82, 100, 0.22)", accent: "rgba(241, 205, 213, 0.82)" }
        : { bg: "#56343b", border: "rgba(122, 68, 80, 0.18)", accent: "rgba(224, 190, 198, 0.74)" };

  return {
    "--heatmap-bg": tone.bg,
    "--heatmap-border": tone.border,
    "--heatmap-accent": tone.accent,
    "--heatmap-text": "rgba(250, 237, 240, 0.9)",
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

function isUpdateStatusText(value?: string) {
  return Boolean(value?.trim().match(/^updated\b/i));
}

function PanelHeading({ title, meta }: { title: string; meta?: string }) {
  return (
    <header className="portfolio-workspace-panel-heading">
      <div>
        <h2>{title}</h2>
      </div>
      {meta ? <strong className={isUpdateStatusText(meta) ? "portfolio-update-status-text" : undefined}>{meta}</strong> : null}
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
      For informational purposes only. Not investment, tax, legal, accounting, or trading advice.
    </p>
  );
}

function getEarningsImpactTone(impact: EarningsEvent["impact"]): WorkspaceTone {
  if (impact === "High impact") return "negative";
  if (impact === "Medium impact") return "neutral";
  return "positive";
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

const MAX_VISIBLE_TOP_METRICS = 6;
const DEFAULT_TOP_METRIC_SYMBOLS = ["NIFTY 50", "SENSEX", "USD/INR", "INDIA VIX", "BANK NIFTY", "MIDCAP 150"];

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

function marketMoverToShared(item: MarketMover): SharedMoverItem {
  return {
    key: item.ticker,
    name: item.name,
    ticker: item.ticker,
    meta: `${item.ticker} / ${item.exchange}`,
    price: item.price,
    move: item.move,
  };
}

const MARKET_MOVER_ITEMS: SharedMoverItemsByTab = {
  gainers: MARKET_MOVERS.gainers.map(marketMoverToShared),
  losers: MARKET_MOVERS.losers.map(marketMoverToShared),
  active: MARKET_MOVERS.active.map(marketMoverToShared),
};

function SharedMoverPanel({
  itemsByTab,
  ariaLabel,
  className,
  tabsClassName = "",
  listClassName = "",
  priceClassName = "",
  showPrice = true,
}: {
  itemsByTab: SharedMoverItemsByTab;
  ariaLabel: string;
  className: string;
  tabsClassName?: string;
  listClassName?: string;
  priceClassName?: string;
  showPrice?: boolean;
}) {
  const [activeMoverTab, setActiveMoverTab] = useState<MoverTabKey>("gainers");
  const activeMoverIndex = MOVER_TABS.indexOf(activeMoverTab);
  const moverTabStyle = { "--mover-active-index": String(activeMoverIndex) } as CSSProperties;

  return (
    <div className={`portfolio-shared-mover-panel ${className}`}>
      <div
        className={`portfolio-segmented-control portfolio-mover-tabs ${tabsClassName} is-${activeMoverTab}`.trim()}
        style={moverTabStyle}
        role="group"
        aria-label={ariaLabel}
      >
        {MOVER_TABS.map((tab) => {
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
              {MOVER_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>
      <div className={`portfolio-mover-list ${listClassName}`.trim()}>
        {itemsByTab[activeMoverTab].map((item) => (
          <article key={`${activeMoverTab}-${item.key}`} className="portfolio-mover-row">
            <CompanyAvatar name={item.name} ticker={item.ticker} />
            <span className="portfolio-mover-identity">
              <strong>{item.name}</strong>
              <em>{item.meta}</em>
            </span>
            <span className={`portfolio-mover-price ${priceClassName}`.trim()}>
              {showPrice && item.price != null ? <strong>{formatPortfolioTapePrice(item.price)}</strong> : null}
              <em className={toneClass(item.move)}>{formatPercent(item.move)}</em>
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

function MarketMoversPanel() {
  return (
    <section className="portfolio-market-movers-section">
      <PanelHeading title="Live Indian movers" />
      <SharedMoverPanel itemsByTab={MARKET_MOVER_ITEMS} ariaLabel="Market mover category" className="portfolio-market-movers-panel" />
    </section>
  );
}

function StockNewsLogo({ item }: { item: MarketNewsItem }) {
  const [hasImageError, setHasImageError] = useState(false);
  const iconUrl = sourceFaviconUrl(item.logoDomain);

  return (
    <span className="markets-news-logo" aria-hidden="true">
      {iconUrl && !hasImageError ? (
        <img src={iconUrl} alt="" loading="lazy" onError={() => setHasImageError(true)} />
      ) : (
        <strong>{companyInitials(item.company || item.ticker)}</strong>
      )}
    </span>
  );
}

function StocksInNewsPanel({ items = STOCKS_IN_NEWS }: { items?: MarketNewsItem[] }) {
  const hasNews = items.length > 0;

  return (
    <section className="markets-news-panel" aria-label="Stocks in news today">
      <header className="markets-news-heading">
        <div>
          <h2>Stocks in news today</h2>
        </div>
      </header>

      {hasNews ? (
        <div className="markets-news-card-list">
          {items.map((item) => (
            <article key={item.id} className="markets-news-card" aria-label={`${item.company} news, ${formatPercent(item.move)}`}>
              <div className="markets-news-card-top">
                <StockNewsLogo item={item} />
                <div className="markets-news-company">
                  <strong>{item.company}</strong>
                </div>
                <em className={toneClass(item.move)}>{formatPercent(item.move)}</em>
              </div>
              <p>{item.summary}</p>
              <time>{item.timeAgo}</time>
            </article>
          ))}
        </div>
      ) : (
        <p className="markets-news-empty">No stock-specific news available yet.</p>
      )}
    </section>
  );
}

const SECTOR_ICON_MAP = {
  Financials: Landmark,
  Auto: Car,
  "Capital Goods": Factory,
  Healthcare: HeartPulse,
  Energy: Flame,
  "IT Services": Cpu,
  FMCG: ShoppingBag,
};

function SectorPerformancePanel() {
  return (
    <section className="portfolio-sector-performance-section" aria-label="Sectoral Performance">
      <header className="portfolio-sector-performance-heading">
        <div>
          <h2>Sectors trending today</h2>
        </div>
      </header>
      <div className="portfolio-workspace-panel portfolio-sector-performance-panel">
        <div className="portfolio-sector-performance-table" role="table" aria-label="Sector gainer loser breadth and one day move">
          <div className="portfolio-sector-performance-row portfolio-sector-performance-header" role="row">
            <span role="columnheader">Sector</span>
            <span role="columnheader">Gainers/Losers</span>
            <span role="columnheader">1D price change</span>
          </div>
          {SECTOR_PERFORMANCE.map((sector) => {
            const totalBreadth = Math.max(sector.gainers + sector.losers, 1);
            const gainerShare = (sector.gainers / totalBreadth) * 100;
            const loserShare = 100 - gainerShare;
            const SectorIcon = SECTOR_ICON_MAP[sector.sector as keyof typeof SECTOR_ICON_MAP] ?? Banknote;

            return (
              <article key={sector.sector} className="portfolio-sector-performance-row" role="row">
                <div className="portfolio-sector-performance-sector" role="cell">
                  <span className="portfolio-sector-performance-icon" aria-hidden="true">
                    <SectorIcon size={24} strokeWidth={1.9} />
                  </span>
                  <div>
                    <strong>{sector.sector}</strong>
                  </div>
                </div>
                <div className="portfolio-sector-performance-breadth" role="cell" aria-label={`${sector.gainers} gainers and ${sector.losers} losers`}>
                  <div className="portfolio-sector-performance-counts">
                    <span>{sector.gainers}</span>
                    <span>{sector.losers}</span>
                  </div>
                  <div className="portfolio-sector-performance-bar" aria-hidden="true">
                    <span className="is-gainer" style={{ width: `${gainerShare}%` }} />
                    <span className="is-loser" style={{ width: `${loserShare}%` }} />
                  </div>
                </div>
                <em className={toneClass(sector.move)} role="cell">
                  {formatPercent(sector.move)}
                </em>
              </article>
            );
          })}
        </div>
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

const HEATMAP_PRIMARY_DEPTH_ITEMS = [
  { label: "Adv", value: MARKET_BREADTH.advances.toLocaleString("en-IN"), tone: "positive" },
  { label: "Dec", value: MARKET_BREADTH.declines.toLocaleString("en-IN"), tone: "negative" },
];

const HEATMAP_SECONDARY_DEPTH_ITEMS = [
  { label: "52W H/L", value: `${MARKET_BREADTH.highs52Week}/${MARKET_BREADTH.lows52Week}`, tone: "neutral" },
  { label: "FII", value: formatCompactFlowCrores(MARKET_BREADTH.fiiFlowCr), tone: "neutral" },
  { label: "DII", value: formatCompactFlowCrores(MARKET_BREADTH.diiFlowCr), tone: "neutral" },
];

function HeatmapMarketStatsDetails() {
  return (
    <details className="portfolio-heatmap-stat-details">
      <summary aria-label="More market stats">More market stats</summary>
      <div className="portfolio-heatmap-stat-popover" role="list" aria-label="Additional market stats">
        {HEATMAP_SECONDARY_DEPTH_ITEMS.map((item) => (
          <span key={item.label} className={`portfolio-heatmap-depth-item is-${item.tone}`} role="listitem">
            <b>{item.label}</b>
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </details>
  );
}

function HeatmapMarketDepthStrip() {
  return (
    <div className="portfolio-heatmap-depth-strip" role="group" aria-label="Market depth">
      <div className="portfolio-heatmap-depth-primary">
        <span className="portfolio-heatmap-depth-caption">NSE Depth</span>
        {HEATMAP_PRIMARY_DEPTH_ITEMS.map((item) => (
          <span key={item.label} className={`portfolio-heatmap-depth-item is-${item.tone}`}>
            <b>{item.label}</b>
            <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeatmapHeaderActions({
  expanded,
  onExpand,
  onClose,
}: {
  expanded: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="portfolio-heatmap-control-cluster">
      <HeatmapMarketStatsDetails />
      <button
        type="button"
        className="portfolio-heatmap-action"
        onClick={expanded ? onClose : onExpand}
        aria-label={expanded ? "Close expanded NIFTY 50 heatmap" : "Expand NIFTY 50 heatmap"}
      >
        <span>{expanded ? "Close" : "Expand"}</span>
        {expanded ? <X size={14} aria-hidden="true" /> : <MoveDiagonal2 size={14} aria-hidden="true" />}
      </button>
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
        <HeatmapMarketDepthStrip />
      </div>
      <HeatmapHeaderActions expanded={expanded} onExpand={onExpand} onClose={onClose} />
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
            const displayTicker = stock.ticker;
            const showTicker = tile.labelLevel !== "micro" || (tile.width >= 2.6 && tile.height >= 2.2);
            const showChange = tile.labelLevel !== "micro";

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
                {showTicker ? <strong>{displayTicker}</strong> : null}
                {showChange ? <em>{formatPercent(stock.changePercent)}</em> : null}
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
            <strong>{tooltip.stock.ticker}</strong>
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
      <div className="portfolio-heatmap-section-block">
        <NiftyHeatmapHeader onExpand={() => setIsExpanded(true)} />
        <section className="portfolio-workspace-panel portfolio-heatmap-panel">
          <NiftyHeatmapSurface showHeader={false} />
        </section>
      </div>
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
            <strong className="portfolio-update-status-text">Updated 12 minutes ago</strong>
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
    <section className="portfolio-standouts-section" aria-label="Standouts">
      <PanelHeading title="Names moving with force" />
      <div className="portfolio-standouts-panel">
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

      <section className="markets-heatmap-section" aria-label="Market heatmap workspace">
        <div className="markets-heatmap-main">
          <MarketHeatmapPanel />
          <section className="markets-lower-workspace" aria-label="Indian market lower workspace">
            <div className="markets-lower-main">
              <MarketDevelopmentGrid onAnswer={onAnswer} />
              <SectorPerformancePanel />
              <MarketStandoutsPanel />
            </div>
          </section>
        </div>
        <aside className="markets-heatmap-rail" aria-label="Heatmap right rail">
          <StocksInNewsPanel />
          <aside className="markets-lower-rail" aria-label="Market movers">
            <MarketMoversPanel />
          </aside>
        </aside>
      </section>
      <FinanceDisclaimer />
    </section>
  );
}

function getEarningsSearchText(event: EarningsEvent) {
  const context = EARNINGS_EVENT_CONTEXT[event.id];

  return [
    event.company,
    event.ticker,
    event.sector,
    event.quarter,
    event.status,
    event.impact,
    event.portfolioRelevance,
    event.watchlistRelevance,
    event.thesis,
    event.whyItMatters,
    event.watchFor,
    event.streetFocus,
    event.readThrough,
    event.tags.join(" "),
    event.notes.join(" "),
    context?.relevance.join(" ") ?? "",
    context?.theme ?? "",
  ].join(" ");
}

const EARNINGS_IMPACT_RANK: Record<EarningsEvent["impact"], number> = {
  "High impact": 3,
  "Medium impact": 2,
  "Low impact": 1,
};

function getEarningsEventRank(event: EarningsEvent) {
  const upcomingRank = event.status === "Upcoming" ? 100 : 0;
  const impactRank = EARNINGS_IMPACT_RANK[event.impact] * 10;
  const exposureRank = /portfolio|holding|watchlist|tracked|concentration/i.test(
    `${event.portfolioRelevance} ${event.watchlistRelevance} ${event.tags.join(" ")}`,
  )
    ? 5
    : 0;

  return upcomingRank + impactRank + exposureRank;
}

function normalizeEarningsTicker(value: string) {
  return value.trim().toUpperCase();
}

function findEarningsEventFromQuery(query: string) {
  const normalizedQuery = normalizeEarningsTicker(query);
  if (!normalizedQuery) return undefined;

  return EARNINGS_EVENTS.find(
    (event) =>
      event.ticker === normalizedQuery ||
      event.company.toUpperCase().includes(normalizedQuery) ||
      normalizedQuery.includes(event.ticker),
  );
}

function getEarningsEventDate(event: EarningsEvent) {
  return EARNINGS_EVENT_DATE_MAP[event.dateLabel] ?? event.dateLabel;
}

function parseEarningsDateLabel(value: string) {
  const [monthLabel, dayLabel] = value.trim().replace(/\+/g, " ").split(/\s+/);
  const monthIndex = EARNINGS_MONTH_LABELS.findIndex((month) => month.toLowerCase() === monthLabel?.toLowerCase());
  const day = Number.parseInt(dayLabel ?? "", 10);

  if (monthIndex < 0 || !Number.isFinite(day)) return undefined;
  return new Date(EARNINGS_CALENDAR_YEAR, monthIndex, day);
}

function formatEarningsDateLabel(date: Date) {
  return `${EARNINGS_MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

function formatEarningsDateLongLabel(date: Date) {
  return `${EARNINGS_MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatEarningsMonthYear(date: Date) {
  return `${EARNINGS_MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatEarningsExchangeLabel(exchange: EarningsEvent["exchange"]) {
  return exchange === "NSE" ? "NS" : exchange;
}

function getEarningsWeekDays(selectedDate: string) {
  const selectedDateValue = parseEarningsDateLabel(selectedDate) ?? parseEarningsDateLabel(ACTIVE_EARNINGS_DATE)!;
  const weekStart = new Date(selectedDateValue);
  weekStart.setDate(selectedDateValue.getDate() - selectedDateValue.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    return {
      day: EARNINGS_WEEKDAY_LABELS[dayDate.getDay()],
      date: formatEarningsDateLabel(dayDate),
      longDate: formatEarningsDateLongLabel(dayDate),
    };
  });
}

function getEarningsMonthGrid(monthDate: Date) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function shiftEarningsDateByDays(date: string, days: number) {
  const selectedDateValue = parseEarningsDateLabel(date) ?? parseEarningsDateLabel(ACTIVE_EARNINGS_DATE)!;
  const shiftedDate = new Date(selectedDateValue);
  shiftedDate.setDate(selectedDateValue.getDate() + days);
  return formatEarningsDateLabel(shiftedDate);
}

function filterEventsByTickers(events: EarningsEvent[], activeTickers: string[]) {
  if (!activeTickers.length) return events;
  return events.filter((event) => activeTickers.includes(event.ticker));
}

function normalizeEarningsSelectedDate(value: string) {
  const decodedValue = value.trim().replace(/\+/g, " ");
  if (!decodedValue) return ACTIVE_EARNINGS_DATE;

  const matchingCalendarDay = EARNINGS_PERPLEXITY_DAYS.find((day) => day.date.toLowerCase() === decodedValue.toLowerCase());
  if (matchingCalendarDay) return matchingCalendarDay.date;

  const parsedDate = parseEarningsDateLabel(decodedValue);
  if (parsedDate) return formatEarningsDateLabel(parsedDate);

  const matchingEventDate = EARNINGS_EVENTS.map(getEarningsEventDate).find((date) => date.toLowerCase() === decodedValue.toLowerCase());
  return matchingEventDate ?? ACTIVE_EARNINGS_DATE;
}

function getEarningsEventsForDate(date: string, activeTickers: string[] = []) {
  return filterEventsByTickers(
    EARNINGS_EVENTS.filter((event) => getEarningsEventDate(event) === date),
    activeTickers,
  );
}

function pickDefaultEarningsEvent(events: EarningsEvent[]) {
  return [...events].sort((a, b) => getEarningsEventRank(b) - getEarningsEventRank(a))[0];
}

function pickSelectedEarningsEvent(events: EarningsEvent[], selectedTicker: string) {
  const normalizedTicker = normalizeEarningsTicker(selectedTicker);
  return events.find((event) => event.ticker === normalizedTicker) ?? pickDefaultEarningsEvent(events);
}

function getCompactList(value: string, limit = 3) {
  return value
    .replace(/\band\b/gi, ",")
    .replace(/\.$/, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function withTerminalPeriod(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  return /[.!?]$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}.`;
}

function getEarningsDrivers(event: EarningsEvent) {
  return getCompactList(event.watchFor, 3);
}

function getEarningsWatchItems(event: EarningsEvent) {
  return getCompactList(event.streetFocus, 3);
}

function getEarningsRiskItems(event: EarningsEvent) {
  const noteItems = event.notes.flatMap((note) => getCompactList(note, 2));
  return noteItems.length ? noteItems.slice(0, 3) : getCompactList(event.whyItMatters, 3);
}

function getEarningsMovePercent(event: EarningsEvent) {
  if (typeof event.actualMove === "number") return Math.min(Math.abs(event.actualMove), 4);
  const parsedMove = Number.parseFloat(event.expectedMove.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsedMove) ? Math.min(parsedMove, 4) : 0;
}

function getEarningsMoveLabel(event: EarningsEvent) {
  if (typeof event.actualMove === "number") return formatPercent(event.actualMove);
  return event.expectedMove;
}

function getEarningsMoveTone(event: EarningsEvent): WorkspaceTone {
  if (typeof event.actualMove !== "number") return "neutral";
  return event.actualMove >= 0 ? "positive" : "negative";
}

function getEarningsExposureMarker(event: EarningsEvent) {
  if (/portfolio|holding|concentration/i.test(`${event.portfolioRelevance} ${event.tags.join(" ")}`)) return "Portfolio";
  if (/watchlist|tracked/i.test(`${event.watchlistRelevance} ${event.tags.join(" ")}`)) return "Watchlist";
  return "Market";
}

function getEarningsForceMatch(event: EarningsEvent) {
  return EARNINGS_FORCE_NAMES.find((item) => item.ticker === event.ticker);
}

function EarningsCalendar({
  selectedDate,
  activeTickerFilters,
  onTickerFilterToggle,
  onTickerFiltersReset,
  onSelectedDateChange,
}: {
  selectedDate: string;
  activeTickerFilters: string[];
  onTickerFilterToggle: (ticker: string) => void;
  onTickerFiltersReset: () => void;
  onSelectedDateChange: (date: string) => void;
}) {
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const [openControl, setOpenControl] = useState<"filter" | "date" | null>(null);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [visibleMonthDate, setVisibleMonthDate] = useState(() => parseEarningsDateLabel(selectedDate) ?? parseEarningsDateLabel(ACTIVE_EARNINGS_DATE)!);
  const weekDays = useMemo(() => getEarningsWeekDays(selectedDate), [selectedDate]);
  const eventFilterOptions = useMemo(
    () =>
      Array.from(
        EARNINGS_EVENTS.reduce((eventMap, event) => {
          if (!eventMap.has(event.ticker)) eventMap.set(event.ticker, event);
          return eventMap;
        }, new Map<string, EarningsEvent>()),
      ).map(([, event]) => event),
    [],
  );
  const monthGrid = useMemo(() => getEarningsMonthGrid(visibleMonthDate), [visibleMonthDate]);
  const visibleMonthLabel = formatEarningsMonthYear(visibleMonthDate);

  useEffect(() => {
    const selectedDateValue = parseEarningsDateLabel(selectedDate) ?? parseEarningsDateLabel(ACTIVE_EARNINGS_DATE)!;
    setDraftDate(selectedDate);
    setVisibleMonthDate(selectedDateValue);
  }, [selectedDate]);

  useEffect(() => {
    if (!openControl) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setOpenControl(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenControl(null);
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setOpenControl(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [openControl]);

  const handleWeekShift = (days: number) => {
    setOpenControl(null);
    onSelectedDateChange(shiftEarningsDateByDays(selectedDate, days));
  };

  const handleToday = () => {
    setOpenControl(null);
    onSelectedDateChange(ACTIVE_EARNINGS_DATE);
  };

  const handleApplyDraftDate = () => {
    onSelectedDateChange(draftDate);
    setOpenControl(null);
  };

  const handleResetDate = () => {
    const activeDate = parseEarningsDateLabel(ACTIVE_EARNINGS_DATE)!;
    setDraftDate(ACTIVE_EARNINGS_DATE);
    setVisibleMonthDate(activeDate);
    onSelectedDateChange(ACTIVE_EARNINGS_DATE);
    setOpenControl(null);
  };

  const handleMonthShift = (offset: number) => {
    setVisibleMonthDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <section className="earnings-pplx-calendar" aria-label="Earnings calendar">
      <header className="earnings-pplx-section-header">
        <h2>Earnings Calendar</h2>
        <div ref={toolsRef} className="earnings-pplx-calendar-tools" aria-label="Earnings calendar controls">
          <button
            type="button"
            aria-label="Filter earnings calendar"
            title="Filter earnings calendar"
            aria-expanded={openControl === "filter"}
            onClick={() => setOpenControl((currentControl) => (currentControl === "filter" ? null : "filter"))}
          >
            <Filter size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Open earnings date picker"
            title="Open earnings date picker"
            aria-expanded={openControl === "date"}
            onClick={() => setOpenControl((currentControl) => (currentControl === "date" ? null : "date"))}
          >
            <CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Previous earnings week" title="Previous earnings week" onClick={() => handleWeekShift(-7)}>
            <ChevronLeft size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button type="button" className="earnings-pplx-today-button" aria-label="Today" title="Today" onClick={handleToday}>
            Today
          </button>
          <button type="button" aria-label="Next earnings week" title="Next earnings week" onClick={() => handleWeekShift(7)}>
            <ChevronRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>

          {openControl === "filter" ? (
            <div className="earnings-pplx-filter-popover" role="dialog" aria-label="Filter earnings calendar">
              <div className="earnings-pplx-filter-list" role="group" aria-label="Filter earnings companies">
                {eventFilterOptions.slice(0, 8).map((event) => {
                  const isChecked = activeTickerFilters.includes(event.ticker);
                  const label = `${event.ticker}.${formatEarningsExchangeLabel(event.exchange)}`;

                  return (
                    <button
                      key={event.ticker}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={label}
                      onClick={() => onTickerFilterToggle(event.ticker)}
                    >
                      <CompanyAvatar name={event.company} ticker={event.ticker} />
                      <span>{label}</span>
                      <i aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <button type="button" className="earnings-pplx-popover-reset" onClick={onTickerFiltersReset}>
                Reset earnings filters
              </button>
            </div>
          ) : null}

          {openControl === "date" ? (
            <div className="earnings-pplx-date-popover" role="dialog" aria-label="Choose earnings date">
              <header>
                <h3>{visibleMonthLabel}</h3>
                <div>
                  <button type="button" aria-label="Previous calendar month" onClick={() => handleMonthShift(-1)}>
                    <ChevronLeft size={17} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                  <button type="button" aria-label="Next calendar month" onClick={() => handleMonthShift(1)}>
                    <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              </header>
              <div className="earnings-pplx-date-weekdays" aria-hidden="true">
                {EARNINGS_WEEKDAY_LABELS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="earnings-pplx-date-grid" role="grid" aria-label={`Earnings date picker for ${visibleMonthLabel}`}>
                {monthGrid.map((date) => {
                  const dateLabel = formatEarningsDateLabel(date);
                  const isOutsideMonth = date.getMonth() !== visibleMonthDate.getMonth();
                  const isDraftDate = draftDate === dateLabel;

                  return (
                    <button
                      key={`${date.getMonth()}-${date.getDate()}`}
                      type="button"
                      className={`${isOutsideMonth ? "is-outside-month" : ""}${isDraftDate ? " is-selected" : ""}`}
                      aria-selected={isDraftDate}
                      aria-label={formatEarningsDateLongLabel(date)}
                      onClick={() => setDraftDate(dateLabel)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
              <footer>
                <button type="button" onClick={handleResetDate}>
                  Reset
                </button>
                <button type="button" onClick={handleApplyDraftDate} aria-label="Apply earnings date">
                  Apply
                </button>
              </footer>
            </div>
          ) : null}
        </div>
      </header>

      <div className="earnings-pplx-day-grid" role="list" aria-label="Earnings calendar days">
        {weekDays.map((day) => {
          const dayEvents = getEarningsEventsForDate(day.date, activeTickerFilters);
          const isSelected = selectedDate === day.date;

          return (
            <div key={day.date} role="listitem">
              <button
                type="button"
                className={isSelected ? "is-selected" : ""}
                aria-pressed={isSelected}
                aria-label={`${day.day} ${day.date}, ${dayEvents.length ? `${dayEvents.length} calls` : "No Calls"}`}
                onClick={() => {
                  setOpenControl(null);
                  onSelectedDateChange(day.date);
                }}
              >
                <span>{day.day}</span>
                <strong>{day.date}</strong>
                {dayEvents.length ? (
                  <span className="earnings-pplx-logo-stack" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CompanyAvatar key={event.id} name={event.company} ticker={event.ticker} />
                    ))}
                  </span>
                ) : null}
                <em>{dayEvents.length ? `${dayEvents.length} ${dayEvents.length === 1 ? "Call" : "Calls"}` : "No Calls"}</em>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EarningsCallList({
  events,
  selectedDate,
  onSelectedTickerChange,
}: {
  events: EarningsEvent[];
  selectedDate: string;
  onSelectedTickerChange: (ticker: string) => void;
}) {
  return (
    <section className="earnings-pplx-call-panel" aria-label={`${selectedDate} earnings calls`}>
      {events.length === 0 ? (
        <div className="earnings-pplx-empty" role="status">
          <strong>No Earnings Calls</strong>
        </div>
      ) : (
        <ul className="earnings-pplx-call-list" aria-label="Earnings calls for selected date">
          {events.map((event) => (
            <li key={event.id}>
              <a
                href={`${EARNINGS_PATH}?selected=${encodeURIComponent(event.ticker)}&selectedDate=${encodeURIComponent(selectedDate)}`}
                aria-label={`${event.company} earnings`}
                onClick={(clickEvent) => {
                  clickEvent.preventDefault();
                  onSelectedTickerChange(event.ticker);
                }}
              >
                <CompanyAvatar name={event.company} ticker={event.ticker} />
                <div className="earnings-pplx-call-copy">
                  <strong>{event.company}</strong>
                  <span>{event.ticker}</span>
                  <p>{event.watchFor}</p>
                  <p>{event.streetFocus}</p>
                  <p>{event.readThrough}</p>
                </div>
                <div className="earnings-pplx-call-meta">
                  <span>{event.quarter}</span>
                  <strong>{event.time.replace(" IST", "")}</strong>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EarningsAskComposer({ onAnswer }: { onAnswer: FinanceNavigationProps["onAnswer"] }) {
  const [question, setQuestion] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const submitQuestion = (queryValue: string) => {
    const query = queryValue.trim();
    if (!query) return;

    void onAnswer({
      query,
      title: "Earnings question",
      summary: "Question routed from the earnings calendar workspace.",
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(question);
  };

  const handleSuggestionClick = (query: string) => {
    setQuestion(query);
    submitQuestion(query);
  };

  return (
    <form
      className={`earnings-pplx-composer${isFocused ? " is-expanded" : ""}`}
      role="search"
      aria-label="Ask about Indian company earnings"
      onSubmit={handleSubmit}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocused(false);
      }}
    >
      {isFocused && !question.trim() ? (
        <ul className="earnings-pplx-suggestion-list" role="list" aria-label="Suggested earnings searches">
          {EARNINGS_ASK_SUGGESTIONS.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                aria-label={suggestion.kind === "company" ? `${suggestion.label} earnings question` : suggestion.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionClick(suggestion.query)}
              >
                {suggestion.kind === "company" ? (
                  <CompanyAvatar name={suggestion.label} ticker={suggestion.detail?.split(" / ")[0] ?? suggestion.label} />
                ) : (
                  <Search size={16} strokeWidth={1.9} aria-hidden="true" />
                )}
                <span>
                  <strong>{suggestion.label}</strong>
                  {suggestion.detail ? <em>{suggestion.detail}</em> : null}
                </span>
                <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="earnings-pplx-composer-input-row">
        <label className="earnings-pplx-sr-label" htmlFor="earnings-pplx-question">
          Ask anything about Indian company earnings
        </label>
        <input
          id="earnings-pplx-question"
          type="search"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about Indian company earnings"
        />
      </div>
      <div className="earnings-pplx-composer-actions">
        <span aria-hidden="true">
          <Plus size={16} strokeWidth={1.9} />
        </span>
        <span>
          <Search size={15} strokeWidth={1.9} aria-hidden="true" />
          Search
        </span>
        <span>
          <Cpu size={15} strokeWidth={1.9} aria-hidden="true" />
          Computer
        </span>
        <button type="submit" aria-label="Ask earnings question">
          <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function EarningsRailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="earnings-pplx-rail-section">
      <header className="earnings-pplx-section-header">
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function EarningsWatchlistRail({ onWatchlist }: { onWatchlist: () => void }) {
  return (
    <EarningsRailSection title="Create Watchlist">
      <div className="earnings-pplx-watchlist">
        {WATCHLIST_ITEMS.slice(0, 4).map((item) => (
          <button key={item.ticker} type="button" onClick={onWatchlist} aria-label={`Review ${item.name} in Watchlist`}>
            <CompanyAvatar name={item.name} ticker={item.ticker} />
            <span>
              <strong>{item.name}</strong>
              <em>{item.ticker} / {item.exchange}</em>
            </span>
            <span className="earnings-pplx-price">
              <strong>{formatPortfolioTapePrice(item.price)}</strong>
              <em className={toneClass(item.oneDay)}>{formatPercent(item.oneDay)}</em>
            </span>
            <Star size={15} strokeWidth={1.7} aria-hidden="true" />
          </button>
        ))}
      </div>
    </EarningsRailSection>
  );
}

function EarningsMoversRail() {
  return (
    <EarningsRailSection title="Gainers">
      <SharedMoverPanel
        itemsByTab={MARKET_MOVER_ITEMS}
        ariaLabel="Earnings movers"
        className="earnings-pplx-movers"
        tabsClassName="earnings-pplx-mover-tabs"
        priceClassName="earnings-pplx-price"
      />
    </EarningsRailSection>
  );
}

function EarningsMarketRail({ onWatchlist }: { onWatchlist: () => void }) {
  return (
    <aside className="earnings-pplx-rail" aria-label="Earnings market rail">
      <div className="earnings-pplx-sentiment" aria-label="Market sentiment">
        <span aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index} />
          ))}
        </span>
        <strong>Upbeat Sentiment</strong>
        <em>Markets Closed / 17 Jun 2026, IST</em>
      </div>
      <EarningsWatchlistRail onWatchlist={onWatchlist} />
      <EarningsMoversRail />
    </aside>
  );
}

function EarningsImpactTimeline({
  earningsFilter,
  onEarningsFilterChange,
}: {
  earningsFilter: EarningsFilter;
  onEarningsFilterChange: (filter: EarningsFilter) => void;
}) {
  const filterForDay = (date: string): EarningsFilter => {
    if (date === "May 11") return "Next Week";
    if (date === "May 6") return "Today";
    return "This Week";
  };

  return (
    <section className="earnings-impact-timeline" aria-label="Earnings impact timeline">
      <div className="portfolio-workspace-panel portfolio-earnings-command-panel earnings-timeline-panel">
        <div className="portfolio-earnings-day-strip earnings-week-map" role="list" aria-label="Earnings week map">
          {EARNINGS_DAYS.map((day) => {
            const dayFilter = filterForDay(day.date);
            const isActive = earningsFilter === dayFilter;

            return (
              <button
                key={day.date}
                type="button"
                role="listitem"
                className={`portfolio-earnings-day-chip earnings-day-card${isActive ? " is-active" : ""}`}
                aria-pressed={isActive}
                aria-label={`${day.day} ${day.date}, ${day.calls} calls, ${day.highImpact} high impact, ${day.portfolioWatchlist} portfolio or watchlist events`}
                onClick={() => onEarningsFilterChange(dayFilter)}
              >
                <span>{day.day}</span>
                <strong>{day.date}</strong>
                <em>{day.totalResults} results</em>
                <small>{day.highImpact} high</small>
                <i style={{ width: `${day.intensity}%` }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="portfolio-filter-bar portfolio-earnings-filter-bar">
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
      </div>
    </section>
  );
}

function EarningsQueueTable({
  events,
  selectedTicker,
  onSelect,
}: {
  events: EarningsEvent[];
  selectedTicker: string;
  onSelect: (ticker: string) => void;
}) {
  return (
    <section className="portfolio-workspace-panel earnings-queue-panel" aria-label="Earnings queue">
      <header className="earnings-section-heading">
        <div>
          <h2>Earnings Queue</h2>
          <p>Compact scan by time, impact, sector, and exposure.</p>
        </div>
        <span>{events.length} shown</span>
      </header>

      {events.length === 0 ? (
        <div className="portfolio-empty-state earnings-empty-state" role="status">
          <strong>No earnings match this view.</strong>
          <p>Clear search or choose another window.</p>
        </div>
      ) : (
        <div className="earnings-queue-table-shell">
          <table className="earnings-queue-table" aria-label="Earnings Queue">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Time</th>
                <th>Setup</th>
                <th>Sector</th>
                <th>Exposure</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const isSelected = event.ticker === selectedTicker;

                return (
                  <tr key={event.id} aria-selected={isSelected}>
                    <td>
                      <button
                        type="button"
                        className="earnings-queue-select"
                        aria-pressed={isSelected}
                        aria-label={`Select ${event.company} earnings`}
                        onClick={() => onSelect(event.ticker)}
                      >
                        <strong>{event.ticker}</strong>
                        <span>{event.company}</span>
                      </button>
                    </td>
                    <td>
                      <span className="earnings-queue-date">{event.dateLabel}</span>
                      <b>{event.time}</b>
                    </td>
                    <td>
                      <div className="earnings-queue-setup">
                        <span>{event.status}</span>
                        <strong className={toneClass(getEarningsImpactTone(event.impact))}>{event.impact}</strong>
                        <b className={`earnings-queue-number ${toneClass(getEarningsMoveTone(event))}`}>{getEarningsMoveLabel(event)}</b>
                      </div>
                    </td>
                    <td>{event.sector}</td>
                    <td>{getEarningsExposureMarker(event)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SelectedEarningsDossier({
  event,
  onScreener,
  onWatchlist,
}: {
  event: EarningsEvent;
  onScreener: (query: string) => void;
  onWatchlist: () => void;
}) {
  const context = EARNINGS_EVENT_CONTEXT[event.id];
  const force = getEarningsForceMatch(event);
  const drivers = getEarningsDrivers(event);
  const watchItems = getEarningsWatchItems(event);
  const riskItems = getEarningsRiskItems(event);
  const moveLevel = getEarningsMovePercent(event);
  const moveWidth = `${Math.max(8, (moveLevel / 4) * 100)}%`;
  const moveTone = toneClass(getEarningsMoveTone(event));
  const metricRows = [
    { label: "Estimate", value: event.estimate, tone: "neutral" as WorkspaceTone },
    ...(event.actual ? [{ label: "Actual", value: event.actual, tone: (event.surprise ?? 0) >= 0 ? "positive" as WorkspaceTone : "negative" as WorkspaceTone }] : []),
    ...event.consensusMetrics.slice(0, 3),
    { label: "Revenue", value: formatPercent(event.revenueGrowth), tone: event.revenueGrowth >= 0 ? "positive" as WorkspaceTone : "negative" as WorkspaceTone },
    { label: "Profit", value: formatPercent(event.profitGrowth), tone: event.profitGrowth >= 0 ? "positive" as WorkspaceTone : "negative" as WorkspaceTone },
  ].slice(0, 5);

  return (
    <section className="portfolio-workspace-panel earnings-selected-dossier" aria-label="Selected company earnings dossier">
      <header className="earnings-dossier-header">
        <CompanyAvatar name={event.company} ticker={event.ticker} />
        <div>
          <h2>{event.company}</h2>
          <span>{event.ticker} / {event.exchange} / {event.sector}</span>
        </div>
        <div className="earnings-dossier-status">
          <span>{event.status}</span>
          <strong>{event.impact}</strong>
        </div>
      </header>

      <div className="earnings-dossier-schedule">
        <span>Result</span>
        <strong>{event.dateLabel} / {event.time}</strong>
        <em>Call {event.callTime}</em>
      </div>

      <div className="earnings-dossier-fragments">
        <p>
          <b>Drivers:</b> {withTerminalPeriod(drivers.join(", "))}
        </p>
        <p>
          <b>Watch:</b> {withTerminalPeriod(watchItems.join(", "))}
        </p>
        <p>
          <b>Risk:</b> {withTerminalPeriod(riskItems.join(", "))}
        </p>
      </div>

      <div className="earnings-dossier-metrics" aria-label={`${event.ticker} key metrics`}>
        {metricRows.map((metric) => (
          <div key={`${event.id}-${metric.label}`} className={toneClass(metric.tone ?? "neutral")}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="earnings-dossier-move" aria-label={`${event.ticker} ${event.status === "Reported" ? "result reaction" : "expected move"} ${getEarningsMoveLabel(event)}`}>
        <div>
          <span>{event.status === "Reported" ? "Reaction" : "Expected move"}</span>
          <strong className={moveTone}>{getEarningsMoveLabel(event)}</strong>
        </div>
        <span className="earnings-dossier-move-track">
          <i className={moveTone} style={{ width: moveWidth }} />
        </span>
        {force ? <em>Price {formatPortfolioTapePrice(force.price)} / Volume {force.volume}</em> : null}
      </div>

      <p className="earnings-dossier-readthrough">Read-through: {withTerminalPeriod(event.readThrough)}</p>

      <details className="earnings-dossier-brief">
        <summary>Brief</summary>
        <p>{event.thesis}</p>
        <p>{event.whyItMatters}</p>
        {context ? <p>{context.theme}: {withTerminalPeriod(context.relevance.slice(0, 2).join(", "))}</p> : null}
      </details>

      <footer className="earnings-dossier-actions">
        <div className="portfolio-action-card-buttons portfolio-compact-action-row">
          <button
            type="button"
            aria-label={`Open ${event.company} in Screener`}
            title={`Open ${event.company} in Screener`}
            onClick={() => onScreener(event.ticker)}
          >
            Inspect
          </button>
          <button
            type="button"
            aria-label={`Open Watchlist for ${event.company} context`}
            title={`Open Watchlist for ${event.company} context`}
            onClick={onWatchlist}
          >
            Watchlist
          </button>
        </div>
      </footer>
    </section>
  );
}

function EarningsRail({ selectedEvent, visibleEvents }: { selectedEvent?: EarningsEvent; visibleEvents: EarningsEvent[] }) {
  const eventsForRail = visibleEvents.length ? visibleEvents : EARNINGS_EVENTS;
  const event = selectedEvent ?? pickDefaultEarningsEvent(eventsForRail);
  const sectorCalendar = Array.from(
    eventsForRail.reduce((sectorMap, item) => {
      const current = sectorMap.get(item.sector) ?? { sector: item.sector, total: 0, highImpact: 0, tickers: [] as string[] };
      current.total += 1;
      if (item.impact === "High impact") current.highImpact += 1;
      current.tickers.push(item.ticker);
      sectorMap.set(item.sector, current);
      return sectorMap;
    }, new Map<string, { sector: string; total: number; highImpact: number; tickers: string[] }>()),
  )
    .map(([, item]) => item)
    .sort((a, b) => b.highImpact - a.highImpact || b.total - a.total)
    .slice(0, 4);
  const consensusRiskEvents = [event, ...eventsForRail.filter((item) => item.id !== event.id && item.impact !== "Low impact")]
    .filter(Boolean)
    .slice(0, 3);

  return (
    <>
      <section className="portfolio-workspace-panel portfolio-earnings-rail-panel">
        <PanelHeading title="Exposure" />
        <div className="earnings-rail-row-list">
          <article>
            <span>Portfolio</span>
            <strong>{event.portfolioRelevance}</strong>
          </article>
          <article>
            <span>Watchlist</span>
            <strong>{event.watchlistRelevance}</strong>
          </article>
          <article>
            <span>Marker</span>
            <strong>{getEarningsExposureMarker(event)}</strong>
          </article>
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-earnings-rail-panel">
        <PanelHeading title="Next call" />
        <div className="earnings-rail-callout">
          <strong>{event.ticker}, {event.callTime}</strong>
          <span>{event.company}</span>
          <em>Drivers: {getEarningsDrivers(event).join(", ")}</em>
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-earnings-rail-panel">
        <PanelHeading title="Consensus risk" />
        <div className="earnings-risk-list">
          {consensusRiskEvents.map((item) => {
            const riskLevel = item.impact === "High impact" ? 84 : item.impact === "Medium impact" ? 62 : 38;

            return (
              <article key={item.id}>
                <div>
                  <strong>{item.ticker}</strong>
                  <span>{getCompactList(item.streetFocus, 2).join(", ")}</span>
                </div>
                <span className="earnings-risk-meter" aria-label={`${item.ticker} consensus risk ${riskLevel}%`}>
                  <i style={{ width: `${riskLevel}%` }} />
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-earnings-rail-panel">
        <PanelHeading title="Sector clusters" />
        <div className="earnings-sector-calendar">
          {sectorCalendar.map((item) => (
            <article key={item.sector}>
              <div>
                <strong>{item.sector}</strong>
                <span>{item.tickers.slice(0, 3).join(" / ")}</span>
              </div>
              <em>{item.total} events / {item.highImpact} high</em>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ReportedTodayTable({ events }: { events: EarningsEvent[] }) {
  return (
    <section className="earnings-table-section" aria-label="Reported Today section">
      <header className="earnings-section-heading">
        <div>
          <h2>Reported Today</h2>
          <p>Actuals, price reaction, and immediate read-through.</p>
        </div>
      </header>
      <div className="earnings-table-shell">
        <table className="earnings-data-table" aria-label="Reported Today">
          <thead>
            <tr>
              <th>Company</th>
              <th>Result</th>
              <th>Revenue YoY</th>
              <th>PAT YoY</th>
              <th>Margin</th>
              <th>Price reaction</th>
              <th>Read-through</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const snapshot = event.resultSnapshot;

              return (
                <tr key={event.id}>
                  <td>
                    <strong>{event.ticker}</strong>
                    <span>{event.company}</span>
                  </td>
                  <td>{snapshot?.result ?? event.status}</td>
                  <td>{snapshot?.revenueYoY ?? formatPercent(event.revenueGrowth)}</td>
                  <td>{snapshot?.patYoY ?? formatPercent(event.profitGrowth)}</td>
                  <td>{snapshot?.margin ?? "Pending"}</td>
                  <td className={toneClass(snapshot?.priceReaction ?? event.actualMove ?? 0)}>
                    {snapshot ? formatPercent(snapshot.priceReaction) : "Pending"}
                  </td>
                  <td>{snapshot?.readThrough ?? event.readThrough}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UpcomingThisWeekTable({ events }: { events: EarningsEvent[] }) {
  return (
    <section className="earnings-table-section" aria-label="Upcoming This Week section">
      <header className="earnings-section-heading">
        <div>
          <h2>Upcoming This Week</h2>
          <p>Street focus, impact level, and the first action to take before the call.</p>
        </div>
      </header>
      <div className="earnings-table-shell">
        <table className="earnings-data-table" aria-label="Upcoming This Week">
          <thead>
            <tr>
              <th>Company</th>
              <th>Date</th>
              <th>Time</th>
              <th>Sector</th>
              <th>Street focus</th>
              <th>Impact</th>
              <th>Exposure</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <strong>{event.ticker}</strong>
                  <span>{event.company}</span>
                </td>
                <td>{event.dateLabel}</td>
                <td>{event.time}</td>
                <td>{event.sector}</td>
                <td>{event.streetFocus}</td>
                <td className={toneClass(getEarningsImpactTone(event.impact))}>{event.impact}</td>
                <td>{event.portfolioRelevance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EarningsThemesPanel() {
  return (
    <section className="earnings-themes-panel" aria-label="Earnings Themes To Watch">
      <header className="earnings-section-heading">
        <div>
          <h2>Earnings Themes To Watch</h2>
          <p>Cross-stock reads that matter more than a single headline EPS number.</p>
        </div>
      </header>
      <div className="earnings-theme-list">
        {EARNINGS_THEMES.map((theme) => (
          <article key={theme.id} className={toneClass(theme.tone)}>
            <div>
              <strong>{theme.title}</strong>
              <span>{theme.sectors.join(" / ")}</span>
            </div>
            <p>{theme.summary}</p>
            <em>{theme.tickers.join(" / ")}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function EarningsForceCard({ item }: { item: EarningsForceName }) {
  return (
    <article className={`earnings-force-card ${toneClass(item.move)}`} aria-label={`${item.company} earnings force`}>
      <header>
        <div>
          <strong>{item.ticker}</strong>
          <span>{item.company}</span>
        </div>
        <em>{formatPercent(item.move)}</em>
      </header>
      <DetailedSparkline
        data={item.points}
        trend={item.move >= 0 ? "up" : "down"}
        height={52}
        className="earnings-force-sparkline"
        ariaLabel={`Earnings force trend for ${item.company}`}
      />
      <div className="earnings-force-metrics">
        <span>
          Price <b>{formatPortfolioTapePrice(item.price)}</b>
        </span>
        <span>
          Implied <b>{item.expectedMove}</b>
        </span>
        <span>
          Volume <b>{item.volume}</b>
        </span>
      </div>
      <p>{item.reason}</p>
    </article>
  );
}

function EarningsForcePanel() {
  return (
    <section className="earnings-force-panel" aria-label="Names With Earnings Force">
      <header className="earnings-section-heading">
        <div>
          <h2>Names With Earnings Force</h2>
          <p>Price and volume setups around the result window.</p>
        </div>
      </header>
      <div className="earnings-force-grid">
        {EARNINGS_FORCE_NAMES.map((item) => (
          <EarningsForceCard key={item.ticker} item={item} />
        ))}
      </div>
    </section>
  );
}

function EarningsTab({
  query,
  selectedTicker,
  selectedDate,
  onSelectedTickerChange,
  onSelectedDateChange,
  onWatchlist,
  onAnswer,
}: {
  query: string;
  selectedTicker: string;
  selectedDate: string;
  onSelectedTickerChange: (ticker: string) => void;
  onSelectedDateChange: (date: string) => void;
  onWatchlist: () => void;
  onAnswer: FinanceNavigationProps["onAnswer"];
}) {
  const trimmedQuery = query.trim();
  const [activeTickerFilters, setActiveTickerFilters] = useState<string[]>([]);
  const handleTickerFilterToggle = (ticker: string) => {
    setActiveTickerFilters((currentFilters) =>
      currentFilters.includes(ticker) ? currentFilters.filter((item) => item !== ticker) : [...currentFilters, ticker],
    );
  };
  const filteredEvents = useMemo(
    () =>
      filterEventsByTickers(
        trimmedQuery ? EARNINGS_EVENTS : getEarningsEventsForDate(selectedDate),
        activeTickerFilters,
      ).filter((event) => !trimmedQuery || includesSearch(getEarningsSearchText(event), trimmedQuery)),
    [activeTickerFilters, selectedDate, trimmedQuery],
  );
  const selectedEvent = useMemo(() => pickSelectedEarningsEvent(filteredEvents, selectedTicker), [filteredEvents, selectedTicker]);

  return (
    <section className="earnings-pplx-shell" aria-label="Earnings calendar workspace">
      <section className="earnings-pplx-main" aria-label="Earnings calendar and calls">
        <EarningsCalendar
          selectedDate={selectedDate}
          activeTickerFilters={activeTickerFilters}
          onTickerFilterToggle={handleTickerFilterToggle}
          onTickerFiltersReset={() => setActiveTickerFilters([])}
          onSelectedDateChange={onSelectedDateChange}
        />
        <EarningsCallList events={filteredEvents} selectedDate={selectedDate} onSelectedTickerChange={onSelectedTickerChange} />
        <EarningsAskComposer onAnswer={onAnswer} />
        <FinanceDisclaimer />
      </section>
      <EarningsMarketRail onWatchlist={onWatchlist} />
      {selectedEvent ? <span className="earnings-pplx-selected-anchor" aria-hidden="true">{selectedEvent.ticker}</span> : null}
    </section>
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
    ? "Screening the equity universe..."
    : trimmedQuery
      ? `${filteredRows.length} matches in the current equity universe.`
      : "Try: low debt banks, high ROE consumer, dividend yield, earnings momentum.";

  return (
    <WorkspaceLayout
      label="Screener"
      rail={
        <>
          <section className="portfolio-workspace-panel portfolio-screener-context-panel">
            <PanelHeading title="Current screen" meta="Equity universe" />
            <p className="portfolio-rail-copy">
              {query.trim()
                ? `Search is filtering Indian-market names for "${query.trim()}".`
                : `Showing ${filteredRows.length} Indian-market names from the ${preset} screen.`}
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
              <PanelHeading title={`${selectedRow.ticker} setup`} meta="Quick read" />
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
                      ? `${selectedRow.name} is already saved in your watchlist`
                      : `Add ${selectedRow.name} to your watchlist`
                  }
                  aria-pressed={trackedTickers.has(selectedRow.ticker)}
                  title={
                    trackedTickers.has(selectedRow.ticker)
                      ? "Already saved to your watchlist."
                      : "Save this name to your watchlist."
                  }
                  onClick={() => onAddToWatchlist(selectedRow)}
                >
                  {trackedTickers.has(selectedRow.ticker) ? "Saved" : "Add to watchlist"}
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
          <span>Equity universe and watchlist actions</span>
        </div>
        <form
          className={`portfolio-screener-query-composer has-animated-search-prompt${query.trim() ? " has-search-value" : ""}${isScreening ? " is-screening" : ""}`}
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
            placeholder=" "
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onQuerySubmit();
              }
            }}
          />
          <AnimatedSearchPrompt prompts={SCREENER_SEARCH_PROMPTS} />
          <button
            type="submit"
            aria-label={isScreening ? "Screening equity universe" : "Run screener query"}
            title={isScreening ? "Screening equity universe" : "Run screener query"}
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
        <PanelHeading title="Indian equity screens" meta={`${filteredRows.length} results`} />
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
                        aria-label={isTracked ? `${row.name} is already saved in your watchlist` : `Add ${row.name} to your watchlist`}
                        aria-pressed={isTracked}
                        title={
                          isTracked
                            ? "Already saved to your watchlist."
                            : "Save this name to your watchlist."
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

function watchlistSymbol(item: (typeof WATCHLIST_ITEMS)[number]) {
  return `${item.ticker}${item.exchange === "BSE" ? ".BO" : ".NS"}`;
}

function watchlistRangeMove(item: (typeof WATCHLIST_ITEMS)[number], range: WatchlistRange) {
  if (range === "1D") return item.oneDay;
  if (range === "1M") return item.oneMonth;
  if (range === "6M") return item.sixMonth;
  if (range === "YTD") return item.ytd;
  if (range === "1Y") return Number((item.sixMonth * 0.72 + item.ytd * 0.88).toFixed(2));
  if (range === "5Y") return Number((item.sixMonth * 1.55 + item.ytd * 1.35).toFixed(2));
  return Number((item.sixMonth * 1.86 + item.ytd * 1.64).toFixed(2));
}

function watchlistSeriesValues(item: (typeof WATCHLIST_ITEMS)[number], range: WatchlistRange) {
  const rangeMove = watchlistRangeMove(item, range) / 100;
  const length = Math.max(item.points.length - 1, 1);
  return item.points.map((point, index) => point + point * rangeMove * (index / length) * 2.35);
}

function buildWatchlistPolyline(values: number[], min: number, max: number) {
  const span = Math.max(max - min, 0.01);
  const length = Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = 4 + (index / length) * 92;
      const y = 38 - ((value - min) / span) * 30;
      return `${x.toFixed(2)},${Math.max(6, Math.min(40, y)).toFixed(2)}`;
    })
    .join(" ");
}

function WatchlistComparisonChart({
  items,
  range,
}: {
  items: typeof WATCHLIST_ITEMS;
  range: WatchlistRange;
}) {
  const series = items.slice(0, 4).map((item, index) => ({
    item,
    values: watchlistSeriesValues(item, range),
    color: ["#79c99e", "#c9876c", "#9ba9f6", "#e4cf86"][index] ?? "#a5a29a",
  }));
  const allValues = series.flatMap((entry) => entry.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return (
    <svg
      className="watchlist-pplx-chart"
      viewBox="0 0 100 44"
      preserveAspectRatio="none"
      role="img"
      aria-label={`Watchlist movers comparison chart for ${range}`}
    >
      <line x1="4" x2="96" y1="38" y2="38" aria-hidden="true" />
      <line x1="4" x2="96" y1="22" y2="22" aria-hidden="true" />
      {series.map((entry) => (
        <polyline
          key={entry.item.ticker}
          points={buildWatchlistPolyline(entry.values, min, max)}
          fill="none"
          stroke={entry.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function WatchlistAskComposer({
  question,
  onQuestionChange,
  onAsk,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  onAsk: (query: string) => void;
}) {
  const submitQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    onAsk(trimmedQuestion);
  };

  const chooseSuggestion = (suggestion: string) => {
    onQuestionChange(suggestion);
    onAsk(suggestion);
  };

  return (
    <form className="watchlist-pplx-composer" role="search" aria-label="Ask about Indian company watchlist" onSubmit={submitQuestion}>
      <div className="watchlist-pplx-suggestions" role="list" aria-label="Suggested watchlist searches">
        {WATCHLIST_ASK_SUGGESTIONS.map((suggestion) => (
          <div key={suggestion} role="listitem">
            <button type="button" onClick={() => chooseSuggestion(suggestion)}>
              <Search aria-hidden="true" />
              <span>{suggestion}</span>
            </button>
          </div>
        ))}
      </div>
      <label className="watchlist-pplx-composer-input-row">
        <span className="portfolio-screen-reader-only">Ask anything about Indian company watchlist</span>
        <input
          type="search"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          aria-label="Ask anything about Indian company watchlist"
          placeholder="Ask anything about Indian company watchlist"
        />
      </label>
      <div className="watchlist-pplx-composer-toolbar">
        <button type="button" aria-label="Add watchlist attachment">
          <Plus aria-hidden="true" />
        </button>
        <button type="button" aria-label="Search mode" className="is-active">
          <Search aria-hidden="true" />
          <span>Search</span>
        </button>
        <button type="button" aria-label="Computer mode" className="is-active">
          <Cpu aria-hidden="true" />
          <span>Computer</span>
        </button>
        <button type="submit" aria-label="Ask watchlist question" className="watchlist-pplx-submit">
          <ArrowUpRight aria-hidden="true" />
        </button>
      </div>
    </form>
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
  onAnswer,
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
  onAnswer: FinanceNavigationProps["onAnswer"];
}) {
  const [watchlistFilter, setWatchlistFilter] = useState<WatchlistFilter>("Watched");
  const [watchlistRange, setWatchlistRange] = useState<WatchlistRange>("1D");
  const [isCompareMode, setIsCompareMode] = useState(true);
  const [isManagingWatchlist, setIsManagingWatchlist] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
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
  const comparisonItems = (trackedItems.length ? trackedItems : WATCHLIST_ITEMS).slice(0, isCompareMode ? 4 : 1);
  const topMover = [...(trackedItems.length ? trackedItems : WATCHLIST_ITEMS)].sort((a, b) => b.oneDay - a.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const laggard = [...(trackedItems.length ? trackedItems : WATCHLIST_ITEMS)].sort((a, b) => a.oneDay - b.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const activeAlerts = WATCHLIST_ITEMS.filter((item) => alertTickers.has(item.ticker));
  const biggestRiskCluster =
    trackedItems.reduce<Record<string, number>>((clusters, item) => {
      const cluster = WATCHLIST_ITEM_CONTEXT[item.ticker]?.riskCluster ?? item.sector;
      clusters[cluster] = (clusters[cluster] ?? 0) + 1;
      return clusters;
    }, {});
  const riskCluster = Object.entries(biggestRiskCluster).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Indian equity breadth";
  const sourceCount = WATCHLIST_NEWS.length + WATCHLIST_MOVEMENTS.reduce((total, item) => total + item.sources, 0);
  const sortedByDay = [...WATCHLIST_ITEMS].sort((a, b) => b.oneDay - a.oneDay);
  const toWatchlistMoverItem = (item: WatchlistItem): SharedMoverItem => ({
    key: item.ticker,
    name: item.name,
    ticker: item.ticker,
    meta: watchlistSymbol(item),
    move: item.oneDay,
  });
  const watchlistMoverItems: SharedMoverItemsByTab = {
    gainers: sortedByDay.slice(0, 4).map(toWatchlistMoverItem),
    losers: [...WATCHLIST_ITEMS].sort((a, b) => a.oneDay - b.oneDay).slice(0, 4).map(toWatchlistMoverItem),
    active: [...(trackedItems.length ? trackedItems : WATCHLIST_ITEMS)]
      .sort((a, b) => Math.abs(b.oneDay) - Math.abs(a.oneDay))
      .slice(0, 4)
      .map(toWatchlistMoverItem),
  };

  const askWatchlistQuestion = (questionText: string) => {
    void onAnswer({
      query: questionText,
      title: "Watchlist question",
      summary: "Indian equities watchlist context",
    });
  };

  return (
    <WorkspaceLayout
      label="Watchlist market rail"
      rail={
        <>
          <section className="portfolio-workspace-panel watchlist-pplx-rail-card watchlist-pplx-mover-card">
            <h2>Gainers</h2>
            <SharedMoverPanel
              itemsByTab={watchlistMoverItems}
              ariaLabel="Watchlist rail movers"
              className="watchlist-pplx-mover-panel"
              tabsClassName="watchlist-pplx-rail-tabs"
              listClassName="watchlist-pplx-rail-list"
              showPrice={false}
            />
          </section>

          <section className="portfolio-workspace-panel watchlist-pplx-rail-card">
            <h2>Equity Sectors</h2>
            <div className="watchlist-pplx-sector-list">
              {WATCHLIST_SECTOR_THEME_ROWS.map((row) => (
                <article key={row.label}>
                  <div>
                    <strong>{row.label}</strong>
                    <span>{row.score}</span>
                  </div>
                  <em>{row.tickers.join(" / ")}</em>
                </article>
              ))}
            </div>
          </section>
          <FinanceDisclaimer />
        </>
      }
    >
      <section className="watchlist-pplx-summary" aria-labelledby="watchlist-pplx-title">
        <header>
          <div>
            <h1 id="watchlist-pplx-title">My Watchlist</h1>
            <p>Indian equities with the clearest near-term price and earnings context.</p>
          </div>
          <button
            type="button"
            className={isManagingWatchlist ? "is-active" : ""}
            aria-pressed={isManagingWatchlist}
            onClick={() => setIsManagingWatchlist((current) => !current)}
          >
            Manage Watchlist
          </button>
        </header>
        <p>
          <TickerMovePill ticker={topMover.ticker} move={topMover.oneDay} /> is leading the list today, while{" "}
          <TickerMovePill ticker={laggard.ticker} move={laggard.oneDay} /> is the main drag. The most crowded watch item is{" "}
          <strong>{riskCluster}</strong>, with the table below focused only on Indian listed equities.
        </p>
        <div className="watchlist-pplx-meta-row">
          <span>{sourceCount} sources</span>
          <span>Updated 9 minutes ago</span>
          <span>{trackedItems.length} tracked</span>
        </div>
      </section>

      {isManagingWatchlist ? (
        <section className="watchlist-pplx-manager" aria-label="Manage Indian equity watchlist">
          <label className={`portfolio-search-control has-animated-search-prompt${query.trim() ? " has-search-value" : ""}`}>
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search watchlist</span>
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder=" "
            />
            <AnimatedSearchPrompt prompts={WATCHLIST_SEARCH_PROMPTS} />
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
        </section>
      ) : null}

      {feedbackMessage ? (
        <p className="portfolio-interaction-feedback watchlist-pplx-feedback" role="status" aria-live="polite">
          {feedbackMessage}
        </p>
      ) : null}

      <section className="portfolio-workspace-panel portfolio-table-panel watchlist-pplx-table-panel">
        <header className="watchlist-pplx-section-heading">
          <h2>Tracked Indian assets</h2>
          <span>{visibleItems.length} equities</span>
        </header>
        <table className="portfolio-workspace-table portfolio-watchlist-return-table" aria-label="Indian equity watchlist returns">
          <thead>
            <tr>
              <th>
                <span className="portfolio-screen-reader-only">Asset</span>
              </th>
              <th>Price</th>
              <th>1D</th>
              <th>5D</th>
              <th>1M</th>
              <th>6M</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const isTracked = trackedTickers.has(item.ticker);
              const hasAlert = alertTickers.has(item.ticker);

              return (
                <tr key={item.ticker} className={isTracked ? "is-tracked" : ""}>
                  <td>
                    <div className="portfolio-watchlist-asset-cell">
                      <CompanyAvatar name={item.name} ticker={item.ticker} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{watchlistSymbol(item)}</span>
                      </div>
                      <div className="portfolio-table-actions">
                        <button
                          type="button"
                          className={`portfolio-icon-action ${isTracked ? "is-active" : ""}`}
                          aria-label={`${isTracked ? "Remove" : "Add"} ${item.name} ${isTracked ? "from" : "to"} watchlist`}
                          aria-pressed={isTracked}
                          title={`${isTracked ? "Remove" : "Add"} ${item.name} ${isTracked ? "from" : "to"} your watchlist`}
                          onClick={() => onToggleTracked(item.ticker)}
                        >
                          <Star aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`portfolio-icon-action ${hasAlert ? "is-active" : ""}`}
                          aria-label={`${hasAlert ? "Disable" : "Enable"} alert for ${item.name}`}
                          aria-pressed={hasAlert}
                          title={`${hasAlert ? "Disable" : "Enable"} alert for ${item.name}`}
                          onClick={() => onToggleAlert(item.ticker)}
                        >
                          <Bell aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="portfolio-icon-action"
                          aria-label={`Inspect ${item.name} in Screener`}
                          title={`Inspect ${item.name} in Screener`}
                          onClick={() => onScreener(item.ticker)}
                        >
                          <ArrowUpRight aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="portfolio-icon-action"
                          aria-label={`Open related earnings for ${item.name}`}
                          title={`Open related earnings for ${item.name}`}
                          onClick={() => onEarnings(item.ticker)}
                        >
                          <CalendarDays aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="is-numeric">{formatPortfolioTapePrice(item.price)}</td>
                  <td className={`is-numeric ${toneClass(item.oneDay)}`}>{formatPercent(item.oneDay)}</td>
                  <td className={`is-numeric ${toneClass(item.fiveDay)}`}>{formatPercent(item.fiveDay)}</td>
                  <td className={`is-numeric ${toneClass(item.oneMonth)}`}>{formatPercent(item.oneMonth)}</td>
                  <td className={`is-numeric ${toneClass(item.sixMonth)}`}>{formatPercent(item.sixMonth)}</td>
                </tr>
              );
            })}
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="portfolio-empty-row">
                  {trackedTickers.size === 0 && watchlistFilter === "Watched"
                    ? "Your watchlist is empty. Search or switch to All, then star Indian assets to build it."
                    : "No watchlist matches. Search another Indian asset or clear the filter."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <WatchlistAskComposer
        question={askQuestion}
        onQuestionChange={setAskQuestion}
        onAsk={askWatchlistQuestion}
      />

      <section className="portfolio-workspace-panel watchlist-pplx-movers" aria-label="Watchlist Movers">
        <header className="watchlist-pplx-section-heading">
          <h2>Watchlist Movers</h2>
          <div className="watchlist-pplx-range-row" aria-label="Watchlist movement range">
            {WATCHLIST_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                className={watchlistRange === range ? "is-active" : ""}
                aria-pressed={watchlistRange === range}
                onClick={() => setWatchlistRange(range)}
              >
                {range}
              </button>
            ))}
            <button
              type="button"
              className={isCompareMode ? "is-active" : ""}
              aria-pressed={isCompareMode}
              onClick={() => setIsCompareMode((current) => !current)}
            >
              Compare
            </button>
          </div>
        </header>
        <WatchlistComparisonChart items={comparisonItems} range={watchlistRange} />
        <div className="watchlist-pplx-chart-legend">
          {comparisonItems.map((item) => {
            const rangeMove = watchlistRangeMove(item, watchlistRange);
            return (
              <article key={item.ticker}>
                <CompanyAvatar name={item.name} ticker={item.ticker} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{watchlistSymbol(item)}</span>
                </div>
                <em>{formatPortfolioTapePrice(item.price)}</em>
                <b className={toneClass(rangeMove)}>{formatPercent(rangeMove)}</b>
              </article>
            );
          })}
        </div>
      </section>

      <section className="portfolio-workspace-panel watchlist-pplx-notable" aria-label="Notable Price Movement">
        <header className="watchlist-pplx-section-heading">
          <h2>Notable Price Movement</h2>
          <span>{WATCHLIST_MOVEMENTS.length} moves</span>
        </header>
        <div className="portfolio-movement-timeline watchlist-pplx-timeline">
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

      <section className="portfolio-workspace-panel watchlist-pplx-news">
        <header className="watchlist-pplx-section-heading">
          <h2>Watchlist News</h2>
          <span>{WATCHLIST_NEWS.length} updates</span>
        </header>
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
      <form
        className={`portfolio-finance-search portfolio-cockpit-search has-animated-search-prompt${searchValue.trim() ? " has-search-value" : ""}`}
        role="search"
        aria-label="Search portfolio workspace"
        onSubmit={onSearchSubmit}
      >
        <Search aria-hidden="true" />
        <input
          type="search"
          aria-label="Search portfolio workspace"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder=" "
        />
        <AnimatedSearchPrompt prompts={PORTFOLIO_SEARCH_PROMPTS} />
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
      <PanelHeading title="Holdings decision table" meta={`Based on ${PORTFOLIO_COCKPIT.status.sourceCount} sources`} />
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
              <th>Read</th>
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
                  <td data-label="Read">
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
        <PanelHeading title="Portfolio vs NIFTY 50" meta="Indexed view" />
        <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
      </article>
      <div className="portfolio-performance-side">
        <article className="portfolio-workspace-panel portfolio-chart-card portfolio-allocation-card">
          <PanelHeading title="Allocation" meta="Equity 100%" />
          <PortfolioAllocationView />
        </article>
        <article className="portfolio-workspace-panel portfolio-chart-card portfolio-contribution-card">
          <PanelHeading title="Return drivers" meta="1D P&L" />
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
        <PanelHeading title="Portfolio vs NIFTY 50" meta="Functional range" />
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
            <dd className="portfolio-update-status-text">{freshness}</dd>
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
      <div className="portfolio-status-updated">
        <span>Updated</span>
        <strong className="portfolio-update-status-text">{displayFreshness}</strong>
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

function PortfolioEditorialHero({
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
  const primaryAction = PORTFOLIO_COCKPIT.actions[0];
  const displayFreshness = freshness.replace(/^Local view updated\s*/i, "");
  const heroFacts = PORTFOLIO_COCKPIT.read.facts.slice(0, 3);
  const metrics = [
    { label: "Portfolio value", value: formatPortfolioCurrency(totalValue), tone: "neutral" },
    {
      label: "Today's P&L",
      value: formatSignedPortfolioCurrency(oneDayReturn),
      helper: formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT),
      tone: oneDayReturn >= 0 ? "positive" : "negative",
    },
    {
      label: "Total return",
      value: formatSignedPortfolioCurrency(totalReturn),
      helper: formatSignedPortfolioPercent(totalReturnPercent),
      tone: totalReturn >= 0 ? "positive" : "negative",
    },
    { label: "Evidence", value: `${PORTFOLIO_COCKPIT.status.sourceCount} sources`, helper: displayFreshness, tone: "neutral" },
  ];

  const handleActionClick = (action: (typeof PORTFOLIO_COCKPIT.actions)[number]) => {
    if (action.ctaType === "funds") {
      onFunds();
      return;
    }

    onOpenEvidence(buildActionEvidence(action, freshness));
  };

  return (
    <section className="portfolio-editorial-hero" aria-labelledby="portfolio-editorial-hero-heading">
      <div className="portfolio-editorial-hero-copy">
        <span className="portfolio-editorial-kicker">Portfolio read</span>
        <h2 id="portfolio-editorial-hero-heading">
          {primaryAction?.title === "Reduce private-bank concentration" ? (
            <>
              Reduce <span className="portfolio-title-nowrap">private-bank</span> concentration
            </>
          ) : (
            primaryAction?.title ?? PORTFOLIO_COCKPIT.read.title
          )}
        </h2>
        <p>{PORTFOLIO_COCKPIT.read.summary}</p>

        <div className="portfolio-editorial-metrics" aria-label="Portfolio summary">
          {metrics.map((item) => (
            <article key={item.label} className={`is-${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.helper ? <em>{item.helper}</em> : null}
            </article>
          ))}
        </div>

        <div className="portfolio-editorial-facts" aria-label="Portfolio read facts">
          {heroFacts.map((fact) => (
            <article key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <p>{fact.detail}</p>
            </article>
          ))}
        </div>

        <div className="portfolio-editorial-actions-row">
          {primaryAction ? (
            <button type="button" className="is-primary" onClick={() => onOpenEvidence(buildActionEvidence(primaryAction, freshness))}>
              View evidence
            </button>
          ) : null}
          <button type="button" onClick={onShowHoldings}>
            Open analysis
          </button>
        </div>
      </div>

      <aside className="portfolio-editorial-action-queue" aria-label="Decision queue">
        <header>
          <span>Decision queue</span>
          <strong>{PORTFOLIO_COCKPIT.actions.length} checks</strong>
        </header>
        <div>
          {PORTFOLIO_COCKPIT.actions.map((action, index) => (
            <button key={action.id} type="button" onClick={() => handleActionClick(action)}>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <span className={`risk-${action.riskLevel.toLowerCase()}`}>{action.riskLevel}</span>
              <strong>{action.title}</strong>
              <p>{action.why}</p>
              <b>{action.affectedHoldings.join(" / ")}</b>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}

function PortfolioHoldingsStory({
  freshness,
  onOpenEvidence,
  onShowHoldings,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
  onShowHoldings: () => void;
}) {
  const holdings = [...PORTFOLIO_HOLDINGS].sort((first, second) => second.allocation - first.allocation);
  const maxAllocation = Math.max(...holdings.map((holding) => holding.allocation), 1);

  return (
    <section className="portfolio-holdings-story" aria-labelledby="portfolio-holdings-story-heading">
      <header>
        <div>
          <span>Holdings map</span>
          <h2 id="portfolio-holdings-story-heading">Where the account is exposed</h2>
        </div>
        <button type="button" onClick={onShowHoldings}>
          Full analysis
        </button>
      </header>

      <div className="portfolio-holdings-story-list">
        {holdings.map((holding) => {
          const decision = PORTFOLIO_COCKPIT.holdingDecisions[holding.ticker];
          const context = PORTFOLIO_HOLDING_CONTEXT[holding.ticker];
          const contribution = getHoldingContribution(holding);

          return (
            <button key={holding.ticker} type="button" className={`risk-${holding.risk.toLowerCase()}`} onClick={() => onOpenEvidence(buildHoldingEvidence(holding.ticker, freshness))}>
              <CompanyAvatar name={holding.name} ticker={holding.ticker} />
              <span className="portfolio-holdings-story-main">
                <strong>{holding.name}</strong>
                <em>
                  {holding.ticker} / {context?.exposureCluster ?? holding.sector}
                </em>
              </span>
              <span className="portfolio-holdings-story-allocation">
                <strong>{holding.allocation.toFixed(1)}%</strong>
                <i aria-hidden="true">
                  <span style={{ width: `${((holding.allocation / maxAllocation) * 100).toFixed(1)}%` }} />
                </i>
              </span>
              <span className={holding.dayMove >= 0 ? "portfolio-holdings-story-move is-positive" : "portfolio-holdings-story-move is-negative"}>
                {formatSignedPortfolioMove(holding.dayMove)}
                <em>{formatSignedPortfolioCurrency(contribution)}</em>
              </span>
              <span className="portfolio-holdings-story-read">{decision?.action ?? "Review"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PortfolioDriverBrief({
  freshness,
  onOpenEvidence,
}: {
  freshness: string;
  onOpenEvidence: (content: PortfolioEvidenceDrawerContent) => void;
}) {
  return (
    <section className="portfolio-driver-brief" aria-labelledby="portfolio-driver-brief-heading">
      <header>
        <span>Drivers</span>
        <h2 id="portfolio-driver-brief-heading">What explains the move</h2>
      </header>
      <div>
        {PORTFOLIO_COCKPIT.marketDrivers.slice(0, 3).map((driver) => (
          <button key={driver.id} type="button" className={`is-${driver.impactDirection.toLowerCase()}`} onClick={() => onOpenEvidence(buildMarketDriverEvidence(driver, freshness))}>
            <em>{driver.impactDirection}</em>
            <strong>{driver.headline}</strong>
            <span>{driver.affectedHoldings.join(" / ")}</span>
          </button>
        ))}
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
    <div className="portfolio-today-view portfolio-editorial-view">
      <PortfolioEditorialHero
        totalValue={totalValue}
        oneDayReturn={oneDayReturn}
        totalReturn={totalReturn}
        totalReturnPercent={totalReturnPercent}
        freshness={freshness}
        onOpenEvidence={onOpenEvidence}
        onShowHoldings={onShowHoldings}
        onFunds={onFunds}
      />

      <div className="portfolio-editorial-content-grid">
        <PortfolioHoldingsStory freshness={freshness} onOpenEvidence={onOpenEvidence} onShowHoldings={onShowHoldings} />
        <div className="portfolio-editorial-side-stack">
        <TodayMovedBy oneDayReturn={oneDayReturn} />
          <PortfolioDriverBrief freshness={freshness} onOpenEvidence={onOpenEvidence} />
        </div>
      </div>

      <PortfolioDiagnosis />
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
          <article className="portfolio-evidence-freshness">
            <span>Freshness</span>
            <strong className="portfolio-update-status-text">{content.freshness}</strong>
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
  pageSubtitle,
  pageMeta,
  hideSearch = false,
  useAnimatedSearch = true,
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
  pageSubtitle?: string;
  pageMeta?: string[];
  hideSearch?: boolean;
  useAnimatedSearch?: boolean;
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
            {pageSubtitle ? <p>{pageSubtitle}</p> : null}
            {pageMeta?.length ? (
              <div className="portfolio-finance-header-meta" aria-label={`${pageTitle} view status`}>
                {pageMeta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>
          {hideSearch ? null : (
            <form
              className={`portfolio-finance-search${useAnimatedSearch ? " has-animated-search-prompt" : ""}${searchValue.trim() ? " has-search-value" : ""}`}
              role="search"
              aria-label={searchLabel}
              onSubmit={onSearchSubmit}
            >
              <Search aria-hidden="true" />
              <input
                type="search"
                aria-label={searchLabel}
                value={searchValue}
                onChange={(event) => onSearchValueChange(event.target.value)}
                placeholder={useAnimatedSearch ? " " : commandPlaceholder}
                title={commandPlaceholder}
              />
              {useAnimatedSearch ? <AnimatedSearchPrompt prompts={FINANCE_VIEW_SEARCH_PROMPTS[activeView]} /> : null}
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

export function EarningsScreen({ initialQuery = "", initialSelectedTicker = "", initialSelectedDate = "", ...props }: EarningsScreenProps) {
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState(initialQuery);
  const [earningsQuery, setEarningsQuery] = useState(initialQuery);
  const [selectedEarningsTicker, setSelectedEarningsTicker] = useState(() => normalizeEarningsTicker(initialSelectedTicker || initialQuery));
  const [selectedEarningsDate, setSelectedEarningsDate] = useState(() => normalizeEarningsSelectedDate(initialSelectedDate));

  useEffect(() => {
    setWorkspaceSearchQuery(initialQuery);
    setEarningsQuery(initialQuery);
    setSelectedEarningsTicker(normalizeEarningsTicker(initialSelectedTicker || initialQuery));
    setSelectedEarningsDate(normalizeEarningsSelectedDate(initialSelectedDate));
  }, [initialQuery, initialSelectedTicker, initialSelectedDate]);

  const handleSelectedTickerChange = (ticker: string) => {
    const normalizedTicker = normalizeEarningsTicker(ticker);
    if (!normalizedTicker) return;

    setSelectedEarningsTicker(normalizedTicker);

    if (typeof window !== "undefined" && window.location.pathname === EARNINGS_PATH) {
      const params = new URLSearchParams(window.location.search);
      params.set("selected", normalizedTicker);
      const nextPath = `${EARNINGS_PATH}?${params.toString()}`;
      if (`${window.location.pathname}${window.location.search}` !== nextPath) {
        window.history.replaceState({}, "", nextPath);
      }
    }
  };

  const handleSelectedDateChange = (date: string) => {
    const normalizedDate = normalizeEarningsSelectedDate(date);
    setSelectedEarningsDate(normalizedDate);

    if (typeof window !== "undefined" && window.location.pathname === EARNINGS_PATH) {
      const params = new URLSearchParams(window.location.search);
      params.set("selectedDate", normalizedDate);
      const nextPath = `${EARNINGS_PATH}?${params.toString()}`;
      if (`${window.location.pathname}${window.location.search}` !== nextPath) {
        window.history.replaceState({}, "", nextPath);
      }
    }
  };

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();
    const matchedEvent = findEarningsEventFromQuery(query);

    setEarningsQuery(query);
    if (matchedEvent) {
      handleSelectedDateChange(getEarningsEventDate(matchedEvent));
      handleSelectedTickerChange(matchedEvent.ticker);
    }
  };

  return (
    <FinanceScreenShell
      {...props}
      activeView="earnings"
      label="Earnings screen"
      pageTitle="Earnings"
      pageSubtitle="Calendar, calls, watchlist, and market context."
      searchLabel="Search earnings workspace"
      searchPlaceholder="Search for companies, earnings, and more..."
      useAnimatedSearch={false}
      searchValue={workspaceSearchQuery}
      onSearchValueChange={setWorkspaceSearchQuery}
      onSearchSubmit={handleWorkspaceSearch}
    >
      <EarningsTab
        query={earningsQuery}
        selectedTicker={selectedEarningsTicker}
        selectedDate={selectedEarningsDate}
        onSelectedTickerChange={handleSelectedTickerChange}
        onSelectedDateChange={handleSelectedDateChange}
        onWatchlist={props.onWatchlist}
        onAnswer={props.onAnswer}
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
          ? `${row.name} is already saved in your watchlist.`
          : `${row.name} added to your watchlist.`,
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
        `${itemName} ${isRemoving ? "removed from" : "added to"} your watchlist.`,
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
        `${itemName} alert ${isDisabling ? "disabled" : "enabled"}.`,
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
        onAnswer={props.onAnswer}
      />
    </FinanceScreenShell>
  );
}

export function PortfolioScreen({ onHome, onMarkets, onEarnings, onFunds, onScreener, onWatchlist, onPortfolio }: PortfolioScreenProps) {
  const portfolioAppRef = useRef<HTMLElement | null>(null);
  const portfolioSyncStatus = "Portfolio view";
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

      <section className="portfolio-screen portfolio-workspace-screen" aria-label="Portfolio screen">
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
