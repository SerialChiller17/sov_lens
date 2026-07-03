# Sovereign Lens Project Summary

Last consolidated: June 17, 2026

## Executive Summary

Sovereign Lens is a desktop/tablet-first finance terminal and market intelligence dashboard. The MVP combines geopolitical event monitoring, Indian market workspaces, portfolio exposure, watchlists, earnings, screeners, mutual fund comparison, source/evidence patterns, a frontend AI synthesis route, and deterministic backend intelligence data.

The product is intentionally dense and workstation-oriented. It should feel like a finance terminal and analyst cockpit, not a mobile-first consumer news app or marketing landing page.

The current first screen is the Global Intelligence Monitor: a dark terminal shell with a live-style market tape, interactive `cobe` globe, event hotspots, selected-event preview, and a deterministic `sovereign AI` panel. Navigation also opens Indian markets, earnings, screener, funds, watchlist, portfolio, global events/article views, and a local `/answer` synthesis view for market-question handoffs.

The product direction has shifted from "globe showcase plus finance pages" toward "portfolio and market workbench with a distinctive macro-risk lens." `/` remains the signature lens, while `/portfolio` is the working home base for holdings, evidence, exposure, and inspect-next decisions.

Normal product screens should be treated as the frontend of a real premium finance website. Engineering truths about deterministic data, client-side persistence, missing broker sync, and missing live feeds belong in docs, tests, code boundaries, admin/debug surfaces, or legal/compliance disclosures; they should not appear as ordinary UI chrome such as page subtitles, badges, helper text, table labels, or action feedback.

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
- `frontend/src/features/portfolio/MarketSummary.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`
- `frontend/src/data/mockMarketData.ts`

This workspace contains:

- Route-scoped finance shell, Indian market tape, and animated command/search prompts.
- Indian benchmark cards for NIFTY 50, SENSEX, BANK NIFTY, MIDCAP 150, SMALLCAP 250, and NIFTY IT.
- Configurable top metrics rail with a 6-item visible limit and picker for adding/removing indicators.
- Source-aware Market Summary accordion with a source drawer and compact freshness text.
- Market breadth, FII/DII flow, 52-week highs/lows, and sector performance.
- NIFTY 50 heatmap grouped by sector, sized by market cap, and colored by one-day move.
- Stocks-in-news right rail for compact company news and movement context.
- Gainers, losers, and active market movers exposed through a semantic slider-style control.
- Recent developments carousel with source-linked local market explanation data.
- Sector performance with gainers/losers counts and one-day move context.
- Standout stocks and lower-rail market movers.
- Workspace search that routes into the screener.
- Handoff into `/answer` from market development questions.

The current market data source is deterministic Indian market data. The route should not expose implementation-status labels as normal product chrome.

### `/earnings` - Earnings

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`

This workspace contains:

- Route-scoped finance shell and animated earnings search prompts.
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

- Search, animated prompt composer, sector filters, preset filters, and local screening feedback.
- Sortable table over the deterministic NIFTY 50 universe.
- Presets for quality compounders, value opportunities, momentum leaders, low debt, high ROE, large-cap safety, earnings momentum, and dividend.
- Quick-read context for selected tickers.
- Add-to-watchlist behavior saved in browser `localStorage`.
- Add-to-watchlist feedback when a ticker is already tracked or newly added.
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
- Animated command entry and fund picker search prompts.
- Fund picker with category filters, available-fund results, selected-fund chips, and add/remove management.
- Restored premium glass/liquid-metal treatment on the add/manage fund button.
- Performance tab with generated 120-month NAV histories, rolling-return charting, investment amount controls, time ranges, and stats.
- Allocation, Risk, and Overlap tabs as preview states until richer holdings/risk data exists.

The current fund universe includes large-cap, flexi-cap, mid-cap, small-cap, ELSS, sector ETF, foreign ETF, gold, debt, and hybrid examples.

### `/watchlist` - Watchlist

Implemented inside:

- `frontend/src/features/portfolio/PortfolioScreen.tsx`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`

This workspace contains:

- Browser-saved tracked tickers and local alert toggles.
- Watched, Alerts, and All filters.
- Route-scoped finance shell, watchlist market tape, and animated watchlist search prompts.
- Watchlist cards with price/move context and small trend visuals.
- Related watchlist news and movement history.
- Add/remove and alert-toggle feedback for tracked names.
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
- Portfolio tape and animated portfolio command/search prompts.
- Staged workspace tabs for Overview and Portfolio Analysis.
- Portfolio status strip with source count and updated label.
- Primary action module focused on what matters now, currently led by private-bank concentration.
- Today's P&L contribution module, diagnosis grid, risk radar, and market-signal rows.
- Portfolio read panel and holdings decision table.
- 6-month performance chart versus NIFTY 50.
- Allocation strip/ledger, sector exposure, contribution bars, and analysis summary.
- Evidence drawer for portfolio trust, primary action logic, risk cards, market drivers, and holding-level explanations.
- Portfolio AI/context data with evidence, assumptions, news affecting portfolio, and suggested plays.
- Suggested action logic such as reducing bank concentration, tracking Tata Motors/JLR margin confirmation, and comparing broad funds.
- Search that routes into `/screener?q=...`.
- Fund comparison handoff for fund-buffer suggestions.

The current implementation uses deterministic portfolio data and client-side state behind the UI. There is no brokerage sync, authentication, server persistence, or trading execution. Normal product copy should not expose local/demo status labels.

### `/news-pulse` - Global Events Dashboard

Implemented in:

- `frontend/src/features/events/EventsDashboard.tsx`
- `frontend/src/features/events/eventsData.ts`
- `frontend/src/features/events/eventsUtils.ts`

The dashboard contains:

- Event risk market tape.
- Animated event search prompt with local input state.
- Upcoming global events.
- Static global map stage using `frontend/src/assets/globe-premium-dark.svg`.
- Featured event callout.
- Global event archive table.
- Live rows derived from backend `globalPulse.alerts`.
- Sort controls that are currently mostly visual.
- Leaner context-bar copy with decorative explanatory text removed.

### `/news-pulse/:newsId` - News Article View

Implemented in:

- `frontend/src/features/events/NewsArticleView.tsx`
- `frontend/src/features/events/eventsData.ts`

Article routes render frontend-local geotagged news items with:

- Headline, region, severity, time, and source.
- Summary, deterministic AI insight, and market read.
- Source/geotag/conflict facts.
- Connected sector buttons.
- Route-scoped event tape and simplified context bar without decorative "Intelligence brief" copy.

### `/answer` - AI Synthesis Handoff

Implemented in:

- `frontend/src/features/answer/AiAnswerView.tsx`
- `frontend/src/features/answer/ai-answer.css`
- `frontend/src/features/portfolio/portfolioWorkspaceData.ts`
- `frontend/src/app/routes.ts`

The synthesis route contains:

- Manual route support for `/answer`.
- Query-parameter handoff for `event`, `q`, `title`, and `summary`.
- Synthesis tape from `EVENT_RISK_TAPE`.
- Submitted command panel.
- Short answer panel with source cues only when supporting source data exists.
- Local answer rendering from `MARKET_DEVELOPMENTS` when the event id matches.
- Source chips with favicon support when local sources exist.
- Fallback synthesis copy when no backend AI thread exists.
- Inspect-next actions back into market context.

This is not a live LLM-backed answer service yet. It is a frontend route and interaction contract for the future backend AI thread endpoint.

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
- A decorative globe showcase without workflow depth.

The core workflow should continue moving toward:

```text
Global event -> AI explanation -> affected sectors/stocks -> portfolio exposure -> source-backed detail -> watchlist/action
```

Current implementation partially supports this through deterministic globe analysis, market-development answer handoffs, portfolio evidence drawers, browser-local watchlist state, and source-aware market summary cards. The backend and data model still need to consolidate these into one normalized event/source/exposure system.

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
- `@paper-design/shaders` for the reusable liquid-metal button treatment.
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
- `frontend/src/components/search/AnimatedSearchPrompt.tsx` - reusable animated command prompt affordance for finance/event/fund search controls.
- `frontend/src/features/answer/` - `/answer` synthesis route, local source-aware answer rendering, and fallback AI-thread handoff state.
- `frontend/src/globe-monitor/` - current default global monitor, hotspot data, details, types, and CSS.
- `frontend/src/features/market-tape/` - shared tape component and global market-tape data.
- `frontend/src/features/events/` - events dashboard, article route, local news/event data, types, and CSS.
- `frontend/src/features/portfolio/` - portfolio workspace plus Indian markets, market summary, earnings, screener, watchlist, local evidence drawer behavior, and shared finance-workspace data.
- `frontend/src/funds/` - standalone mutual fund comparison flow.
- `frontend/src/data/mockMarketData.ts` - deterministic NIFTY 50 market universe used by markets, screener, watchlist, and heatmap.
- `frontend/src/styles/` - global CSS entrypoint and staged legacy/style layers.
- `frontend/src/components/ui/liquid-metal-button.tsx` - reusable UI button component.
- `frontend/src/InsightCompanion.tsx` - small interactive AI-companion visual used by the monitor.
- `frontend/src/ARCHITECTURE.md` - frontend migration map and CSS import guidance.
- `frontend/src/App.test.tsx` - frontend regression tests.

Current routing is manual with `window.history` and `popstate`, not React Router. The manual router now handles `/`, `/news-pulse`, `/news-pulse/:newsId`, `/answer`, `/markets`, `/earnings`, `/funds`, `/screener`, `/watchlist`, and `/portfolio`. This is workable for the MVP but should be revisited as route count, query-state handling, and deep-link behavior grow.

CSS import order is controlled from `frontend/src/styles/index.css`. The current non-globe finish is intentionally route-scoped around `.portfolio-app`, `.events-dashboard-shell`, `.news-article-shell`, and `.ai-answer-shell` so broad finance-route polish does not leak into the protected globe monitor.

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

CORS currently allows Vite/dev-preview origins on `localhost` and `127.0.0.1` for ports `5173`, `5177`, and `4173`.

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
- Deterministic NIFTY 50 universe in `frontend/src/data/mockMarketData.ts`.
- Markets, market summary, source lists, stocks-in-news items, earnings, screener, and watchlist workspace data in `frontend/src/features/portfolio/portfolioWorkspaceData.ts`.
- Local answer content for `/answer`, currently from `MARKET_DEVELOPMENTS` in `frontend/src/features/portfolio/portfolioWorkspaceData.ts`.
- Portfolio holdings, cockpit status, action queue, risk strip, market drivers, holding decisions, AI/news context, performance points, allocation colors, and suggested plays in `frontend/src/features/portfolio/portfolioData.ts`.
- Mutual fund universe and generated NAV history in `frontend/src/funds/mockFunds.ts`.
- Market tape data in `frontend/src/features/market-tape/marketTapeData.ts`.

Moving these datasets behind backend APIs is one of the most important consolidation steps.

## Test Coverage

Frontend tests in `frontend/src/App.test.tsx` currently cover:

- Desktop-only gate behavior below `768px`.
- Product rendering at the tablet breakpoint.
- Non-globe market movement typography and route-scoped market tape numeric styling.
- Animated command/search prompts on finance, events, and funds surfaces, including reduced-motion CSS.
- Default global monitor rendering.
- Globe card toggling.
- Monitor category filtering.
- Navigation into portfolio, markets, earnings, screener, watchlist, events dashboard, and article routes.
- Direct route initialization for standalone finance sections and article routes.
- Standalone finance sections staying out of the portfolio workspace.
- Portfolio search handoff into screener.
- Portfolio Overview rendering, primary action module, staged tabs, and local evidence/status language.
- Markets layout including Market Summary placement, top metrics rail, configurable metric picker, heatmap workspace, stock-news rail, lower rails, sector performance, market mover filters, recent-development carousel, and refined heatmap tones.
- Removal of decorative panel eyebrow text across non-globe finance routes.
- Funds add/manage fund button treatment.
- Global events dashboard leaner copy and event search field.
- Article sector controls.

Backend tests in `backend/tests/test_api.py` currently cover:

- Health endpoint.
- CORS for running Vite dev origin `http://127.0.0.1:5177`.
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
- No production source verification workflow; current source chips/drawers are deterministic evidence patterns.
- No real portfolio sync.
- No authentication, account system, server persistence, or trading execution.
- Watchlist state persists only in browser `localStorage`.
- `/answer` is a frontend synthesis handoff and fallback route, not a backend AI thread service.

UX limitations:

- Event details do not yet open a full source-backed drawer.
- News dashboard search stores local input state but does not yet filter archive rows.
- News dashboard sort controls are mostly visual.
- Article routes exist but are not deeply connected to the default globe workflow.
- Main AI panels are deterministic and cannot answer follow-up questions.
- Portfolio exposure is not yet mapped directly from live/global events.
- Portfolio evidence drawer uses deterministic local assumptions and source counts.
- Funds Allocation, Risk, and Overlap tabs are preview states.
- Animated command prompts are guidance affordances, not semantic AI search.
- Login is present as a disabled top-nav action.

Engineering limitations:

- `frontend/src/app/App.tsx` still owns manual routing and high-level navigation state.
- `frontend/src/features/portfolio/PortfolioScreen.tsx` is large and owns multiple product surfaces: portfolio, markets, market summary composition, earnings, screener, watchlist, heatmap layout, evidence drawer behavior, and localStorage behavior.
- Several important datasets are frontend constants instead of API-backed resources.
- CSS still contains staged legacy layers from multiple design passes.
- `frontend/src/funds/FundsScreen.tsx` uses many inline style objects and should eventually be normalized into feature CSS/components.
- A real router should be considered before route complexity grows further.
- `/answer` currently reads query params directly from `window.location` and should be integrated into a real route/thread model later.

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
- Extract the portfolio evidence drawer, market heatmap, market summary, and watchlist/localStorage behaviors into smaller components/hooks.
- Add a source-backed event detail drawer from the Global Intelligence Monitor.
- Connect selected globe events to portfolio exposure callouts and `/answer` handoffs.
- Move monitor events and event details into backend endpoints.
- Move deterministic NIFTY 50 market data behind backend endpoints.
- Connect `/answer` to a backend AI thread/synthesis endpoint with source retrieval and honest fallback states.
- Replace local-only event search and visual-only sort controls with real filtering/sorting behavior.
- Preserve the current non-globe design rules: route-scoped CSS, one visible box per content unit, consistent route header sizing, animated search prompts as guidance, and globe-route protection.
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
- Normalize answer requests, evidence, citations, and inspect-next actions across `/markets`, `/portfolio`, `/news-pulse`, articles, and `/answer`.

### Phase 3 - Make It User-Specific

- Add portfolio CSV upload.
- Map holdings to sectors, countries, routes, chokepoints, and event risk.
- Add watchlists, saved views, alert preferences, and account-level persistence.
- Upgrade watchlist localStorage behavior into backend-backed saved state.
- Replace client-side portfolio status with explicit account/import/sync states once real persistence exists.

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
- `PRODUCT.md` - product promise, user, route hierarchy, AI/data honesty, decision posture, and voice.
- `DESIGN.md` - visual direction, non-globe UI system, craft rules, globe protection, and visual QA expectations.
- `AGENTS.md` - permanent Codex instructions, including the no-mobile policy, product direction, route hierarchy, data honesty, globe protection, and non-globe UI rules.
- `frontend/src/ARCHITECTURE.md` - frontend migration notes, target boundaries, and CSS import order.

Older planning docs were consolidated into this summary to reduce stale and repeated content.
