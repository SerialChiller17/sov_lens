import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GlobalBrandNav } from "../../app/GlobalBrandNav";
import { InsightCompanion } from "../../InsightCompanion";
import { MarketTape } from "../market-tape/MarketTape";
import {
  NIFTY_50_PERFORMANCE,
  PORTFOLIO_AI_NEWS,
  PORTFOLIO_DAY_RETURN_PERCENT,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_INVESTED_VALUE,
  PORTFOLIO_MARKET_TAPE,
  PORTFOLIO_PERFORMANCE,
  PORTFOLIO_SUGGESTED_PLAYS,
} from "./portfolioData";
import { formatPortfolioCurrency, formatSignedPortfolioCurrency, formatSignedPortfolioMove, formatSignedPortfolioPercent } from "./portfolioFormatters";
import { PortfolioCompositionDonut } from "./PortfolioCompositionDonut";
import { PortfolioPerformanceChart } from "./PortfolioPerformanceChart";
import { PortfolioRecommendationCard } from "./PortfolioRecommendationCard";

interface PortfolioScreenProps {
  onHome: () => void;
  onFunds: () => void;
  onPortfolio: () => void;
}

export function PortfolioScreen({ onHome, onFunds, onPortfolio }: PortfolioScreenProps) {
  const portfolioAppRef = useRef<HTMLElement | null>(null);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState("Synced 2m ago");
  const [expandedPlayId, setExpandedPlayId] = useState<string | null>(null);
  const [activePlayIndex, setActivePlayIndex] = useState(2);
  const [playCycleDirection, setPlayCycleDirection] = useState<"next" | "previous" | null>(null);
  const totalValue = PORTFOLIO_HOLDINGS.reduce((sum, holding) => sum + holding.value, 0);
  const oneDayReturn = totalValue * (PORTFOLIO_DAY_RETURN_PERCENT / 100);
  const totalReturn = totalValue - PORTFOLIO_INVESTED_VALUE;
  const totalReturnPercent = (totalReturn / PORTFOLIO_INVESTED_VALUE) * 100;
  const topHolding = [...PORTFOLIO_HOLDINGS].sort((a, b) => b.allocation - a.allocation)[0];
  const highRiskHoldings = PORTFOLIO_HOLDINGS.filter((holding) => holding.risk === "High");
  const activeSuggestedPlay = PORTFOLIO_SUGGESTED_PLAYS[activePlayIndex];

  useEffect(() => {
    if (!playCycleDirection) return;

    const cycleTimer = window.setTimeout(() => setPlayCycleDirection(null), 620);
    return () => window.clearTimeout(cycleTimer);
  }, [activePlayIndex, playCycleDirection]);

  const scrollPortfolioDown = () => {
    const portfolioApp = portfolioAppRef.current;
    if (!portfolioApp) return;

    portfolioApp.scrollBy({
      top: Math.max(portfolioApp.clientHeight * 0.72, 360),
      behavior: "smooth",
    });
  };

  const cycleSuggestedPlay = (direction: "next" | "previous") => {
    setExpandedPlayId(null);
    setPlayCycleDirection(direction);
    setActivePlayIndex((currentIndex) => {
      const offset = direction === "next" ? 1 : -1;
      return (currentIndex + offset + PORTFOLIO_SUGGESTED_PLAYS.length) % PORTFOLIO_SUGGESTED_PLAYS.length;
    });
  };

  const showPreviousPlay = () => cycleSuggestedPlay("previous");
  const showNextPlay = () => cycleSuggestedPlay("next");

  return (
    <main ref={portfolioAppRef} className="app-shell portfolio-app">
      <GlobalBrandNav activeView="portfolio" onHome={onHome} onFunds={onFunds} onPortfolio={onPortfolio} />
      <MarketTape basket={PORTFOLIO_MARKET_TAPE} includeGlobalItems={false} statusLabel="Live Prices" />

      <section className="portfolio-screen" aria-label="Synced portfolio screen">
        <div className="portfolio-background-grid" aria-hidden="true" />

        <section className="portfolio-hero-grid" aria-label="Portfolio overview">
          <section className="portfolio-dashboard portfolio-hero-dashboard" aria-label="Portfolio dashboard summary">
            <header className="portfolio-section-header">
              <div>
                <h1>Your Portfolio</h1>
              </div>
              <div className="portfolio-sync-cluster" aria-label="Portfolio sync controls">
                <button
                  type="button"
                  className="portfolio-sync-button"
                  aria-label="Sync portfolio"
                  title="Sync portfolio"
                  onClick={() => setPortfolioSyncStatus("Synced just now")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11a8 8 0 0 0-14.2-5.1L4 8" />
                    <path d="M4 4v4h4" />
                    <path d="M4 13a8 8 0 0 0 14.2 5.1L20 16" />
                    <path d="M20 20v-4h-4" />
                  </svg>
                </button>
                <strong aria-live="polite">{portfolioSyncStatus}</strong>
              </div>
            </header>

            <div className="portfolio-value-panel">
              <div className="portfolio-value-topline">
                <div className="portfolio-current-value">
                  <span>Current Portfolio Value</span>
                  <strong>{formatPortfolioCurrency(totalValue)}</strong>
                </div>
              </div>

              <span className="portfolio-value-divider" aria-hidden="true" />

              <div className="portfolio-metric-row">
                <div className="portfolio-metric">
                  <span>Invested value</span>
                  <strong>{formatPortfolioCurrency(PORTFOLIO_INVESTED_VALUE)}</strong>
                </div>
                <div className="portfolio-metric is-positive">
                  <span>1D returns</span>
                  <strong>
                    {formatSignedPortfolioCurrency(oneDayReturn)} ({formatSignedPortfolioPercent(PORTFOLIO_DAY_RETURN_PERCENT)})
                  </strong>
                </div>
                <div className="portfolio-metric is-negative">
                  <span>Total returns</span>
                  <strong>
                    {formatSignedPortfolioCurrency(totalReturn)} ({formatSignedPortfolioPercent(totalReturnPercent)})
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <aside className="portfolio-ai-panel" aria-label="Portfolio AI intelligence">
            <header>
              <div className="portfolio-ai-title-row">
                <h2>portfolio AI</h2>
                <InsightCompanion className="portfolio-ai-companion" />
              </div>
            </header>

            <div className="portfolio-ai-summary">
              <p>Your account is synced. The main live risk is concentrated in freight, energy, and Taiwan-linked semiconductor exposure.</p>
              <p>
                {topHolding.ticker} is the largest allocation at {topHolding.allocation.toFixed(1)}%, while{" "}
                {highRiskHoldings.map((holding) => holding.ticker).join(" and ")} carry the highest news sensitivity.
              </p>
            </div>

            <section className="portfolio-ai-block" aria-label="News affecting portfolio">
              <span>News Affecting Portfolio</span>
              <div>
                {PORTFOLIO_AI_NEWS.slice(0, 1).map((item) => (
                  <article key={item.title}>
                    <small>{item.source}</small>
                    <strong>{item.title}</strong>
                    <p>{item.tickers}</p>
                    <em>{item.severity}</em>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="portfolio-lower-grid" aria-label="Portfolio detail">
          <section className="portfolio-dashboard portfolio-main-dashboard" aria-label="Portfolio holdings and performance">
            <div className="portfolio-dashboard-grid">
              <article className="portfolio-glass-panel portfolio-performance-panel">
                <div className="portfolio-panel-heading">
                  <span>Performance</span>
                  <strong>6M trajectory</strong>
                </div>
                <PortfolioPerformanceChart points={PORTFOLIO_PERFORMANCE} benchmarkPoints={NIFTY_50_PERFORMANCE} />
              </article>

              <article className="portfolio-glass-panel portfolio-composition-panel">
                <div className="portfolio-panel-heading">
                  <span>Composition</span>
                  <strong>Allocation</strong>
                </div>
                <PortfolioCompositionDonut holdings={PORTFOLIO_HOLDINGS} />
              </article>
            </div>

            <article className="portfolio-glass-panel portfolio-holdings-panel">
              <div className="portfolio-panel-heading">
                <span>Holdings</span>
                <strong>Stock-wise value</strong>
              </div>
              <table className="portfolio-holdings-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Sector</th>
                    <th>Value</th>
                    <th>Alloc.</th>
                    <th>Move</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_HOLDINGS.map((holding) => (
                    <tr key={holding.ticker} className={`portfolio-holding-row risk-${holding.risk.toLowerCase()}`}>
                      <td>
                        <strong>{holding.ticker}</strong>
                        <span>{holding.name}</span>
                      </td>
                      <td>{holding.sector}</td>
                      <td>{formatPortfolioCurrency(holding.value)}</td>
                      <td>{holding.allocation.toFixed(1)}%</td>
                      <td className={holding.dayMove >= 0 ? "is-positive" : "is-negative"}>{formatSignedPortfolioMove(holding.dayMove)}</td>
                      <td>
                        <em className={`portfolio-risk-pill risk-${holding.risk.toLowerCase()}`}>{holding.risk}</em>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>

          <aside className="portfolio-insight-column" aria-label="Portfolio action panels">
            <section className="portfolio-ai-block portfolio-risk-stock-block" aria-label="High risk stocks">
              <span>High-Risk Stocks</span>
              <div className="portfolio-risk-grid">
                {highRiskHoldings.map((holding) => (
                  <article key={holding.ticker}>
                    <strong>{holding.ticker}</strong>
                    <p>
                      {holding.sector} / {holding.allocation.toFixed(1)}% allocation
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="portfolio-ai-block portfolio-recommendations-block" aria-label="Suggested plays">
              <div className="portfolio-suggested-header">
                <span>Recommended Plays</span>
              </div>
              <div className="portfolio-suggested-list">
                <button type="button" className="portfolio-stack-arrow portfolio-stack-arrow-prev" aria-label="Previous recommendation" onClick={showPreviousPlay}>
                  <ChevronLeft aria-hidden="true" />
                </button>

                <div className={`portfolio-card-stack${playCycleDirection ? ` is-cycling-${playCycleDirection}` : ""}`} aria-live="polite">
                  {PORTFOLIO_SUGGESTED_PLAYS.map((play, index) => {
                    const stackPosition = (index - activePlayIndex + PORTFOLIO_SUGGESTED_PLAYS.length) % PORTFOLIO_SUGGESTED_PLAYS.length;
                    const isActive = stackPosition === 0;

                    return (
                      <div
                        key={play.id}
                        className={`portfolio-highlight-recommendation priority-${play.priority.toLowerCase()} stack-position-${stackPosition}${isActive ? " is-active" : ""}`}
                        aria-hidden={!isActive}
                      >
                        <PortfolioRecommendationCard
                          play={play}
                          isExpanded={isActive && expandedPlayId === play.id}
                          isInteractive={isActive}
                          onToggleLogic={() => setExpandedPlayId((currentId) => (currentId === play.id ? null : play.id))}
                        />
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="portfolio-stack-arrow portfolio-stack-arrow-next" aria-label="Next recommendation" onClick={showNextPlay}>
                  <ChevronRight aria-hidden="true" />
                </button>

                <div className="portfolio-stack-counter" aria-label={`Recommendation ${activePlayIndex + 1} of ${PORTFOLIO_SUGGESTED_PLAYS.length}`}>
                  {PORTFOLIO_SUGGESTED_PLAYS.map((play, index) => (
                    <span key={play.id} className={index === activePlayIndex ? "is-active" : ""} />
                  ))}
                </div>

                <span className="portfolio-stack-sr-status">
                  {activeSuggestedPlay ? `${activeSuggestedPlay.headline}, ${activeSuggestedPlay.riskLabel}` : ""}
                </span>
              </div>
            </section>
          </aside>
        </section>

        <button type="button" className="portfolio-scroll-cue" aria-label="Scroll portfolio screen down" onClick={scrollPortfolioDown}>
          <span />
        </button>
      </section>
    </main>
  );
}
