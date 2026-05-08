import { useState, type CSSProperties } from "react";
import { PORTFOLIO_ALLOCATION_COLORS, PORTFOLIO_DONUT_SEGMENT_GAP } from "./portfolioData";
import type { PortfolioHolding } from "./portfolioTypes";

export function PortfolioCompositionDonut({ holdings }: { holdings: PortfolioHolding[] }) {
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const totalAllocation = holdings.reduce((sum, holding) => sum + holding.allocation, 0);
  const activeHolding = activeTicker ? holdings.find((holding) => holding.ticker === activeTicker) ?? null : null;
  const fundAllocation = holdings
    .filter((holding) => /etf|fund/i.test(holding.sector) || /etf|fund/i.test(holding.name))
    .reduce((sum, holding) => sum + holding.allocation, 0);
  const equityAllocation = Math.max(totalAllocation - fundAllocation, 0);
  let cumulativeAllocation = 0;

  const segments = holdings.map((holding) => {
    const normalizedShare = (holding.allocation / totalAllocation) * 100;
    const segmentGap = Math.min(PORTFOLIO_DONUT_SEGMENT_GAP, normalizedShare * 0.22);
    const visibleShare = Math.max(normalizedShare - segmentGap, 0.1);
    const start = cumulativeAllocation;
    cumulativeAllocation += normalizedShare;
    const midAngle = ((start + normalizedShare / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    const isActive = holding.ticker === activeTicker;
    const lift = isActive ? 1.65 : 0;

    return {
      holding,
      color: PORTFOLIO_ALLOCATION_COLORS[holding.ticker] ?? "#fff2d1",
      dashArray: `${visibleShare} ${100 - visibleShare}`,
      dashOffset: -(start + segmentGap / 2),
      liftX: Math.cos(midAngle) * lift,
      liftY: Math.sin(midAngle) * lift,
      isActive,
    };
  });

  return (
    <div className="portfolio-donut-composition" onMouseLeave={() => setActiveTicker(null)} onBlur={() => setActiveTicker(null)}>
      <div className="portfolio-donut-stage">
        <svg className="portfolio-donut-chart" viewBox="0 0 112 112" role="img" aria-label="Stock allocation donut chart. Focus or hover a segment to preview its allocation.">
          <circle className="portfolio-donut-track" cx="56" cy="56" r="42" />
          {segments.map((segment) => (
            <g
              key={segment.holding.ticker}
              className={`portfolio-donut-segment-shell${segment.isActive ? " is-active" : ""}`}
              tabIndex={0}
              aria-label={`${segment.holding.name} ${segment.holding.allocation.toFixed(1)} percent of portfolio`}
              onMouseEnter={() => setActiveTicker(segment.holding.ticker)}
              onFocus={() => setActiveTicker(segment.holding.ticker)}
              style={
                {
                  transform: `translate(${segment.liftX.toFixed(2)}px, ${segment.liftY.toFixed(2)}px)`,
                } as CSSProperties
              }
            >
              <circle
                className="portfolio-donut-segment"
                cx="56"
                cy="56"
                r="42"
                pathLength={100}
                transform="rotate(-90 56 56)"
                style={
                  {
                    stroke: segment.color,
                    strokeDasharray: segment.dashArray,
                    strokeDashoffset: segment.dashOffset,
                    "--segment-aura": segment.color,
                  } as CSSProperties
                }
              />
              <circle
                className="portfolio-donut-segment-sheen"
                cx="56"
                cy="56"
                r="42"
                pathLength={100}
                transform="rotate(-90 56 56)"
                style={
                  {
                    strokeDasharray: segment.dashArray,
                    strokeDashoffset: segment.dashOffset,
                  } as CSSProperties
                }
              />
            </g>
          ))}
        </svg>
        <div className="portfolio-donut-center" aria-live="polite">
          {activeHolding ? (
            <>
              <span>{activeHolding.ticker}</span>
              <strong>{activeHolding.allocation.toFixed(1)}%</strong>
              <small>{activeHolding.name}</small>
            </>
          ) : (
            <div className="portfolio-donut-mix-lines">
              <small>Equity {equityAllocation.toFixed(0)}%</small>
              <small>Fund {fundAllocation.toFixed(0)}%</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
