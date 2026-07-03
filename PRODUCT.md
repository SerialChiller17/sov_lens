# Sovereign Lens Product Context

Register: product

For detailed route inventory, architecture, setup commands, implementation notes, and longer product context, refer to `PROJECT_SUMMARY.md`.

Last updated against the current codebase: June 17, 2026.

## Product Promise

Sovereign Lens is an Indian-market intelligence cockpit that helps active investors connect market data, portfolio exposure, and geopolitical context into clearer decisions.

Geopolitical risk is the differentiator, not the whole product. The product should feel like a serious market workspace where portfolio is the working home base, watchlist, screener, earnings, and funds support discovery, news and events explain what is moving, the globe adds a distinctive macro-risk lens, and AI helps synthesize information without pretending to be a magic advisor.

Sovereign Lens is not a trading terminal, brokerage app, generic finance dashboard, news aggregator, or geopolitical war tracker.

## Target Users

Primary user: an active Indian-market investor with analyst-grade expectations.

This user manages or tracks their own portfolio and watchlist, wants better context than normal broker apps or news apps provide, and expects analyst-grade clarity rather than retail-app simplification. They care about portfolio impact, event exposure, earnings, funds, screeners, market signals, and the reasoning behind a move.

Secondary user: a market-aware knowledge worker or finance-curious professional who may not trade daily but wants to understand what matters and why.

Non-primary users include institutional traders, HFT users, execution-workflow users, professional Bloomberg or Refinitiv terminal users, and casual beginners looking for basic stock education.

## Product Home

`/` is the signature lens entrypoint. It is the conceptual and cinematic surface for geopolitical and macro context.

`/portfolio` is the working home base. It should concentrate user-specific decisions around holdings, allocation, exposure, watchlist context, and evidence.

Globe gives the lens. Portfolio gives the workbench.

Current product routes:

- `/` - signature global intelligence monitor.
- `/portfolio` - local portfolio cockpit and evidence-led working home.
- `/markets` - Indian markets workspace with heatmap, summary, movers, stocks in news, and source cues.
- `/earnings` - earnings calendar and event context.
- `/screener` - Indian equity screener with local watchlist handoff.
- `/funds` - mutual fund comparison workspace.
- `/watchlist` - browser-saved tracked names and local alert state.
- `/news-pulse` and `/news-pulse/:newsId` - global event dashboard and article views.
- `/answer` - frontend synthesis handoff for market questions and source-aware local answers.

## Core Workflows

Default product flow:

1. What matters now
2. Why it matters
3. What part of my portfolio or watchlist is exposed
4. What evidence supports this
5. What should I inspect next

Other routes should often help answer: "How does this affect my portfolio or watchlist?" Events, news, earnings, screener, funds, and market pages can lead users back toward exposure, but every route should keep its own purpose.

Personalization should deepen the product, not be required for it to work. When portfolio or watchlist data exists, show personalized exposure first. When it does not, provide useful market context and a clear next action such as adding holdings, creating a watchlist, or inspecting affected names. Do not expose implementation-storage language in normal product copy.

## AI Layer

AI should act like an embedded analyst layer, not a persistent chatbot.

Use AI to summarize what matters, explain why it matters, connect events to holdings, watchlists, sectors, and funds, surface risks and tradeoffs, and show source context or assumptions where relevant.

AI insight should stay visible near the main decision surface. It should guide the user into charts, tables, evidence, holdings, events, and sources rather than replace them.

Prefer compact analyst notes, exposure callouts, ranked drivers, comparison blocks, evidence links, and inspect-next actions. Avoid long paragraph dumps, generic "AI summary" cards, sparkle icons, magic advisor language, and repeated chat inputs.

Use evidence-grounded cues over fake confidence. Show source counts, source names, assumptions, and confidence only when they are genuinely backed by product data. Do not show confidence percentages unless the system truly computes them.

The AI answer route should feel like an intelligence brief generated from market context, not a chat transcript. It should show the question, concise synthesis, source or assumption cues, affected holdings or sectors, evidence, and inspect-next paths.

Current `/answer` implementation is a frontend route, not a live LLM service. It can receive `event`, `q`, `title`, and `summary` query parameters and render matching local market-development answers when present. Do not describe it in docs as production AI until a backend thread service, source retrieval, and response generation are connected. In the visible product, avoid exposing that limitation as scaffolding copy; design the state as an intelligence brief or omit unsupported claims.

## Decision Posture

Sovereign Lens can explain exposure, tradeoffs, scenarios, and possible plays. It should help the user think better, not make the final decision for them.

The product may say:

- This event may affect these holdings.
- Watch these stocks or sectors.
- Compare these alternatives.
- This portfolio has concentration risk here.
- Possible play: reduce exposure, hedge, wait for confirmation, or monitor earnings.
- Here are the tradeoffs.

The product must not say:

- Buy this stock.
- Sell this stock.
- Invest a specific amount now.
- This will definitely happen.
- Guaranteed upside or downside.
- You should execute this trade.

Sovereign Lens is an intelligence and decision-support cockpit, not a SEBI-registered advisor, brokerage, or execution platform.

## Product Capability Truth

Sovereign Lens is being designed as the frontend of a real finance website. Normal product screens should read like an operating, premium finance product, not like a demo harness, local prototype, or implementation status board.

The product must never fake:

- live broker sync if no broker sync exists
- real portfolio connection if data is manually entered or stored client-side
- verified news or event intelligence if sources are not available
- real AI confidence if no confidence calculation exists
- executable trades if there is no execution layer
- live market data if no market-data feed exists

But the visible UI should not advertise implementation limitations with scaffolding labels such as:

- Demo
- Local
- Browser-only
- Not connected
- Static sample
- Not live
- Live API
- Source unavailable
- Confidence unavailable
- Mock data
- Sample data

Those truths belong in engineering docs, architecture notes, tests, backend/data boundaries, admin/debug surfaces, or legal/compliance disclosures. They do not belong in ordinary user-facing headings, badges, cards, rails, table titles, helper text, search prompts, empty states, or action feedback.

When a capability is not truly implemented, the product should handle it through design rather than confession labels:

- Do not render unsupported claims, fake source chips, fake confidence, fake refresh timestamps, fake alert delivery, or fake broker-sync states.
- Prefer neutral product states such as `Add holdings`, `Create watchlist`, `Connect account`, `Set alert`, `View evidence`, `Refresh`, or `Retry` only when the action exists or is intentionally disabled.
- If an action is future-only, keep it disabled or omit it until it has a real interaction contract.
- If source evidence is unavailable, do not show a fake source control. Show the claim only when the product has enough context to support it, or phrase it as an analyst note without false provenance.
- Keep legal and risk disclosures concise and professional, not implementation-specific.

The product can be pre-production internally, but it should not look pre-production to users. It should look like a billion-dollar, award-worthy finance website whose visible UI is disciplined, confident, and capability-aware.

## Product Voice

The product should speak like a concise intelligence brief, not a friendly app assistant and not a hype-driven SaaS product.

Voice rules:

- short, direct, analyst-like copy
- clear judgment, but not fake certainty
- no hype, motivational SaaS language, or playful finance education tone
- no chatbot personality
- no vague AI-powered-insights language
- no dramatic war-room language
- no broker or trade-execution language

Preferred labels and verbs:

- Watch
- Inspect
- Compare
- Evidence
- Exposure
- Scenario
- Assumption
- Signal
- Drag
- Driver
- Risk
- Confidence
- Source
- What changed
- Why it matters
- Affected holdings

Avoid phrases like "Great job," "Unlock smarter investing," "Supercharge your portfolio," "Our AI thinks," "set to explode," "Guaranteed," "Must buy," and "Don't miss out."

The tone should be serious and sharp without becoming cold, robotic, or cryptic. Aim for editorial clarity and confidence.

## Onboarding And First Run

Portfolio and watchlist setup should be light, serious, and action-oriented.

Use manual portfolio entry, manual watchlist creation, compact empty states, and one useful next action. Avoid long onboarding wizards, fake broker-sync setup, forced signup, account-setup theater, motivational copy, implementation-storage labels, or multi-step preference screens.

Good first-run behavior:

- No holdings added. Add a holding or inspect watchlist exposure.
- No watchlist yet. Search a stock or start with key Indian-market names.

Move the user into inspection fast. Keep implementation storage and environment details out of normal product copy.

## Indian-Market Specificity

The product should feel Indian-market-native through correctness, not decoration.

Use NSE and BSE labels, ticker/exchange clarity, `₹`, `Cr`, `L`, `%`, `bps`, `x`, IST timestamps, Indian market session context, sector context, result-call language, earnings calendar behavior, promoter or shareholding context where relevant, and indices such as Nifty 50, Sensex, Bank Nifty, and sectoral indices when available.

Avoid flag colors, tricolor motifs, patriotic gradients, decorative India maps, saffron/green accent systems, nationalistic copy, and ornamental cultural visuals. Maps or India-specific visuals are acceptable only when they serve analysis.

Comparisons should default to Indian-market context: Nifty 50, Sensex, Bank Nifty, relevant sector index, category peer group, selected watchlist, portfolio sleeve, fund category average, or user-selected basket. Do not default to S&P 500, Nasdaq, or generic global benchmarks unless the page is explicitly global, macro, or cross-market.

## Non-Goals

Do not build or imply:

- trading execution
- brokerage account management
- live broker sync without real connectivity
- live alerts or real-time monitoring without infrastructure
- guaranteed recommendations
- institutional-terminal parity
- phone-first workflows
- beginner stock education as the primary experience
- decorative dashboards that do not support decisions
- generic news aggregation without exposure or evidence context

## Protected Assumptions

The app is desktop/tablet-first. Screens below `768px` are intentionally unsupported through the existing mobile gate. Do not weaken that policy unless explicitly asked to design a real mobile version.

The `/` globe route is the cinematic signature screen and protected by default. Broad product redesigns should assume non-globe routes are the target unless the user explicitly asks for globe changes. See `DESIGN.md` for detailed route protection rules.
