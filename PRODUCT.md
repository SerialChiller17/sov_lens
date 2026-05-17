# Sovereign Lens Product Context

Register: product

For detailed route inventory, architecture, setup commands, implementation notes, and longer product context, refer to `PROJECT_SUMMARY.md`.

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

## Core Workflows

Default product flow:

1. What matters now
2. Why it matters
3. What part of my portfolio or watchlist is exposed
4. What evidence supports this
5. What should I inspect next

Other routes should often help answer: "How does this affect my portfolio or watchlist?" Events, news, earnings, screener, funds, and market pages can lead users back toward exposure, but every route should keep its own purpose.

Personalization should deepen the product, not be required for it to work. When portfolio or watchlist data exists, show personalized exposure first. When it does not, clearly state that no personal exposure is available yet, then provide useful market context, watchlist paths, or demo/sample context with honest labels.

## AI Layer

AI should act like an embedded analyst layer, not a persistent chatbot.

Use AI to summarize what matters, explain why it matters, connect events to holdings, watchlists, sectors, and funds, surface risks and tradeoffs, and show source context or assumptions where relevant.

AI insight should stay visible near the main decision surface. It should guide the user into charts, tables, evidence, holdings, events, and sources rather than replace them.

Prefer compact analyst notes, exposure callouts, ranked drivers, comparison blocks, evidence links, and inspect-next actions. Avoid long paragraph dumps, generic "AI summary" cards, sparkle icons, magic advisor language, and repeated chat inputs.

Use source-grounded cues over fake confidence:

- Based on 3 sources
- Source-limited
- Source unavailable
- Confidence unavailable
- Demo context
- Assumption
- Evidence incomplete

Do not show confidence percentages unless the system truly computes them.

The AI answer route should feel like an intelligence brief generated from market context, not a chat transcript. It should show the question, concise synthesis, source or assumption cues, affected holdings or sectors, evidence, and inspect-next paths.

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

## Data Honesty Rule

Any static, generated, frontend-local, demo-only, mocked, delayed, cached, or incomplete data must be labelled honestly when it appears on a decision surface.

The product should never imply:

- live broker sync if no broker sync exists
- real portfolio connection if data is manually entered or local
- verified news or event intelligence if the source is demo or static
- real AI confidence if no confidence calculation exists
- executable trades if there is no execution layer
- live market data if the feed is delayed, cached, mocked, or static

Use lightweight labels where trust or decisions are affected:

- Demo
- Preview
- Local
- Browser-only
- Not connected
- Coming soon
- Static sample
- Delayed
- Source unavailable
- Confidence unavailable

Watchlist saved in `localStorage` should be labelled as local or browser-only. Portfolio data should not imply broker sync unless real sync exists. AI outputs should show source count, assumptions, source context, or confidence unavailable where relevant. Disabled or future actions should be visibly marked as Preview, Coming soon, Not connected, or Unavailable.

The product can be polished and demo-ready, but it should never fake capability, connectivity, freshness, or certainty.

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

Portfolio and watchlist setup should be light, local, and honest.

Use manual portfolio entry, manual watchlist creation, browser-saved state, clear Local or Browser-only labels, compact empty states, and one useful next action. Avoid long onboarding wizards, fake broker-sync setup, forced signup, account-setup theater, motivational copy, or multi-step preference screens.

Good first-run behavior:

- No holdings added. Portfolio is local until broker sync exists. Add a holding or inspect watchlist exposure.
- No watchlist yet. Watchlist data is saved in this browser. Search a stock or start with sample Indian-market names.

If sample data is used, label it as Demo portfolio, Static sample, or Local only.

Start local, disclose clearly, and move the user into inspection fast.

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
