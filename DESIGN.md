# Sovereign Lens Design Context

For detailed route inventory, architecture, setup commands, implementation notes, and longer product context, refer to `PROJECT_SUMMARY.md`.

## Visual Direction

Non-globe product pages should feel like a deep dark finance workstation: crisp, restrained, dense, premium, low-glow, and highly usable.

Target look: black-charcoal finance intelligence cockpit with platinum typography and restrained oxide or vermilion signal accents.

Prioritize clarity over cinematic effect. Use density carefully, not clutter. Every section should help the user understand markets, exposure, risk, evidence, or the next inspection path.

Avoid gold or champagne luxury styling, cyan AI dashboard styling, neon/cyberpunk language, purple sparkle AI styling, brown or sepia haze, crypto gradients, glowing borders, decorative glassmorphism, cheap icon systems, and giant empty hero sections.

The globe page can remain atmospheric and cinematic, but its language should not be smeared across the rest of the product.

## Applied UI Craft Rules

Use these practical checks when shaping or polishing any non-globe interface:

- Affordances must be visible. Selected tabs need a clear container, disabled actions need lower contrast plus disabled semantics, and clickable cards need hover, focus, cursor, or icon cues.
- Visual hierarchy should be explicit. Make the main object largest or strongest, keep metadata quieter, isolate critical values through position and contrast, and replace repeated labels with icons or structure when it improves scan speed.
- Spacing should follow a 4px rhythm. Keep related title/subtitle groups tight, usually 8-20px, and separate major sections with stronger gaps, usually 24-40px. Use whitespace to group meaning, not just grid columns.
- Dense workstation headers should usually stay at or below 24px. Use line-height around 1.1-1.25 for headings, normal tracking for product UI, and tabular numerics for market data.
- Color should be semantic. Product accent is for selection and inspect actions; green/red are only movement semantics; blue/info, green/success, red/error, and neutral/disabled must not be used as decoration.
- Dark mode depth comes from lightness, not heavy shadows. Higher surfaces are slightly lighter graphite, borders are barely brighter than the surface, and saturated colors are dimmed before use.
- Shadows should be felt, not seen. Prefer broad, low-opacity elevation; avoid tight dark outlines masquerading as polish.
- Icons and buttons need optical alignment. Icon boxes should match text line-height where possible, icon-only buttons need labels, and button horizontal padding should normally exceed vertical padding.
- Every interaction needs feedback. Hover, focus, pressed, disabled, loading, and success states should be visibly distinct without shifting layout.
- Text over imagery requires a real contrast system. Use a directional gradient or scrim behind copy rather than placing type directly over busy or light areas.

## App Shell And Density

Use a compact top-nav terminal shell for non-globe finance pages, not a left-sidebar SaaS shell.

Keep navigation compact, crisp, and finance-terminal-like. Preserve horizontal width for portfolio tables, watchlists, screeners, fund comparison, earnings views, exposure panels, charts, and event-to-portfolio workflows. Do not introduce a left sidebar during normal redesign or polish tasks unless explicitly asked.

Default density: balanced analyst workspace.

This means serious, compact, readable, and polished. Use enough whitespace for hierarchy and enough density for real finance work. No oversized heroes, empty decorative sections, or dashboards made of generic KPI tiles. Tables can be dense; meaningful charts need enough width and height to communicate clearly.

## Page Modes And Route Identity

All routes should share one finance system for typography, surfaces, borders, tables, charts, controls, actions, evidence cues, AI notes, data honesty, loading, and errors. They should not become identical templates.

Dominant object by route:

- Portfolio: holdings, exposure, allocation, performance, and the working home base.
- Watchlist: tracked names, movement, alerts, and watch reasons.
- Screener: filters and results.
- Earnings: calendar, result events, and affected names.
- Funds: comparison, overlap, cost, risk, and category context.
- Events/articles: evidence, exposure, source context, and affected sectors or holdings.
- AI answer/synthesis: concise synthesis tied to data, sources, assumptions, and inspect-next paths.

Do not give every route the same metric strip, big AI card, table, right rail, generic chart, and "see more" links. Coherent system, distinct work surfaces.

Workstation pages should be denser, scan-first, chart/table-led, compact, and interaction-heavy. Research, article, and event pages can be slightly more editorial, but must keep market relevance visible through metadata, source/freshness labels, exposure callouts, affected holdings, evidence, and inspect-next actions.

## Typography And Voice

Do not default to Inter unless there is a strong reason. Inter is good, but it can make the app feel like generic SaaS.

Preferred direction:

- Primary UI font: `Satoshi`
- Data, tickers, timestamps, metadata, and numerics: `IBM Plex Mono`
- Fallback UI stack: `"Satoshi", "IBM Plex Sans", "Inter", system-ui, sans-serif`
- Fallback data stack: `"IBM Plex Mono", "Geist Mono", "SF Mono", ui-monospace, monospace`

Safest alternative: `IBM Plex Sans` plus `IBM Plex Mono`. Modern alternative: `Geist` plus `Geist Mono`. Paid/editorial options such as Metric, Neue Haas Grotesk, Financier, or Berkeley Mono require confirmed licensing before use. Do not commit commercial fonts unless licensed.

Use variable fonts where possible and load only needed weights: 400, 500, 600, and 700 only if necessary. Prefer self-hosted WOFF2 for production stability.

Typography rules:

- headings use the primary UI font, medium/semi-bold weight, confident but not oversized
- body text uses the primary UI font with crisp off-white or readable cool grey
- table names and labels use UI font
- numbers, tickers, timestamps, percentages, bps, prices, units, chart tooltip values, and metric values use data font or `font-variant-numeric: tabular-nums`
- AI notes use short primary-font prose, not paragraph blocks
- article/research pages can use slightly larger body text and more editorial spacing

Avoid Poppins, Montserrat, Roboto-only default styling, Orbitron, cyberpunk fonts, decorative serif dashboards, too much mono text, tiny unreadable metadata, and font changes that make tables cramped.

Microcopy should sound like a concise intelligence brief. Use short analyst-like labels such as Watch, Inspect, Compare, Evidence, Exposure, Scenario, Assumption, Signal, Drag, Driver, Risk, Confidence, Source, What changed, Why it matters, and Affected holdings. Do not use hype copy, chatbot personality, motivational SaaS phrasing, playful education tone, cheap AI labels, or overconfident predictions.

## Color, Background, And Surfaces

Base UI:

- near-black neutral charcoal background with cool graphite undertone
- crisp off-white primary text
- readable cool grey secondary text
- subtle graphite borders
- platinum or silver micro-highlights

Primary accent: muted sovereign red, oxide copper, deep vermilion, clay, or restrained ember. Approximate ranges:

- oxide copper: `#B86A4B` to `#C87854`
- muted vermilion: `#C24132` to `#D04A3A`
- deep clay/rust: `#9F4A38` to `#B4533F`
- restrained ember: `#D97745`, used very sparingly

Use the accent for active nav edges, selected tabs, primary inspect actions, evidence cues, key portfolio action highlights, and tiny emphasis marks. Do not use it for every heading, every badge, every border, large backgrounds, market losses, or warning states.

Secondary accent: platinum/silver, not another bright color. Use `#D7D7CF` to `#F0EFE7` for highlights, `rgba(255,255,255,0.08)` to `rgba(255,255,255,0.14)` for graphite borders, and `#8B929C` to `#A1A8B3` for muted cool grey.

Semantic movement colors:

- green means positive price or performance
- red means negative price or performance

The product accent must not be confused with movement or loss.

Backgrounds should use one base layer and one or two disciplined surface levels. A very faint grid, radial noise, technical mesh, or coordinate-style texture is allowed only when nearly invisible and not behind dense tables or chart grids. Avoid brown haze, blur-heavy glass, visible blueprint grids, neon mesh, animated particles, and decorative wallpaper.

Panels should be distinct through tonal difference, graphite borders, disciplined spacing, internal alignment, crisp typography, and restrained elevation. Avoid nested card stacks. If content already sits inside a surface, use dividers, rows, subtle bands, spacing, or table structure instead of more cards.

Depth should feel engineered, not decorated.

## Information Hierarchy

Design around the inspection path:

1. What matters now
2. Why it matters
3. What portfolio or watchlist exposure is involved
4. What evidence supports the claim
5. What to inspect next

"What matters now" should appear as a compact insight band or first-row analyst note only when a real signal earns the space. It should contain one clear signal, why it matters, affected exposure, source/evidence cue, and one inspect action. Use a thin oxide/vermilion accent edge or marker, not a huge hero card or red panic banner. If no meaningful signal exists, omit the band and start with the main work surface.

Avoid equal-weight dashboards where every panel looks important. Prefer fewer sections, stronger hierarchy, cleaner surfaces, better typography, and more useful insight per pixel.

## AI Insight Presentation

AI is contextual, embedded, and evidence-aware. It should sit close to the relevant data and help interpret it. It should reduce cognitive load, not add more reading.

Use:

- compact insight strips
- concise analyst notes
- exposure callouts
- ranked drivers and risks
- clean comparison blocks
- assumptions and source-grounded cues
- evidence/source links
- inspect-next actions

Avoid:

- long text dumps
- generic AI summary cards full of paragraphs
- sparkle icons or decorative AI badges
- black-box claims not tied to data
- repeated chatbot inputs between sections
- AI content that replaces the chart, table, event, holding, or source it should explain

Most workstation AI notes should be one or two compact sentences or one to three short bullets. Long-form explanation belongs on research/article pages.

Prefer `Based on X sources` when real source counts exist. Use `Source-limited`, `Source unavailable`, `Confidence unavailable`, `Demo context`, or `Assumption` when evidence is limited. Do not use fake confidence percentages.

## Search And Command

Use a compact contextual command/search bar near the top of major non-globe work surfaces. It should feel like a serious market command layer, not a chat prompt.

Search the current page/domain first:

- portfolio: holdings, sectors, risks, exposure, actions
- watchlist: tracked assets, alerts, movements
- screener: tickers, sectors, filters, metrics
- earnings: companies, dates, results, calls
- funds: funds, categories, comparisons
- news/events: events, companies, sectors, sources

Preferred language:

- Search holdings, sectors, exposure...
- Search watchlist or alerts...
- Inspect ticker, sector, or event...
- Search companies, earnings, calls...
- Search funds or compare category...

Avoid "Ask anything," "Chat with AI," "What can I help you with?", sparkle icons, generic full-width prompt boxes, and repeated Perplexity-style inputs. Chat/follow-up search can exist later as contextual command behavior, not the main identity.

## Market Tape

Keep the existing market-status strip/tape largely as it is. Preserve its visual language unless explicitly asked to redesign it.

The tape can appear on non-globe pages where market context supports the workflow. Keep it compact, calm, readable, and route-aware:

- portfolio: indices, portfolio movers, exposed sectors, P&L context
- watchlist: tracked names, movers, alert count, affected sectors
- screener: breadth, selected universe context, sector leadership
- earnings: reporting names, post-result movers, watchlist reporting
- funds: benchmark or category context
- events/news: affected sectors or holdings, freshness/source cue
- AI answer: referenced symbols, sectors, events, or evidence freshness

Do not make it taller, louder, neon, crypto-like, aggressively animated, or stuffed with random instruments. Label demo, delayed, static sample, or local data lightly when relevant.

## Page Headers And Metrics

Headers should orient the user, then get out of the way.

Default header structure:

1. page title
2. one-line purpose or current status
3. lightweight data honesty label where relevant
4. one compact command/search input or one primary action, not both unless clearly needed

Avoid big hero headers, marketing copy, welcome panels, oversized slogans, decorative icons, huge empty top sections, and making every page start like a dashboard.

`/portfolio` can have the strongest concise header because it is the working home base. It may include portfolio value, today's P&L, source/local/demo status, last updated status, and compact command input. It should still move quickly into the main decision surface.

Summary metrics should be used sparingly and deliberately. Do not add an automatic row of four KPI cards to every page. Use metrics only when they answer what changed, how large the move was, what is exposed, what the impact is, how fresh the data is, or what needs attention.

Metrics should have a clear label, value, unit where needed, change context where relevant, and source/freshness label where trust is affected. Use compact strips or small cards, tabular numerics, muted labels, strong value contrast, and green/red only for actual movement.

## Right Rail And Inspection

A right-side context rail is allowed as a recurring finance-page pattern only when it earns its space.

Use a rail for useful secondary context such as watchlist context, portfolio exposure summary, related events, source/evidence cues, gainers/losers, upcoming earnings, alerts, inspect-next paths, related holdings or sectors, scenario assumptions, and confidence/source notes.

The main column must remain the priority. Primary decisions and primary data stay in the main workspace. The rail should not hold primary workflow controls, squeeze charts or tables, or become generic widget noise. On tablet widths, the rail should usually collapse below the main content or become a compact secondary band.

Inspection should preserve context. When a user clicks a holding, event, fund, earnings item, chart point, or table row, prefer inline selection plus a right rail, local detail drawer, expandable row, or adjacent inspection panel. Reserve full pages for deeper research flows. Use modals only for confirmations, destructive actions, small edits, settings, or small form entry.

A detail rail/drawer should show item identity, current status, why it matters, portfolio/watchlist exposure, key drivers or risks, evidence/source context, assumptions/confidence if AI is involved, and inspect-next actions. Keep it compact.

## Evidence And Sources

Evidence should be inspectable, not performative.

Use compact evidence triggers near the claim they support:

- 4 sources
- Evidence
- Sources
- Updated 9m ago
- Source unavailable
- Confidence unavailable

Evidence should appear near analyst notes, event exposure, alerts, charts, portfolio actions, watchlist movement explanations, earnings summaries, and market signal rows.

Use three levels:

1. Inline evidence cue: tiny pill such as `4 sources`.
2. Expandable source preview: source name, short title/snippet, timestamp, and relevance.
3. Full evidence view: only for deeper research pages, event dossiers, or source-heavy investigations.

Do not put all sources at the bottom of a page if the user cannot tell which claim they support. Do not show giant citation walls, bright source badges, or logos as decoration. If source links are not implemented, use `Source preview` or `Source unavailable` rather than fake links.

## Tables

Tables are the serious workhorse of Sovereign Lens.

They should be dense but readable, scan-first, sortable where useful, precise with numbers, visually calm, and designed for comparison, filtering, and inspection. Do not replace real desktop/tablet finance tables with card grids unless the content is genuinely not tabular.

Visual rules:

- compact row height, not cramped
- clear column alignment
- tabular numerics for all numbers
- right-align numeric values
- left-align names, tickers, companies, sectors, funds, and event labels
- muted row dividers or gridlines
- no heavy boxed cell borders
- no loud zebra striping
- restrained hover and selected states
- crisp header typography
- sticky headers for long lists when useful
- subtle header/body separation
- minimal badges, pills, icons, and colored dots

Column priority:

1. identity: ticker, company, fund, event
2. current value or status
3. movement/change
4. exposure/weight/impact
5. evidence/source/freshness
6. secondary metadata
7. actions

Use finance-grade formatting: `₹`, `%`, bps, `x`, `Cr`, `L`, tabular numerics, consistent decimals, clear `+` and `-`, and muted neutral values. Do not use the product accent for positive/negative movement.

Data freshness, local/demo state, or source status should appear near the table title or section header. Do not repeat the same label in every row unless row-level source status differs.

## Charts

Charts are one of the main quality markers of the product. They are not decoration.

Chart guidance is informed by serious finance and data-visualization references such as Bloomberg chart tools, TradingView Lightweight Charts, Apple charting guidance, Datawrapper Academy, Financial Times Visual Vocabulary, Observable examples, Koyfin-style market workspaces, and the user's Perplexity Finance references. Extract principles; do not copy any product.

Use a chart only when it helps the user understand what changed, when it changed, how large the move was, what drove it, what is exposed, or what needs inspection next. If a chart does not answer a real finance question, remove it.

Chart levels:

1. Primary charts: portfolio performance, watchlist movers, exposure over time, fund comparison, sector/holding contribution, earnings reaction, event impact.
2. Supporting charts: allocation, trend comparisons, risk distribution, source/evidence movement.
3. Micro charts: sparklines in tables, asset cards, or small movement previews.

Primary charts should be wide and tall enough to read. They should usually pair a short title, key movement, chart, concise interpretation note, range controls, source/freshness cue where needed, and one inspect-next action. Do not squeeze important charts into tiny cards.

Visual rules:

- dark charcoal chart surface
- clean plot area
- subtle gridlines
- readable axes and labels
- clear baseline where relevant
- thin but confident lines
- restrained fills only when meaningful
- no default chart-library styling
- no neon, gold, cyan, purple glow, rainbow palettes, or heavy shadows
- no fake-smoothed curves that imply precision

Axes and units must be legible and formatted properly: `₹`, `%`, bps, `x`, `Cr`, `L`, time, and consistent decimals. Do not hide scale when the user needs it. Do not imply precision that does not exist.

Color must carry meaning. Green is positive movement, red is negative movement, neutral grey is context or inactive comparison, and product accent is for selected series or annotation only when it does not conflict with movement. Multi-series charts should limit active lines, highlight the primary series, push secondary series back, and use direct labels where possible.

Interactions should be inspectable and honest: range controls, hover crosshair, tooltip with date/time, value, change, and series name, selected-series state, click-to-inspect where implemented, and clear comparison controls. Do not show fake compare dropdowns or interactions that look clickable but do nothing.

Annotations should be sparse and useful: `Prev close`, `Earnings`, `Crude spike`, `Rate decision`, `Result call`, `Event update`.

Prefer line charts for time-series, bars for contribution/impact, stacked bars only when readable, heatmaps for breadth or large universe scans, and scatter/bubble only with clear axes. Avoid donut/pie by default unless the allocation summary is very simple.

Standardize chart wrappers, tooltip, axis, grid, legend, range controls, empty state, and tokens across the app. A chart should feel expensive, calm, sharp, readable, finance-native, insight-led, and trustworthy.

## Filters, Tabs, And Controls

Filters should feel like precise market controls, not SaaS decoration.

Filters should be compact, close to the data they affect, visibly active, easy to clear, tied to result count where useful, and honest. Do not show filters that do nothing.

Use the right control:

- segmented controls for time ranges and simple mutually exclusive modes
- chips for sector, risk level, event type, market cap, watchlist group, alert state, or freshness state
- dropdowns for larger option sets, fund categories, screener fields, sort modes, and comparison universe
- search/command for ticker, company, fund, sector, event, and source
- advanced drawer only for heavy screening or complex comparison

Active filters need a clear but restrained state, active count, result count, and Clear/Reset when needed. Tabs should organize meaningful views such as holdings vs sectors, reported vs upcoming, equity vs debt funds, events vs evidence. The default tab should be the most useful working view.

Do not use fake controls, decorative sort icons, giant static filter sidebars, too many tabs, hidden primary data, or hover states that imply clickability when nothing happens.

## Actions And Navigation

Each section should have one clear primary action at most. The strongest actions should move the user toward inspection, evidence, comparison, exposure review, watchlist context, or portfolio context.

Preferred actions:

- Inspect exposure
- View evidence
- Compare funds
- Review watchlist
- Inspect holding
- Compare with benchmark
- Add to watchlist
- Review risk
- Open earnings
- Inspect affected names

Avoid vague actions such as See more, Explore, Learn more, Get started, Discover insights, and Unlock analysis. Use Read more only for actual article continuation.

Avoid broker/execution language unless real execution exists: Buy, Sell, Trade now, Invest now, Execute, Place order, Book profit, Exit position.

Secondary actions should be quiet text buttons, ghost buttons, or small icon buttons only when obvious. Disabled/future actions must be visibly disabled and labelled Coming soon, Preview, Not connected, Unavailable, Demo, Local only, or Requires connection. Do not add fake buttons, empty modals, hidden console behavior, or dead click-through.

Route-to-route navigation should follow the investor's investigation path: signal -> exposure -> evidence -> comparison -> decision support. Use intent labels such as Inspect exposure, Review watchlist, Compare funds, View evidence, Check affected names, Review risk, Compare alternatives, Add to watchlist, and Track this signal. Avoid link mazes.

## Empty, Loading, Error, And Alert States

Empty states should be compact, operational, and honest. They should explain what is missing, why it is empty, whether the data is Local, Demo, Preview, Not connected, Browser-only, or unavailable, and one clear next action. Avoid cute illustrations, mascots, motivational copy, oversized blank panels, fake progress, and decorative empty cards.

Loading states should be quiet skeleton rows, skeleton chart blocks, compact status rows, muted labels, and preserved layout space. Avoid big centered spinners, full-page drama, glowing loaders, fake terminal animations, and layout shifts.

Error states should be precise and section-level where possible. Explain what failed, what data is still available, whether visible data is stale/local/demo/unavailable, and what the user can do next. Only show Retry if retry is actually implemented. Use muted amber or neutral grey for unavailable/delayed/stale states; reserve red for real failures.

Alerts should be evidence-linked watch/inspect signals, not pushy urgency. They should connect to evidence, affected holdings, watchlist assets, sectors, or events and disclose Local, Demo, Static, Delayed, or Not connected status. Separate market movement from risk/event severity. Use severity labels only when there is a defined reason.

Preferred alert labels: Watch, Review, Inspect, Evidence, Source unavailable, Local alert, Browser-only, Not connected, Demo signal, Confidence unavailable.

Failure states should preserve trust and keep the user working.

## Icons And Visual Markers

Avoid icons by default. Use icons only when they make the interface clearer.

Allowed uses include search in command inputs, close controls, chevrons for expansion, sort indicators, external-link source icons, info icons for compact explanations, warning icons for real warning/error states, and plus/minus where they improve add/remove clarity.

Avoid sparkle AI icons, magic wands, colorful finance icon packs, decorative stock icons, excessive arrows, emoji indicators, crypto-style symbols, patriotic icons, section-decoration icons, and icon-only buttons when the meaning is not obvious.

Prefer thin accent edges, selected row state, source pills, compact labels, `+`/`-` signs, subtle dividers, status text, graphite borders, row highlight, typography contrast, and tabular numerics.

If icons are used, keep one stroke style, small size, muted color, consistent alignment, no glow, no filled colorful icons, and no competing with numbers or labels.

## Accessibility And Readability

Contrast is non-negotiable. Premium dark UI must remain readable during real market inspection.

Use crisp off-white primary text, readable cool grey secondary text, legible metadata, strong numeric contrast, clear labels, visible focus states, and keyboard-accessible controls.

Never rely on color alone to communicate positive/negative movement, selected state, disabled state, alert state, source confidence, or market status. Pair color with signs, labels, borders, selected states, or text context.

All interactive controls need clear default, hover, focus, active, selected, disabled, loading, and error states. Keyboard access should work for tabs, filters, segmented controls, selectable table rows, buttons, command inputs, dropdowns, evidence expanders, and drawers.

Charts must have readable axes, tooltip text, legends or direct labels, and contrast that works on dark backgrounds. Respect reduced-motion preferences where possible.

Compact controls still need usable pointer targets: filter chips, segmented controls, table actions, source pills, chart range controls, drawer close buttons, and command input actions.

## Motion

Motion should confirm state, guide attention, and preserve flow. It should never become decoration, delay, or drama.

Allowed motion: row selection, hover/focus, tab transitions, drawer/rail open-close, expandable evidence, chart tooltip/crosshair movement, selected chart series, loading skeletons, command focus, filter selection, and small saved/added/removed/updated states.

Keep motion fast, subtle, functional, predictable, and easy to ignore. Avoid cinematic motion outside the globe, animated glow, particles, pulsing borders, bouncing cards, slow easing, parallax, animated gradients, distracting chart redraws, and AI magic animations.

The `/` globe route is the only surface allowed to be more cinematic, and globe changes require explicit instruction.

## Responsiveness

This product is desktop/tablet-first only. Screens below `768px` are intentionally unsupported through the existing mobile gate.

Allowed responsive work:

- tablet and small-laptop layout refinement
- desktop resizing
- side panel behavior
- chart/table density above `768px`
- one-column fallbacks for crowded product routes

Do not build phone-first layouts, hamburger menus, bottom nav, phone dashboards, or card replacements for dense finance tables unless the user explicitly asks for a real mobile version.

## CSS And Change-Safety Rules

Prefer route-scoped styles under existing route shells.

Do not casually modify broad or global selectors such as:

- `body`
- `:root`
- `.app-shell`
- shared nav or layout wrappers
- `.portfolio-screen`
- `.portfolio-workspace-screen`
- other shared screen-level classes

Only touch global styles when the task explicitly requires it, and then verify that unrelated routes are visually unaffected.

Important rules:

- Do not apply portfolio-specific layout assumptions to markets, earnings, screener, watchlist, funds, articles, or AI answer pages.
- Do not use one page's layout as a blanket pattern for every route.
- Visual finish passes should improve tokens, surfaces, borders, typography contrast, spacing rhythm, states, and component polish before changing major layout structure.
- If layout changes are necessary, keep them local to the target route.
- Any multi-route layout change must be checked at `1440x900`, `1024x768`, and `900x768`.
- If a new CSS layer is added, it must clearly state its scope in comments.
- New CSS layers must avoid globe selectors unless the task explicitly asks for globe changes.
- Before final response, mention which route shells and CSS files were touched.

For broad redesign tasks, first identify target routes, protected routes, shared files that could cause visual side effects, and screenshots or viewport checks needed before calling the task complete.

## Visual QA Before Completion

UI work is not done until it has been seen.

For broad UI changes, redesigns, visual polish passes, layout changes, chart/table changes, or shared CSS updates, screenshots are required before final response. Changed non-globe routes should be checked at:

- `1440x900`
- `1024x768`
- `900x768`

Inspect for squeezed charts, cramped tables, broken rails, oversized headers, poor density, unreadable text, wrapping, overflow, broken filters, tablet issues, loud market tape, cheap icon clutter, huge hero cards, muddy haze, and fake-looking controls.

For broad non-globe UI work, include `/` only as a protection check. Verify the globe route remains visually unchanged and mention any shared/global files that could affect it.

Before final response, report changed routes, screenshots/viewports checked, visual issues found and fixed, whether `/` was checked when relevant, build/typecheck result, and files changed.

Passing tests means the app compiles. Screenshots prove the product still looks and behaves like a serious finance intelligence cockpit.

## Globe Route Protection

The `/` globe route is the signature cinematic screen and is protected by default.

General UI redesigns, cleanup sweeps, theme refactors, global CSS changes, typography changes, layout changes, or make-the-app-more-premium tasks must not alter the globe route visually unless the user explicitly asks for changes to the globe page.

Default rule:

- Do not touch the globe page during broad redesigns.
- Do not let global CSS, theme, or token changes accidentally affect the globe page.
- Route-scope non-globe redesign work wherever possible.
- If a shared or global change is necessary, verify that the globe page remains visually unchanged.
- Mention any files touched that could affect the globe route.

Allowed without explicit globe request:

- build-breaking fixes
- type errors
- accessibility-only fixes
- non-visual bug fixes
- small structural fixes that do not change appearance

Allowed only with explicit request:

- globe visual redesign
- globe layout changes
- cinematic style changes
- globe navigation or header changes
- market tape changes on the globe surface
- animation or atmosphere changes

Explicit request means the user clearly mentions the globe route, lens page, or `/` page and asks for it to be changed.

Rule: protected by default, editable by explicit instruction.
