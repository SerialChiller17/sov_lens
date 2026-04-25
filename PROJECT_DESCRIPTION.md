# Sovereign Lens Project Description

Last updated: April 25, 2026

## Overview

Sovereign Lens is a high-fidelity local MVP for geopolitical risk, sovereign intelligence, supply-chain exposure, and market pulse analysis. The product is built around a cinematic 3D globe with restrained intelligence overlays. It is intended to feel like a premium analytical terminal: disciplined, calm, information-dense, and editorial rather than game-like or sensational.

The current experience combines four major ideas:

1. A live geopolitical globe that shows countries, borders, chokepoints, trade routes, supply-chain connections, and conflict signals.
2. A market and risk tape that behaves like a Bloomberg-style geopolitical pulse strip.
3. Side intelligence panes for conflict pulse, news pulse, sector exposure, and country file details.
4. A compact conflict brief that connects conflict geography to intensity, humanitarian impact, market exposure, source confidence, and latest update.

The MVP uses deterministic local dummy data. It is not yet connected to live market feeds, live news feeds, or a real conflict-data provider.

## Product Intent

Sovereign Lens is meant to answer questions like:

- Which countries matter most for a given strategic sector?
- What market instruments are reacting to current geopolitical pressure?
- Where are the chokepoints, routes, and sovereign-risk nodes that transmit stress?
- How does a conflict affect markets, supply chains, and country exposure?
- What is the current risk posture of a selected country?

The visual language should remain:

- Dark, cinematic, and premium.
- Dense but readable.
- Calm rather than alarmist.
- Editorial rather than gamified.
- Analytical rather than decorative.

The best aesthetic target is:

> Bloomberg discipline + cinematic globe + intelligence briefing restraint.

## Current User Experience

### First Screen

The app opens directly into the working intelligence surface. There is no landing page. The first viewport is the product itself:

- A large dark globe dominates the center.
- A live market tape runs across the top.
- A Conflict Pulse panel sits on the left.
- A News Pulse panel is restored below the conflict panel.
- A Sectors At Risk panel sits at the lower left.
- A Country File panel sits on the right.
- A selected conflict card appears near the lower center when a conflict is active.

The default selected sector is `Semiconductors`.
The default selected country is `India`.
The default selected conflict is `Red Sea`.

### Market Tape

The top tape combines a global market/risk strip with active-lens-specific instruments.

Global tape items include:

- DXY
- US10Y
- Gold Spot
- Brent Crude
- S&P 500
- Nasdaq 100
- Nifty 50

Lens-specific examples:

- Semiconductors: NVIDIA, TSM, SOXX, TAIEX, ASML
- Hydrocarbons: WTI, Nat Gas, OPEC Basket, Shipping Insurance, XLE
- Critical Minerals: REMX, LIT, AUD/USD, China PMI, Copper

The tape intentionally avoids writing labels like "Semiconductor lens tape" in the UI. It should feel contextual without overexplaining itself.

### Globe

The globe is built with `react-globe.gl` and `three`.

Current globe layers include:

- Country polygons.
- Country borders.
- India boundary paths from the Survey of India asset.
- Sector arcs.
- Trade route arcs.
- Conflict transmission arcs.
- Chokepoint points.
- Selected country/capital points.
- Conflict heat markers.
- Conflict pulse rings.
- Labels for selected or priority items.

The globe currently uses a premium dark SVG texture at:

`frontend/src/assets/globe-premium-dark.svg`

Border and boundary assets are stored in:

- `frontend/src/assets/country-border-paths.json`
- `frontend/src/assets/india-boundary-paths.soi.json`

### Active Conflict Layer

The conflict layer is designed as a restrained intelligence overlay.

Conflict markers use native globe objects, not HTML overlay elements. This matters because an earlier HTML marker approach using `htmlElementsData` broke the WebGL globe rendering. The current implementation uses:

- `objectsData` for conflict marker sprites.
- `ringsData` for soft pulse rings.
- `labelsData` for selected and priority labels.

The current conflict marker structure visually approximates:

- Tiny central heat dot.
- Inner ring.
- Soft glow.
- Slow expanding pulse rings.
- Small text label when selected or prioritized.

The current conflict dataset is stored in `frontend/src/App.tsx` as `ACTIVE_CONFLICTS`.

Current conflicts include:

- Red Sea
- Taiwan Strait
- Gaza / Israel
- Ukraine
- Sudan
- Myanmar

Each conflict contains:

- Name
- Region
- Coordinates
- Severity
- Intensity
- Short description
- Reported impact
- Market channels
- Latest update
- Last updated time
- Confidence
- Humanitarian impact
- Source
- Transmission targets

Severity levels are:

- Watch
- Elevated
- High
- Critical

The selected conflict state:

- Brightens the selected marker.
- Keeps other conflict nodes more muted.
- Opens the compact conflict card.
- Shows relevant transmission arcs from the selected conflict.
- Rotates and zooms the globe toward the selected region when selected.

### Conflict Pulse Panel

The left Conflict Pulse panel lists active conflicts in a compact editorial format.

Current row content:

- Conflict name
- Severity pill
- Short description
- Time since update

Clicking a conflict row:

- Selects the conflict.
- Rotates the globe toward that conflict.
- Opens the conflict brief card.
- Updates the marker emphasis.

### News Pulse Panel

The News Pulse panel was restored below Conflict Pulse.

It uses `globalPulse.alerts` from the backend and currently shows:

- Region
- Headline
- Relative time

The current backend dummy alerts include:

- Taiwan Strait activity affecting chip-linked markets.
- Persian Gulf tanker insurance pressure.
- US, EU, China export-control reviews.

### Sectors At Risk Panel

The Sectors At Risk panel controls the active geopolitical lens.

Current sectors:

- Semiconductors, sensitivity 9.8
- Hydrocarbons, sensitivity 8.5
- Critical Minerals & EV Batteries, sensitivity 9.5

Changing the sector updates:

- Active accent color.
- Market tape lens-specific instruments.
- Globe route arcs.
- Chokepoints.
- Highlighted countries.
- Sector exposure panel active state.

Current note: on very narrow panes, long sector names can truncate. Recent CSS containment work reduced overflow, but the sector row remains a place to polish further if the desired behavior is full text rather than ellipsis.

### Country File Panel

The Country File panel shows the selected country.

For India, the current panel includes:

- Flag
- Country name
- Capital
- Tension score and label
- GDP
- Population
- Growth
- GDP per capita
- Gini
- FX volatility
- Structural, sentiment, and live trigger breakdowns
- Group tags
- Industry criticality
- Market index pulse
- Sparkline
- FX note
- Export/import trade partner tabs
- Contrarian insight

Clicking country polygons or trade partners changes the selected country.

### Compact Conflict Card

The conflict card appears near the lower center of the globe when a conflict is selected.

It currently displays:

- Region
- Conflict name
- Short description
- Severity
- Intensity
- Reported impact
- Market channels
- Latest update
- Reported humanitarian impact
- Source
- Updated time
- Confidence
- Timeline, Market impact, and Sources action buttons

Recent work changed the card to use auto-fitting columns so text wraps safely instead of overflowing from narrow columns.

## Frontend Architecture

Frontend location:

`frontend/`

Main files:

- `frontend/src/App.tsx`
- `frontend/src/App.css`
- `frontend/src/api.ts`
- `frontend/src/types.ts`
- `frontend/src/geo.ts`
- `frontend/src/App.test.tsx`

Primary libraries:

- React 19
- Vite
- TypeScript
- react-globe.gl
- three
- topojson-client
- world-atlas
- Vitest
- Testing Library

### App.tsx Responsibilities

`App.tsx` currently owns most of the MVP behavior:

- Fetches bootstrap data from the backend.
- Tracks selected country.
- Tracks selected sector.
- Tracks selected trade flow.
- Tracks selected conflict.
- Controls pane collapsed state.
- Defines global and sector-specific market tape data.
- Defines the active conflict dataset.
- Builds globe points, arcs, rings, labels, objects, and border paths.
- Handles country selection, sector selection, trade-flow switching, and conflict selection.
- Renders all major UI panes.

Important local frontend constants:

- `GLOBAL_MARKET_TAPE`
- `MARKET_TAPE_BY_SECTOR`
- `ACTIVE_CONFLICTS`
- `SEVERITY_RANK`
- `DEFAULT_COLLAPSED_PANES`
- `SECTOR_THEMES`

Important rendering functions:

- `MarketTape`
- `Sparkline`
- `ConflictCard`
- `createConflictMarkerTexture`
- `createConflictMarkerObject`

### Globe Implementation Notes

The globe uses native layers wherever possible:

- `polygonsData` for country surfaces.
- `pathsData` for border paths.
- `arcsData` for trade, sector, and conflict connections.
- `pointsData` for country and chokepoint nodes.
- `objectsData` for conflict marker sprites.
- `ringsData` for conflict pulse rings.
- `labelsData` for globe labels.

Do not reintroduce `htmlElementsData` for conflict markers unless it is isolated and tested carefully. The current native sprite approach is the safer path.

The marker sprite is generated at runtime with a canvas texture and rendered as a Three.js sprite. This gives the conflict node a heat-signal look while remaining inside the WebGL scene.

### CSS Organization

Most visual design lives in:

`frontend/src/App.css`

The CSS has accumulated several iteration passes:

- Base shell and globe styling.
- Panel styling.
- Density adjustments.
- Reference composition pass.
- Reference polish pass.
- Desktop containment pass.

The latest containment pass was added to solve:

- Pane widths covering too much globe.
- Text overflowing from the conflict card.
- Excessively large side panels at desktop zoom or narrower viewport widths.
- Pane content needing internal scroll instead of expanding over the globe.

Future cleanup should consolidate the repeated override layers into a cleaner structure once the design stabilizes.

## Backend Architecture

Backend location:

`backend/`

Main files:

- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/data.py`

Primary libraries:

- FastAPI
- Pydantic
- Uvicorn
- Pytest

### API Endpoints

Current API endpoints:

- `GET /api/health`
- `GET /api/countries`
- `GET /api/countries/{iso3}`
- `GET /api/global-pulse`
- `GET /api/market-pulse`
- `GET /api/sectors`
- `GET /api/sectors/{sector_id}`

### Backend Data

The backend serves deterministic dummy data for:

- Countries
- Global pulse alerts
- Market movements
- Sectors
- Chokepoints
- Sector arcs
- Trade partners
- Market index series
- FX triggers

The backend currently does not serve the conflict dataset. Conflict data is defined directly in the frontend. A natural next step is to move `ACTIVE_CONFLICTS` into the backend as a first-class API resource.

## Data Model Summary

### Country

A country includes:

- ISO3 code
- Numeric ISO code
- Name
- Flag URL
- Capital
- Coordinates
- GDP
- Population
- Growth
- GDP per capita
- Gini
- Tension score
- Tension label
- Tension breakdown
- Group memberships
- Industry criticality
- Trade partners
- Market index
- FX pulse
- Contrarian insight

### Sector

A sector includes:

- ID
- Name
- Color
- Market value
- Systemic multiplier
- Sensitivity score
- Power nodes
- Consumption nodes
- Arcs
- Chokepoints
- Brief
- Alpha note
- Equity proxy

### Conflict

A conflict currently includes:

- ID
- Name
- Region
- Coordinates
- Severity
- Intensity
- Short description
- Reported impact
- Market channels
- Latest update
- Updated time
- Confidence
- Humanitarian impact
- Source
- Transmission routes

This conflict model is currently frontend-local and should eventually be formalized in backend Pydantic models.

## Current Design State

The current UI has moved from a small collapsed HUD concept toward a reference-style intelligence dashboard:

- The side panes are expanded by default.
- The globe remains the central object.
- The market tape is always visible.
- The active conflict layer is visible on the globe.
- The selected conflict brief is visible by default.
- The panels are dense and terminal-like.

Recent refinements:

- Restored the News Pulse panel.
- Added a global plus lens-specific market tape.
- Removed visible lens-tape labels.
- Converted conflict markers from broken HTML overlays to native Three.js sprite markers.
- Made Red Sea selected by default.
- Added conflict pulse rings.
- Added a compact conflict brief.
- Slimmed panes and added internal scrolling to reduce globe coverage.
- Fixed conflict-card text overflow with auto-fit grid columns.

## Current Known Limitations

1. Data is deterministic dummy data.
2. Conflict data lives in the frontend instead of the backend.
3. Market tape values are static.
4. News pulse values are static backend dummy alerts.
5. Some CSS is layered from many iteration passes and should be consolidated.
6. Long labels, especially sector names, may still need final text treatment depending on whether truncation or wrapping is preferred.
7. The right Country File can still feel dense at smaller desktop heights.
8. The top tape can become crowded at high browser zoom levels.
9. Conflict detail buttons are visual affordances only unless further views are implemented.
10. The bundle is large because the globe and Three.js stack are heavy.

## Testing and Verification

Frontend test command:

```bash
cd frontend
npm test
```

Frontend build command:

```bash
cd frontend
npm run build
```

Root frontend test command:

```bash
npm run test:frontend
```

Backend test command:

```bash
npm run test:backend
```

Recent verification status:

- Frontend tests passed.
- Frontend production build passed.
- Playwright screenshots were captured at desktop sizes during visual QA.

## Local Development

Backend:

```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Root scripts:

```bash
npm run dev:backend
npm run dev:frontend
```

Default frontend URL:

`http://127.0.0.1:5173/`

Default backend URL:

`http://127.0.0.1:8000/`

## Recommended Next Steps

### Product

1. Decide whether the default product mode should be conflict-first, country-first, or sector-first.
2. Decide whether sector names should wrap, shrink, or truncate in the Sectors At Risk panel.
3. Add real detail views behind Timeline, Market impact, and Sources in the conflict card.
4. Add a source drawer for humanitarian/conflict data so casualty information can remain respectful and contextual.
5. Add a "View all conflicts" flow.
6. Add a way to toggle conflict, sector, market, and trade layers independently.

### Engineering

1. Move conflict data into the FastAPI backend.
2. Add backend Pydantic models for conflicts and conflict transmission.
3. Add API endpoints such as:

```text
GET /api/conflicts
GET /api/conflicts/{id}
```

4. Split `App.tsx` into smaller components:

```text
MarketTape.tsx
GlobeStage.tsx
ConflictPulsePanel.tsx
NewsPulsePanel.tsx
SectorsAtRiskPanel.tsx
CountryFilePanel.tsx
ConflictCard.tsx
```

5. Consolidate CSS overrides into clearer sections.
6. Add visual regression screenshots for desktop and narrower desktop viewports.
7. Consider code-splitting the globe route because the built bundle is large.

### Data

1. Replace static market tape with a provider-backed market data abstraction.
2. Replace static news pulse with a news/event ingestion source.
3. Add source metadata and timestamps to conflict data.
4. Add confidence scoring rules.
5. Add severity history so pulse animation and card content can reflect trend, not only current state.

## Important Implementation Warning

The conflict globe markers should remain native WebGL/Three.js objects unless there is a strong reason to change them.

Avoid using `htmlElementsData` for the conflict heat nodes without careful testing. A previous HTML marker implementation caused the globe to disappear or render incorrectly. The current implementation uses `objectsData`, `ringsData`, and `labelsData`, which is the safer direction for this project.

