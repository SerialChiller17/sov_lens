import { useMemo, useState, type PointerEvent } from "react";
import { formatPortfolioCurrency, formatSignedPortfolioPercent } from "./portfolioFormatters";
import type { PortfolioPerformancePoint } from "./portfolioTypes";

interface PortfolioPerformanceChartProps {
  points: PortfolioPerformancePoint[];
  benchmarkPoints: PortfolioPerformancePoint[];
}

const TIMEFRAMES = ["1M", "3M", "6M", "1Y"] as const;
const VIEW_BOX = { width: 640, height: 320, left: 58, right: 612, top: 34, bottom: 264 };

function toReturnPercent(series: PortfolioPerformancePoint[], index: number) {
  const firstPoint = series[0];
  const point = series[index] ?? series[series.length - 1];
  if (!firstPoint || !point) return 0;
  return ((point.value - firstPoint.value) / firstPoint.value) * 100;
}

function getPath(points: Array<PortfolioPerformancePoint & { x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  return points
    .slice(1)
    .reduce((path, point, index) => {
      const currentIndex = index + 1;
      const previous = points[currentIndex - 2] ?? points[currentIndex - 1];
      const current = points[currentIndex - 1];
      const next = point;
      const after = points[currentIndex + 1] ?? next;
      const smoothing = 0.18;
      const controlOneX = current.x + (next.x - previous.x) * smoothing;
      const controlOneY = current.y + (next.y - previous.y) * smoothing;
      const controlTwoX = next.x - (after.x - current.x) * smoothing;
      const controlTwoY = next.y - (after.y - current.y) * smoothing;

      return `${path} C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }, `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`);
}

export function PortfolioPerformanceChart({ points, benchmarkPoints }: PortfolioPerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("6M");
  const [activeIndex, setActiveIndex] = useState(points.length - 1);

  const chart = useMemo(() => {
    const values = [...points, ...benchmarkPoints].map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const plotWidth = VIEW_BOX.right - VIEW_BOX.left;
    const plotHeight = VIEW_BOX.bottom - VIEW_BOX.top;

    const coordinates = (series: PortfolioPerformancePoint[]) =>
      series.map((point, index) => ({
        ...point,
        x: VIEW_BOX.left + (index / Math.max(series.length - 1, 1)) * plotWidth,
        y: VIEW_BOX.bottom - ((point.value - min) / range) * plotHeight,
      }));

    const portfolio = coordinates(points);
    const benchmark = coordinates(benchmarkPoints);
    const yTicks = [max, min + range / 2, min].map((value) => ({
      value,
      y: VIEW_BOX.bottom - ((value - min) / range) * plotHeight,
    }));

    return {
      portfolio,
      benchmark,
      portfolioPath: getPath(portfolio),
      benchmarkPath: getPath(benchmark),
      yTicks,
    };
  }, [benchmarkPoints, points]);

  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const activePortfolioPoint = chart.portfolio[safeActiveIndex] ?? chart.portfolio[chart.portfolio.length - 1];
  const activeBenchmarkPoint = chart.benchmark[safeActiveIndex] ?? chart.benchmark[chart.benchmark.length - 1];
  const portfolioReturn = toReturnPercent(points, safeActiveIndex);
  const benchmarkReturn = toReturnPercent(benchmarkPoints, safeActiveIndex);
  const latestPortfolioReturn = toReturnPercent(points, points.length - 1);
  const latestBenchmarkReturn = toReturnPercent(benchmarkPoints, benchmarkPoints.length - 1);
  const latestPortfolioPoint = chart.portfolio[chart.portfolio.length - 1];
  const latestBenchmarkPoint = chart.benchmark[chart.benchmark.length - 1];
  const clampDirectLabelY = (value?: number) => Math.min(Math.max(value ?? VIEW_BOX.top, VIEW_BOX.top + 12), VIEW_BOX.bottom - 10);

  const handleChartPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * VIEW_BOX.width;
    const constrainedX = Math.min(Math.max(cursorX, VIEW_BOX.left), VIEW_BOX.right);
    const nextIndex = Math.round(((constrainedX - VIEW_BOX.left) / (VIEW_BOX.right - VIEW_BOX.left)) * Math.max(points.length - 1, 1));
    setActiveIndex(Math.min(Math.max(nextIndex, 0), points.length - 1));
  };

  return (
    <div className="portfolio-cockpit-performance-chart">
      <div className="portfolio-chart-toolbar" aria-label="Performance timeframe">
        <div className="portfolio-chart-summary-badge">
          Outperformance {formatSignedPortfolioPercent(latestPortfolioReturn - latestBenchmarkReturn)}
        </div>
        <div className="portfolio-timeframe-chips">
          {TIMEFRAMES.map((item) => (
            <button
              key={item}
              type="button"
              className={timeframe === item ? "is-active" : ""}
              aria-pressed={timeframe === item}
              onClick={() => setTimeframe(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="portfolio-chart-stage" aria-live="polite">
        <svg
          className="portfolio-performance-chart"
          viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
          role="img"
          aria-label="Portfolio value compared with NIFTY 50"
          preserveAspectRatio="none"
          onPointerMove={handleChartPointerMove}
          onPointerLeave={() => setActiveIndex(points.length - 1)}
        >
          <defs>
            <linearGradient id="portfolioPerformanceArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(157, 176, 139, 0.24)" />
              <stop offset="58%" stopColor="rgba(157, 176, 139, 0.08)" />
              <stop offset="100%" stopColor="rgba(157, 176, 139, 0)" />
            </linearGradient>
            <linearGradient id="portfolioPerformanceLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#d0bb78" />
              <stop offset="100%" stopColor="#9daf8d" />
            </linearGradient>
          </defs>

          <rect className="portfolio-chart-plot-bg" x={VIEW_BOX.left} y={VIEW_BOX.top} width={VIEW_BOX.right - VIEW_BOX.left} height={VIEW_BOX.bottom - VIEW_BOX.top} />
          {chart.yTicks.map((tick) => (
            <g key={tick.value.toFixed(0)}>
              <path className="portfolio-chart-grid" d={`M ${VIEW_BOX.left} ${tick.y.toFixed(2)} H ${VIEW_BOX.right}`} />
              <text className="portfolio-chart-axis-label" x="14" y={(tick.y + 4).toFixed(2)}>
                {formatPortfolioCurrency(tick.value)}
              </text>
            </g>
          ))}
          <path className="portfolio-chart-baseline" d={`M ${VIEW_BOX.left} ${VIEW_BOX.bottom} H ${VIEW_BOX.right}`} />
          <path className="portfolio-chart-baseline" d={`M ${VIEW_BOX.left} ${VIEW_BOX.top} V ${VIEW_BOX.bottom}`} />
          <path className="portfolio-chart-area" d={`${chart.portfolioPath} L ${VIEW_BOX.right} ${VIEW_BOX.bottom} L ${VIEW_BOX.left} ${VIEW_BOX.bottom} Z`} />
          <path className="portfolio-chart-benchmark-line" d={chart.benchmarkPath} />
          <path className="portfolio-chart-line-glass" d={chart.portfolioPath} />
          <path className="portfolio-chart-line" d={chart.portfolioPath} />
          {latestPortfolioPoint ? (
            <text className="portfolio-chart-direct-label is-portfolio" x={VIEW_BOX.right - 8} y={clampDirectLabelY(latestPortfolioPoint.y).toFixed(2)} textAnchor="end">
              Portfolio {formatSignedPortfolioPercent(latestPortfolioReturn)}
            </text>
          ) : null}
          {latestBenchmarkPoint ? (
            <text className="portfolio-chart-direct-label is-benchmark" x={VIEW_BOX.right - 8} y={clampDirectLabelY(latestBenchmarkPoint.y).toFixed(2)} textAnchor="end">
              NIFTY {formatSignedPortfolioPercent(latestBenchmarkReturn)}
            </text>
          ) : null}
          {activePortfolioPoint ? (
            <>
              <path className="portfolio-chart-active-guide" d={`M ${activePortfolioPoint.x.toFixed(2)} ${VIEW_BOX.top} V ${VIEW_BOX.bottom}`} />
              <circle className="portfolio-chart-active-dot" cx={activePortfolioPoint.x.toFixed(2)} cy={activePortfolioPoint.y.toFixed(2)} r="5.4" />
              <circle className="portfolio-chart-benchmark-dot" cx={activeBenchmarkPoint.x.toFixed(2)} cy={activeBenchmarkPoint.y.toFixed(2)} r="4.2" />
            </>
          ) : null}
          {chart.portfolio.map((point, index) => (
            <text key={`${point.label}-${index}`} className="portfolio-chart-axis-label" x={point.x.toFixed(2)} y="296" textAnchor="middle">
              {point.label}
            </text>
          ))}
          <rect className="portfolio-chart-hitbox" x="0" y="0" width={VIEW_BOX.width} height={VIEW_BOX.height} />
        </svg>
      </div>

      <div className="portfolio-chart-readout">
        <div>
          <span>{activePortfolioPoint?.label ?? "Latest"}</span>
          <strong>{formatPortfolioCurrency(activePortfolioPoint?.value ?? 0)}</strong>
        </div>
        <div className={portfolioReturn >= 0 ? "is-positive" : "is-negative"}>
          <span>Portfolio return</span>
          <strong>{formatSignedPortfolioPercent(portfolioReturn)}</strong>
        </div>
        <div className={benchmarkReturn >= 0 ? "is-positive" : "is-negative"}>
          <span>NIFTY 50 return</span>
          <strong>{formatSignedPortfolioPercent(benchmarkReturn)}</strong>
        </div>
        <div className={portfolioReturn - benchmarkReturn >= 0 ? "is-positive" : "is-negative"}>
          <span>Alpha</span>
          <strong>{formatSignedPortfolioPercent(portfolioReturn - benchmarkReturn)}</strong>
        </div>
      </div>

      <div className="portfolio-chart-legend" aria-label="Chart legend">
        <span className="is-portfolio">Portfolio Value</span>
        <span className="is-benchmark">NIFTY 50</span>
      </div>
    </div>
  );
}
