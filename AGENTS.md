# AGENTS.md

Last updated: June 17, 2026

## Product Direction

This project is a finance terminal / market intelligence dashboard. It is intentionally designed for larger screens where users can properly work with dense market data, charts, tables, watchlists, portfolios, research views, and decision-support workflows.

The product is desktop/tablet-first only.

Sovereign Lens is an Indian-market intelligence cockpit with a distinctive geopolitical risk lens. The product should feel like a serious analyst workstation: dense, calm, premium, market-aware, evidence-led, and decision-supportive.

`/` is the signature Global Intelligence Monitor and should remain the cinematic macro-risk lens. `/portfolio` is the working home base for holdings, exposure, evidence, and inspect-next decisions. `/markets`, `/earnings`, `/screener`, `/funds`, `/watchlist`, `/news-pulse`, `/news-pulse/:newsId`, and `/answer` support the investigation path around markets, events, source context, portfolio exposure, and watchlist action.

The default workflow direction is:

```text
Signal or event -> explanation -> affected sectors/stocks -> portfolio/watchlist exposure -> evidence -> inspect next
```

Refer to:

- `PROJECT_SUMMARY.md` for current route inventory, architecture, data inventory, tests, limitations, and roadmap.
- `PRODUCT.md` for product promise, user, voice, capability truth, and decision posture.
- `DESIGN.md` for visual direction, route protection, UI craft rules, and visual QA expectations.

## No-Mobile Policy

Do not optimize the main finance terminal for mobile phone screens.

Screens below `768px` are intentionally unsupported and should show the existing mobile unsupported screen through:

- `frontend/src/App.tsx`
- `frontend/src/app/DesktopOnlyGate.tsx`
- `frontend/src/app/desktop-only-gate.css`

Do not remove, bypass, or weaken this gate unless the user explicitly asks for a real mobile version.

## What Not To Build

Do not spend time creating or improving:

- mobile-first layouts
- hamburger menus
- bottom navigation
- mobile drawers
- phone-specific dashboards
- phone-specific chart layouts
- mobile card replacements for dense tables
- stacked mobile versions of portfolio, watchlist, market, or research workflows

Do not spend time adjusting dense dashboards, watchlists, charts, portfolios, or market tables for phone screens.

Do not degrade the desktop/tablet experience to make the product fit on small phones.

## What Responsive Work Is Allowed

Responsive work is allowed only for:

- tablets
- small laptops
- desktop browser resizing
- side panels
- charts
- tables
- density and spacing improvements above `768px`

The app should remain strong from tablet width upward.

## Default Rule For Future UI Work

For all future frontend/UI/UX tasks, assume:

> Desktop and tablet support are required. Phone support is intentionally blocked.

If a task appears to require mobile phone optimization, stop and ask the user before doing it.

## Design Decision

This is a finance terminal-style product. The experience depends on information density, chart readability, table scanning, watchlist utility, portfolio context, and research workflows.

Forcing this product into a phone layout would reduce usability, trust, and product quality. A dedicated mobile version or app can be designed separately later.

## Globe Route Protection

The `/` globe route is protected by default. Broad UI redesigns, finance-route polish, theme cleanup, and CSS refactors should not visually alter the globe page unless the user explicitly asks for globe changes.

Prefer route-scoped styles for non-globe work, especially under:

- `.portfolio-app`
- `.events-dashboard-shell`
- `.news-article-shell`
- `.ai-answer-shell`

If a shared/global change is necessary, verify that the globe route still looks and behaves as intended.

## Production Frontend And Capability Truth

Do not imply live data, broker sync, real alerts, real AI confidence, source verification, trading execution, or account persistence unless the code actually implements it.

Current important constraints:

- Portfolio data is local/sample data, not broker-synced.
- Watchlist and local alert state are browser `localStorage` only.
- Market, fund, event, portfolio, and news datasets are static, deterministic, generated, or frontend-local unless served by the existing deterministic backend.
- `/answer` is a frontend synthesis handoff using local market-development data or fallback copy. It is not a live LLM-backed answer service yet.
- Source chips, evidence drawers, and `Based on X sources` labels should reflect available source data and should not pretend to be verified live research.

These constraints are engineering and product-planning truths, not normal UI copy. Treat Sovereign Lens as the frontend of a real, premium finance website. Do not put implementation-status labels in ordinary user-facing screens.

Avoid visible copy such as:

- Demo
- Static sample
- Browser-only
- Local
- Not live
- Live API
- Mock data
- Sample data
- Source unavailable
- Confidence unavailable
- Frontend-only

Do not use those labels in page subtitles, badges, cards, rails, helper text, search prompts, table headings, empty states, or action feedback. If a capability is not implemented, omit unsupported claims, hide or disable unsupported actions, and use product-language states such as Add holding, Create watchlist, Connect account, Set alert, View evidence, Refresh, Retry, or Manage only when the action has a real interaction contract.

Future cleanup work should remove implementation-status copy from existing product screens. This cleanup directive excludes the protected `/` globe route and the current `/markets` screen unless the user explicitly asks to change them.

## Non-Globe UI Rules

Non-globe product pages should use the deep dark finance-workstation system described in `DESIGN.md`: compact navigation, restrained graphite surfaces, platinum typography, semantic movement colors, tabular numerics, crisp tables, readable charts, compact evidence cues, and purposeful right rails.

Do not build generic landing-page sections, oversized heroes, decorative dashboards, repeated AI chat boxes, sparkle/magic AI visuals, fake controls, or card-heavy mobile-style replacements for dense finance workflows.

When applying frontend-design or taste-skill guidance, translate it into Sovereign Lens rather than copying generic website patterns. "Bold" means a clear, memorable finance-workstation concept executed with precision: real workflow surface first, strong dominant object, distinctive but serious typography, locked dark theme, one restrained accent, controlled density, purposeful motion, and no decorative gimmicks.

For UI review, UX audit, accessibility check, or "check my site" requests, apply the Web Interface Guidelines layer in `DESIGN.md`. Fetch the current guideline source first, then report concise `file:line` findings. For implementation work, satisfy the local checklist around semantic controls, labels, focus-visible states, reduced motion, long-content handling, image dimensions, URL state, dark-mode controls, and dynamic `Intl` formatting.

Current implemented patterns to preserve:

- Animated search prompts are route-specific command examples, not chatbot promises.
- Market movement numerics outside the globe route use calm finance typography and tabular numerics.
- Section headers generally live outside the panel they describe.
- Use one visible box per content unit.
- Avoid box-within-box and panel-within-panel composition. If content is already inside a surface, use rows, dividers, bands, tabs, or table structure instead of adding another bordered card stack.
- Avoid duplicate identity text in compact feeds when the company, fund, event, or section name is already clear.
- Evidence, freshness, and source cues should appear only when they represent real product information. Do not add decorative status dots, version labels, build labels, section-numbering eyebrows, fake timestamps, or implementation badges as visual filler.
