import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bell, Search, SlidersHorizontal, Star } from "lucide-react";
import { GlobalBrandNav } from "../../app/GlobalBrandNav";
import { MarketTape } from "../market-tape/MarketTape";
import {
  NIFTY_50_PERFORMANCE,
  PORTFOLIO_AI_NEWS,
  PORTFOLIO_DAY_RETURN_PERCENT,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_INVESTED_VALUE,
  PORTFOLIO_MARKET_TAPE,
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
  MARKET_QUESTIONS,
  MARKET_STANDOUTS,
  SCREENER_PRESETS,
  SCREENER_ROWS,
  SECTOR_PERFORMANCE,
  WATCHLIST_ITEMS,
  WATCHLIST_MOVEMENTS,
  WATCHLIST_NEWS,
  type EarningsEvent,
  type MarketIndexCard,
  type MarketMover,
  type ScreenerRow,
  type WatchlistItem,
  type WorkspaceTone,
} from "./portfolioWorkspaceData";

interface PortfolioScreenProps {
  onHome: () => void;
  onFunds: () => void;
  onPortfolio: () => void;
}

type WorkspaceTab = "portfolio" | "markets" | "earnings" | "screener" | "watchlist";
type EarningsFilter = "Today" | "This Week" | "Next Week" | "Recent";
type ScreenerPreset = (typeof SCREENER_PRESETS)[number];
type SortDirection = "asc" | "desc";

const WORKSPACE_TABS: Array<{ id: WorkspaceTab; label: string; description: string }> = [
  { id: "portfolio", label: "Your Portfolio", description: "Holdings, exposure, AI actions" },
  { id: "markets", label: "Indian Markets", description: "Indices, sectors, movers" },
  { id: "earnings", label: "Earnings", description: "Calendar and result watch" },
  { id: "screener", label: "Screener", description: "Filter Indian equities" },
  { id: "watchlist", label: "Watchlist", description: "Tracked names and alerts" },
];

const EARNINGS_FILTERS: EarningsFilter[] = ["Today", "This Week", "Next Week", "Recent"];

const SCREENER_COLUMNS: Array<{ key: keyof ScreenerRow; label: string; className?: string }> = [
  { key: "marketCapCr", label: "M Cap", className: "is-numeric" },
  { key: "price", label: "Price", className: "is-numeric" },
  { key: "pe", label: "P/E", className: "is-numeric" },
  { key: "oneDay", label: "1D", className: "is-numeric" },
  { key: "oneMonth", label: "1M", className: "is-numeric" },
  { key: "oneYear", label: "1Y", className: "is-numeric" },
  { key: "revenueGrowth", label: "Rev", className: "is-numeric" },
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

function FinanceQuestionList() {
  return (
    <div className="portfolio-question-list">
      {MARKET_QUESTIONS.map((item) => (
        <article key={item.question} className={`portfolio-question-card ${toneClass(item.tone)}`}>
          <strong>{item.question}</strong>
          <div className="portfolio-question-bars" aria-label={`${item.yes}% yes and ${item.no}% no`}>
            <span style={{ width: `${item.yes}%` }} />
            <em style={{ width: `${item.no}%` }} />
          </div>
          <div className="portfolio-question-meta">
            <span>Yes {item.yes}%</span>
            <span>No {item.no}%</span>
          </div>
          <p>{item.catalyst}</p>
        </article>
      ))}
    </div>
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
      <PanelHeading eyebrow="Heatmap" title="NIFTY sample heatmap" meta="Market close" />
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
        <PanelHeading eyebrow="Market pulse" title="India market read" meta="Closed / IST" />
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

      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Market questions" title="What to confirm" />
        <FinanceQuestionList />
      </section>
    </>
  );
}

function IndianMarketsTab() {
  return (
    <WorkspaceLayout label="Indian Markets" rail={<MarketRail />}>
      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Overview" title="Indian market overview" meta="NSE / BSE" />
        <div className="portfolio-index-grid">
          {MARKET_INDEX_CARDS.map((item) => (
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

function EarningsCard({ event }: { event: EarningsEvent }) {
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
          <em>{event.status}</em>
        </div>
        <ul>
          {event.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <div className="portfolio-earnings-metrics">
          <MetricTile label="Estimate" value={event.estimate} />
          <MetricTile label="Actual" value={event.actual ?? event.dateLabel} tone={event.actual ? "positive" : "neutral"} />
          <MetricTile label="Revenue" value={formatPercent(event.revenueGrowth)} tone={event.revenueGrowth >= 0 ? "positive" : "negative"} />
          <MetricTile label="Profit" value={formatPercent(event.profitGrowth)} tone={event.profitGrowth >= 0 ? "positive" : "negative"} />
          {event.surprise !== undefined ? (
            <MetricTile label="Surprise" value={formatPercent(event.surprise)} tone={event.surprise >= 0 ? "positive" : "negative"} />
          ) : null}
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
}: {
  earningsFilter: EarningsFilter;
  onEarningsFilterChange: (filter: EarningsFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const filteredEvents = EARNINGS_EVENTS.filter((event) => {
    if (earningsFilter === "This Week") return event.dateGroup === "Today" || event.dateGroup === "This Week";
    return event.dateGroup === earningsFilter;
  }).filter(
    (event) =>
      !query ||
      includesSearch(event.company, query) ||
      includesSearch(event.ticker, query) ||
      event.notes.some((note) => includesSearch(note, query)),
  );

  const reportedEvents = EARNINGS_EVENTS.filter((event) => event.status === "Reported").length;
  const upcomingEvents = EARNINGS_EVENTS.length - reportedEvents;

  const earningsRail = (
    <>
      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Result watch" title="Key signals" />
        <div className="portfolio-insight-list">
          <article className="portfolio-insight-card is-positive">
            <strong>Margin surprise</strong>
            <p>Tata Motors and Infosys reported positive surprise versus expectations.</p>
          </article>
          <article className="portfolio-insight-card is-neutral">
            <strong>Coming up</strong>
            <p>Reliance and TCS are the highest-impact portfolio earnings events this week.</p>
          </article>
        </div>
      </section>
      <section className="portfolio-workspace-panel">
        <PanelHeading eyebrow="Earnings tape" title="Calendar density" />
        <div className="portfolio-breadth-grid">
          <MetricTile label="Upcoming" value={upcomingEvents.toString()} />
          <MetricTile label="Reported" value={reportedEvents.toString()} tone="positive" />
        </div>
        <div className="portfolio-calendar-mini-list">
          {EARNINGS_DAYS.map((day) => (
            <span key={day.date} className={day.active ? "is-active" : ""}>
              <strong>{day.date}</strong>
              {day.calls} calls
            </span>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <WorkspaceLayout label="Earnings" rail={earningsRail}>
      <section className="portfolio-workspace-panel portfolio-earnings-command-panel">
        <PanelHeading eyebrow="Calendar" title="Earnings calendar" meta="Indian companies" />
        <div className="portfolio-earnings-day-strip">
          {EARNINGS_DAYS.map((day) => (
            <button key={day.date} type="button" className={day.active ? "is-active" : ""}>
              <span>{day.day}</span>
              <strong>{day.date}</strong>
              <em>{day.calls} calls</em>
            </button>
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
        <PanelHeading eyebrow="Companies" title="Important results" meta={`${filteredEvents.length} shown`} />
        <div className="portfolio-earnings-list portfolio-earnings-feed">
          {filteredEvents.map((event) => (
            <EarningsCard key={event.id} event={event} />
          ))}
        </div>
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
}) {
  const sectors = useMemo(() => ["All", ...Array.from(new Set(SCREENER_ROWS.map((row) => row.sector)))], []);
  const filteredRows = useMemo(() => {
    const rows = SCREENER_ROWS.filter((row) => {
      const hasQuery = Boolean(query.trim());
      const matchesQuery =
        !query ||
        includesSearch(row.name, query) ||
        includesSearch(row.ticker, query) ||
        includesSearch(row.sector, query);
      const matchesSector = sector === "All" || row.sector === sector;
      const matchesPreset =
        hasQuery ||
        preset === "All" ||
        (preset === "Quality" && row.roe >= 16 && row.debtEquity <= 0.8) ||
        (preset === "Low debt" && row.debtEquity <= 0.4) ||
        (preset === "Momentum" && row.oneMonth >= 3 && row.oneYear >= 20) ||
        (preset === "Dividend" && row.dividendYield >= 1);

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
    if (row.dividendYield >= 1) return "Yield";
    return "Watch";
  };

  return (
    <WorkspaceLayout
      label="Screener"
      rail={
        <>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Saved screens" title="Quick screens" />
            <div className="portfolio-preset-stack">
              {SCREENER_PRESETS.filter((item) => item !== "All").map((item) => (
                <button key={item} type="button" className={item === preset ? "is-active" : ""} onClick={() => onPresetChange(item)}>
                  {item}
                </button>
              ))}
            </div>
          </section>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Screener read" title="Current filter" />
            <p className="portfolio-rail-copy">
              Showing {filteredRows.length} Indian-market names. Filters are frontend sample controls and do not call the backend.
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
            <button key={item} type="button" className={item === preset ? "is-active" : ""} onClick={() => onPresetChange(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-table-panel">
        <table className="portfolio-workspace-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Sector</th>
              {SCREENER_COLUMNS.map((column) => (
                <th key={column.key} className={column.className}>
                  <button type="button" onClick={() => onSortChange(column.key)} aria-label={`Sort screener by ${column.label}`}>
                    {column.label}
                    {sortKey === column.key ? <span>{sortDirection === "asc" ? "Asc" : "Desc"}</span> : null}
                  </button>
                </th>
              ))}
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.ticker}>
                <td>
                  <strong>{row.name}</strong>
                  <span>
                    {row.ticker} / {row.exchange}
                  </span>
                </td>
                <td>{row.sector}</td>
                <td className="is-numeric">{formatCompactCrores(row.marketCapCr)}</td>
                <td className="is-numeric">{formatPortfolioTapePrice(row.price)}</td>
                <td className="is-numeric">{row.pe.toFixed(1)}</td>
                <td className={`is-numeric ${toneClass(row.oneDay)}`}>{formatPercent(row.oneDay)}</td>
                <td className={`is-numeric ${toneClass(row.oneMonth)}`}>{formatPercent(row.oneMonth)}</td>
                <td className={`is-numeric ${toneClass(row.oneYear)}`}>{formatPercent(row.oneYear)}</td>
                <td className={`is-numeric ${toneClass(row.revenueGrowth)}`}>{formatPercent(row.revenueGrowth)}</td>
                <td className={`is-numeric ${toneClass(row.profitGrowth)}`}>{formatPercent(row.profitGrowth)}</td>
                <td className="is-numeric">{formatPercent(row.roe)}</td>
                <td className="is-numeric">{row.debtEquity.toFixed(2)}</td>
                <td>
                  <em className="portfolio-table-signal">{signalForRow(row)}</em>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="portfolio-empty-row">
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
  onToggleTracked,
  onToggleAlert,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  trackedTickers: Set<string>;
  alertTickers: Set<string>;
  onToggleTracked: (ticker: string) => void;
  onToggleAlert: (ticker: string) => void;
}) {
  const visibleItems = WATCHLIST_ITEMS.filter((item) => {
    const matchesQuery =
      !query ||
      includesSearch(item.name, query) ||
      includesSearch(item.ticker, query) ||
      includesSearch(item.sector, query);
    return matchesQuery && (query || trackedTickers.has(item.ticker));
  });
  const trackedItems = WATCHLIST_ITEMS.filter((item) => trackedTickers.has(item.ticker));
  const topMover = [...trackedItems].sort((a, b) => b.oneDay - a.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const laggard = [...trackedItems].sort((a, b) => a.oneDay - b.oneDay)[0] ?? WATCHLIST_ITEMS[0];
  const activeAlerts = WATCHLIST_ITEMS.filter((item) => alertTickers.has(item.ticker));

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
            </div>
          </section>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Alerts" title="Active alerts" />
            <div className="portfolio-alert-list">
              {activeAlerts.map((item) => (
                <article key={item.ticker}>
                  <strong>{item.ticker}</strong>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="portfolio-workspace-panel">
            <PanelHeading eyebrow="Watchlist news" title="Why it moved" />
            <div className="portfolio-watchlist-news">
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
        </>
      }
    >
      <section className="portfolio-workspace-panel portfolio-read-panel portfolio-watchlist-read-panel">
        <PanelHeading eyebrow="My Watchlist" title="Indian markets stayed broad, but leadership is concentrated" meta="Updated 9m ago" />
        <p>
          <TickerMovePill ticker={topMover.ticker} move={topMover.oneDay} /> is the strongest tracked name today, while{" "}
          <TickerMovePill ticker={laggard.ticker} move={laggard.oneDay} /> is the cleanest weak spot. The list is currently most sensitive to
          banks, crude, IT guidance, and high-momentum consumer internet names.
        </p>
      </section>

      <section className="portfolio-workspace-panel portfolio-watchlist-command-panel">
        <PanelHeading eyebrow="Watchlist" title="Tracked Indian assets" meta={`${trackedTickers.size} tracked`} />
        <div className="portfolio-filter-bar">
          <label className="portfolio-search-control">
            <Search aria-hidden="true" />
            <span className="portfolio-screen-reader-only">Search watchlist</span>
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search and star an asset..." />
          </label>
        </div>
      </section>

      <section className="portfolio-workspace-panel portfolio-table-panel">
        <table className="portfolio-workspace-table portfolio-watchlist-return-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>1D</th>
              <th>5D</th>
              <th>1M</th>
              <th>6M</th>
              <th>YTD</th>
              <th>Actions</th>
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
                      <span>
                        {item.ticker} / {item.exchange} / {item.sector}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="is-numeric">{formatPortfolioTapePrice(item.price)}</td>
                <td className={`is-numeric ${toneClass(item.oneDay)}`}>{formatPercent(item.oneDay)}</td>
                <td className={`is-numeric ${toneClass(item.fiveDay)}`}>{formatPercent(item.fiveDay)}</td>
                <td className={`is-numeric ${toneClass(item.oneMonth)}`}>{formatPercent(item.oneMonth)}</td>
                <td className={`is-numeric ${toneClass(item.sixMonth)}`}>{formatPercent(item.sixMonth)}</td>
                <td className={`is-numeric ${toneClass(item.ytd)}`}>{formatPercent(item.ytd)}</td>
                <td>
                  <div className="portfolio-table-actions">
                    <button
                      type="button"
                      className={`portfolio-icon-action ${isTracked ? "is-active" : ""}`}
                      aria-label={`${isTracked ? "Remove" : "Add"} ${item.name} ${isTracked ? "from" : "to"} watchlist`}
                      onClick={() => onToggleTracked(item.ticker)}
                    >
                      <Star aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`portfolio-icon-action ${hasAlert ? "is-active" : ""}`}
                      aria-label={`${hasAlert ? "Disable" : "Enable"} alert for ${item.name}`}
                      onClick={() => onToggleAlert(item.ticker)}
                    >
                      <Bell aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {visibleItems.length === 0 ? (
            <tr>
              <td colSpan={8} className="portfolio-empty-row">
                No watchlist matches. Search another Indian asset or clear the filter.
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
  const largestHolding = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.allocation - a.allocation)[0];
  const financialAllocation = PORTFOLIO_HOLDINGS.filter((holding) => holding.sector === "Financials").reduce(
    (sum, holding) => sum + holding.allocation,
    0,
  );

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
      <MetricTile label="Largest name" value={`${largestHolding.ticker} ${largestHolding.allocation.toFixed(1)}%`} />
      <MetricTile label="Financials sleeve" value={`${financialAllocation.toFixed(1)}%`} tone={financialAllocation > 30 ? "negative" : "neutral"} />
    </section>
  );
}

function PortfolioReadPanel() {
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

            return (
              <article key={play.id} className={`portfolio-action-card priority-${play.priority.toLowerCase()}`}>
                <div>
                  <span>{play.riskLabel}</span>
                  <em>{play.context}</em>
                </div>
                <strong>{play.headline}</strong>
                <p>{play.analysis}</p>
                {isExpanded ? (
                  <ul>
                    {play.logic.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="portfolio-action-card-buttons">
                  <button type="button" disabled={!hasPrimaryAction} onClick={hasPrimaryAction ? onFunds : undefined}>
                    {play.primaryAction}
                    {hasPrimaryAction ? <ArrowUpRight aria-hidden="true" /> : null}
                  </button>
                  <button type="button" onClick={() => onExpandedPlayChange(isExpanded ? null : play.id)}>
                    {isExpanded ? "Hide logic" : play.secondaryAction}
                  </button>
                </div>
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
                  <th>Asset</th>
                  <th>Value</th>
                  <th>1D</th>
                  <th>Alloc.</th>
                  <th>Sector</th>
                  <th>Risk</th>
                  <th>Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_HOLDINGS.map((holding) => (
                  <tr key={holding.ticker} className={`portfolio-holding-row risk-${holding.risk.toLowerCase()}`}>
                    <td>
                      <strong>{holding.ticker}</strong>
                      <span>
                        {holding.name}
                        {holding.exchange ? ` / ${holding.exchange}` : ""}
                      </span>
                    </td>
                    <td>{formatPortfolioCurrency(holding.value)}</td>
                    <td className={holding.dayMove >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioMove(holding.dayMove)}</td>
                    <td>{holding.allocation.toFixed(1)}%</td>
                    <td>{holding.sector}</td>
                    <td>
                      <em className={`portfolio-risk-pill risk-${holding.risk.toLowerCase()}`}>{holding.risk}</em>
                    </td>
                    <td className="portfolio-impact-cell">{holding.impact}</td>
                  </tr>
                ))}
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

export function PortfolioScreen({ onHome, onFunds, onPortfolio }: PortfolioScreenProps) {
  const portfolioAppRef = useRef<HTMLElement | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>("portfolio");
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState("Synced 2m ago");
  const [isPortfolioSyncing, setIsPortfolioSyncing] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [earningsFilter, setEarningsFilter] = useState<EarningsFilter>("This Week");
  const [earningsQuery, setEarningsQuery] = useState("");
  const [screenerQuery, setScreenerQuery] = useState("");
  const [screenerSector, setScreenerSector] = useState("All");
  const [screenerPreset, setScreenerPreset] = useState<ScreenerPreset>("Quality");
  const [screenerSort, setScreenerSort] = useState<{ key: keyof ScreenerRow; direction: SortDirection }>({
    key: "oneYear",
    direction: "desc",
  });
  const [watchlistQuery, setWatchlistQuery] = useState("");
  const [trackedTickers, setTrackedTickers] = useState(() => new Set(WATCHLIST_ITEMS.slice(0, 4).map((item) => item.ticker)));
  const [alertTickers, setAlertTickers] = useState(() => new Set(WATCHLIST_ITEMS.filter((item) => item.alert).map((item) => item.ticker)));

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
    setPortfolioSyncStatus("Syncing...");
    syncTimerRef.current = window.setTimeout(() => {
      setIsPortfolioSyncing(false);
      setPortfolioSyncStatus("Synced just now");
    }, 720);
  };

  const handleWorkspaceSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceSearchQuery.trim();
    if (!query) return;

    setScreenerQuery(query);
    setWatchlistQuery(query);
    setActiveWorkspaceTab("screener");
  };

  const handleScreenerSort = (key: keyof ScreenerRow) => {
    setScreenerSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const toggleTrackedTicker = (ticker: string) => {
    setTrackedTickers((current) => {
      const next = new Set(current);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const toggleAlertTicker = (ticker: string) => {
    setAlertTickers((current) => {
      const next = new Set(current);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const canOpenFundsForPlay = (play: (typeof PORTFOLIO_SUGGESTED_PLAYS)[number]) =>
    /fund|etf/i.test(`${play.primaryAction} ${play.context} ${play.command}`);

  return (
    <main ref={portfolioAppRef} className="app-shell portfolio-app">
      <GlobalBrandNav activeView="portfolio" onHome={onHome} onFunds={onFunds} onPortfolio={onPortfolio} />
      <MarketTape basket={PORTFOLIO_MARKET_TAPE} includeGlobalItems={false} statusLabel="Live Prices" />

      <section className="portfolio-screen portfolio-workspace-screen" aria-label="Synced portfolio screen">
        <div className="portfolio-background-grid" aria-hidden="true" />

        <header className="portfolio-finance-header">
          <div className="portfolio-finance-header-title">
            <span className="portfolio-section-kicker">Sovereign Lens Finance</span>
            <h1>Portfolio</h1>
            <p>Indian portfolio, markets, earnings, screening, and watchlist intelligence.</p>
          </div>
          <form className="portfolio-finance-search" role="search" aria-label="Search portfolio workspace" onSubmit={handleWorkspaceSearch}>
            <Search aria-hidden="true" />
            <input
              value={workspaceSearchQuery}
              onChange={(event) => setWorkspaceSearchQuery(event.target.value)}
              placeholder="Search Indian stocks, sectors, funds..."
            />
            <button type="submit">Search</button>
          </form>
          <div className="portfolio-sync-cluster portfolio-finance-sync" aria-label="Portfolio sync controls">
            <button
              type="button"
              className={`portfolio-sync-button${isPortfolioSyncing ? " is-syncing" : ""}`}
              aria-label="Sync portfolio"
              aria-busy={isPortfolioSyncing}
              title="Sync portfolio"
              onClick={handlePortfolioSync}
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

        <nav className="portfolio-workspace-tabs" aria-label="Portfolio finance sections" role="tablist">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`portfolio-tab-${tab.id}`}
              role="tab"
              aria-selected={activeWorkspaceTab === tab.id}
              aria-controls={`portfolio-panel-${tab.id}`}
              className={activeWorkspaceTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveWorkspaceTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </button>
          ))}
        </nav>

        <div id={`portfolio-panel-${activeWorkspaceTab}`} role="tabpanel" aria-labelledby={`portfolio-tab-${activeWorkspaceTab}`}>
          {activeWorkspaceTab === "portfolio" ? (
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
            />
          ) : null}
          {activeWorkspaceTab === "markets" ? <IndianMarketsTab /> : null}
          {activeWorkspaceTab === "earnings" ? (
            <EarningsTab
              earningsFilter={earningsFilter}
              onEarningsFilterChange={setEarningsFilter}
              query={earningsQuery}
              onQueryChange={setEarningsQuery}
            />
          ) : null}
          {activeWorkspaceTab === "screener" ? (
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
            />
          ) : null}
          {activeWorkspaceTab === "watchlist" ? (
            <WatchlistTab
              query={watchlistQuery}
              onQueryChange={setWatchlistQuery}
              trackedTickers={trackedTickers}
              alertTickers={alertTickers}
              onToggleTracked={toggleTrackedTicker}
              onToggleAlert={toggleAlertTicker}
            />
          ) : null}
        </div>

        <button type="button" className="portfolio-scroll-cue" aria-label="Scroll portfolio screen down" onClick={scrollPortfolioDown}>
          <span />
        </button>
      </section>
    </main>
  );
}
