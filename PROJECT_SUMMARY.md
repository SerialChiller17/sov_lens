# Sovereign Lens Project Summary

Last consolidated: May 10, 2026

## Executive Summary

Sovereign Lens is a desktop/tablet-first finance terminal and market intelligence dashboard. The MVP combines geopolitical event monitoring, Indian market workspaces, portfolio exposure, watchlists, earnings, screeners, mutual fund comparison, and deterministic backend intelligence data.

The product is intentionally dense and workstation-oriented. It should feel like a finance terminal and analyst cockpit, not a mobile-first consumer news app or marketing landing page.

The current first screen is the Global Intelligence Monitor: a dark terminal shell with a live-style market tape, interactive `cobe` globe, event hotspots, selected-event preview, and a deterministic `sovereign AI` panel. Navigation also opens Indian markets, earnings, screener, funds, watchlist, portfolio, and global events/article views.

Screens below `768px` are intentionally unsupported through `DesktopOnlyGate`. Do not weaken this gate unless a real mobile version is explicitly requested.

## Current Product Surfaces

### `/` - Global Intelligence Monitor

Implemented in:

- `frontend/src/app/App.tsx`
- `frontend/src/globe-monitor/GlobeMonitor.tsx`
- `frontend/src/globe-monitor/mockEvents.ts`
- `frontend/src/globe-monitor/mockDetails.ts`
- `frontend/src/features/market-tape/MarketTape.tsx`

The default route contains:

- Global brand navigation.
- `Live Markets` tape from `GLOBAL_MARKET_TAPE`.
- Interactive dotted globe rendered with `cobe`.
- 15 frontend-local geopolitical and market hotspots.
- Category filter for Conflict Zones, Diplomacy, Economics, Energy, Trade, and Regulation.
- Multi-select event state with active selected-event preview.
- `sovereign AI` analysis panel with affected sectors/stocks, suggested plays, and related news.
- `InsightCompanion` pointer-following microinteraction in the AI header.

Default selected event:

- Red Sea Shipping Risk

### `/markets` - Indian Markets

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`
- `frontend/src/data/mockMarketData.ts`

This workspace contains:

- Indian benchmark cards for NIFTY 50, SENSEX, BANK NIFTY, MIDCAP 150, SMALLCAP 250, and NIFTY IT.
- Market breadth, FII/DII flow, 52-week highs/lows, and sector performance.
- NIFTY 50 heatmap grouped by sector, sized by market cap, and colored by one-day move.
- Gainers, losers, and active market movers.
- Market developments, market questions, and standout stocks.
- Workspace search that routes into the screener.

Data is demo-only NIFTY 50 data and is not live.

### `/earnings` - Earnings

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`

This workspace contains:

- Earnings date strip.
- Today, This Week, Next Week, and Recent filters.
- Upcoming and reported Indian company results.
- Event context for Reliance, TCS, HDFC Bank, Infosys, and Tata Motors.
- Links into screener and watchlist context.
- High-impact earnings rail.

The route supports `?q=` query initialization.

### `/screener` - Indian Equity Screener

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`
- `frontend/src/data/mockMarketData.ts`

This workspace contains:

- Search and preset filters.
- Sortable table over the demo NIFTY 50 universe.
- Presets for quality compounders, value opportunities, momentum leaders, low debt, high ROE, large-cap safety, earnings momentum, and dividend.
- Quick-read context for selected tickers.
- Add-to-watchlist behavior saved in browser `localStorage`.
- Links to related earnings context.

The route supports `?q=` query initialization.

### `/funds` - Mutual Funds

Implemented in:

- `frontend/src/funds/FundsScreen.tsx`
- `frontend/src/funds/FundSelector.tsx`
- `frontend/src/funds/mockFunds.ts`
- `frontend/src/funds/tabs/PerformanceTab.tsx`
- `frontend/src/funds/types.ts`
- `frontend/src/funds/fundUtils.ts`

This workspace contains:

- Mutual fund comparison shell.
- Benchmark tape for NIFTY 50 TRI, NIFTY 500 TRI, MIDCAP, SMALLCAP, S&P 500 in INR, debt index, and gold.
- Compare up to 4 selected funds.
- Fund picker with category filters and selected-fund chips.
- Performance tab with generated 120-month NAV histories, rolling-return charting, investment amount controls, time ranges, and stats.
- Allocation, Risk, and Overlap tabs as preview states until richer holdings/risk data exists.

The demo fund universe currently includes large-cap, flexi-cap, mid-cap, small-cap, ELSS, sector ETF, foreign ETF, gold, debt, and hybrid examples.

### `/watchlist` - Watchlist

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`

This workspace contains:

- Browser-saved tracked tickers and local alert toggles.
- Watched, Alerts, and All filters.
- Watchlist cards with price/move context and small trend visuals.
- Related watchlist news and movement history.
- Links into screener and earnings views.

Persistence is local browser `localStorage` only:

- `sov-finance-watchlist-tracked`
- `sov-finance-watchlist-alerts`

### `/portfolio` - Portfolio

Implemented in:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioData.ts`
- `frontend/src/features/portfolio/PortfolioPerformanceChart.tsx`
- `frontend/src/features/portfolio/PortfolioCompositionDonut.tsx`
- `frontend/src/features/portfolio/portfolioFormatters.ts`

The portfolio workspace contains:

- Local sample holdings for 7 Indian stocks.
- Current value, one-day return, total return, and local refresh state.
- Portfolio read panel and holdings impact table.
- 6-month performance chart versus NIFTY 50.
- Allocation donut.
- Portfolio AI rail with evidence, assumptions, news affecting portfolio, and suggested plays.
- Suggested action logic such as reducing bank concentration, tracking Tata Motors/JLR margin confirmation, and comparing broad funds.
- Search that routes into `/screener?q=...`.
- Fund comparison handoff for fund-buffer suggestions.

This is demo data only. There is no brokerage sync, authentication, server persistence, or trading execution.

### `/news-pulse` - Global Events Dashboard

Implemented in:

- `frontend/src/features/events/EventsDashboard.tsx`
- `frontend/src/features/events/eventsData.ts`
- `frontend/src/features/events/eventsUtils.ts`

The dashboard contains:

- Upcoming global events.
- Static global map stage using `frontend/src/assets/globe-premium-dark.svg`.
- Featured event callout.
- Global event archive table.
- Live rows derived from backend `globalPulse.alerts`.
- Search and sort controls that are currently mostly visual.

### `/news-pulse/:newsId` - News Article View

Implemented in:

- `frontend/src/features/events/NewsArticleView.tsx`
- `frontend/src/features/events/eventsData.ts`

Article routes render frontend-local geotagged news items with:

- Headline, region, severity, time, and source.
- Summary, deterministic AI insight, and market read.
- Source/geotag/conflict facts.
- Connected sector buttons.

## Product Direction

Sovereign Lens should feel like:

- A finance terminal.
- A geopolitical intelligence workstation.
- A market-aware research dashboard.
- Dense, calm, premium, analytical, and decision-supportive.

It should not feel like:

- A marketing landing page.
- A consumer news feed.
- A phone-first app.
- A decorative globe demo without workflow depth.

The core workflow should become:

```text
Global event -> AI explanation -> affected sectors/stocks -> portfolio exposure -> source-backed detail -> watchlist/action
```

## Desktop/Tablet Policy

The app is desktop/tablet-first only.

Existing mobile gate files:

- `frontend/src/App.tsx`
- `frontend/src/app/DesktopOnlyGate.tsx`
- `frontend/src/app/desktop-only-gate.css`

Expected behavior:

- Below `768px`: show the mobile unsupported screen only.
- At `768px` and above: render the normal finance terminal.

Do not optimize the main terminal for phones. Tablet, small-laptop, desktop resize, side-panel, chart, and dense-table work above `768px` is valid.

## Repository Structure

Top-level structure:

- `README.md` - local setup, run commands, and test commands.
- `AGENTS.md` - permanent Codex/product instructions, including the no-mobile policy.
- `PROJECT_SUMMARY.md` - canonical project/product/architecture summary.
- `package.json` - root scripts for backend/frontend dev and tests.
- `backend/` - FastAPI deterministic API.
- `frontend/` - React/Vite terminal UI.
- `scripts/npm_registry_proxy.py` - local npm registry proxy helper for Windows install issues.

## Frontend Architecture

Location:

- `frontend/`

Stack:

- React 19
- TypeScript
- Vite 6
- `cobe`
- `lucide-react`
- Tailwind CSS plus plain CSS
- Vitest
- Testing Library
- Playwright dependency installed for browser/visual checks

Important files and directories:

- `frontend/src/main.tsx` - React entrypoint and CSS imports.
- `frontend/src/App.tsx` - root wrapper around `DesktopOnlyGate` and routed app.
- `frontend/src/app/App.tsx` - manual route shell, navigation handlers, bootstrap API loading, and top-level view switching.
- `frontend/src/app/routes.ts` - route constants and route-to-view mapping.
- `frontend/src/app/GlobalBrandNav.tsx` - primary desktop/tablet navigation.
- `frontend/src/app/DesktopOnlyGate.tsx` - viewport gate for unsupported phone widths.
- `frontend/src/globe-monitor/` - current default global monitor, hotspot data, details, types, and CSS.
- `frontend/src/features/market-tape/` - shared tape component and global market-tape data.
- `frontend/src/features/events/` - events dashboard, article route, local news/event data, types, and CSS.
- `frontend/src/features/portfolio/` - portfolio workspace plus Indian markets, earnings, screener, and watchlist screens.
- `frontend/src/funds/` - standalone mutual fund comparison flow.
- `frontend/src/data/mockMarketData.ts` - demo NIFTY 50 market universe used by markets, screener, watchlist, and heatmap.
- `frontend/src/styles/` - global CSS entrypoint and staged legacy/style layers.
- `frontend/src/components/ui/liquid-metal-button.tsx` - reusable UI button component.
- `frontend/src/InsightCompanion.tsx` - small interactive AI-companion visual used by the monitor.
- `frontend/src/ARCHITECTURE.md` - frontend migration map and CSS import guidance.
- `frontend/src/App.test.tsx` - frontend regression tests.

Current routing is manual with `window.history` and `popstate`, not React Router. This is workable for the MVP but should be revisited as route count and deep-link behavior grow.

## Backend Architecture

Location:

- `backend/`

Stack:

- FastAPI
- Pydantic
- Uvicorn
- Pytest

Important files:

- `backend/app/main.py` - FastAPI app, CORS, and endpoint definitions.
- `backend/app/models.py` - Pydantic schemas for countries, global pulse, market movements, sectors, arcs, chokepoints, and related models.
- `backend/app/data.py` - deterministic in-memory country, pulse, market, sector, and chokepoint data.
- `backend/tests/test_api.py` - API tests.

Endpoints:

- `GET /api/health`
- `GET /api/countries`
- `GET /api/countries/{iso3}`
- `GET /api/global-pulse`
- `GET /api/market-pulse`
- `GET /api/sectors`
- `GET /api/sectors/{sector_id}`

The backend is deterministic and in-memory. The frontend currently uses it only for bootstrap data needed by the lens/news flows: countries, global pulse, market pulse, and sectors. Most finance workspace data still lives in frontend constants.

## Data Inventory

### Backend Data

The backend currently serves:

- 12 countries: USA, IND, CHN, TWN, JPN, KOR, NLD, DEU, SAU, ARE, RUS, BRA.
- 3 global pulse alerts.
- 3 daily global pulse briefs.
- 3 market pulse movements.
- 3 sectors: Semiconductors, Hydrocarbons, Critical Minerals & EV Batteries.
- 3 chokepoints: Strait of Malacca, Strait of Hormuz, Suez Canal.

Country records include economics, coordinates, tension score, tension breakdown, group memberships, industry criticality, trade partners, market index data, FX pulse, and contrarian insight.

Sector records include market value, systemic multiplier, sensitivity, power nodes, consumption nodes, arcs, chokepoints, brief, alpha note, and equity proxy.

### Frontend-Local Data

The frontend currently owns:

- Globe monitor events in `frontend/src/globe-monitor/mockEvents.ts`.
- Globe monitor event details in `frontend/src/globe-monitor/mockDetails.ts`.
- Global event/news article data in `frontend/src/features/events/eventsData.ts`.
- Demo NIFTY 50 universe in `frontend/src/data/mockMarketData.ts`.
- Markets, earnings, screener, and watchlist workspace data in `frontend/src/features/portfolio/portfolioWorkspaceData.ts`.
- Portfolio holdings, AI/news context, performance points, allocation colors, and suggested plays in `frontend/src/features/portfolio/portfolioData.ts`.
- Mutual fund universe and generated NAV history in `frontend/src/funds/mockFunds.ts`.
- Market tape data in `frontend/src/features/market-tape/marketTapeData.ts`.

Moving these datasets behind backend APIs is one of the most important consolidation steps.

## Test Coverage

Frontend tests in `frontend/src/App.test.tsx` currently cover:

- Desktop-only gate behavior below `768px`.
- Product rendering at the tablet breakpoint.
- Default global monitor rendering.
- Globe card toggling.
- Monitor category filtering.
- Navigation into portfolio, markets, earnings, screener, watchlist, events dashboard, and article routes.
- Direct route initialization for standalone finance sections and article routes.
- Portfolio search handoff into screener.
- Article sector controls.

Backend tests in `backend/tests/test_api.py` currently cover:

- Health endpoint.
- Country list, country detail, and 404 handling.
- Global pulse payload.
- Market pulse payload.
- Sector list, sector detail, arcs/chokepoints, and 404 handling.

## Current Limitations

Product limitations:

- All market, event, portfolio, and fund data is static, deterministic, generated, or frontend-local.
- No live market data.
- No live news feed.
- No real AI/LLM-backed summarization.
- No source verification workflow.
- No real portfolio sync.
- No authentication, account system, server persistence, or trading execution.
- Watchlist state persists only in browser `localStorage`.

UX limitations:

- Event details do not yet open a full source-backed drawer.
- News dashboard search and sort controls are mostly visual.
- Article routes exist but are not deeply connected to the default globe workflow.
- Main AI panels are deterministic and cannot answer follow-up questions.
- Portfolio exposure is not yet mapped directly from live/global events.
- Funds Allocation, Risk, and Overlap tabs are preview states.
- Login is present as a disabled top-nav action.

Engineering limitations:

- `frontend/src/app/App.tsx` still owns manual routing and high-level navigation state.
- `frontend/src/features/portfolio/PortfolioScreen.tsx` is large and owns multiple product surfaces: portfolio, markets, earnings, screener, watchlist, heatmap layout, and localStorage behavior.
- Several important datasets are frontend constants instead of API-backed resources.
- CSS still contains staged legacy layers from multiple design passes.
- `frontend/src/funds/FundsScreen.tsx` uses many inline style objects and should eventually be normalized into feature CSS/components.
- A real router should be considered before route complexity grows further.

## Source And Data Strategy

The product should use curated, market-aware feeds rather than raw event scraping as its first data layer.

High-priority source directions:

| Source | Best Use |
| --- | --- |
| RavenPack | Market-aware news analytics, sentiment, relevance, novelty, and entity/event scoring. |
| Marketaux | API-first financial news bus with tickers, categories, and sentiment. |
| Intel Desk Live | Trader-grade geopolitical squawk feed for global risk events. |
| S&P Global Commodity Insights | Commodity, energy, shipping, metals, and sector research context. |
| Argus Media | Energy, shipping, freight, war-risk, and commodity price reporting. |
| Reuters/Bloomberg licensed feeds | Core institutional market-news backbone. |
| gCaptain / Maritime Executive | Shipping, maritime insurance, chokepoints, and logistics risk. |
| SemiAnalysis / DIGITIMES Asia | Semiconductor supply chain, AI infrastructure, Taiwan/Korea/US/EU exposure. |
| Benchmark Mineral Intelligence | Lithium, nickel, cobalt, graphite, batteries, gigafactory capacity, and EV materials. |

The product moat should be the normalization and interpretation layer:

```text
source item -> event schema -> severity/confidence -> sector mapping -> asset mapping -> portfolio exposure -> analyst-readable explanation
```

Potential event schema:

```text
Event
- id
- title
- summary
- region
- country_codes
- coordinates
- category
- severity
- confidence
- updated_at
- sources
- affected_sectors
- affected_assets
- routes
- chokepoints
- watchlist_signals
- timeline
- analyst_note
```

Potential source schema:

```text
Source
- id
- name
- url
- publisher_type
- published_at
- retrieved_at
- confidence_weight
- excerpt
- tags
```

Potential portfolio exposure schema:

```text
PortfolioExposure
- holding_id
- ticker
- event_id
- exposure_level
- exposure_reason
- affected_channel
- suggested_action
- confidence
```

## Recommended Roadmap

### Phase 1 - Consolidate Current MVP

- Extract markets, earnings, screener, and watchlist into smaller files under `frontend/src/features/portfolio/` or a clearer finance-workspace boundary.
- Add a source-backed event detail drawer from the Global Intelligence Monitor.
- Connect selected globe events to portfolio exposure callouts.
- Move monitor events and event details into backend endpoints.
- Move NIFTY 50 demo market data behind backend endpoints.
- Replace visual-only event search/sort with real behavior.
- Keep the desktop/tablet gate intact.

Suggested endpoints:

```text
GET /api/events
GET /api/events/{event_id}
GET /api/news
GET /api/news/{news_id}
GET /api/markets/india/demo
GET /api/portfolio/demo
GET /api/funds/demo
```

### Phase 2 - Make The Intelligence Workflow Real

- Add source drawer and confidence logic.
- Add event timeline and "what changed" windows.
- Add event-to-market transmission paths.
- Add real event/news search and filters.
- Reuse backend country and sector data as drawers or secondary tabs.
- Add a single normalized event schema shared by globe, news, portfolio, and watchlist surfaces.

### Phase 3 - Make It User-Specific

- Add portfolio CSV upload.
- Map holdings to sectors, countries, routes, chokepoints, and event risk.
- Add watchlists, saved views, alert preferences, and account-level persistence.
- Upgrade watchlist localStorage behavior into backend-backed saved state.

### Phase 4 - Add Live Data

- Integrate one market-aware news API.
- Add one market data provider.
- Add ingestion jobs and normalized event/source schema.
- Add freshness, stale-data, source-count, and confidence indicators.
- Add real AI/LLM summarization only after source provenance is visible.

## Development

Run commands, test commands, and local URLs are kept in `README.md` to avoid duplicating setup instructions here.

## Documentation Structure

This repo uses:

- `README.md` - quick local setup and command entrypoint.
- `PROJECT_SUMMARY.md` - canonical project/product/architecture summary.
- `AGENTS.md` - permanent Codex instructions, including the no-mobile policy.
- `frontend/src/ARCHITECTURE.md` - frontend migration notes, target boundaries, and CSS import order.

Older planning docs were consolidated into this summary to reduce stale and repeated content.
