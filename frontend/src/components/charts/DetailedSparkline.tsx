import { useId, type CSSProperties } from "react";
import "./DetailedSparkline.css";

export type DetailedSparklineTrend = "up" | "down" | "mixed" | "auto";

interface DetailedSparklineProps {
  data: number[];
  trend?: DetailedSparklineTrend;
  width?: number | string;
  height?: number | string;
  showBaseline?: boolean;
  showArea?: boolean;
  showEndPoint?: boolean;
  className?: string;
  positiveColor?: string;
  negativeColor?: string;
  ariaLabel?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

const VIEW_BOX_WIDTH = 120;
const VIEW_BOX_HEIGHT = 48;
const PADDING_X = 5;
const PADDING_TOP = 5;
const PADDING_BOTTOM = 6;
const SMOOTHING = 0.18;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function normalizeData(data: number[]) {
  const values = data.filter((value) => Number.isFinite(value));
  if (values.length >= 2) return values;
  if (values.length === 1) return [values[0], values[0]];
  return [0, 0];
}

function controlPoint(current: ChartPoint, previous: ChartPoint | undefined, next: ChartPoint | undefined, reverse = false) {
  const previousPoint = previous ?? current;
  const nextPoint = next ?? current;
  const angle = Math.atan2(nextPoint.y - previousPoint.y, nextPoint.x - previousPoint.x) + (reverse ? Math.PI : 0);
  const length = Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y) * SMOOTHING;

  return {
    x: current.x + Math.cos(angle) * length,
    y: current.y + Math.sin(angle) * length,
  };
}

function cubicCommand(points: ChartPoint[], index: number) {
  const currentPoint = points[index];
  const nextPoint = points[index + 1];
  const previousPoint = points[index - 1];
  const afterNextPoint = points[index + 2];
  const startControl = controlPoint(currentPoint, previousPoint, nextPoint);
  const endControl = controlPoint(nextPoint, currentPoint, afterNextPoint, true);

  return `C ${startControl.x.toFixed(2)} ${startControl.y.toFixed(2)}, ${endControl.x.toFixed(2)} ${endControl.y.toFixed(2)}, ${nextPoint.x.toFixed(2)} ${nextPoint.y.toFixed(2)}`;
}

function segmentTone(startValue: number, endValue: number, baselineValue: number) {
  if (endValue === baselineValue) return endValue >= startValue ? "positive" : "negative";
  return endValue > baselineValue ? "positive" : "negative";
}

function trendClass(trend: DetailedSparklineTrend, firstValue: number, lastValue: number) {
  if (trend === "up" || trend === "down" || trend === "mixed") return `is-${trend}`;
  if (lastValue > firstValue) return "is-up";
  if (lastValue < firstValue) return "is-down";
  return "is-mixed";
}

function toCssLength(value: number | string | undefined) {
  if (typeof value === "number") return `${value}px`;
  return value;
}

export function DetailedSparkline({
  data,
  trend = "auto",
  width,
  height,
  showBaseline = true,
  showArea = true,
  showEndPoint = true,
  className,
  positiveColor,
  negativeColor,
  ariaLabel = "Mini trend chart",
}: DetailedSparklineProps) {
  const gradientId = `mini-trend-fill-${sanitizeId(useId())}`;
  const values = normalizeData(data);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const minValue = Math.min(...values, firstValue);
  const maxValue = Math.max(...values, firstValue);
  const range = Math.max(maxValue - minValue, 1);
  const chartHeight = VIEW_BOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const chartWidth = VIEW_BOX_WIDTH - PADDING_X * 2;
  const yForValue = (value: number) => PADDING_TOP + (1 - (value - minValue) / range) * chartHeight;
  const baselineY = clampNumber(yForValue(firstValue), PADDING_TOP + 2, VIEW_BOX_HEIGHT - PADDING_BOTTOM - 2);

  const points = values.map((value, index) => ({
    value,
    x: PADDING_X + (index / Math.max(values.length - 1, 1)) * chartWidth,
    y: yForValue(value),
  }));

  const fullPath = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`]
    .concat(points.slice(0, -1).map((_, index) => cubicCommand(points, index)))
    .join(" ");
  const areaPath = `${fullPath} L ${points[points.length - 1].x.toFixed(2)} ${VIEW_BOX_HEIGHT - PADDING_BOTTOM} L ${points[0].x.toFixed(2)} ${VIEW_BOX_HEIGHT - PADDING_BOTTOM} Z`;
  const segments = points.slice(0, -1).map((point, index) => ({
    key: `${index}-${points[index + 1].x.toFixed(2)}`,
    path: `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${cubicCommand(points, index)}`,
    tone: segmentTone(point.value, points[index + 1].value, firstValue),
  }));
  const resolvedTrendClass = trendClass(trend, firstValue, lastValue);
  const areaTone = trend === "up" ? "positive" : trend === "down" ? "negative" : lastValue >= firstValue ? "positive" : "negative";
  const endPoint = points[points.length - 1];

  const style = {
    width: toCssLength(width),
    height: toCssLength(height),
    "--mini-positive": positiveColor,
    "--mini-negative": negativeColor,
    "--mini-area-color": areaTone === "positive" ? (positiveColor ?? "var(--pf-green, #8df0bb)") : (negativeColor ?? "var(--pf-red, #f29a9a)"),
  } as CSSProperties & Record<string, string | undefined>;

  return (
    <svg
      className={["detailed-sparkline", resolvedTrendClass, className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
      style={style}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1={PADDING_TOP} y2={VIEW_BOX_HEIGHT - PADDING_BOTTOM} gradientUnits="userSpaceOnUse">
          <stop className="detailed-sparkline-area-stop-strong" offset="0%" />
          <stop className="detailed-sparkline-area-stop-soft" offset="52%" />
          <stop className="detailed-sparkline-area-stop-clear" offset="100%" />
        </linearGradient>
      </defs>
      <path className="detailed-sparkline-grid" d={`M ${PADDING_X} ${PADDING_TOP + chartHeight * 0.28} H ${VIEW_BOX_WIDTH - PADDING_X} M ${PADDING_X} ${PADDING_TOP + chartHeight * 0.72} H ${VIEW_BOX_WIDTH - PADDING_X}`} aria-hidden="true" />
      {showBaseline ? <path className="detailed-sparkline-baseline" d={`M ${PADDING_X} ${baselineY.toFixed(2)} H ${VIEW_BOX_WIDTH - PADDING_X}`} aria-hidden="true" /> : null}
      {showArea ? <path className="detailed-sparkline-area" d={areaPath} fill={`url(#${gradientId})`} aria-hidden="true" /> : null}
      <path className="detailed-sparkline-line-shadow" d={fullPath} aria-hidden="true" />
      {segments.map((segment) => (
        <path key={segment.key} className={`detailed-sparkline-segment is-${segment.tone}`} d={segment.path} aria-hidden="true" />
      ))}
      {showEndPoint ? (
        <>
          <circle className="detailed-sparkline-endpoint-halo" cx={endPoint.x.toFixed(2)} cy={endPoint.y.toFixed(2)} r="3.2" aria-hidden="true" />
          <circle className="detailed-sparkline-endpoint" cx={endPoint.x.toFixed(2)} cy={endPoint.y.toFixed(2)} r="1.8" aria-hidden="true" />
        </>
      ) : null}
    </svg>
  );
}
