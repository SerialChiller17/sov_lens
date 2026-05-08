# Sovereign Lens Project Summary

Last consolidated: May 8, 2026

## Executive Summary

Sovereign Lens is a local MVP for geopolitical risk, market intelligence, portfolio exposure, and research workflows. It is built as a dense finance terminal, not a consumer news app or mobile-first dashboard.

The current app opens directly into a Global Intelligence Monitor: a dark market terminal with a live-style market tape, an interactive `cobe` globe, event hotspots, an analyst-style AI panel, and navigation into portfolio and market workspaces.

The product is intentionally desktop/tablet-first. Screens below `768px` are blocked by `DesktopOnlyGate`; the routed terminal should not mount on phone widths. Permanent no-mobile instructions are in `AGENTS.md`.

## Current Routes

### `/` - Global Intelligence Monitor

The default route contains:

- Global brand navigation.
- `Live Markets` tape.
- Interactive globe rendered with `cobe`.
- Frontend-local event hotspots from `frontend/src/globe-monitor/mockEvents.ts`.
- Event details and AI-style analysis from `frontend/src/globe-monitor/mockDetails.ts`.
- Category filtering, selected-event preview, and a right-side `sovereign AI` panel.

Default selected event:

- Red Sea Shipping Risk

Event categories:

- Conflict Zones
- Diplomacy
- Economics
- Energy
- Trade
- Regulation

### `/portfolio`

The portfolio dashboard contains:

- Portfolio value and return summary.
- Live-style prices tape.
- Performance chart.
- Allocation donut.
- Holdings impact table.
- Portfolio AI panel.
- News affecting portfolio.
- High-risk holdings and suggested plays.

This is demo data only. There is no brokerage sync, persistence, authentication, or user account system yet.

### Finance Workspace Routes

The app also includes standalone finance sections:

- `/markets` - Indian market overview.
- `/earnings` - Earnings calendar.
- `/screener` - Indian equity screener.
- `/funds` - Funds and performance exploration.
- `/watchlist` - Tracked Indian assets.

These routes share the terminal-style navigation and are part of the larger finance dashboard direction.

### `/news-pulse`

The global events dashboard contains:

- Upcoming events.
- Static global map stage.
- Featured event callout.
- Global event archive table.
- Search and sort controls that are currently mostly visual.

### `/news-pulse/:newsId`

Article routes render frontend-local geotagged news items with:

- Headline and metadata.
- Summary, AI insight, and market read.
- Source/geotag/conflict facts.
- Connected sector buttons.

## Product Direction

Sovereign Lens should feel like:

- A finance terminal.
- A geopolitical intelligence workstation.
- A market-aware research dashboard.
- Dense, calm, premium, and analytical.

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

Do not optimize main terminal screens for phones. Tablet, small-laptop, desktop resize, side-panel, chart, and dense-table work above `768px` is still valid.

## Architecture

### Frontend

Location:

- `frontend/`

Stack:

- React 19
- TypeScript
- Vite 6
- `cobe`
- Tailwind and plain CSS
- Vitest
- Testing Library
- Playwright dependency installed for visual/browser checks

Important files and directories:

- `frontend/src/App.tsx` - root wrapper with `DesktopOnlyGate`.
- `frontend/src/app/App.tsx` - manual route shell and high-level app state.
- `frontend/src/app/routes.ts` - route constants and route-to-view mapping.
- `frontend/src/app/GlobalBrandNav.tsx` - primary navigation.
- `frontend/src/globe-monitor/` - current default monitor.
- `frontend/src/features/portfolio/` - portfolio, markets, earnings, screener, watchlist surfaces.
- `frontend/src/features/events/` - events dashboard and article route.
- `frontend/src/features/market-tape/` - shared market tape.
- `frontend/src/App.test.tsx` - frontend regression tests.

Current routing is manual with `window.history`. A real router should be considered as route count grows.

### Backend

Location:

- `backend/`

Stack:

- FastAPI
- Pydantic
- Uvicorn
- Pytest

Important files:

- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/data.py`
- `backend/tests/test_api.py`

Endpoints:

- `GET /api/health`
- `GET /api/countries`
- `GET /api/countries/{iso3}`
- `GET /api/global-pulse`
- `GET /api/market-pulse`
- `GET /api/sectors`
- `GET /api/sectors/{sector_id}`

The backend is deterministic and in-memory. It is clean enough to extend into events, news, portfolio, and source APIs.

## Data Inventory

### Backend Data

The backend currently serves:

- 12 countries: USA, IND, CHN, TWN, JPN, KOR, NLD, DEU, SAU, ARE, RUS, BRA.
- 3 global pulse alerts.
- 3 market pulse movements.
- 3 sectors: Semiconductors, Hydrocarbons, Critical Minerals & EV Batteries.
- Chokepoints: Strait of Malacca, Strait of Hormuz, Suez Canal.

Country records include economics, tension score, group memberships, industry criticality, trade partners, market index data, FX pulse, and contrarian insight.

Sector records include market value, systemic multiplier, sensitivity, power nodes, consumption nodes, arcs, chokepoints, brief, alpha note, and equity proxy.

### Frontend-Local Data

The frontend still owns several important datasets:

- Globe monitor events in `frontend/src/globe-monitor/mockEvents.ts`.
- Event AI/details data in `frontend/src/globe-monitor/mockDetails.ts`.
- Portfolio workspace data in `frontend/src/features/portfolio/`.
- Events/news article data in `frontend/src/features/events/`.

Moving these into backend APIs is one of the most important consolidation steps.

## Current Limitations

Product limitations:

- All data is static or deterministic dummy data.
- No live market data.
- No live news feed.
- No real AI/LLM-backed summarization.
- No source verification workflow.
- No real portfolio sync.
- No authentication or persistence.

UX limitations:

- Event details do not yet open a full source-backed drawer.
- News dashboard search and sort are mostly visual.
- Article routes exist but are not deeply integrated into the default workflow.
- Main AI panel is deterministic and cannot answer follow-up questions.
- Layer controls for routes, sectors, portfolio exposure, and sources are not yet unified.

Engineering limitations:

- `frontend/src/app/App.tsx` still owns too much route logic.
- Several important data sets are frontend constants.
- CSS contains historical layers from multiple design passes.
- Routes are handled manually instead of through a router.
- Some older docs described a previous `react-globe.gl`/country-file implementation; this summary now reflects the current `cobe` monitor.

## Source And Data Strategy

The product should use curated, market-aware feeds rather than raw event scraping as its first data layer.

High-priority source directions:

| Source | Best Use |
| --- | --- |
| [RavenPack](https://www.ravenpack.com/products/edge/data/news-analytics) | Market-aware news analytics, sentiment, relevance, novelty, and entity/event scoring. |
| [Marketaux](https://www.marketaux.com) | API-first financial news bus with tickers, categories, and sentiment. |
| [Intel Desk Live](https://www.inteldesk.app/live) | Trader-grade geopolitical squawk feed for global risk events. |
| [S&P Global Commodity Insights](https://www.spglobal.com/commodity-insights/en/rss) | Commodity, energy, shipping, metals, and sector research context. |
| [Argus Media](https://www.argusmedia.com/en) | Energy, shipping, freight, war-risk, and commodity price reporting. |
| Reuters/Bloomberg licensed feeds | Core institutional market-news backbone. |
| [gCaptain](https://gcaptain.com) and [Maritime Executive](https://maritime-executive.com) | Shipping, maritime insurance, chokepoints, and logistics risk. |
| [SemiAnalysis](https://semianalysis.com) and [DIGITIMES Asia](https://www.digitimes.com) | Semiconductor supply chain, AI infrastructure, Taiwan/Korea/US/EU exposure. |
| [Benchmark Mineral Intelligence](https://source.benchmarkminerals.com) | Lithium, nickel, cobalt, graphite, batteries, gigafactory capacity, and EV materials. |

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

- Add a source-backed event detail drawer.
- Expose news/events more clearly in primary navigation.
- Wire selected events to portfolio exposure callouts.
- Move monitor events and event details into backend endpoints.
- Split route-level code out of `frontend/src/app/App.tsx`.

Suggested endpoints:

```text
GET /api/events
GET /api/events/{event_id}
GET /api/news
GET /api/news/{news_id}
GET /api/portfolio/demo
```

### Phase 2 - Make The Intelligence Workflow Real

- Add source drawer and confidence logic.
- Add event timeline and "what changed" windows.
- Add event-to-market transmission paths.
- Add real search/filter behavior for events.
- Reuse backend country and sector data as drawers or secondary tabs.

### Phase 3 - Make It User-Specific

- Add portfolio CSV upload.
- Map holdings to sectors, countries, routes, and event risk.
- Add watchlists, saved views, and alert preferences.

### Phase 4 - Add Live Data

- Integrate one market-aware news API.
- Add one market data provider.
- Add ingestion jobs and normalized event/source schema.
- Add freshness, stale-data, and confidence indicators.

## Development

Run commands, test commands, and local URLs are kept in `README.md` to avoid repeating them here.

## Documentation Structure

This repo now uses:

- `README.md` - quick local setup and command entrypoint.
- `PROJECT_SUMMARY.md` - canonical project/product/architecture summary.
- `AGENTS.md` - permanent Codex instructions, including the no-mobile policy.

The older `plan.md`, `PROJECT_DESCRIPTION.md`, and `sources_research.md` were consolidated here to remove stale and repeated content.
