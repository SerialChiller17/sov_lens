# Sovereign Lens Project Summary

Generated: April 30, 2026

## Executive Summary

Sovereign Lens is a local MVP for geopolitical, market, and portfolio intelligence. It presents global risk events through a cinematic dark interface centered on an interactive globe, then connects those events to sectors, stocks, market signals, and portfolio exposure.

The current running app is no longer exactly the same as the older project description. The live default route (`/`) is a newer **Global Intelligence Monitor** built with `cobe`, not the earlier country-file / sector-rail dashboard described in parts of `PROJECT_DESCRIPTION.md`. The older country, sector, conflict-card, and geotagged-news code still exists in `frontend/src/App.tsx`, but much of it is currently unused or only reachable through direct routes.

At a product level, the project is already strong as a high-fidelity demo: it has a premium visual direction, a working globe monitor, a portfolio dashboard, a news/event archive route, a direct article route, a FastAPI dummy backend, and frontend/backend tests. The main opportunity is to consolidate these pieces into one coherent intelligence workflow and move the important event/news/conflict data out of frontend constants into backend APIs.

## Product Intent

Sovereign Lens is intended to answer questions like:

- What global events currently matter for markets?
- Which sectors and stocks are most exposed to a geopolitical event?
- Which country, route, chokepoint, or policy signal is transmitting risk?
- How does a user portfolio intersect with live geopolitical and market stress?
- What should an analyst watch next to confirm or reject a risk thesis?

The intended tone is:

- Dark, cinematic, premium.
- Market-aware and institutional.
- Dense, but not noisy.
- Analytical instead of sensational.
- More like an intelligence terminal than a consumer news app.

## Current App Surfaces

### `/` - Global Intelligence Monitor

This is the current default first screen.

It includes:

- Primary navigation with `Sovereign Lens` and `Your Portfolio`.
- A horizontally scrolling `Live Markets` tape.
- A large interactive globe rendered with `cobe`.
- Hotspot markers for global events.
- Floating labels for selected or high-priority events.
- A selected event preview card on the left side of the globe.
- A right-side `sovereign AI` panel.
- Category filter menu for event types.
- A small animated `InsightCompanion` visual in the AI panel.

The default selected event is:

- `Red Sea Shipping Risk`

The current globe monitor has 15 frontend-local events:

- Red Sea Shipping Risk
- US Policy Cycle
- Critical Minerals Corridor
- Nearshoring Capacity Watch
- Copper Output Watch
- China Demand Pulse
- Yen Intervention Watch
- Memory Cycle Signal
- Energy Import Exposure
- Indian Ocean Port Flow
- EU Diplomatic Track
- LNG Terminal Watch
- Capital Flow Monitor
- Maritime Pressure Watch
- Malacca Flow Monitor

Event categories:

- Conflict Zones
- Diplomacy
- Economics
- Energy
- Trade
- Regulation

Impact levels:

- Watch
- Elevated
- High
- Critical

Current globe interactions:

- The globe auto-rotates.
- Pointer drag rotates the globe.
- Hovering the globe pauses auto-rotation.
- Clicking hotspot targets toggles event selection.
- Multiple events can be selected, with the newest selected event becoming the active AI context.
- The filter menu narrows visible events by category.
- Label placement includes collision-avoidance logic so the globe does not become overloaded.

### `/portfolio` - Synced Portfolio Dashboard

This route is reachable from the top navigation button `Your Portfolio`.

It includes:

- `Live Prices` ticker tape for portfolio holdings.
- Portfolio value summary.
- Invested value.
- 1-day return.
- Total return.
- 6-month performance chart compared with Nifty 50.
- Interactive allocation donut.
- Holdings table.
- Portfolio AI panel.
- News affecting portfolio.
- High-risk stock callouts.
- Suggested plays.

Current frontend-local holdings:

- NVDA - NVIDIA
- TSM - Taiwan Semi
- XOM - Exxon Mobil
- LMT - Lockheed Martin
- ZIM - ZIM Integrated
- SPY - S&P 500 ETF

Current portfolio AI themes:

- Freight and energy risk.
- Taiwan-linked semiconductor exposure.
- Concentration risk from SPY.
- Shipping beta from ZIM.
- Potential ETF/fund buffer.

This is dummy data only. There is no real brokerage, portfolio sync, persistence, or user account system yet.

### `/news-pulse` - Global Events Pulse

This route exists and is tested, but it is not currently exposed from the main top navigation. It can be opened directly.

It includes:

- `Global Events Pulse` topbar.
- Search input.
- `Upcoming Events` panel.
- Static global map stage using the premium dark globe SVG.
- Featured callout: `G20 Summit: Climate Deal Reached`.
- `Global Event Archive` table.
- Sort buttons for `Newest` and `Oldest`.

Important note: the search and sort controls are currently mostly visual. There is no meaningful search or sort behavior wired yet.

Upcoming events:

- OPEC+ output guidance window
- G20 finance deputies track
- Climate finance implementation brief

The archive combines:

- Live backend global pulse alerts.
- Frontend-local archive rows.

### `/news-pulse/:newsId` - Full News Article

This direct route renders a full article view for a geotagged news item.

It includes:

- Article topbar.
- Region/time/severity metadata.
- Headline.
- Location.
- Summary, AI insight, and market read text.
- Facts: source, geotag, conflict link.
- Connected sector buttons.

Current geotagged article items are frontend-local and include:

- Red Sea freight/insurance story.
- Taiwan Strait chip continuity story.
- Eastern Mediterranean fragile talks story.
- Ukraine infrastructure/Europe energy story.
- Myanmar rare-earth logistics story.

The article sector buttons update selected sector state, but they do not yet navigate the user back into a live sector dashboard.

## Core Features Implemented

### 1. Interactive Global Event Globe

Implemented in:

- `frontend/src/globe-monitor/GlobeMonitor.tsx`
- `frontend/src/globe-monitor/mockEvents.ts`
- `frontend/src/globe-monitor/mockDetails.ts`

The globe uses:

- `cobe` for the canvas globe.
- React state for selected and hovered events.
- Manual projection math for placing HTML hotspot targets and labels over the canvas.
- Responsive label limits and collision checks.
- Category filtering.
- Auto-rotation and pointer drag interaction.

This is the strongest current product surface.

### 2. Sovereign AI Context Panel

The right-side panel changes based on the active selected globe event.

It shows:

- AI-style analysis text.
- A watchlist sentence.
- Most affected sectors.
- Most affected stocks.
- Suggested plays.
- Related news.

Important note: this is not connected to a real AI model. The content is deterministic frontend mock content from `mockDetails.ts`.

### 3. Market Tape

Implemented in:

- `frontend/src/App.tsx`

The market tape appears on the main monitor and portfolio screen.

Default global tape items:

- DXY
- US10Y
- Gold Spot
- Brent Crude
- S&P 500
- Nasdaq 100
- Nifty 50

The tape is a repeated scrolling row of static values. It is styled like a market terminal strip and works well as a visual product signal, but there is no live market data integration yet.

### 4. Portfolio Dashboard

Implemented in:

- `frontend/src/App.tsx`

Features:

- Current portfolio value.
- Invested value.
- 1D returns.
- Total returns.
- Interactive 6-month performance chart.
- Benchmark comparison against Nifty 50.
- Interactive allocation donut.
- Holdings table with risk pills.
- Portfolio AI panel with news, risk, and suggested plays.

The portfolio route gives the project an important commercial direction: connect global events to personal exposure.

### 5. Global Events / News Archive

Implemented in:

- `frontend/src/App.tsx`

Features:

- Events dashboard route.
- Upcoming events cards.
- Archive table.
- Search input.
- Direct article pages.

This area is visually present but less functionally complete than the main monitor and portfolio screen.

### 6. Backend Dummy Intelligence API

Implemented in:

- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/data.py`

Stack:

- FastAPI
- Pydantic
- Uvicorn
- Pytest

Endpoints:

- `GET /api/health`
- `GET /api/countries`
- `GET /api/countries/{iso3}`
- `GET /api/global-pulse`
- `GET /api/market-pulse`
- `GET /api/sectors`
- `GET /api/sectors/{sector_id}`

The backend includes CORS for local Vite dev origins.

### 7. Frontend Tests

Implemented in:

- `frontend/src/App.test.tsx`

The tests mock `cobe` and API fetches, then verify:

- Main global monitor renders.
- Event selection updates AI context.
- Category filter works.
- Portfolio route opens from navigation.
- `/news-pulse` direct route renders the events dashboard.
- `/news-pulse/red-sea-freight` direct route renders an article.
- Article sector controls still work.

### 8. Backend Tests

Implemented in:

- `backend/tests/test_api.py`

The tests verify:

- Health endpoint.
- Countries endpoint includes full sidebar-style data.
- Country lookup and 404.
- Global pulse payload.
- Market pulse payload.
- Sector list includes arcs and chokepoints.
- Sector lookup and 404.

## Backend Data Inventory

### Countries

The backend has 12 countries:

- USA
- IND
- CHN
- TWN
- JPN
- KOR
- NLD
- DEU
- SAU
- ARE
- RUS
- BRA

Each country includes:

- ISO3 code.
- Numeric ISO code.
- Name.
- Flag URL.
- Capital.
- Coordinates.
- GDP.
- Population.
- GDP growth.
- GDP per capita.
- Gini.
- Tension score.
- Tension label.
- Structural/sentiment/live trigger breakdown.
- Group memberships.
- Industry criticality notes.
- Trade partners.
- Market index and series.
- FX pulse.
- Contrarian insight.

### Global Pulse

The backend has 3 global alerts:

- Taiwan Strait activity affecting chip-linked markets.
- Persian Gulf tanker insurance pressure.
- US, EU, China export-control reviews.

It also includes 3 daily briefs:

- Semiconductor risk clustering around chokepoints.
- Energy route security being priced before physical shortage.
- Critical minerals policy shifting from efficiency to redundancy.

### Market Pulse

The backend has 3 market movements:

- TAIEX, Taiwan, -1.8 percent.
- Brent crude, Middle East, +2.2 percent.
- USD/KRW, Korea, +0.8 percent.

### Sectors

The backend has 3 sectors:

- Semiconductors
- Hydrocarbons
- Critical Minerals & EV Batteries

Each sector includes:

- Market value.
- Systemic multiplier.
- Sensitivity score.
- Power nodes.
- Consumption nodes.
- Arcs.
- Chokepoints.
- Brief.
- Alpha note.
- Equity proxy.

Chokepoints:

- Strait of Malacca
- Strait of Hormuz
- Suez Canal

## Frontend Data Inventory

The frontend currently owns several important datasets directly in code.

### Globe Monitor Events

Location:

- `frontend/src/globe-monitor/mockEvents.ts`

Contains 15 current event markers for the live default monitor.

### Globe Monitor Details

Location:

- `frontend/src/globe-monitor/mockDetails.ts`

Contains:

- AI insights.
- Affected sectors.
- Affected stocks.
- Related news.
- Suggested plays.
- Generated SVG image data URIs.

### Legacy Active Conflicts

Location:

- `frontend/src/App.tsx`

Contains 6 conflict records:

- Red Sea
- Taiwan Strait
- Gaza / Israel
- Ukraine
- Sudan
- Myanmar

These records are currently not part of the default `GlobeMonitor` route. They appear to belong to an earlier globe/conflict-card design.

### Geotagged News Feed

Location:

- `frontend/src/App.tsx`

Contains 5 article-style news items. Direct article routes use this data, but the richer geotagged news pin UI appears to be unused in the current default route.

### Portfolio Data

Location:

- `frontend/src/App.tsx`

Contains:

- Holdings.
- Portfolio value constants.
- Allocation colors.
- Performance data.
- Benchmark data.
- Portfolio AI news.
- Suggested portfolio plays.

## Current UI Assessment

### Overall Feel

The UI feels like a dark institutional intelligence terminal with a cinematic globe centerpiece. It uses:

- Black and near-black backgrounds.
- Warm white text.
- Amber, gold, red, and muted cream accents.
- Subtle grid overlays.
- Glassy panels.
- Small uppercase metadata.
- Dense financial/news layout patterns.
- Rounded corners generally at 8px or less.

The strongest visual surface is the default global monitor. It feels premium and cohesive: a glowing dotted globe, event labels, a selected event card, a filter control, and an AI panel that reads like an analyst workstation.

### First Screen

The app opens directly into the product experience. There is no landing page. This is good for the intended MVP/demo because the product value is visible immediately.

The first screen communicates:

- Global intelligence.
- Market monitoring.
- Live event relevance.
- AI interpretation.
- Portfolio extension through navigation.

### Layout

Desktop layout:

- Top left: brand navigation.
- Top strip: market tape.
- Left/center: large globe.
- Left over globe: selected event preview card.
- Right: AI intelligence panel.
- Near globe/panel boundary: filter menu.

Mobile/responsive behavior:

- CSS contains several breakpoints, especially around `980px`.
- The app attempts to reflow panels and reduce globe/panel crowding.
- The monitor is clearly desktop-first.

### Interaction Quality

Good current interactions:

- Globe drag.
- Auto-rotation pause on hover.
- Event click selection.
- Multi-select behavior.
- Category filter menu.
- Hover/focus states.
- Portfolio donut hover/focus.
- Portfolio chart pointer interaction.

Needs more functional depth:

- Search input on events dashboard.
- Archive sort buttons.
- Source links.
- Event detail drilldowns.
- News route discoverability from the main UI.
- Real navigation between event, sector, country, and portfolio contexts.

### UI Risks

- The project has a lot of CSS layering and older layout code in `App.css`.
- Some old components and new components coexist in `App.tsx`, making the product direction hard to read.
- Some documented UI expectations in `PROJECT_DESCRIPTION.md` do not match the current live implementation.
- The default monitor is polished, but the news dashboard and article route feel more like secondary prototypes.

## Architecture Summary

### Root

Important files:

- `package.json`
- `README.md`
- `PROJECT_DESCRIPTION.md`
- `plan.md`
- `sources_research.md`

Root scripts:

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run test:backend`
- `npm run test:frontend`

### Frontend

Location:

- `frontend/`

Stack:

- React 19
- TypeScript
- Vite 6
- `cobe`
- Vitest
- Testing Library
- Playwright dependency is installed, though no visible Playwright test suite is currently present.

Main files:

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/api.ts`
- `frontend/src/types.ts`
- `frontend/src/InsightCompanion.tsx`
- `frontend/src/globe-monitor/GlobeMonitor.tsx`
- `frontend/src/globe-monitor/mockEvents.ts`
- `frontend/src/globe-monitor/mockDetails.ts`
- `frontend/src/globe-monitor/types.ts`
- `frontend/src/App.test.tsx`

Data flow:

- `App.tsx` calls `getBootstrapData()`.
- `getBootstrapData()` fetches countries, global pulse, market pulse, and sectors from the backend.
- The default monitor waits for backend bootstrap data to load, but its main event globe content comes from frontend-local mock files.
- `/news-pulse` uses backend global alerts plus frontend archive rows.
- `/portfolio` uses frontend-local portfolio constants.

### Backend

Location:

- `backend/`

Stack:

- FastAPI
- Pydantic
- Uvicorn
- Pytest

Main files:

- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/data.py`
- `backend/tests/test_api.py`

The backend is clean, small, and easy to extend. It is currently a deterministic in-memory API.

## Current Mismatch Between Docs And Code

The project documentation describes a previous or target version with:

- `react-globe.gl`
- `three`
- country polygons
- country file side panel
- sector arcs
- conflict pulse panel
- news pulse panel under conflict pulse
- selected country details
- trade partner tabs

The current `frontend/package.json` uses:

- `cobe`
- React
- Vite

It does not list `react-globe.gl` or `three`.

The current live default UI is:

- Global monitor with event hotspots.
- Sovereign AI panel.
- Portfolio navigation.

The old country/sector/conflict code should either be revived intentionally or removed to reduce confusion.

## Known Limitations

### Product Limitations

- All data is static or deterministic dummy data.
- No live market data.
- No live news feed.
- No real portfolio sync.
- No authentication.
- No persistence.
- No user-specific watchlists.
- No real AI or LLM-backed summarization.
- No source verification workflow.
- No confidence scoring beyond static labels.

### UX Limitations

- Main navigation exposes portfolio but not news/events.
- News dashboard search is visual only.
- News dashboard sort buttons are visual only.
- Article pages are reachable by direct route but not well integrated into the default workflow.
- Event details do not open a deeper drawer/page from the main monitor.
- The AI panel reads well, but users cannot ask follow-up questions.
- The filter button does not show the selected category label in the collapsed trigger.
- There is no event timeline.
- There is no map zoom-to-event action.
- There is no layer toggle for sectors, markets, routes, countries, or portfolio exposure.

### Engineering Limitations

- `App.tsx` is very large and contains several product generations at once.
- `App.css` is very large and contains layered historical styling passes.
- Important datasets live in frontend constants.
- The backend country/sector data is underused by the current default monitor.
- Routes are handled manually with `window.history` instead of a router.
- There are no dedicated API endpoints for events, event details, news articles, conflicts, or portfolios.
- Some text contains encoding artifacts such as `Â·` in JSX strings and mojibake in `sources_research.md`.
- Current docs and dependencies are out of sync in places.

## What To Add Further

### Highest-Value Product Additions

1. Add a real event detail drawer from the default globe.
   - Include timeline, source list, affected sectors, affected tickers, watchlist signals, confidence, and "why this matters".

2. Expose the news/events route in the main navigation.
   - Add a `News` or `Events` button next to `Your Portfolio`.

3. Connect globe events to portfolio holdings.
   - If Red Sea is selected, highlight ZIM/XOM exposure.
   - If Taiwan or Korea is selected, highlight NVDA/TSM/MU exposure.
   - If policy/regulation is selected, highlight LMT/JPM/BA or sector ETFs.

4. Move monitor events into the backend.
   - Add `/api/events`.
   - Add `/api/events/{id}`.
   - Add `/api/events?category=Energy`.

5. Add source transparency.
   - Show source name, link, timestamp, and confidence basis.
   - Distinguish official releases, wires, OSINT, vendor analysis, and internal inference.

6. Add a "What changed?" mode.
   - 1h, 6h, 24h, 7d windows.
   - Show new events, escalations, downgrades, and market confirmations.

7. Add portfolio ingestion.
   - First simple CSV upload.
   - Later broker sync.
   - Map tickers to sectors, countries, routes, and risk themes.

### Data And Intelligence Additions

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
- ai_summary
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

Useful source directions from `sources_research.md`:

- RavenPack or another news analytics provider for structured market-aware news.
- Marketaux for broader finance/news API coverage.
- Intel Desk style geopolitical market squawk feed.
- S&P Global / Argus for commodities and shipping.
- Reuters/Bloomberg through licensed feeds or a news analytics vendor.
- gCaptain and Maritime Executive for shipping/war-risk context.
- SemiAnalysis and DIGITIMES for semiconductor context.
- Benchmark Mineral Intelligence for critical minerals and batteries.

### UI Additions

1. Event detail drawer.
   - Opens from globe hotspot or selected event card.
   - Should not obscure the globe completely.

2. Portfolio impact overlay.
   - When an event is selected, show affected holdings directly in the AI panel.

3. Event-to-market transmission map.
   - Example: Red Sea -> freight insurance -> Brent/shipping -> ZIM/XOM/airlines.

4. Layer controls.
   - Events
   - Sectors
   - Routes
   - Portfolio exposure
   - News density

5. Country/sector reintegration.
   - Reuse backend country and sector data as drawers or secondary tabs.
   - Avoid bringing back too many old side panels at once.

6. News feed card on the main monitor.
   - Small, high-signal list of active events.
   - Click opens event or article.

7. Source drawer.
   - Shows citations, timestamps, confidence, and contradictions.

8. Scenario mode.
   - "If Hormuz escalates..."
   - "If Taiwan risk cools..."
   - "If export controls tighten..."

### Engineering Additions

1. Split `App.tsx` into route-level and feature-level files.

Suggested structure:

```text
frontend/src/routes/MonitorRoute.tsx
frontend/src/routes/PortfolioRoute.tsx
frontend/src/routes/NewsPulseRoute.tsx
frontend/src/routes/ArticleRoute.tsx
frontend/src/components/MarketTape.tsx
frontend/src/components/GlobalBrandNav.tsx
frontend/src/features/globe-monitor/
frontend/src/features/portfolio/
frontend/src/features/news/
```

2. Add a router.
   - Use React Router or a small route abstraction.
   - Avoid manual `window.history` handling as route count grows.

3. Create backend APIs for frontend-local data.

Suggested endpoints:

```text
GET /api/events
GET /api/events/{event_id}
GET /api/news
GET /api/news/{news_id}
GET /api/portfolio/demo
GET /api/conflicts
GET /api/conflicts/{conflict_id}
```

4. Consolidate CSS.
   - Separate current monitor CSS from legacy dashboard CSS.
   - Remove unused styles after confirming product direction.

5. Clean encoding issues.
   - Replace mojibake in docs.
   - Replace `Â·` separators in JSX with plain ASCII separators or proper Unicode if the file encoding is confirmed.

6. Add visual regression checks.
   - Desktop main monitor.
   - Portfolio route.
   - News route.
   - Article route.
   - Narrow desktop/mobile.

7. Add API contract tests.
   - Especially once events/news/portfolio data moves backend-side.

## Suggested Roadmap

### Phase 1 - Consolidate The MVP

- Add main navigation to News/Events.
- Move `GLOBE_MONITOR_EVENTS` and `MONITOR_EVENT_DETAILS` to backend endpoints.
- Add event detail drawer.
- Wire event selection to portfolio risk callouts.
- Clean `App.tsx` into separate route files.

### Phase 2 - Make It Feel Like A Real Intelligence Product

- Add source drawer and confidence logic.
- Add event timeline.
- Add "what changed" time window.
- Add event-to-market transmission paths.
- Add real search/filter behavior for events.
- Add sector/country drawers using existing backend data.

### Phase 3 - Make It User-Specific

- Add portfolio upload.
- Map holdings to event exposure.
- Add watchlists.
- Add saved views.
- Add alert preferences.

### Phase 4 - Add Live Data

- Integrate one market-aware news API.
- Add one financial market data provider.
- Add sector-specific feeds.
- Add ingestion jobs and normalized event schema.
- Add update timestamps and stale-data indicators.

## Development Notes

Run backend:

```bash
npm run dev:backend
```

Run frontend:

```bash
npm run dev:frontend
```

Default URLs:

```text
Frontend: http://127.0.0.1:5173/
Backend:  http://127.0.0.1:8000/
```

Run tests:

```bash
npm run test:backend
npm run test:frontend
```

## Most Important Takeaway

The project already has a strong visual and product foundation. The next best move is not to add more isolated UI concepts. It is to connect the existing surfaces into one workflow:

```text
Global event -> AI explanation -> affected sectors/stocks -> portfolio exposure -> source-backed detail -> watchlist/action
```

That workflow would turn Sovereign Lens from a beautiful demo into a credible intelligence product.
