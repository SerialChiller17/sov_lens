import { useMemo, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import {
  computeAlphaVsBenchmark,
  computeCAGR,
  computeRollingCAGR,
  computeTotalReturn,
  formatIndianCroresCompact,
  formatIndianCurrency,
  formatPercent,
  formatSignedPercent,
  generateAICommentary,
  niceRoundTicks,
  normalizeToInvestment,
  type NormalizedNavPoint,
  type RollingCagrPoint,
} from "../fundUtils";
import { MOCK_FUNDS } from "../mockFunds";
import type { Fund, FundSlot, NavPoint } from "../types";

type TimeRange = "1Y" | "3Y" | "5Y" | "10Y" | "MAX";
type ViewMode = "POINT_TO_POINT" | "ROLLING_3Y";

type SelectedFund = {
  fund: Fund;
  slotIndex: number;
  color: string;
};

type ChartPoint = {
  date: string;
  value: number | null;
  changePercent: number | null;
};

type ChartSeries = {
  id: string;
  label: string;
  color: string;
  dashed?: boolean;
  points: ChartPoint[];
};

type CoordinatePoint = ChartPoint & {
  x: number;
  y: number | null;
};

const TIME_RANGES: TimeRange[] = ["1Y", "3Y", "5Y", "10Y", "MAX"];
const FUND_COLORS = ["#B86A4B", "#D7D7CF", "#7E9A86", "#A1A8B3"];
const BENCHMARK_COLOR = "rgba(215, 215, 207, 0.42)";
const BENCHMARK_LABEL = "NIFTY 500 TRI";
const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";
const FONT_SANS = 'Satoshi, "IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FONT_MONO = '"IBM Plex Mono", "Geist Mono", "SFMono-Regular", Consolas, monospace';
const SVG_VIEW_BOX = { width: 220, height: 74 };
const VIEW_BOX = { left: 27, right: 214, top: 7, bottom: 63 };
const CHART_MIN_HEIGHT = "16.9rem";
const PERFORMANCE_PANEL_MIN_HEIGHT = "22.8rem";
const SVG_AXIS_FONT_SIZE = 3.05;
const SVG_AXIS_SMALL_FONT_SIZE = 2;
const DEFAULT_INVESTMENT_AMOUNT = 10000;
const BENCHMARK_SOURCE_IDS = ["icici-pru-bluechip", "parag-parikh-flexi-cap", "hdfc-flexi-cap", "kotak-emerging-equity"];
const MAX_X_TICKS: Record<TimeRange, number> = { "1Y": 6, "3Y": 6, "5Y": 6, "10Y": 6, MAX: 6 };

const chartHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(16rem, 1fr) auto",
  alignItems: "center",
  gap: "0.64rem",
  minWidth: 0,
};

const chartTitleBlockStyle: CSSProperties = {
  display: "grid",
  minWidth: 0,
};

const chartHeadingStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255, 250, 235, 0.94)",
  fontFamily: FONT_SANS,
  fontSize: "1rem",
  fontWeight: 700,
  lineHeight: 1.1,
};

const primaryRangeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifySelf: "end",
  gap: "0.16rem",
  border: "1px solid rgba(255, 242, 209, 0.14)",
  borderRadius: CHIP_RADIUS,
  padding: "0.18rem",
  background:
    "linear-gradient(180deg, rgba(255, 250, 235, 0.05), rgba(255, 250, 235, 0.015)), rgba(0, 0, 0, 0.34)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.06), 0 0.55rem 1.1rem rgba(0, 0, 0, 0.18)",
};

const secondaryControlsRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "0.5rem",
  borderTop: "1px solid rgba(255, 242, 209, 0.075)",
  paddingTop: "0.48rem",
};

const secondaryControlsRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifySelf: "end",
  flexWrap: "wrap",
  gap: "0.42rem",
};

const quietControlGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.28rem",
};

const segmentedControlStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.12rem",
  border: "1px solid rgba(255, 242, 209, 0.085)",
  borderRadius: CHIP_RADIUS,
  padding: "0.14rem",
  background: "rgba(0, 0, 0, 0.18)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.04)",
};

const controlLabelStyle: CSSProperties = {
  color: "rgba(238, 231, 214, 0.46)",
  fontFamily: FONT_MONO,
  fontSize: "0.46rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const pillStyle: CSSProperties = {
  border: "1px solid transparent",
  borderRadius: CHIP_RADIUS,
  minHeight: "1.5rem",
  padding: "0.26rem 0.5rem",
  color: "rgba(238, 231, 214, 0.66)",
  background: "transparent",
  cursor: "pointer",
  fontFamily: FONT_MONO,
  fontSize: "0.54rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const activePillStyle: CSSProperties = {
  borderColor: "rgba(255, 242, 209, 0.16)",
  color: "rgba(255, 250, 235, 0.94)",
  background:
    "linear-gradient(180deg, rgba(255, 250, 235, 0.16), rgba(255, 250, 235, 0.05)), rgba(0, 0, 0, 0.5)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.14), 0 0 0.82rem rgba(255, 242, 209, 0.055)",
};

const secondaryPillStyle: CSSProperties = {
  ...pillStyle,
  minHeight: "1.24rem",
  padding: "0.2rem 0.42rem",
  borderColor: "transparent",
  color: "rgba(238, 231, 214, 0.58)",
  background: "transparent",
  fontSize: "0.48rem",
};

const activeSecondaryPillStyle: CSSProperties = {
  ...secondaryPillStyle,
  borderColor: "rgba(255, 242, 209, 0.14)",
  color: "rgba(255, 250, 235, 0.9)",
  background:
    "linear-gradient(180deg, rgba(255, 242, 209, 0.13), rgba(255, 242, 209, 0.045)), rgba(0, 0, 0, 0.34)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.09)",
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 76fr) minmax(18.5rem, 24fr)",
  columnGap: "0.76rem",
  minHeight: PERFORMANCE_PANEL_MIN_HEIGHT,
  overflow: "hidden",
};

const chartPaneStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateRows: "auto auto auto",
  alignContent: "start",
  gap: "0.28rem",
  minWidth: 0,
  padding: "0.66rem 0.66rem 0.5rem",
};

const statsPaneStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "0.34rem",
  minWidth: 0,
  borderLeft: "1px solid rgba(255, 242, 209, 0.08)",
  maxHeight: "min(36rem, calc(100vh - 15rem))",
  overflowY: "auto",
  padding: "0.56rem 0.58rem",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(255, 242, 209, 0.24) transparent",
};

const tooltipChromeStyle: CSSProperties = {
  position: "absolute",
  zIndex: 3,
  display: "grid",
  gap: "0.34rem",
  width: "min(16.9rem, calc(100% - 0.92rem))",
  border: "1px solid rgba(255, 253, 240, 0.13)",
  borderRadius: OUTER_RADIUS,
  padding: "0.48rem 0.56rem",
  background:
    "linear-gradient(135deg, rgba(255, 253, 240, 0.12), rgba(116, 229, 156, 0.065) 44%, rgba(0, 0, 0, 0.28)), rgba(13, 15, 13, 0.95)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 253, 240, 0.12), 0 0.8rem 1.8rem rgba(0, 0, 0, 0.38), 0 0 1.2rem rgba(116, 229, 156, 0.08)",
  backdropFilter: "blur(16px) saturate(1.08)",
  pointerEvents: "none",
  userSelect: "none",
};

const chartTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.32rem",
  minWidth: 0,
  margin: 0,
  color: "rgba(238, 231, 214, 0.68)",
  fontFamily: FONT_SANS,
  fontSize: "0.76rem",
  fontWeight: 650,
  lineHeight: 1.1,
};

const chartTitleCurrencyStyle: CSSProperties = {
  color: "rgba(255, 250, 235, 0.94)",
  fontWeight: 900,
};

const investmentAmountInputStyle: CSSProperties = {
  minWidth: "8.8ch",
  maxWidth: "18ch",
  height: "1.62rem",
  border: "1px solid rgba(255, 242, 209, 0.24)",
  borderRadius: "7px",
  padding: "0 0.52rem",
  color: "rgba(255, 250, 235, 0.92)",
  background:
    "linear-gradient(180deg, rgba(255, 250, 235, 0.12), rgba(255, 250, 235, 0.035)), rgba(0, 0, 0, 0.42)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.13), inset 0 -0.35rem 0.65rem rgba(0, 0, 0, 0.24)",
  cursor: "text",
  fontFamily: FONT_MONO,
  fontSize: "0.82rem",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};

const svgAxisTextStyle: CSSProperties = {
  fill: "rgba(238, 231, 214, 0.76)",
  fontFamily: FONT_MONO,
  fontVariantNumeric: "tabular-nums",
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const svgAxisMutedTextStyle: CSSProperties = {
  ...svgAxisTextStyle,
  fill: "rgba(238, 231, 214, 0.52)",
};

function buildBenchmarkHistory() {
  const sourceFunds = BENCHMARK_SOURCE_IDS.map((id) => MOCK_FUNDS.find((fund) => fund.id === id)).filter((fund): fund is Fund => Boolean(fund));
  const dates = sourceFunds[0]?.navHistory.map((point) => point.date) ?? [];

  return dates.map((date) => {
    const normalizedValues = sourceFunds
      .map((fund) => {
        const point = fund.navHistory.find((item) => item.date === date);
        const baseNav = fund.navHistory[0]?.nav;
        if (!point || !baseNav) return null;
        return (point.nav / baseNav) * 100;
      })
      .filter((value): value is number => typeof value === "number");

    const nav = normalizedValues.reduce((sum, value) => sum + value, 0) / Math.max(normalizedValues.length, 1);
    return { date, nav: Number(nav.toFixed(4)) };
  });
}

const BENCHMARK_HISTORY = buildBenchmarkHistory();

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftMonths(date: string, months: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return isoDate(next);
}

function latestDateFromHistory(history: NavPoint[]) {
  return history[history.length - 1]?.date ?? isoDate(new Date());
}

function earliestDateFromHistories(histories: NavPoint[][]) {
  const dates = histories.map((history) => history[0]?.date).filter((date): date is string => Boolean(date));
  return dates.sort()[0] ?? latestDateFromHistory(BENCHMARK_HISTORY);
}

function rangeStartDate(range: TimeRange, endDate: string, histories: NavPoint[][]) {
  if (range === "MAX") return earliestDateFromHistories(histories);
  const monthsByRange: Record<Exclude<TimeRange, "MAX">, number> = { "1Y": -12, "3Y": -36, "5Y": -60, "10Y": -120 };
  return shiftMonths(endDate, monthsByRange[range]);
}

function maxDate(first: string, second: string) {
  return first > second ? first : second;
}

function formatTooltipMonth(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase();
}

function formatAxisMonth(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }).toUpperCase();
}

function formatAxisYear(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB", { year: "numeric" });
}

function parseInvestmentAmount(input: string) {
  const digitsOnly = input.replace(/[^\d]/g, "");
  const amount = Number(digitsOnly);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function formatInvestmentInput(amount: number) {
  return Math.round(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function toChartPoints(points: NormalizedNavPoint[] | RollingCagrPoint[], viewMode: ViewMode): ChartPoint[] {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
    changePercent: viewMode === "POINT_TO_POINT" ? (point as NormalizedNavPoint).changePercent : null,
  }));
}

function yDomain(values: number[], viewMode: ViewMode, investmentAmount: number) {
  const baseAmount = Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : DEFAULT_INVESTMENT_AMOUNT;

  if (values.length === 0) {
    return viewMode === "ROLLING_3Y" ? { min: -5, max: 5 } : { min: baseAmount * 0.88, max: baseAmount * 1.12 };
  }

  const minValue = Math.min(...values, viewMode === "ROLLING_3Y" ? 0 : baseAmount);
  const maxValue = Math.max(...values, viewMode === "ROLLING_3Y" ? 0 : baseAmount);
  const padding = Math.max((maxValue - minValue) * 0.12, viewMode === "ROLLING_3Y" ? 2 : baseAmount * 0.08);
  return { min: viewMode === "ROLLING_3Y" ? minValue - padding : Math.max(0, minValue - padding), max: maxValue + padding };
}

function xForIndex(index: number, total: number) {
  return VIEW_BOX.left + (index / Math.max(total - 1, 1)) * (VIEW_BOX.right - VIEW_BOX.left);
}

function yForValue(value: number, domain: { min: number; max: number }) {
  const ratio = (value - domain.min) / Math.max(domain.max - domain.min, 1);
  return VIEW_BOX.bottom - ratio * (VIEW_BOX.bottom - VIEW_BOX.top);
}

function splitSegments(points: CoordinatePoint[]) {
  const segments: CoordinatePoint[][] = [];
  let current: CoordinatePoint[] = [];

  points.forEach((point) => {
    if (point.y === null || point.value === null) {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }

    current.push(point);
  });

  if (current.length > 0) segments.push(current);
  return segments;
}

function pathForSegment(segment: CoordinatePoint[]) {
  return segment.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y!.toFixed(2)}`).join(" ");
}

function areaPathForSegment(segment: CoordinatePoint[]) {
  const path = pathForSegment(segment);
  const first = segment[0];
  const last = segment[segment.length - 1];
  return `${path} L ${last.x.toFixed(2)} ${VIEW_BOX.bottom} L ${first.x.toFixed(2)} ${VIEW_BOX.bottom} Z`;
}

function monthNumber(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCMonth();
}

function pickEvenly<T>(items: T[], maxCount: number) {
  if (items.length <= maxCount) return items;
  return Array.from({ length: maxCount }, (_, index) => items[Math.round((index / Math.max(maxCount - 1, 1)) * (items.length - 1))]);
}

function xAxisTicks(dates: string[], range: TimeRange) {
  const maxTicks = MAX_X_TICKS[range];
  if (dates.length <= maxTicks) return dates;

  const startMonth = monthNumber(dates[0]);

  if (range !== "1Y") {
    const sameMonthTicks = dates.filter((date, index) => index === 0 || index === dates.length - 1 || monthNumber(date) === startMonth);
    return pickEvenly(sameMonthTicks, maxTicks);
  }

  const candidates = dates.filter((date, index) => {
    const isEndpoint = index === 0 || index === dates.length - 1;
    if (isEndpoint) return true;
    const month = monthNumber(date);
    return month % 3 === startMonth % 3;
  });

  return pickEvenly(candidates, maxTicks);
}

function axisLabelForDate(date: string, range: TimeRange) {
  return range === "1Y" ? formatAxisMonth(date) : formatAxisYear(date);
}

function valueLabel(value: number, viewMode: ViewMode) {
  return viewMode === "ROLLING_3Y" ? formatSignedPercent(value, 1) : formatIndianCurrency(value, 0);
}

function preventMouseFocus(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function blurAfterPointerClick(event: MouseEvent<HTMLButtonElement>) {
  if (event.detail > 0) {
    event.currentTarget.blur();
  }
}

function categoryAverage(fund: Fund) {
  const peers = MOCK_FUNDS.filter((peer) => peer.category === fund.category && peer.trailingReturns[5] > 0);
  return peers.reduce((sum, peer) => sum + peer.trailingReturns[5], 0) / Math.max(peers.length, 1);
}

function uniqueCommentary(fund: Fund, context: { rangeReturn: number; rangeCagr: number; variant: number }, used: Set<string>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const commentary = generateAICommentary(fund, {
      rangeReturn: context.rangeReturn,
      rangeCagr: context.rangeCagr,
      categoryAverage: categoryAverage(fund),
      variant: context.variant + attempt,
    });

    if (!used.has(commentary)) {
      used.add(commentary);
      return commentary;
    }
  }

  const fallback = `${fund.shortName} stands apart here with ${formatSignedPercent(context.rangeCagr, 1)} CAGR and a ${Math.abs(fund.drawdown.max).toFixed(1)}% worst drawdown in the mock history.`;
  used.add(fallback);
  return fallback;
}

function FundStatCard({
  selectedFund,
  commentary,
}: {
  selectedFund: SelectedFund;
  commentary: string;
}) {
  return (
    <article
      className="fund-performance-stat-card"
      style={{
        display: "grid",
        alignContent: "start",
        gridTemplateRows: "auto auto",
        gap: "0.5rem",
        height: "auto",
        minHeight: "5.55rem",
        overflow: "visible",
        border: "1px solid rgba(255, 242, 209, 0.105)",
        borderRadius: OUTER_RADIUS,
        padding: "0.68rem 0.72rem 0.76rem",
        background:
          "linear-gradient(145deg, rgba(255, 242, 209, 0.045), transparent 46%), linear-gradient(180deg, rgba(24, 23, 20, 0.58), rgba(7, 7, 6, 0.58))",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: "0.36rem", minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: "0.4rem", height: "0.4rem", borderRadius: CHIP_RADIUS, background: selectedFund.color }} />
        <strong
          style={{
            minWidth: 0,
            overflow: "hidden",
            color: "rgba(255, 250, 235, 0.94)",
            fontFamily: FONT_SANS,
            fontSize: "0.76rem",
            fontWeight: 700,
            lineHeight: 1.1,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedFund.fund.shortName}
        </strong>
      </div>

      <p
        style={{
          display: "block",
          margin: 0,
          minWidth: 0,
          overflow: "visible",
          color: "rgba(238, 231, 214, 0.78)",
          fontFamily: FONT_SANS,
          fontSize: "0.64rem",
          fontStyle: "normal",
          fontWeight: 500,
          lineHeight: 1.43,
          overflowWrap: "break-word",
          whiteSpace: "normal",
        }}
      >
        {commentary}
      </p>
    </article>
  );
}

function ComparisonMatrix({
  funds,
  benchmarkStats,
  hoveredSeriesId,
  onSeriesHover,
}: {
  funds: Array<{ selectedFund: SelectedFund; totalReturn: number; cagr: number }>;
  benchmarkStats: { totalReturn: number; cagr: number };
  hoveredSeriesId: string | null;
  onSeriesHover: (seriesId: string | null) => void;
}) {
  return (
    <section className="fund-comparison-matrix" aria-label="Fast fund comparison metrics">
      <div className="fund-comparison-matrix-header" aria-hidden="true">
        <span>Fund</span>
        <span>Return</span>
        <span>CAGR</span>
        <span>Alpha</span>
        <span>TER</span>
        <span>AUM</span>
      </div>

      {funds.map((item) => {
        const alpha = computeAlphaVsBenchmark(item.cagr, benchmarkStats.cagr);
        const isHovered = hoveredSeriesId === item.selectedFund.fund.id;
        return (
          <div
            key={item.selectedFund.fund.id}
            className={isHovered ? "fund-comparison-matrix-row is-hovered" : "fund-comparison-matrix-row"}
            onMouseEnter={() => onSeriesHover(item.selectedFund.fund.id)}
            onMouseLeave={() => onSeriesHover(null)}
            style={{ "--fund-color": item.selectedFund.color } as CSSProperties}
          >
            <div className="fund-comparison-matrix-name">
              <span aria-hidden="true" />
              <strong>{item.selectedFund.fund.shortName}</strong>
            </div>
            <strong className={item.totalReturn >= 0 ? "is-positive" : "is-negative"}>{formatSignedPercent(item.totalReturn, 1)}</strong>
            <strong className={item.cagr >= 0 ? "is-positive" : "is-negative"}>{formatSignedPercent(item.cagr, 1)}</strong>
            <strong className={alpha >= 0 ? "is-positive" : "is-negative"}>{formatSignedPercent(alpha, 1)}</strong>
            <span>{formatPercent(item.selectedFund.fund.expenseRatio)}</span>
            <span>{formatIndianCroresCompact(item.selectedFund.fund.aum)}</span>
          </div>
        );
      })}

      <div
        className={hoveredSeriesId === "benchmark" ? "fund-comparison-matrix-row is-benchmark is-hovered" : "fund-comparison-matrix-row is-benchmark"}
        onMouseEnter={() => onSeriesHover("benchmark")}
        onMouseLeave={() => onSeriesHover(null)}
        style={{ "--fund-color": BENCHMARK_COLOR } as CSSProperties}
      >
        <div className="fund-comparison-matrix-name">
          <span aria-hidden="true" />
          <strong>{BENCHMARK_LABEL}</strong>
        </div>
        <strong>{formatSignedPercent(benchmarkStats.totalReturn, 1)}</strong>
        <strong>{formatSignedPercent(benchmarkStats.cagr, 1)}</strong>
        <span>Base</span>
        <span>Index</span>
        <span>--</span>
      </div>
    </section>
  );
}

function PerformanceTooltip({
  date,
  rows,
  viewMode,
  left,
  top,
}: {
  date: string;
  rows: Array<{ label: string; color: string; dashed?: boolean; value: number | null; changePercent: number | null }>;
  viewMode: ViewMode;
  left: number;
  top: number;
}) {
  const tooltipLeft =
    left > 62
      ? `clamp(0.46rem, calc(${left}% - 18.8rem), calc(100% - 17.4rem))`
      : `clamp(0.46rem, calc(${left}% + 0.78rem), calc(100% - 17.4rem))`;
  const tooltipTop =
    top > 52
      ? `clamp(0.46rem, calc(${top}% - 8.1rem), calc(100% - 8.8rem))`
      : `clamp(0.46rem, calc(${top}% + 0.82rem), calc(100% - 8.8rem))`;

  return (
    <div
      aria-label={`${date} performance tooltip`}
      style={{
        ...tooltipChromeStyle,
        left: tooltipLeft,
        top: tooltipTop,
      }}
    >
      <strong
        style={{
          color: "rgba(255, 250, 235, 0.82)",
          fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: "0.56rem",
          fontWeight: 700,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {date}
      </strong>

      <div style={{ display: "grid", gap: "0.28rem" }}>
        {rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr) auto",
              alignItems: "center",
              gap: "0.42rem",
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={
                row.dashed
                  ? { width: "0.72rem", height: 0, borderTop: "1px dashed rgba(255, 253, 240, 0.48)" }
                  : { width: "0.48rem", height: "0.48rem", borderRadius: CHIP_RADIUS, background: row.color }
              }
            />
            <span
              style={{
                minWidth: 0,
                overflow: "visible",
                color: "rgba(238, 231, 214, 0.68)",
                fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: "0.5rem",
                lineHeight: 1.12,
                whiteSpace: "normal",
                textTransform: "uppercase",
              }}
            >
              {row.label}
            </span>
            <strong
              style={{
                color: row.value === null ? "rgba(238, 231, 214, 0.56)" : "rgba(255, 250, 235, 0.88)",
                fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: "0.54rem",
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {row.value === null ? "--" : valueLabel(row.value, viewMode)}
              {viewMode === "POINT_TO_POINT" && row.changePercent !== null ? ` (${formatSignedPercent(row.changePercent, 1)})` : ""}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceChart({
  series,
  benchmarkSeries,
  domainDates,
  timeRange,
  viewMode,
  investmentAmount,
  showInceptionNote,
  hoveredSeriesId,
}: {
  series: ChartSeries[];
  benchmarkSeries: ChartSeries;
  domainDates: string[];
  timeRange: TimeRange;
  viewMode: ViewMode;
  investmentAmount: number;
  showInceptionNote: boolean;
  hoveredSeriesId: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(domainDates.length - 1);
  const [cursor, setCursor] = useState({ x: 78, y: 22 });
  const [isPointerActive, setIsPointerActive] = useState(false);
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(domainDates.length - 1, 0));
  const activeDate = domainDates[safeActiveIndex] ?? domainDates[domainDates.length - 1] ?? "";
  const allSeries = [...series, benchmarkSeries];
  const numericValues = allSeries.flatMap((item) => item.points.map((point) => point.value).filter((value): value is number => typeof value === "number"));
  const rawDomain = yDomain(numericValues, viewMode, investmentAmount);
  const pointTickStep = Math.max(1, Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(investmentAmount, 1))) - 1)));
  const yTicks = niceRoundTicks(
    viewMode === "POINT_TO_POINT" && rawDomain.min > investmentAmount * 0.75 ? investmentAmount : rawDomain.min,
    rawDomain.max,
    viewMode === "ROLLING_3Y" ? 8 : 4,
    viewMode === "ROLLING_3Y" ? 5 : pointTickStep,
  );
  const domain =
    yTicks.length > 1
      ? {
          min: Math.min(rawDomain.min, yTicks[0]),
          max: Math.max(rawDomain.max, yTicks[yTicks.length - 1]),
        }
      : rawDomain;
  const dateToIndex = new Map(domainDates.map((date, index) => [date, index]));

  const coordinatesBySeries = allSeries.map((item) => {
    const coordinates = item.points
      .map((point) => {
        const dateIndex = dateToIndex.get(point.date);
        if (dateIndex === undefined) return null;
        return {
          ...point,
          x: xForIndex(dateIndex, domainDates.length),
          y: point.value === null ? null : yForValue(point.value, domain),
        };
      })
      .filter((point): point is CoordinatePoint => Boolean(point));

    return { ...item, coordinates, segments: splitSegments(coordinates) };
  });

  const activeRows = allSeries.map((item) => {
    const activePoint = item.points.find((point) => point.date === activeDate);
    return {
      label: item.label,
      color: item.color,
      dashed: item.dashed,
      value: activePoint?.value ?? null,
      changePercent: activePoint?.changePercent ?? null,
    };
  });
  const hasActiveTooltipValues = activeRows.some((row) => row.value !== null);

  const activeDots = coordinatesBySeries.flatMap((item) => {
    const point = item.coordinates.find((coordinate) => coordinate.date === activeDate && coordinate.value !== null && coordinate.y !== null);
    return point ? [{ ...point, color: item.color, dashed: item.dashed, id: item.id }] : [];
  });

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorPercentX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const cursorPercentY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
    const cursorViewBoxX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * SVG_VIEW_BOX.width;
    const constrainedX = Math.min(Math.max(cursorViewBoxX, VIEW_BOX.left), VIEW_BOX.right);
    const nextIndex = Math.round(((constrainedX - VIEW_BOX.left) / (VIEW_BOX.right - VIEW_BOX.left)) * Math.max(domainDates.length - 1, 1));
    setIsPointerActive(true);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), Math.max(domainDates.length - 1, 0)));
    setCursor({ x: cursorPercentX, y: cursorPercentY });
  };

  const activeX = xForIndex(safeActiveIndex, domainDates.length);
  const plottedDateSet = new Set(allSeries.flatMap((item) => item.points.filter((point) => point.value !== null).map((point) => point.date)));
  const firstPlottedIndex = domainDates.findIndex((date) => plottedDateSet.has(date));
  const hatchedWidth =
    viewMode === "ROLLING_3Y"
      ? firstPlottedIndex === -1
        ? VIEW_BOX.right - VIEW_BOX.left
        : firstPlottedIndex > 0
          ? ((VIEW_BOX.right - VIEW_BOX.left) * firstPlottedIndex) / Math.max(domainDates.length - 1, 1)
          : 0
      : 0;
  const isInInsufficientZone = viewMode === "ROLLING_3Y" && hatchedWidth > 0 && activeX <= VIEW_BOX.left + hatchedWidth;
  const xTicks = xAxisTicks(domainDates, timeRange);
  const rotateXAxisLabels = xTicks.length > 8;
  const hasMatrixHover = hoveredSeriesId !== null;

  return (
    <div className="funds-performance-chart-stage" style={{ position: "relative", minHeight: CHART_MIN_HEIGHT }}>
      <svg
        className="portfolio-performance-chart"
        viewBox={`0 0 ${SVG_VIEW_BOX.width} ${SVG_VIEW_BOX.height}`}
        role="img"
        aria-label="Fund performance comparison chart"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setIsPointerActive(false);
          setActiveIndex(domainDates.length - 1);
          setCursor({ x: 78, y: 22 });
        }}
        style={{ aspectRatio: `${SVG_VIEW_BOX.width} / ${SVG_VIEW_BOX.height}`, display: "block", height: "auto", marginTop: 0, width: "100%" }}
      >
        <defs>
          <pattern id="fundsInsufficientHistoryHatch" width="2.8" height="2.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M 0 0 L 0 2.8" stroke="rgba(255, 242, 209, 0.12)" strokeWidth="0.42" />
          </pattern>
        </defs>

        {yTicks.map((tick) => {
          const y = yForValue(tick, domain);
          return (
            <g key={tick}>
              <path className="portfolio-chart-grid" d={`M ${VIEW_BOX.left} ${y.toFixed(2)} H ${VIEW_BOX.right}`} />
              <text
                x={VIEW_BOX.left - 2.25}
                y={(y + 0.54).toFixed(2)}
                fontSize={SVG_AXIS_FONT_SIZE}
                textAnchor="end"
                style={svgAxisTextStyle}
              >
                {viewMode === "ROLLING_3Y" ? formatSignedPercent(tick, 1) : formatIndianCurrency(tick, 0)}
              </text>
            </g>
          );
        })}

        {viewMode === "ROLLING_3Y" && hatchedWidth > 0 ? (
          <g>
            <rect
              x={VIEW_BOX.left}
              y={VIEW_BOX.top}
              width={hatchedWidth}
              height={VIEW_BOX.bottom - VIEW_BOX.top}
              fill="url(#fundsInsufficientHistoryHatch)"
              opacity="0.82"
            />
            <text
              x={VIEW_BOX.left + 2.1}
              y={VIEW_BOX.top + 2.3}
              fontSize={SVG_AXIS_SMALL_FONT_SIZE}
              opacity="0.3"
              style={svgAxisMutedTextStyle}
            >
              INSUFFICIENT HISTORY
            </text>
          </g>
        ) : null}

        <path className="portfolio-chart-baseline" d={`M ${VIEW_BOX.left} ${VIEW_BOX.bottom} H ${VIEW_BOX.right}`} />
        <path className="portfolio-chart-baseline" d={`M ${VIEW_BOX.left} ${VIEW_BOX.top} V ${VIEW_BOX.bottom}`} />

        {coordinatesBySeries
          .filter((item) => !item.dashed)
          .flatMap((item) =>
            item.segments.map((segment, index) => {
              const isDimmed = hasMatrixHover && hoveredSeriesId !== item.id;
              const isHighlighted = hoveredSeriesId === item.id;

              return (
                <path
                  key={`${item.id}-area-${index}`}
                  d={areaPathForSegment(segment)}
                  fill={item.color}
                  opacity={isDimmed ? "0.018" : isHighlighted ? "0.095" : "0.06"}
                />
              );
            }),
          )}

        {coordinatesBySeries.map((item) =>
          item.segments.map((segment, index) => {
            const path = pathForSegment(segment);
            const isDimmed = hasMatrixHover && hoveredSeriesId !== item.id;
            const isHighlighted = hoveredSeriesId === item.id;
            if (item.dashed) {
              return (
                <path
                  key={`${item.id}-${index}`}
                  className="portfolio-chart-benchmark-line"
                  d={path}
                  style={{
                    opacity: isDimmed ? 0.18 : 1,
                    stroke: isHighlighted ? "rgba(255, 250, 235, 0.96)" : undefined,
                    strokeWidth: isHighlighted ? 0.48 : 0.3,
                    filter: isHighlighted
                      ? "drop-shadow(0 0 0.14rem rgba(255, 250, 235, 0.34)) drop-shadow(0 0 0.44rem rgba(255, 242, 209, 0.16))"
                      : undefined,
                  }}
                />
              );
            }

            return (
              <g key={`${item.id}-${index}`}>
                <path
                  className="portfolio-chart-line-glass"
                  d={path}
                  style={{
                    stroke: item.color,
                    strokeWidth: isHighlighted ? 1.1 : 0.88,
                    opacity: isDimmed ? 0.035 : isHighlighted ? 0.26 : 0.13,
                  }}
                />
                <path
                  className="portfolio-chart-line"
                  d={path}
                  style={{
                    stroke: item.color,
                    strokeWidth: isHighlighted ? 0.62 : 0.44,
                    opacity: isDimmed ? 0.28 : 1,
                    filter: isDimmed
                      ? "none"
                      : `drop-shadow(0 0 0.16rem ${item.color}30)`,
                  }}
                />
              </g>
            );
          }),
        )}

        {isPointerActive ? (
          <path className="portfolio-chart-active-guide" d={`M ${xForIndex(safeActiveIndex, domainDates.length).toFixed(2)} ${VIEW_BOX.top} V ${VIEW_BOX.bottom}`} />
        ) : null}

        {isPointerActive
          ? activeDots.map((dot) => (
              <circle
                key={`${dot.id}-dot`}
                cx={dot.x.toFixed(2)}
                cy={dot.y!.toFixed(2)}
                r="0.46"
                fill={dot.dashed ? "rgba(255, 253, 240, 0.62)" : dot.color}
                stroke="rgba(7, 7, 6, 0.82)"
                strokeWidth="0.16"
              />
            ))
          : null}

        {xTicks.map((date) => {
          const index = dateToIndex.get(date) ?? 0;
          const x = xForIndex(index, domainDates.length);
          const labelAnchor = rotateXAxisLabels ? "start" : index === 0 ? "start" : index === domainDates.length - 1 ? "end" : "middle";
          return (
            <text
              key={date}
              x={x.toFixed(2)}
              y="70.2"
              fontSize={SVG_AXIS_FONT_SIZE}
              textAnchor={labelAnchor}
              transform={rotateXAxisLabels ? `rotate(45 ${x.toFixed(2)} 70.2)` : undefined}
              style={svgAxisTextStyle}
            >
              {axisLabelForDate(date, timeRange)}
            </text>
          );
        })}
        <rect className="portfolio-chart-hitbox" x="0" y="0" width={SVG_VIEW_BOX.width} height={SVG_VIEW_BOX.height} />
      </svg>

      {isPointerActive && !isInInsufficientZone && hasActiveTooltipValues ? (
        <PerformanceTooltip date={formatTooltipMonth(activeDate)} rows={activeRows} viewMode={viewMode} left={cursor.x} top={cursor.y} />
      ) : null}

      {showInceptionNote ? (
        <p
          style={{
            position: "absolute",
            right: "0.82rem",
            bottom: "0.52rem",
            margin: 0,
            color: "rgba(238, 231, 214, 0.56)",
            fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: "0.5rem",
            textTransform: "uppercase",
          }}
        >
          Funds inception-aware - lines start when each fund actually existed.
        </p>
      ) : null}
    </div>
  );
}

export function PerformanceTab({ fundSlots }: { fundSlots: FundSlot[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>("5Y");
  const [viewMode, setViewMode] = useState<ViewMode>("POINT_TO_POINT");
  const [investmentInput, setInvestmentInput] = useState(() => formatInvestmentInput(DEFAULT_INVESTMENT_AMOUNT));
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const investmentAmount = parseInvestmentAmount(investmentInput) ?? DEFAULT_INVESTMENT_AMOUNT;

  const handleInvestmentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInvestmentInput(event.currentTarget.value.replace(/[^\d,]/g, ""));
  };

  const handleInvestmentInputBlur = () => {
    setInvestmentInput(formatInvestmentInput(investmentAmount));
  };

  const selectedFunds = useMemo(
    () =>
      fundSlots
        .map((fund, slotIndex) => (fund ? { fund, slotIndex, color: FUND_COLORS[slotIndex] ?? FUND_COLORS[0] } : null))
        .filter((item): item is SelectedFund => Boolean(item)),
    [fundSlots],
  );

  const endDate = latestDateFromHistory(BENCHMARK_HISTORY);
  const startDate = rangeStartDate(timeRange, endDate, [BENCHMARK_HISTORY, ...selectedFunds.map((item) => item.fund.navHistory)]);
  const domainDates = useMemo(
    () => BENCHMARK_HISTORY.filter((point) => point.date >= startDate && point.date <= endDate).map((point) => point.date),
    [endDate, startDate],
  );

  const chartData = useMemo(() => {
    const benchmarkPoints =
      viewMode === "ROLLING_3Y"
        ? toChartPoints(computeRollingCAGR(BENCHMARK_HISTORY, startDate, endDate), viewMode)
        : toChartPoints(normalizeToInvestment(BENCHMARK_HISTORY, startDate, endDate, investmentAmount), viewMode);

    const series = selectedFunds.map((item) => {
      const effectiveStartDate = maxDate(startDate, item.fund.inceptionDate);
      const points =
        viewMode === "ROLLING_3Y"
          ? toChartPoints(computeRollingCAGR(item.fund.navHistory, effectiveStartDate, endDate), viewMode)
          : toChartPoints(normalizeToInvestment(item.fund.navHistory, effectiveStartDate, endDate, investmentAmount), viewMode);

      return {
        id: item.fund.id,
        label: item.fund.shortName,
        color: item.color,
        points,
      };
    });

    return {
      series,
      benchmarkSeries: {
        id: "benchmark",
        label: BENCHMARK_LABEL,
        color: BENCHMARK_COLOR,
        dashed: true,
        points: benchmarkPoints,
      },
    };
  }, [endDate, investmentAmount, selectedFunds, startDate, viewMode]);

  const sideStats = useMemo(() => {
    const benchmarkStats = {
      totalReturn: computeTotalReturn(BENCHMARK_HISTORY, startDate, endDate),
      cagr: computeCAGR(BENCHMARK_HISTORY, startDate, endDate),
    };

    const usedCommentaries = new Set<string>();
    const funds = selectedFunds.map((item, index) => {
      const effectiveStartDate = maxDate(startDate, item.fund.inceptionDate);
      const totalReturn = computeTotalReturn(item.fund.navHistory, effectiveStartDate, endDate);
      const cagr = computeCAGR(item.fund.navHistory, effectiveStartDate, endDate);
      return {
        selectedFund: item,
        totalReturn,
        cagr,
        commentary: uniqueCommentary(item.fund, { rangeReturn: totalReturn, rangeCagr: cagr, variant: index + item.slotIndex }, usedCommentaries),
      };
    });

    return {
      benchmarkStats,
      funds,
    };
  }, [endDate, selectedFunds, startDate]);

  const showInceptionNote = selectedFunds.some((item) => item.fund.inceptionDate > startDate);

  return (
    <div style={{ display: "grid", gap: "0.82rem" }}>
      <section className="portfolio-glass-panel funds-performance-panel" aria-label="Performance chart and stats" style={heroStyle}>
        <div className="funds-performance-chart-pane" style={chartPaneStyle}>
          <div className="funds-chart-toolbar">
            <header className="funds-performance-chart-header" style={chartHeaderStyle}>
              <div style={chartTitleBlockStyle}>
                {viewMode === "ROLLING_3Y" ? (
                  <h2 style={chartHeadingStyle}>3Y rolling CAGR</h2>
                ) : (
                  <label style={chartTitleRowStyle}>
                    <span>Growth of</span>
                    <span aria-hidden="true" style={chartTitleCurrencyStyle}>
                      {"\u20b9"}
                    </span>
                    <input
                      aria-label="Investment amount"
                      inputMode="numeric"
                      title="Investment amount"
                      value={investmentInput}
                      onChange={handleInvestmentInputChange}
                      onBlur={handleInvestmentInputBlur}
                      onFocus={(event) => event.currentTarget.select()}
                      style={{
                        ...investmentAmountInputStyle,
                        width: `${Math.min(Math.max((investmentInput.length || 5) + 3, 9), 18)}ch`,
                      }}
                    />
                    <span>invested</span>
                  </label>
                )}
              </div>

              <div className="funds-performance-primary-controls" aria-label="Time range" style={primaryRangeStyle}>
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className="funds-performance-control-pill"
                    aria-pressed={range === timeRange}
                    onMouseDown={preventMouseFocus}
                    onClick={(event) => {
                      setTimeRange(range);
                      blurAfterPointerClick(event);
                    }}
                    style={range === timeRange ? { ...pillStyle, ...activePillStyle } : pillStyle}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </header>

            <section aria-label="Performance display controls" style={secondaryControlsRowStyle}>
              <div style={secondaryControlsRightStyle}>
                <div style={quietControlGroupStyle}>
                  <span style={controlLabelStyle}>View</span>
                  <div style={segmentedControlStyle}>
                    {[
                      { label: "POINT-TO-POINT", value: "POINT_TO_POINT" },
                      { label: "ROLLING 3Y", value: "ROLLING_3Y" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className="funds-performance-control-pill funds-performance-secondary-pill"
                        aria-pressed={item.value === viewMode}
                        onMouseDown={preventMouseFocus}
                        onClick={(event) => {
                          setViewMode(item.value as ViewMode);
                          blurAfterPointerClick(event);
                        }}
                        style={item.value === viewMode ? activeSecondaryPillStyle : secondaryPillStyle}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    aria-label="About rolling returns"
                    onMouseEnter={() => setIsHelpVisible(true)}
                    onMouseLeave={() => setIsHelpVisible(false)}
                    onFocus={() => setIsHelpVisible(true)}
                    onBlur={() => setIsHelpVisible(false)}
                    style={{
                      width: "1.34rem",
                      height: "1.34rem",
                      border: "1px solid rgba(255, 242, 209, 0.12)",
                      borderRadius: CHIP_RADIUS,
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255, 242, 209, 0.68)",
                      background: "rgba(255, 242, 209, 0.026)",
                      cursor: "help",
                      fontFamily: FONT_MONO,
                      fontSize: "0.52rem",
                      fontWeight: 700,
                    }}
                  >
                    ?
                  </button>
                  {isHelpVisible ? (
                    <div
                      role="tooltip"
                      style={{
                        ...tooltipChromeStyle,
                        right: 0,
                        top: "1.92rem",
                        width: "18rem",
                        color: "rgba(238, 231, 214, 0.78)",
                        fontSize: "0.64rem",
                        lineHeight: 1.35,
                      }}
                    >
                      Rolling returns show how the fund performed across all possible 3-year holding periods, not just one start-to-end stretch.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <PerformanceChart
            series={chartData.series}
            benchmarkSeries={chartData.benchmarkSeries}
            domainDates={domainDates}
            timeRange={timeRange}
            viewMode={viewMode}
            investmentAmount={investmentAmount}
            showInceptionNote={showInceptionNote}
            hoveredSeriesId={hoveredSeriesId}
          />

          <ComparisonMatrix
            funds={sideStats.funds}
            benchmarkStats={sideStats.benchmarkStats}
            hoveredSeriesId={hoveredSeriesId}
            onSeriesHover={setHoveredSeriesId}
          />
        </div>

        <aside className="funds-performance-stats" aria-label="Performance insights" style={statsPaneStyle}>
          {sideStats.funds.map((item) => (
            <FundStatCard
              key={item.selectedFund.fund.id}
              selectedFund={item.selectedFund}
              commentary={item.commentary}
            />
          ))}
        </aside>
      </section>

      <p
        style={{
          margin: 0,
          color: "rgba(238, 231, 214, 0.58)",
          fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: "0.34rem",
          lineHeight: 1.25,
          textTransform: "uppercase",
        }}
      >
        All return figures are based on mock NAV history and are illustrative only. Past performance does not predict future returns.
      </p>
    </div>
  );
}
