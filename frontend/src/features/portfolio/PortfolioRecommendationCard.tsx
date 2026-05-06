import { type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Cpu, Target } from "lucide-react";
import type { PortfolioRecommendationReason, PortfolioSuggestedPlay } from "./portfolioTypes";

function portfolioRecommendationReasonIcon(icon: PortfolioRecommendationReason["icon"]) {
  const iconClassName = "portfolio-recommendation-reason-icon";

  if (icon === "risk") return <AlertTriangle className={iconClassName} aria-hidden="true" />;
  if (icon === "goal") return <Target className={iconClassName} aria-hidden="true" />;
  return <Cpu className={iconClassName} aria-hidden="true" />;
}

function portfolioRecommendationReasonText(reason: PortfolioRecommendationReason): ReactNode {
  if (!reason.emphasis || !reason.text.includes(reason.emphasis)) return reason.text;

  const [before, after] = reason.text.split(reason.emphasis);

  return (
    <>
      {before}
      <mark>{reason.emphasis}</mark>
      {after}
    </>
  );
}

interface PortfolioRecommendationCardProps {
  play: PortfolioSuggestedPlay;
  isExpanded: boolean;
  isInteractive: boolean;
  onToggleLogic: () => void;
  onPrimaryAction?: () => void;
  isPrimaryActionDisabled?: boolean;
  primaryActionHint?: string;
}

export function PortfolioRecommendationCard({
  play,
  isExpanded,
  isInteractive,
  onToggleLogic,
  onPrimaryAction,
  isPrimaryActionDisabled = false,
  primaryActionHint,
}: PortfolioRecommendationCardProps) {
  const primaryActionDisabled = !isInteractive || isExpanded || isPrimaryActionDisabled;

  return (
    <article className={`portfolio-recommendation-card risk-${play.priority.toLowerCase()}${isExpanded ? " is-flipped" : ""}`}>
      <div className="portfolio-recommendation-face portfolio-recommendation-front" aria-hidden={isExpanded}>
        <div className="portfolio-recommendation-meta">
          <span className="portfolio-recommendation-risk">{play.riskLabel}</span>
          <span className="portfolio-recommendation-context">{play.context}</span>
        </div>

        <div className="portfolio-recommendation-copy">
          <h3>{play.headline}</h3>
          <p>{play.analysis}</p>
        </div>

        <div className="portfolio-recommendation-why">
          <span>Why this matters</span>
          <div>
            {play.reasons.map((reason) => (
              <p key={reason.text}>
                {portfolioRecommendationReasonIcon(reason.icon)}
                <span>{portfolioRecommendationReasonText(reason)}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="portfolio-recommendation-action">
          <span>Suggested action</span>
          <p>{play.command}</p>
          <div className="portfolio-recommendation-actions">
            <button
              type="button"
              className="portfolio-recommendation-action-button is-primary"
              disabled={primaryActionDisabled}
              title={primaryActionHint}
              tabIndex={primaryActionDisabled ? -1 : 0}
              onClick={onPrimaryAction}
            >
              <span>{play.primaryAction}</span>
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              className="portfolio-recommendation-action-button is-secondary"
              aria-expanded={isExpanded}
              disabled={!isInteractive}
              tabIndex={isInteractive && !isExpanded ? 0 : -1}
              onClick={onToggleLogic}
            >
              {play.secondaryAction}
            </button>
          </div>
        </div>
      </div>

      <div className="portfolio-recommendation-face portfolio-recommendation-back" aria-hidden={!isExpanded}>
        <div className="portfolio-logic-header">
          <span>portfolio AI logic</span>
          <em>{play.context}</em>
        </div>

        <div className="portfolio-logic-copy">
          <h3>{play.headline}</h3>
          <p>{play.explanation}</p>
        </div>

        <div className="portfolio-logic-stream" aria-label="Recommendation logic">
          {play.logic.map((line, index) => (
            <p
              key={line}
              style={{
                animationDelay: `${180 + index * 140}ms`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="portfolio-logic-footer">
          <button
            type="button"
            className="portfolio-recommendation-action-button is-secondary"
            disabled={!isInteractive}
            tabIndex={isInteractive && isExpanded ? 0 : -1}
            onClick={onToggleLogic}
          >
            Back to play
          </button>
        </div>
      </div>
    </article>
  );
}
