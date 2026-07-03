# Sovereign Lens Design Context

For detailed route inventory, architecture, setup commands, implementation notes, and longer product context, refer to `PROJECT_SUMMARY.md`.

Last updated against the current codebase: June 17, 2026.

## Visual Direction

Non-globe product pages should feel like a deep dark finance workstation: crisp, restrained, dense, premium, low-glow, and highly usable.

Target look: black-charcoal finance intelligence cockpit with platinum typography and restrained oxide or vermilion signal accents.

Prioritize clarity over cinematic effect. Use density carefully, not clutter. Every section should help the user understand markets, exposure, risk, evidence, or the next inspection path.

Avoid gold or champagne luxury styling, cyan AI dashboard styling, neon/cyberpunk language, purple sparkle AI styling, brown or sepia haze, crypto gradients, glowing borders, decorative glassmorphism, cheap icon systems, and giant empty hero sections.

The globe page can remain atmospheric and cinematic, but its language should not be smeared across the rest of the product.

The current non-globe finish is route-scoped around `.portfolio-app`, `.events-dashboard-shell`, `.news-article-shell`, and `.ai-answer-shell`. Treat that boundary as intentional: it lets finance, event, article, fund, and AI synthesis surfaces share a workstation system without accidentally changing the protected globe route.

## Production Frontend Standard

Design every normal product screen as if Sovereign Lens is already the frontend of a serious, real finance website. The UI should feel capable, expensive, and operating-grade, not like a preview build, prototype, demo, localhost surface, or API-status page.

Do not put implementation-status copy in the visible product UI. Avoid user-facing labels, badges, subtitles, helper text, empty states, table headings, rails, and feedback that say or imply:

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

These facts can live in `PROJECT_SUMMARY.md`, engineering docs, comments, test assertions, admin/debug surfaces, backend/data boundaries, or legal/compliance disclosures. They should not appear as normal page chrome.

Truthfulness is still required. Do not fake live data, broker sync, alerts, source verification, real AI confidence, or trading execution. Instead, design around the available capability:

- omit unsupported claims
- disable or hide unsupported actions
- show evidence only when evidence exists
- use product-language states such as Add holding, Create watchlist, Connect account, Set alert, View evidence, Refresh, Retry, or Manage
- keep legal/risk copy concise and professional

Past-cleanup directive: future cleanup work should remove implementation-status copy from existing non-globe routes except the protected `/` globe route and the current `/markets` screen, which are excluded from this cleanup directive unless explicitly requested.

## Taste Skill Operating Layer

Use the Taste Skill v2 learning as a permanent design filter, but translate it for Sovereign Lens. The skill is strongest at reading briefs, avoiding generated-web cliches, enforcing visual locks, and forcing pre-flight checks. It is not a dashboard or data-table recipe, so do not import its landing-page patterns blindly into finance workspaces.

Default design read for this product:

```text
Reading this as: desktop/tablet Indian-market intelligence workstation for active investors, with a dense premium finance-terminal language, leaning toward route-scoped React/CSS, restrained motion, deep dark surfaces, tabular data, and evidence-led workflows.
```

Default route dials:

- Non-globe finance workspaces: layout variance 4-5, motion intensity 2-3, visual density 8-9.
- Events, articles, and answer views: layout variance 5-6, motion intensity 2-3, visual density 6-7.
- Protected globe route: layout variance and motion can stay higher, but globe changes require explicit instruction.

Before changing a route, read the brief and name the dominant object: table, heatmap, timeline, chart, evidence drawer, holdings list, fund comparison, article, or synthesis brief. The dominant object decides the layout. Do not default to equal cards, a hero block, a right rail, or an AI panel unless that object earns the space.

Use these three locks on every route:

- Color Consistency Lock: one product accent per route. Movement colors stay semantic; do not introduce random teal, cyan, purple, gold, or blue accents mid-page.
- Shape Consistency Lock: one radius system per route. If buttons, cards, inputs, chips, and drawers use different radii, the rule must be intentional and repeated consistently.
- Page Theme Lock: one page theme. Non-globe routes stay in the dark finance-workstation family; do not insert warm paper, bright marketing blocks, or inverted sections halfway down the page.

Use Taste Skill anti-slop bans as hard UI checks for Sovereign Lens:

- no em dash or en dash characters in visible product copy; rewrite with commas, periods, colons, or short sentences
- no section-numbering eyebrows such as `01 / Overview`, `002`, or `INDEX`
- no hero version labels, build numbers, release tags, invite-only badges, or sync/version footers in normal product chrome
- no decorative time, weather, city, locale, or status strips
- no scroll cues, down arrows, or "scroll to explore" prompts
- no decorative status dots; use them only for real semantic state and sparingly
- no hero decoration strips, floating micro-copy, fake photo credits, or image-overlay pills
- no three-equal-card rows as the default way to make a page feel complete
- no AI-purple mesh gradients, sparkle AI badges, magic icons, or generic "AI-powered" panels
- no div-based fake product UI, fake terminals, fake screenshots, fake controls, empty modals, or dead click-through
- no hand-rolled decorative SVG illustrations when a real chart, table, source, image, icon library glyph, or route-specific visual would carry meaning
- no long list/table styling that uses both top and bottom borders on every row just to create texture

Hero discipline becomes workstation discipline here. Non-globe routes should not open with landing-page heroes. The first viewport should show a compact route header, the most useful work surface, and a hint of the next section. Page title should normally fit one line, supporting copy should be short, and the command/search or primary action should not push the core data below the fold.

For redesigns and polish passes, audit before changing. Decide whether the task is preserve, targeted evolution, or overhaul. Preserve route identity, navigation labels, query behavior, local interactions, accessibility wins, and test-covered design-contract language unless the user explicitly asks to change them.

## Frontend Design Skill Adaptation

Use the `frontend-design` skill learning as an execution standard for distinctive, production-grade UI. Do not paste its generic examples directly into the product. Translate them into Sovereign Lens language.

Before coding or polishing a frontend surface, answer four questions:

- Purpose: what finance, market, portfolio, source, or exposure problem does this screen solve?
- Tone: what is the exact aesthetic direction for this route?
- Constraints: what route behavior, data truth, accessibility, performance, desktop/tablet policy, and protected screens must remain intact?
- Differentiation: what is the one memorable product idea the user should remember after using it?

For Sovereign Lens, the default bold direction is:

```text
Refined industrial finance terminal: dense, calm, dark, precise, evidence-led, Indian-market-native, with macro risk connected to holdings and watchlists.
```

Bold does not mean visually loud. It means the route has a clear conceptual point of view and executes it with precision. Maximalist chaos, playful toy-like UI, art-deco ornament, pastel softness, decorative organic forms, and generic luxury styling do not fit this product unless the user explicitly asks for a separate experimental surface.

Differentiation should come from the product idea, not decoration. The memorable thing should be the workflow: event or market signal -> explanation -> affected names -> portfolio/watchlist exposure -> evidence -> inspect next. A route can be visually striking through hierarchy, density, data composition, chart quality, table craft, interaction clarity, and restrained material detail.

Production-grade frontend requirements:

- The UI must work, not just look composed. Controls that appear interactive need real behavior, disabled semantics, or removal.
- Visual polish must support the task. Typography, spacing, color, motion, and surfaces should make data faster to scan.
- Each route needs one dominant object or memorable composition, such as a heatmap, earnings timeline, holdings table, fund comparison, evidence drawer, or answer brief.
- Implementation complexity should match the aesthetic. Dense finance workspaces need precise grids, state handling, and table/chart craft more than elaborate decorative animation.
- Use CSS variables or existing tokens for color, spacing, and surface decisions so the visual system remains coherent across routes.

Frontend aesthetic guidance, adapted:

- Typography: choose distinctive but serious type. Avoid Arial, Roboto-only, system-only styling, default Inter, and repeated Space Grotesk-style defaults. Do not rotate fonts route by route; the product should feel like one terminal.
- Color and theme: commit to the dark graphite finance palette. Use dominant neutrals with one sharp restrained accent. Do not distribute many colors evenly just to make sections look designed.
- Motion: prefer one well-orchestrated state transition or page-load rhythm over scattered micro-animations. CSS transitions are preferred for simple states. Use Motion only when it is already available and the interaction needs it.
- Spatial composition: use controlled asymmetry, dense grids, strong alignment, and data-led composition. Overlap, diagonal flow, and grid-breaking elements are allowed only when they improve hierarchy and do not hurt table/chart readability.
- Background and material: create atmosphere with subtle graphite surfaces, faint grid/noise, disciplined borders, and local depth. Avoid novelty custom cursors, decorative gradient meshes, loud glassmorphism, dramatic shadows, and effects that compete with market data.
- Memorability: make the page unforgettable by making the analysis feel uniquely useful, not by adding ornaments.

## Applied UI Craft Rules

Use these practical checks when shaping or polishing any non-globe interface:

- Affordances must be visible. Selected tabs need a clear container, disabled actions need lower contrast plus disabled semantics, and clickable cards need hover, focus, cursor, or icon cues.
- Visual hierarchy should be explicit. Make the main object largest or strongest, keep metadata quieter, isolate critical values through position and contrast, and replace repeated labels with icons or structure when it improves scan speed.
- Avoid duplicate identity text in compact feeds. If a card already shows a clear company, fund, event, or section name, do not repeat its ticker, category, or label as muted metadata unless it disambiguates the item or supports a real workflow action.
- Read the brief before designing. State the intended design read in your own reasoning, then choose density, motion, layout variance, and component treatment from the actual route purpose rather than defaulting to generic dashboard patterns.
- Lock color, shape, and page theme per route. Do not mix unrelated accent colors, radius systems, or theme moods halfway down a page.
- Spacing should follow a 4px rhythm. Keep related title/subtitle groups tight, usually 8-20px, and separate major sections with stronger gaps, usually 24-40px. Use whitespace to group meaning, not just grid columns.
- Spacing should preserve visual ownership. Metadata, controls, legends, and captions must sit closer to the panel or chart they describe than to neighboring sections. When one component ends and the next component begins, create a clear separation gap so the next heading does not visually attach to the previous panel. Use tight internal gaps for related elements, then a stronger inter-component gap for unrelated sections.
- Use route-level spacing tokens for repeated dashboard rhythm: one tight association gap for `header -> panel` and one larger component gap for `previous panel -> next header`. Do not reuse the same CSS `gap` for both jobs; wrap header+surface groups when needed so internal and external spacing can differ.
- Section headers should live outside the panel they represent by default. Put the heading on the page plane, then place the table, chart, cards, or tool surface inside the bordered panel below it. Only put a heading inside a panel when the user explicitly asks for a framed tool/header treatment or the header controls need to be contained with the surface.
- Avoid panel-within-panel composition. Do not put a bordered card list inside a bordered parent panel, then add bordered child cards inside that again. If content already sits on a surface, use rows, dividers, bands, tabs, or table structure instead of another box.
- Within a route, repeated section headers should share one size, weight, and line-height unless a hierarchy reason is explicit. The route title can be larger; sibling panels such as heatmaps, news, movers, summaries, tables, and cards should not drift into different header scales.
- Dense workstation headers should usually stay at or below 24px. Use line-height around 1.1-1.25 for headings, normal tracking for product UI, and tabular numerics for market data.
- Color should be semantic. Product accent is for selection and inspect actions; green/red are only movement semantics; blue/info, green/success, red/error, and neutral/disabled must not be used as decoration.
- Dark mode depth comes from lightness, not heavy shadows. Higher surfaces are slightly lighter graphite, borders are barely brighter than the surface, and saturated colors are dimmed before use.
- Shadows should be felt, not seen. Prefer broad, low-opacity elevation; avoid tight dark outlines masquerading as polish.
- Icons and buttons need optical alignment. Icon boxes should match text line-height where possible, icon-only buttons need labels, and button horizontal padding should normally exceed vertical padding.
- Every interaction needs feedback. Hover, focus, pressed, disabled, loading, and success states should be visibly distinct without shifting layout.
- Text over imagery requires a real contrast system. Use a directional gradient or scrim behind copy rather than placing type directly over busy or light areas.
- Ban decorative status dots, section-numbering eyebrows, version labels, build labels, fake timestamps, location/weather strips, scroll cues, decorative all-caps text strips, AI sparkle badges, and fake product UI made from styled placeholder divs.

## App Shell And Density

Use a compact top-nav terminal shell for non-globe finance pages, not a left-sidebar SaaS shell.

Keep navigation compact, crisp, and finance-terminal-like. Preserve horizontal width for portfolio tables, watchlists, screeners, fund comparison, earnings views, exposure panels, charts, and event-to-portfolio workflows. Do not introduce a left sidebar during normal redesign or polish tasks unless explicitly asked.

Default density: balanced analyst workspace.

This means serious, compact, readable, and polished. Use enough whitespace for hierarchy and enough density for real finance work. No oversized heroes, empty decorative sections, or dashboards made of generic KPI tiles. Tables can be dense; meaningful charts need enough width and height to communicate clearly.

## Page Modes And Route Identity

All routes should share one finance system for typography, surfaces, borders, tables, charts, controls, actions, evidence cues, AI notes, capability truth, loading, and errors. They should not become identical templates.

Dominant object by route:

- Portfolio: holdings, exposure, allocation, performance, and the working home base.
- Markets: market summary, top metrics, heatmap, movers, stocks in news, sector performance, and source-backed market context.
- Watchlist: tracked names, movement, local alerts, and watch reasons.
- Screener: filters, sorting, local screening feedback, and results.
- Earnings: calendar, result events, and affected names.
- Funds: comparison, benchmark context, cost, risk, allocation, and overlap preview states.
- Events/articles: evidence, exposure, source context, and affected sectors or holdings.
- AI answer/synthesis: concise synthesis tied to data, sources, assumptions, and inspect-next paths.

Do not give every route the same metric strip, big AI card, table, right rail, generic chart, and "see more" links. Coherent system, distinct work surfaces.

Workstation pages should be denser, scan-first, chart/table-led, compact, and interaction-heavy. Research, article, and event pages can be slightly more editorial, but must keep market relevance visible through metadata, source/freshness labels, exposure callouts, affected holdings, evidence, and inspect-next actions.

The current markets route is the reference for a dense non-globe workspace: a source-aware market summary in the main column, configurable top metrics in a right rail, a sector-grouped NIFTY heatmap, stocks-in-news rail, semantic mover slider, recent-development carousel, sector performance, and standout stocks. Keep its section ownership clear: headers on the page plane, panels directly below, one visible box per content unit, and no decorative eyebrow copy inside repeated panel headings.

The current portfolio route is the reference for the working home base: status strip, primary action module, performance interpretation, today's P&L, diagnosis, risk radar, market signals, holdings decision table, allocation view, and evidence drawer. Future cleanup should remove implementation-storage language from visible portfolio copy while preserving the underlying capability truth in docs and code boundaries.

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

Use one visible box per content unit. Section groups such as `Recent Developments`, `Stocks in news today`, watchlist headlines, or other repeated feeds should usually sit directly on the page background with an unboxed heading. The repeated cards, rows, table, chart surface, or selected item can own the border and tonal surface. Do not place card lists inside a second bordered parent panel unless the parent is a true tool frame with controls that need containment. This avoids the dashboard-like box-inside-box feel and keeps the interface closer to a finance workspace than a widget grid.

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

Prefer source counts, source names, and assumptions only when real supporting data exists. Do not use fake confidence percentages, fake evidence chips, or source-status placeholders. If evidence is not available, omit the unsupported claim or phrase the item as a concise analyst note without false provenance.

The `/answer` route should read as a synthesis page, not a chat room. It should show the submitted command, a short answer, compact sections, inspect-next actions, and source chips only when supporting source data exists. It should not expose frontend fallback mechanics through normal UI copy.

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

Current implementation uses `AnimatedSearchPrompt` on finance workspaces, event search, fund search, and fund picker search. These prompts are rotating examples of useful market commands, not a chatbot promise. They should disappear on focus or once a value exists, respect `prefers-reduced-motion`, and remain route-specific: markets prompts should sound like market inspection, earnings prompts like result research, screener prompts like factor filters, watchlist prompts like tracked-name triage, funds prompts like comparison work, and events prompts like market-impact discovery.

When a search currently only changes page state or routes to another surface, keep behavior modest and clear. Do not imply backend semantic search, live AI answering, or real alert creation unless that service exists, and do not describe the limitation with implementation labels.

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

Do not make it taller, louder, neon, crypto-like, aggressively animated, or stuffed with random instruments. Do not label the tape with implementation-status copy such as demo, static, local, or not live. If a feed state is not product-ready, omit unsupported freshness claims rather than exposing scaffolding.

Movement numerics outside the globe route currently use a calmer finance movement font with tabular numerics. Preserve that distinction so green/red move values scan like market data rather than generic UI badges. Do not broaden this rule onto the globe route without an explicit globe request.

## Page Headers And Metrics

Headers should orient the user, then get out of the way.

Default header structure:

1. page title
2. one-line purpose or current status
3. one compact command/search input or one primary action, not both unless clearly needed

Avoid big hero headers, marketing copy, welcome panels, oversized slogans, decorative icons, huge empty top sections, and making every page start like a dashboard.

`/portfolio` can have the strongest concise header because it is the working home base. It may include portfolio value, today's P&L, current account/holdings context, and compact command input. It should still move quickly into the main decision surface and should not show implementation-storage labels.

Summary metrics should be used sparingly and deliberately. Do not add an automatic row of four KPI cards to every page. Use metrics only when they answer what changed, how large the move was, what is exposed, what the impact is, how fresh the data is, or what needs attention.

Metrics should have a clear label, value, unit where needed, and change context where relevant. Use compact strips or small cards, tabular numerics, muted labels, strong value contrast, and green/red only for actual movement. Do not add scaffolding labels just to explain current data plumbing.

## Right Rail And Inspection

A right-side context rail is allowed as a recurring finance-page pattern only when it earns its space.

Use a rail for useful secondary context such as watchlist context, portfolio exposure summary, related events, evidence cues, gainers/losers, upcoming earnings, alerts, inspect-next paths, related holdings or sectors, and scenario assumptions.

The main column must remain the priority. Primary decisions and primary data stay in the main workspace. The rail should not hold primary workflow controls, squeeze charts or tables, or become generic widget noise. On tablet widths, the rail should usually collapse below the main content or become a compact secondary band.

Inspection should preserve context. When a user clicks a holding, event, fund, earnings item, chart point, or table row, prefer inline selection plus a right rail, local detail drawer, expandable row, or adjacent inspection panel. Reserve full pages for deeper research flows. Use modals only for confirmations, destructive actions, small edits, settings, or small form entry.

A detail rail/drawer should show item identity, current status, why it matters, portfolio/watchlist exposure, key drivers or risks, evidence when available, assumptions if AI is involved, and inspect-next actions. Keep it compact.

## Evidence And Sources

Evidence should be inspectable, not performative.

Use compact evidence triggers near the claim they support:

- 4 sources
- Evidence
- Sources
- Updated 9m ago

Evidence should appear near analyst notes, event exposure, alerts, charts, portfolio actions, watchlist movement explanations, earnings summaries, and market signal rows.

Use three levels:

1. Inline evidence cue: tiny pill such as `4 sources`.
2. Expandable source preview: source name, short title/snippet, timestamp, and relevance.
3. Full evidence view: only for deeper research pages, event dossiers, or source-heavy investigations.

Do not put all sources at the bottom of a page if the user cannot tell which claim they support. Do not show giant citation walls, bright source badges, or logos as decoration. If source links are not implemented, do not render fake links or source-unavailable badges in the normal UI.

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

Freshness or source context should appear near the table title or section header only when it is real product information. Do not repeat the same label in every row unless row-level evidence differs. Do not show local, demo, static, browser-only, or not-live labels in normal table chrome.

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

Secondary actions should be quiet text buttons, ghost buttons, or small icon buttons only when obvious. Disabled or future actions must be visibly disabled, professionally worded, and backed by an intentional interaction contract. Avoid labels such as demo, local only, browser-only, not connected, or preview in normal product chrome. Do not add fake buttons, empty modals, hidden console behavior, or dead click-through.

Route-to-route navigation should follow the investor's investigation path: signal -> exposure -> evidence -> comparison -> decision support. Use intent labels such as Inspect exposure, Review watchlist, Compare funds, View evidence, Check affected names, Review risk, Compare alternatives, Add to watchlist, and Track this signal. Avoid link mazes.

## Empty, Loading, Error, And Alert States

Empty states should be compact, operational, and honest. They should explain what the user can do next without exposing implementation storage or feed limitations. Use clear actions such as Add holding, Create watchlist, Search company, Connect account, Set alert, or Retry when those actions exist. Avoid cute illustrations, mascots, motivational copy, oversized blank panels, fake progress, implementation labels, and decorative empty cards.

Loading states should be quiet skeleton rows, skeleton chart blocks, compact status rows, muted labels, and preserved layout space. Avoid big centered spinners, full-page drama, glowing loaders, fake terminal animations, and layout shifts.

Error states should be precise and section-level where possible. Explain what failed in product language and what the user can do next. Only show Retry if retry is actually implemented. Use muted amber or neutral grey for recoverable states; reserve red for real failures.

Alerts should be evidence-linked watch/inspect signals, not pushy urgency. They should connect to evidence, affected holdings, watchlist assets, sectors, or events. Separate market movement from risk/event severity. Use severity labels only when there is a defined reason.

Preferred alert labels: Watch, Review, Inspect, Evidence, Exposure, Risk, Driver, Drag, Catalyst, Alert.

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

Do not hand-roll scroll animation with `window.addEventListener("scroll")` or React state updated on every frame. Use CSS state, `IntersectionObserver`, an existing motion utility, or a small isolated client component with cleanup and reduced-motion handling. Continuous pointer, scroll, or physics values should not re-render the full React tree.

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

Several frontend regression tests intentionally read this file and assert key design-contract phrases around section header sizing, spacing ownership, avoiding duplicate identity text, and one-box-per-content-unit composition. If those principles change, update the design direction and tests together; do not delete the text just to satisfy an implementation shortcut.

For broad redesign tasks, first identify target routes, protected routes, shared files that could cause visual side effects, and screenshots or viewport checks needed before calling the task complete.

## Web Interface Guidelines Review Layer

Use the `web-design-guidelines` skill learning as the functional UI review gate. This complements the taste layers above: taste decides whether the product feels like Sovereign Lens; interface guidelines decide whether the UI behaves like a serious, accessible web application.

When the user asks to review, audit, check accessibility, check UX, or validate UI files, fetch the current rules before reviewing:

```text
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Then read the requested files and report concise findings in `file:line` format. For implementation work, use the current guidelines as a pre-flight checklist before visual completion.

Core interface rules to preserve in Sovereign Lens:

- Use semantic HTML first: `<button>` for actions, `<a>` or route links for navigation, `<label>` for form controls, and `<table>` for tabular data.
- Icon-only buttons need `aria-label`; decorative icons need `aria-hidden="true"`.
- Interactive non-button elements need keyboard handling, but prefer changing them to real buttons or links.
- Focus must be visible with `:focus-visible` or equivalent. Never remove outlines without a replacement.
- Compound controls should support `:focus-within`; selected, disabled, expanded, and pressed states must be visible without instructions.
- Form controls need labels, meaningful `name`, relevant `autocomplete`, correct `type`, and `inputmode` where useful.
- Never block paste. Inline errors should appear near the field and focus should move to the first error on submit.
- Async feedback such as save states, validation, or toasts needs `aria-live="polite"` when the update is not otherwise announced.
- Headings should be hierarchical. Anchor targets need `scroll-margin-top` when sticky headers can cover them.
- Images need `alt`; decorative images use empty alt. Real images should define width and height to prevent layout shift.
- Animations must honor `prefers-reduced-motion`, animate compositor-friendly properties such as `transform` and `opacity`, and avoid `transition: all`.
- Text containers must survive long values with `min-w-0`, truncation, line clamp, or wrapping. Empty strings and empty arrays should not render broken UI.
- Large lists need virtualization or `content-visibility: auto` when they can exceed practical DOM size.
- State that affects navigation or sharing should be reflected in the URL when useful: filters, tabs, pagination, selected panels, or expanded context.
- Destructive actions need confirmation or undo. Do not make destructive clicks immediate.
- Modals, drawers, and sheets should contain overscroll, preserve focus behavior, and avoid background interaction leaks.
- Dark theme needs `color-scheme: dark`; native selects and inputs need explicit dark-surface color treatment.
- Dates, times, numbers, and currencies should use `Intl.DateTimeFormat` and `Intl.NumberFormat`, not hand-formatted strings, when formatting dynamic values.
- Hydration-sensitive date/time rendering needs deliberate handling. Do not use `suppressHydrationWarning` as a casual escape hatch.
- Buttons and links need hover and active states; interactive states should increase clarity, not merely decorate.
- Copy should be active, specific, and action-oriented. Error messages should tell the user what to do next.

Flag these as review failures:

- `user-scalable=no` or `maximum-scale=1`
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` or `outline: none` without a focus-visible replacement
- click handlers on `<div>` or `<span>` where a button or link should exist
- icon buttons without accessible labels
- form inputs without labels
- images without dimensions
- hardcoded dynamic date, time, number, or currency formatting
- uncontrolled layout measurement in render
- `autoFocus` without clear desktop-only justification

## Visual QA Before Completion

UI work is not done until it has been seen.

For broad UI changes, redesigns, visual polish passes, layout changes, chart/table changes, or shared CSS updates, screenshots are required before final response. Changed non-globe routes should be checked at:

- `1440x900`
- `1024x768`
- `900x768`

Inspect for squeezed charts, cramped tables, broken rails, oversized headers, poor density, unreadable text, wrapping, overflow, broken filters, tablet issues, loud market tape, cheap icon clutter, huge hero cards, muddy haze, and fake-looking controls.

For broad non-globe UI work, include `/` only as a protection check. Verify the globe route remains visually unchanged and mention any shared/global files that could affect it.

Taste Skill pre-flight for Sovereign Lens UI work:

- Brief read is clear: route, user, dominant object, density, motion, and protected routes are understood.
- Page theme, accent, and radius system are locked before styling begins.
- No banned implementation-status copy appears in normal product chrome.
- No banned anti-slop patterns appear: section-numbering eyebrows, decorative status dots, version labels, build labels, scroll cues, AI-purple mesh, sparkle AI, fake product UI, three-equal-card filler, or decorative SVG workarounds.
- First viewport contains real workflow surface, not a landing-page hero or empty brand statement.
- Buttons, tabs, filters, inputs, tables, and cards have default, hover, focus, selected, disabled, loading, and error states where relevant.
- Button and form contrast is readable on dark surfaces; no white-on-white, low-contrast ghost controls, or invisible focus rings.
- CTA and action labels do not wrap awkwardly at desktop/tablet widths.
- Tables and charts remain readable at `1440x900`, `1024x768`, and `900x768`.
- Motion is motivated by feedback, hierarchy, or state transition; reduced-motion behavior is respected.
- Web Interface Guidelines checks are satisfied for semantics, focus, labels, aria attributes, motion, long-content handling, image dimensions, URL state, dark-mode controls, and dynamic formatting.
- The globe route is visually unchanged unless explicitly in scope.

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
