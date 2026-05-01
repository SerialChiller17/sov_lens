# Frontend Architecture Map

This frontend is being migrated from a single-file prototype shape into explicit product boundaries. The goal is to keep visual behavior stable while making future changes local, reviewable, and easier for humans and AI coding agents to reason about.

## Current Architecture

- `src/App.tsx` mixed route selection, navigation, mock data, legacy globe/news components, portfolio UI, chart logic, formatting helpers, and feature state.
- `src/App.css` carried several product generations in one ordered cascade, including legacy lens styles, events/news pages, the current globe monitor, global navigation, and portfolio dashboard styles.
- Some features already had local folders (`funds`, `globe-monitor`, `features/market-tape`), but app shell, events, and portfolio had not been split along the same boundary.

## Target Architecture

- `src/app`: app shell, route constants, route parsing, and shared top navigation.
- `src/features/events`: global events dashboard, full news article view, route-local mock event/news data, and event-specific types.
- `src/features/portfolio`: portfolio screen, portfolio-only components, mock portfolio data, types, and formatting helpers.
- `src/globe-monitor`: current global intelligence monitor and its local mock data.
- `src/funds`: funds product flow and its local mock data.
- `src/styles`: global CSS entrypoint plus staged legacy/style strata that preserve cascade order while large CSS is extracted incrementally.

## Migration Steps

1. Keep behavior stable and first extract route/app shell, events, and portfolio from `App.tsx`.
2. Split `App.css` by ordered product/style strata instead of rewriting selectors all at once.
3. Keep legacy CSS in clearly named files until each legacy screen can be retired or tested separately.
4. Prefer feature-local types, data, helpers, and components when ownership is specific to one product surface.
5. Only promote code to shared folders after reuse is real and the shared contract is clear.

## Contributor Guidance

- Start changes in the relevant feature folder before touching app-wide files.
- Keep route files thin: routing and data handoff belong there, not dense UI composition.
- Put mock data beside the feature that consumes it so backend replacement has a small import surface later.
- Preserve CSS import order unless intentionally changing cascade behavior.
- If a change needs multiple folders, note the dependency direction in the PR or commit message.

## CSS Import Order

`src/styles/index.css` preserves the old cascade order through explicit imports:

1. `styles/base.css`
2. `styles/legacy-lens.css`
3. `features/events/events-dashboard.css`
4. `styles/legacy-home.css`
5. `features/events/news-article.css`
6. `globe-monitor/GlobeMonitor.css`
7. `app/global-navigation.css`
8. `features/portfolio/portfolio.css`
9. `styles/responsive.css`

When moving selectors out of legacy files, keep the route or feature import in the same relative order until screenshots/tests prove a cascade change is intended.
