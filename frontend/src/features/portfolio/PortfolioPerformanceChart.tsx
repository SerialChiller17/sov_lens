import { useState, type CSSProperties, type PointerEvent } from "react";
import { PORTFOLIO_INVESTED_VALUE } from "./portfolioData";
import { formatPortfolioCurrency, formatSignedPortfolioCurrency, formatSignedPortfolioPercent } from "./portfolioFormatters";
import type { PortfolioPerformancePoint } from "./portfolioTypes";

interface PortfolioPerformanceChartProps {
  points: PortfolioPerformancePoint[];
  benchmarkPoints: PortfolioPerformancePoint[];
}

export function PortfolioPerformanceChart({ points, benchmarkPoints }: PortfolioPerformanceChartProps) {
  const [activeIndex, setActiveIndex] = useState(points.length - 1);
  const values = [...points, ...benchmarkPoints].map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const chartCoordinates = (series: PortfolioPerformancePoint[]) =>
    series.map((point, index) => ({
      ...point,
      x: 7 + (index / Math.max(series.length - 1, 1)) * 86,
      y: 56 - ((point.value - min) / range) * 42,
    }));

  const coordinates = chartCoordinates(points);
  const benchmarkCoordinates = chartCoordinates(benchmarkPoints);
  const chartPath = (series: typeof coordinates) =>
    series.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");

  const path = chartPath(coordinates);
  const benchmarkPath = chartPath(benchmarkCoordinates);
  const areaPath = `${path} L 93 59 L 7 59 Z`;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const activePoint = coordinates[safeActiveIndex] ?? coordinates[coordinates.length - 1];
  const activeBenchmarkPoint = benchmarkCoordinates[safeActiveIndex] ?? benchmarkCoordinates[benchmarkCoordinates.length - 1];
  const latestBenchmarkPoint = benchmarkCoordinates[benchmarkCoordinates.length - 1];
  const activeGainLoss = activePoint.value - PORTFOLIO_INVESTED_VALUE;
  const activeGainLossPercent = (activeGainLoss / PORTFOLIO_INVESTED_VALUE) * 100;
  const activePortfolioReturnPercent = activeGainLossPercent;
  const activeBenchmarkReturnPercent = ((activeBenchmarkPoint.value - benchmarkPoints[0].value) / benchmarkPoints[0].value) * 100;
  const activeAlphaPercent = activePortfolioReturnPercent - activeBenchmarkReturnPercent;
  const activeMoveClass = activeGainLoss >= 0 ? "is-positive" : "is-negative";
  const activeAlphaClass = activeAlphaPercent >= 0 ? "is-positive" : "is-negative";

  const handleChartPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const constrainedX = Math.min(Math.max(cursorX, 7), 93);
    const nextIndex = Math.round(((constrainedX - 7) / 86) * Math.max(points.length - 1, 1));
    const clampedIndex = Math.min(Math.max(nextIndex, 0), points.length - 1);
    setActiveIndex((currentIndex) => (currentIndex === clampedIndex ? currentIndex : clampedIndex));
  };

  return (
    <div
      className="portfolio-performance-stack"
      style={
        {
          "--trace-left": `${activePoint.x.toFixed(2)}%`,
          "--trace-top": `${((activePoint.y / 72) * 100).toFixed(2)}%`,
        } as CSSProperties
      }
    >
      <svg
        className="portfolio-performance-chart"
        viewBox="0 0 100 72"
        role="img"
        aria-label="Portfolio performance compared with Nifty 50"
        onPointerMove={handleChartPointerMove}
        onPointerLeave={() => setActiveIndex(points.length - 1)}
      >
        <defs>
          <linearGradient id="portfolioPerformanceArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(116, 229, 156, 0.2)" />
            <stop offset="64%" stopColor="rgba(236, 215, 110, 0.08)" />
            <stop offset="100%" stopColor="rgba(255, 242, 209, 0.012)" />
          </linearGradient>
          <linearGradient id="portfolioPerformanceLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ecd76e" />
            <stop offset="48%" stopColor="#fff2d1" />
            <stop offset="100%" stopColor="#74e59c" />
          </linearGradient>
        </defs>
        <path className="portfolio-chart-grid" d="M 7 16 H 93 M 7 35 H 93 M 7 54 H 93" />
        <path className="portfolio-chart-baseline" d="M 7 59 H 93" />
        <path className="portfolio-chart-area" d={areaPath} />
        <path className="portfolio-chart-benchmark-line" d={benchmarkPath} />
        <text className="portfolio-chart-benchmark-label" x="90.8" y={Math.max(12, latestBenchmarkPoint.y - 2.2).toFixed(2)} textAnchor="end">
          Nifty 50
        </text>
        <path className="portfolio-chart-line-glass" d={path} />
        <path className="portfolio-chart-line" d={path} />
        <path className="portfolio-chart-active-guide" d={`M ${activePoint.x.toFixed(2)} 14 V 59`} />
        <text className="portfolio-chart-axis-label" x="7" y="67">
          Jan
        </text>
        <text className="portfolio-chart-axis-label" x="93" y="67" textAnchor="end">
          Jun
        </text>
        <rect className="portfolio-chart-hitbox" x="0" y="0" width="100" height="72" />
      </svg>

      <div className="portfolio-performance-callout" aria-label={`${activePoint.label} portfolio performance summary`}>
        <div>
          <span>Portfolio Value</span>
          <strong>{formatPortfolioCurrency(activePoint.value)}</strong>
        </div>
        <div className={activeMoveClass}>
          <span>Gain/Loss</span>
          <strong>
            {formatSignedPortfolioCurrency(activeGainLoss)} ({formatSignedPortfolioPercent(activeGainLossPercent)})
          </strong>
        </div>
        <div className={activeAlphaClass}>
          <span>Alpha vs Nifty</span>
          <strong>{formatSignedPortfolioPercent(activeAlphaPercent)}</strong>
        </div>
      </div>
    </div>
  );
}
