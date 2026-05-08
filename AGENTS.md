# AGENTS.md

## Product Direction

This project is a finance terminal / market intelligence dashboard. It is intentionally designed for larger screens where users can properly work with dense market data, charts, tables, watchlists, portfolios, research views, and decision-support workflows.

The product is desktop/tablet-first only.

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
