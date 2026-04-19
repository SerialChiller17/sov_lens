# Sovereign Lens MVP Plan

## Summary
Build a high-fidelity local MVP with a **React + Vite + TypeScript frontend** and a **FastAPI backend**. The backend will serve deterministic dummy intelligence data only; the frontend will deliver the product vision: a cinematic 3D geopolitical risk globe, country intelligence sidebar, global pulse HUD, and sector supply-chain overlays.

The first screen is the product itself, not a landing page: full-bleed dark globe, tension heat map, floating HUD, country click behavior, and sector controls.

## Key Changes

- Scaffold a two-app project:
  - `frontend/`: React, TypeScript, Vite, Globe.gl/Three.js, lightweight charts.
  - `backend/`: FastAPI, Pydantic models, static dummy data modules.
  - Root scripts/docs for running both locally.

- Backend dummy API:
  - `GET /api/health`
  - `GET /api/countries`
  - `GET /api/countries/{iso3}`
  - `GET /api/global-pulse`
  - `GET /api/sectors`
  - `GET /api/sectors/{sectorId}`
  - `GET /api/market-pulse`
  - Enable CORS for local frontend development.

- Country data model:
  - ISO-3 code, name, flag, capital, coordinates.
  - GDP, population, GDP growth, GDP per capita, GINI.
  - `tensionScore` from 1-10 with label: Stable, Developing, High Risk.
  - Group badges such as G20, BRICS+, QUAD, NATO, ASEAN, OPEC+.
  - Industry criticality notes.
  - Top 3 export/import partners with ISO codes.
  - Contrarian insight sentence.
  - Dummy market index and FX data.

- Dummy dataset:
  - Include around 12 countries for the MVP: USA, India, China, Taiwan, Japan, South Korea, Netherlands, Germany, Saudi Arabia, UAE, Russia, Brazil.
  - Include enough data to demonstrate green, amber, and red states.
  - Include trade partner relationships so arcs and highlighting work.
  - Include three sectors: Semiconductors, Hydrocarbons, Critical Minerals & EV Batteries.

## Frontend Experience

- Full-screen 3D globe:
  - Use `Globe.gl` with dark ocean/space styling, atmospheric glow, country polygons, and auto-rotation.
  - Heat-map countries by `tensionScore`:
    - Green for 1-3.
    - Amber/gold for 4-6.
    - Crimson for 7-10.
  - Hover highlights country borders.
  - Click centers the globe on the selected country and opens the intelligence sidebar.

- Visual direction:
  - Match the supplied references: black/charcoal space field, glowing globe, sparse stars, white/cyan/yellow highlights, institutional cyber-finance feel.
  - Avoid a purple/blue-dominated gradient theme.
  - Use a public-domain night-earth or black-marble texture as a bitmap asset if compatible with Globe.gl; otherwise use polygon + atmosphere rendering with a subtle image-backed star/space layer.
  - Keep the globe full-bleed, not inside a decorative card.

- Country intelligence sidebar:
  - Identity block with flag, country name, capital, population, GDP, growth, GDP per capita, GINI.
  - Tension score meter with component-style dummy breakdown: structural, sentiment, live trigger.
  - Group badges.
  - Industry criticality badge/brief.
  - Mini line chart for market index pulse using dummy series.
  - FX card showing USD/local currency and 24h volatility.
  - Trade partners widget with export/import toggle.
  - Contrarian insight at the bottom.

- Global Pulse HUD:
  - Top-right transparent HUD with:
    - 3 critical dummy alerts.
    - 3 daily mega-trends.
    - 3 market movements with trigger text.
    - Last structural/sentiment update timestamps.
  - Copy should sound like institutional analyst output, not marketing.

- Sector overlay:
  - Left or bottom control rail with sector buttons.
  - Selecting a sector dims unrelated countries, highlights power nodes, draws arcs, and shows a sector intelligence panel.
  - Arc colors:
    - Semiconductors: electric cyan.
    - Hydrocarbons: cyber amber.
    - Critical minerals: neon emerald.
  - Include dummy chokepoint annotations for Malacca, Hormuz, and Suez.

## Implementation Details

- Frontend state:
  - Fetch all dummy API data on app load.
  - Keep selected country, selected sector, active trade mode, and sidebar tab in React state.
  - Derive globe colors/arcs from backend data plus current UI state.

- Backend structure:
  - Pydantic response models for countries, sectors, pulse alerts, market movements, and trade partners.
  - Static Python dictionaries/lists as the dummy database.
  - No live RestCountries, TradingView, GDELT, OEC, RSS, or OpenAI calls in the MVP.

- Styling:
  - CSS modules or plain CSS with design tokens.
  - Responsive desktop-first layout with mobile fallback: globe remains primary, HUD/sidebar become collapsible panels.
  - Buttons/cards use radius `8px` or less.
  - No nested cards, no decorative orb backgrounds, no landing-page hero.

## Test Plan

- Backend:
  - FastAPI endpoint tests for all routes.
  - Validate known countries return full sidebar data.
  - Validate unknown ISO returns 404.
  - Validate sector endpoints return nodes and arcs.

- Frontend:
  - Smoke test app render.
  - Test API client transforms responses correctly.
  - Test selected country opens sidebar.
  - Test sector selection changes displayed sector panel and arc data.
  - Test trade toggle changes highlighted partners.

- Manual acceptance:
  - Run backend and frontend locally.
  - Confirm first screen is the globe experience.
  - Click India, Taiwan, Saudi Arabia, and USA; each should show distinct intelligence.
  - Toggle each sector and verify highlighted nodes/arcs change.
  - Resize to mobile width and confirm text does not overflow.

## Assumptions

- Stack is locked to **React + FastAPI**.
- MVP priority is **high-fidelity demo** over real data integration.
- Backend serves dummy data only, but API shapes should be realistic enough to swap in live sources later.
- Authentication, database persistence, admin dashboard, real-time ingestion, LLM synthesis, and deployment are out of scope for this first MVP.
- The MVP should be portfolio/demo ready on a local machine before production hosting is considered.
