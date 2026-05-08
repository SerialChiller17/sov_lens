import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bell, RefreshCw, Search, SlidersHorizontal, Star } from "lucide-react";
import { GlobalBrandNav } from "../../app/GlobalBrandNav";
import type { AppView } from "../../app/routes";
import {
  NIFTY_50_PERFORMANCE,
  PORTFOLIO_AI_NEWS,
  PORTFOLIO_AI_TRUST,
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
import { PortfolioCompositionDonut } from "./PortfolioCompositionDonut";
import { PortfolioPerformanceChart } from "./PortfolioPerformanceChart";
import {
  EARNINGS_DAYS,
  EARNINGS_EVENTS,
  MARKET_BREADTH,
  MARKET_DEVELOPMENTS,
  MARKET_HEATMAP_TILES,
  MARKET_INDEX_CARDS,
  MARKET_INSIGHTS,
  MARKET_MOVERS,
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
  type MarketIndexCard,
  type MarketMover,
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

function MiniSparkline({ points, tone = "positive" }: { points: number[]; tone?: WorkspaceTone }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const path = points
    .map((point, index) => {
      const x = 4 + (index / Math.max(points.length - 1, 1)) * 92;
      const y = 34 - ((point - min) / range) * 26;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className={`portfolio-mini-sparkline ${toneClass(tone)}`} viewBox="0 0 100 40" role="img" aria-label="Price trend sparkline">
      <path className="portfolio-mini-sparkline-grid" d="M 4 20 H 96" />
      <path className="portfolio-mini-sparkline-line" d={path} />
    </svg>
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
}: {
  label: string;
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  return (
    <section className="portfolio-finance-grid" aria-label={label}>
      <div className="portfolio-finance-main">{children}</div>
      <aside className="portfolio-finance-rail" aria-label={`${label} intelligence rail`}>
        {rail}
      </aside>
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
      <MiniSparkline points={item.points} tone={item.changePercent >= 0 ? "positive" : "negative"} />
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

function MarketHeatmapPanel() {
  return (
    <section className="portfolio-workspace-panel portfolio-heatmap-panel">
      <PanelHeading eyebrow="Heatmap" title="Top 500 Heatmap" meta="Expand" />
      <div className="portfolio-heatmap-grid">
        {MARKET_HEATMAP_TILES.map((tile) => (
          <article key={tile.ticker} className={`portfolio-heatmap-tile size-${tile.size} ${toneClass(tile.move)}`}>
            <strong>{tile.ticker}</strong>
            <span>{tile.sector}</span>
            <em>{formatPercent(tile.move)}</em>
          </article>
        ))}
      </div>
      <div className="portfolio-heatmap-legend" aria-hidden="true">
        <span>-3%</span>
        <span />
        <strong>0</strong>
        <em />
        <span>+3%</span>
      </div>
    </section>
  );
}

function MarketDevelopmentGrid() {
  return (
    <section className="portfolio-workspace-panel">
      <PanelHeading eyebrow="Recent developments" title="Market summary" meta="Updated 9m ago" />
      <div className="portfolio-development-grid">
        {MARKET_DEVELOPMENTS.map((item) => (
          <article key={item.title} className={`portfolio-development-card ${toneClass(item.tone)}`}>
            <span>{item.source}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
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
              <div>
                <span>
                  {item.ticker} / {item.exchange}
                </span>
                <strong>{item.company}</strong>
              </div>
              <div>
                <strong>{formatPortfolioTapePrice(item.price)}</strong>
                <em className={toneClass(item.move)}>{formatPercent(item.move)}</em>
              </div>
            </div>
            <MiniSparkline points={item.points} tone={item.move >= 0 ? "positive" : "negative"} />
            <div className="portfolio-standout-metrics">
              <MetricTile label="Volume" value={item.volume} />
              <MetricTile label="Market cap" value={item.marketCap} />
              <MetricTile label="P/E" value={item.pe} />
              <MetricTile label="Dividend" value={item.dividendYield} />
            </div>
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

function IndianMarketsTab() {
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

      <section className="portfolio-workspace-panel portfolio-market-summary-panel">
        <PanelHeading eyebrow="Market summary" title="Broad rally, bank leadership, selective IT" meta="Updated 3m ago" />
        <div className="portfolio-summary-accordion">
          {MARKET_INSIGHTS.map((insight) => (
            <article key={insight.title} className={toneClass(insight.tone)}>
              <strong>{insight.title}</strong>
              <p>{insight.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <MarketHeatmapPanel />

      <section className="portfolio-workspace-split">
        <MarketMoversPanel />
        <SectorPerformancePanel />
      </section>

      <MarketDevelopmentGrid />
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
                <MiniSparkline points={item.points} tone={item.oneDay >= 0 ? "positive" : "negative"} />
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

function PortfolioMetricStrip({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  portfolioSyncStatus,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  portfolioSyncStatus: string;
}) {
  return (
    <section className="portfolio-terminal-strip" aria-label="Portfolio value summary">
      <div className="portfolio-terminal-strip-title">
        <span>Personal exposure</span>
        <strong>Your Portfolio</strong>
        <em>{portfolioSyncStatus}</em>
      </div>
      <MetricTile label="Current Portfolio Value" value={formatPortfolioCurrency(totalValue)} />
      <MetricTile label="Invested value" value={formatPortfolioCurrency(PORTFOLIO_INVESTED_VALUE)} />
      <MetricTile
        label="1D return"
        value={`${formatSignedPortfolioCurrency(oneDayReturn)} (${formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT)})`}
        tone={oneDayReturn >= 0 ? "positive" : "negative"}
      />
      <MetricTile
        label="Total return"
        value={`${formatSignedPortfolioCurrency(totalReturn)} (${formatSignedPortfolioPercent(totalReturnPercent)})`}
        tone={totalReturn >= 0 ? "positive" : "negative"}
      />
    </section>
  );
}

function PortfolioReadPanel() {
  const mainDriver = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.value * b.dayMove - a.value * a.dayMove)[0];
  const mainDrag = [...PORTFOLIO_HOLDINGS].sort((a, b) => a.value * a.dayMove - b.value * b.dayMove)[0];
  const financialAllocation = PORTFOLIO_HOLDINGS.filter((holding) => holding.sector === "Financials").reduce(
    (sum, holding) => sum + holding.allocation,
    0,
  );

  return (
    <section className="portfolio-workspace-panel portfolio-read-panel">
      <PanelHeading eyebrow="Portfolio read" title="Today's portfolio read" meta="49 sources / updated 9m ago" />
      <p>
        Indian markets staged a broad rally, but this portfolio is mostly being driven by private-bank leadership and Tata Motors momentum.
        <TickerMovePill ticker="ICICIBANK" move={1.86} />
        and <TickerMovePill ticker="TATAMOTORS" move={2.25} /> carried gains, while{" "}
        <TickerMovePill ticker="RELIANCE" move={-1.8} /> remains the main drag from crude and O2C uncertainty.
      </p>
      <p>
        The next useful confirmation is whether banks keep breadth after earnings commentary and whether IT demand improves beyond currency support.
      </p>
      <div className="portfolio-read-structure">
        <article>
          <span>Main driver</span>
          <strong>{mainDriver.ticker}</strong>
          <p>{PORTFOLIO_HOLDING_CONTEXT[mainDriver.ticker]?.signal}</p>
        </article>
        <article>
          <span>Main drag</span>
          <strong>{mainDrag.ticker}</strong>
          <p>{PORTFOLIO_HOLDING_CONTEXT[mainDrag.ticker]?.signal}</p>
        </article>
        <article>
          <span>Risk cluster</span>
          <strong>Financials {financialAllocation.toFixed(1)}%</strong>
          <p>Bank leadership is helpful today, but concentration still needs confirmation.</p>
        </article>
        <article>
          <span>Suggested next check</span>
          <strong>Confirm breadth</strong>
          <p>Check whether banks, autos, and capex names move together after earnings commentary.</p>
        </article>
      </div>
    </section>
  );
}

function PortfolioRail({
  expandedPlayId,
  onExpandedPlayChange,
  onFunds,
  canOpenFundsForPlay,
}: {
  expandedPlayId: string | null;
  onExpandedPlayChange: (id: string | null) => void;
  onFunds: () => void;
  canOpenFundsForPlay: (play: (typeof PORTFOLIO_SUGGESTED_PLAYS)[number]) => boolean;
}) {
  const topHolding = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.allocation - a.allocation)[0];
  const highRiskHoldings = PORTFOLIO_HOLDINGS.filter((holding) => holding.risk === "High");
  const financialAllocation = PORTFOLIO_HOLDINGS.filter((holding) => holding.sector === "Financials").reduce(
    (sum, holding) => sum + holding.allocation,
    0,
  );

  return (
    <aside className="portfolio-workspace-rail portfolio-right-column" aria-label="Portfolio AI intelligence">
      <section className="portfolio-workspace-panel portfolio-ai-trust-panel">
        <PanelHeading eyebrow="AI trust" title="Evidence level" meta={PORTFOLIO_AI_TRUST.confidence} />
        <div className="portfolio-product-metric-strip">
          <MetricTile label="Sources" value={`${PORTFOLIO_AI_TRUST.sourceCount}`} />
          <MetricTile label="Freshness" value={PORTFOLIO_AI_TRUST.lastUpdated} />
        </div>
        <div className="portfolio-trust-list">
          <span>Changed today</span>
          {PORTFOLIO_AI_TRUST.changedToday.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
        <details className="portfolio-trust-details">
          <summary>Assumptions</summary>
          <ul>
            {PORTFOLIO_AI_TRUST.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="portfolio-workspace-panel portfolio-portfolio-pulse-panel">
        <PanelHeading eyebrow="Portfolio AI" title="Portfolio pulse" meta="Local read" />
        <p className="portfolio-rail-copy">
          Watching bank concentration, Tata Motors momentum, IT commentary, crude sensitivity, and domestic capex confirmation.
        </p>
        <div className="portfolio-rail-mini-table" aria-label="Portfolio AI evidence">
          <div>
            <span>Largest holding</span>
            <strong>
              {topHolding.ticker} {topHolding.allocation.toFixed(1)}%
            </strong>
          </div>
          <div>
            <span>Financials sleeve</span>
            <strong>{financialAllocation.toFixed(1)}%</strong>
          </div>
          <div>
            <span>High-risk name</span>
            <strong>{highRiskHoldings.map((holding) => holding.ticker).join(" / ")}</strong>
          </div>
        </div>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Questions" title="What to confirm" />
        <div className="portfolio-alert-list">
          <article>
            <strong>Does Bank Nifty leadership hold?</strong>
            <p>ICICI Bank and HDFC Bank decide whether today's gains are broad or just index-heavy.</p>
          </article>
          <article>
            <strong>Is Tata Motors momentum becoming crowding?</strong>
            <p>JLR margin commentary is the cleaner check before adding more auto risk.</p>
          </article>
        </div>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="News Affecting Portfolio" title="Impact stream" />
        <div className="portfolio-impact-news-list">
          {PORTFOLIO_AI_NEWS.slice(0, 4).map((item) => (
            <article key={item.id}>
              <span>{item.impact}</span>
              <strong>{item.headline}</strong>
              <p>{item.summary}</p>
              <div>
                {item.tickers.map((ticker) => (
                  <em key={ticker}>{ticker}</em>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Recommended Plays" title="Action queue" />
        <div className="portfolio-action-card-list">
          {PORTFOLIO_SUGGESTED_PLAYS.map((play) => {
            const isExpanded = expandedPlayId === play.id;
            const hasPrimaryAction = canOpenFundsForPlay(play);
            const disabledReasonId = `portfolio-action-disabled-${play.id}`;
            const logicId = `portfolio-action-logic-${play.id}`;

            return (
              <article key={play.id} className={`portfolio-action-card priority-${play.priority.toLowerCase()}`}>
                <div>
                  <span>{play.riskLabel}</span>
                  <em>{play.context}</em>
                </div>
                <strong>{play.headline}</strong>
                <p>{play.analysis}</p>
                <div className="portfolio-reason-chip-row">
                  {play.reasons.map((reason) => (
                    <span key={reason.text}>{reason.emphasis ?? reason.text}</span>
                  ))}
                  {play.confidence ? <span>Confidence: {play.confidence}</span> : null}
                </div>
                {isExpanded ? (
                  <div id={logicId} className="portfolio-action-logic">
                    <ul>
                      {play.logic.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    {play.wouldChange ? (
                      <p>
                        <strong>What would change this:</strong> {play.wouldChange}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="portfolio-action-card-buttons">
                  {hasPrimaryAction ? (
                    <button
                      type="button"
                      aria-label={`${play.primaryAction} for recommendation: ${play.headline}`}
                      title={`${play.primaryAction} for ${play.headline}`}
                      onClick={() => onFunds()}
                    >
                      {play.primaryAction}
                      <ArrowUpRight aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="portfolio-action-status" aria-describedby={disabledReasonId}>
                      {play.primaryAction} unavailable
                    </span>
                  )}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={logicId}
                    aria-label={`${isExpanded ? "Hide" : "View"} logic for recommendation: ${play.headline}`}
                    title={`${isExpanded ? "Hide" : "View"} logic for ${play.headline}`}
                    onClick={() => onExpandedPlayChange(isExpanded ? null : play.id)}
                  >
                    {isExpanded ? "Hide logic" : play.secondaryAction}
                  </button>
                </div>
                {!hasPrimaryAction ? (
                  <p id={disabledReasonId} className="portfolio-action-disabled-note">
                    Requires portfolio action setup. View logic is available, but no broker action runs in this demo.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function YourPortfolioTab({
  totalValue,
  oneDayReturn,
  totalReturn,
  totalReturnPercent,
  portfolioSyncStatus,
  expandedPlayId,
  onExpandedPlayChange,
  onFunds,
  canOpenFundsForPlay,
  onScreener,
}: {
  totalValue: number;
  oneDayReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
  portfolioSyncStatus: string;
  expandedPlayId: string | null;
  onExpandedPlayChange: (id: string | null) => void;
  onFunds: () => void;
  canOpenFundsForPlay: (play: (typeof PORTFOLIO_SUGGESTED_PLAYS)[number]) => boolean;
  onScreener: (query: string) => void;
}) {
  return (
    <section className="portfolio-command-grid portfolio-workspace-command-grid portfolio-terminal-layout" aria-label="Portfolio command center">
      <section className="portfolio-dashboard portfolio-left-column portfolio-terminal-main" aria-label="Portfolio dashboard">
        <PortfolioMetricStrip
          totalValue={totalValue}
          oneDayReturn={oneDayReturn}
          totalReturn={totalReturn}
          totalReturnPercent={totalReturnPercent}
          portfolioSyncStatus={portfolioSyncStatus}
        />

        <PortfolioReadPanel />

        <section className="portfolio-dashboard portfolio-main-dashboard portfolio-terminal-dashboard" aria-label="Portfolio holdings and performance">
          <article className="portfolio-workspace-panel portfolio-table-panel portfolio-holdings-terminal-panel">
            <PanelHeading eyebrow="Holdings" title="Impact table" meta="Stock-wise exposure" />
            <table className="portfolio-holdings-table portfolio-holdings-table-upgraded">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Value</th>
                  <th>1D</th>
                  <th>Contribution</th>
                  <th>Alloc.</th>
                  <th>Risk</th>
                  <th>Signal</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_HOLDINGS.map((holding) => {
                  const context = PORTFOLIO_HOLDING_CONTEXT[holding.ticker];
                  const contribution = holding.value * (holding.dayMove / 100);

                  return (
                    <tr key={holding.ticker} className={`portfolio-holding-row risk-${holding.risk.toLowerCase()}`}>
                      <td>
                        <strong>{holding.ticker}</strong>
                        <span>
                          {holding.name}
                          {holding.exchange ? ` / ${holding.exchange}` : ""}
                          {` / ${holding.sector}`}
                        </span>
                        <button
                          type="button"
                          className="portfolio-inline-link-button"
                          aria-label={`Open ${holding.name} in Screener`}
                          title={`Open ${holding.name} in Screener`}
                          onClick={() => onScreener(holding.ticker)}
                        >
                          Open screener
                        </button>
                      </td>
                      <td>{formatPortfolioCurrency(holding.value)}</td>
                      <td className={holding.dayMove >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioMove(holding.dayMove)}</td>
                      <td className={contribution >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioCurrency(contribution)}</td>
                      <td>{holding.allocation.toFixed(1)}%</td>
                      <td>
                        <em className={`portfolio-risk-pill risk-${holding.risk.toLowerCase()}`}>{holding.risk}</em>
                        <span>{context?.riskReason}</span>
                      </td>
                      <td>
                        <span>{context?.signal}</span>
                        <em className="portfolio-table-signal">{context?.exposureCluster}</em>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>

          <div className="portfolio-workspace-split portfolio-secondary-market-panels">
            <article className="portfolio-workspace-panel portfolio-performance-panel">
              <PanelHeading eyebrow="Performance" title="6M vs NIFTY 50" />
              <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
            </article>

            <article className="portfolio-workspace-panel portfolio-composition-panel">
              <PanelHeading eyebrow="Composition" title="Allocation" />
              <PortfolioCompositionDonut holdings={PORTFOLIO_HOLDINGS} />
            </article>
          </div>
        </section>
      </section>

      <PortfolioRail
        expandedPlayId={expandedPlayId}
        onExpandedPlayChange={onExpandedPlayChange}
        onFunds={onFunds}
        canOpenFundsForPlay={canOpenFundsForPlay}
      />
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
    <main ref={financeAppRef} className="app-shell portfolio-app">
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
      <IndianMarketsTab />
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
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);

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

  const canOpenFundsForPlay = (play: (typeof PORTFOLIO_SUGGESTED_PLAYS)[number]) =>
    /fund|etf/i.test(`${play.primaryAction} ${play.context} ${play.command}`);

  return (
    <main ref={portfolioAppRef} className="app-shell portfolio-app">
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

        <header className="portfolio-finance-header">
          <div className="portfolio-finance-header-title">
            <span className="portfolio-section-kicker">Sovereign Lens Finance</span>
            <h1>Portfolio</h1>
            <p>Personal exposure, holdings, performance, and local AI read.</p>
            <span className="portfolio-page-meta">Local browser view</span>
          </div>
          <form className="portfolio-finance-search" role="search" aria-label="Search portfolio workspace" onSubmit={handleWorkspaceSearch}>
            <Search aria-hidden="true" />
            <input
              value={workspaceSearchQuery}
              onChange={(event) => setWorkspaceSearchQuery(event.target.value)}
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
            <button
              type="button"
              className={`portfolio-status-sync-button${isPortfolioSyncing ? " is-syncing" : ""}`}
              aria-label="Refresh local portfolio view"
              aria-busy={isPortfolioSyncing}
              title="Refresh local portfolio view"
              onClick={handlePortfolioSync}
            >
              <RefreshCw aria-hidden="true" />
            </button>
          </div>
        </header>

        <YourPortfolioTab
          totalValue={totalValue}
          oneDayReturn={oneDayReturn}
          totalReturn={totalReturn}
          totalReturnPercent={totalReturnPercent}
          portfolioSyncStatus={portfolioSyncStatus}
          expandedPlayId={expandedPlayId}
          onExpandedPlayChange={setExpandedPlayId}
          onFunds={onFunds}
          canOpenFundsForPlay={canOpenFundsForPlay}
          onScreener={onScreener}
        />

        <button type="button" className="portfolio-scroll-cue" aria-label="Scroll portfolio screen down" onClick={scrollPortfolioDown}>
          <span />
        </button>
      </section>
    </main>
  );
}
