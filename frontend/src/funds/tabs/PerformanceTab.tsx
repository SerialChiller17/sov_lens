import { useMemo, useState, type ChangeEvent, type CSSProperties, type PointerEvent } from "react";
import {
  computeAlphaVsBenchmark,
  computeCAGR,
  computeRollingCAGR,
  computeTotalReturn,
  formatIndianCurrency,
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
type ScaleMode = "LINEAR" | "LOG";
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
const FUND_COLORS = ["#74e59c", "#ecd76e", "#ff86a8", "#ffb35c"];
const BENCHMARK_COLOR = "rgba(255, 253, 240, 0.34)";
const BENCHMARK_LABEL = "NIFTY 500 TRI";
const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";
const FONT_SANS = 'Inter, Archivo, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FONT_MONO = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
const SVG_VIEW_BOX = { width: 220, height: 74 };
const VIEW_BOX = { left: 27, right: 214, top: 7, bottom: 63 };
const CHART_MIN_HEIGHT = "23.5rem";
const SVG_AXIS_FONT_SIZE = 3.05;
const SVG_AXIS_SMALL_FONT_SIZE = 2;
const DEFAULT_INVESTMENT_AMOUNT = 10000;
const BENCHMARK_SOURCE_IDS = ["icici-pru-bluechip", "parag-parikh-flexi-cap", "hdfc-flexi-cap", "kotak-emerging-equity"];
const MAX_X_TICKS: Record<TimeRange, number> = { "1Y": 6, "3Y": 6, "5Y": 6, "10Y": 6, MAX: 6 };

const controlShellStyle: CSSProperties = {
  position: "relative",
  minHeight: "2.25rem",
  display: "grid",
  gridTemplateColumns: "auto auto auto auto auto 1fr auto",
  alignItems: "center",
  gap: "0.44rem",
  border: "1px solid rgba(255, 242, 209, 0.105)",
  borderRadius: OUTER_RADIUS,
  padding: "0.3rem 0.42rem",
  background: "rgba(0, 0, 0, 0.34)",
};

const controlGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.28rem",
};

const dividerStyle: CSSProperties = {
  width: "1px",
  height: "1.45rem",
  background: "rgba(255, 242, 209, 0.09)",
};

const pillStyle: CSSProperties = {
  border: "1px solid rgba(255, 242, 209, 0.13)",
  borderRadius: CHIP_RADIUS,
  minHeight: "1.55rem",
  padding: "0.32rem 0.52rem",
  color: "rgba(238, 231, 214, 0.62)",
  background: "rgba(255, 242, 209, 0.035)",
  cursor: "pointer",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.52rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const activePillStyle: CSSProperties = {
  borderColor: "rgba(255, 242, 209, 0.32)",
  color: "rgba(255, 250, 235, 0.94)",
  background: "rgba(255, 242, 209, 0.1)",
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 76fr) minmax(18.5rem, 24fr)",
  columnGap: "0.9rem",
  minHeight: CHART_MIN_HEIGHT,
  overflow: "hidden",
};

const chartPaneStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  padding: "0.7rem 0.7rem 0.52rem",
};

const statsPaneStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "0.46rem",
  minWidth: 0,
  borderLeft: "1px solid rgba(255, 242, 209, 0.08)",
  padding: "0.66rem 0.68rem",
};

const tooltipChromeStyle: CSSProperties = {
  position: "absolute",
  zIndex: 3,
  display: "grid",
  gap: "0.34rem",
  width: "min(20rem, calc(100% - 0.92rem))",
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

const monoLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(238, 231, 214, 0.46)",
  fontFamily: FONT_MONO,
  fontSize: "0.52rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const statValueStyle: CSSProperties = {
  display: "block",
  margin: "0.2rem 0 0",
  color: "rgba(255, 250, 235, 0.84)",
  fontFamily: FONT_MONO,
  fontSize: "0.72rem",
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const axisTitleStyle: CSSProperties = {
  margin: "0 0 0.32rem 0",
  color: "rgba(238, 231, 214, 0.44)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.58rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const chartTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.28rem",
  margin: "0 0 0.32rem 0",
  color: "rgba(238, 231, 214, 0.44)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.58rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const chartTitleCurrencyStyle: CSSProperties = {
  color: "rgba(255, 250, 235, 0.9)",
  fontWeight: 900,
};

const investmentAmountInputStyle: CSSProperties = {
  minWidth: "8.8ch",
  maxWidth: "18ch",
  height: "1.42rem",
  border: "1px solid rgba(255, 242, 209, 0.28)",
  borderRadius: "6px",
  padding: "0 0.48rem",
  color: "rgba(255, 250, 235, 0.92)",
  background:
    "linear-gradient(180deg, rgba(255, 242, 209, 0.105), rgba(255, 242, 209, 0.035)), rgba(0, 0, 0, 0.42)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.12), 0 0 0 1px rgba(255, 242, 209, 0.035)",
  cursor: "text",
  font: "inherit",
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};

const svgAxisTextStyle: CSSProperties = {
  fill: "rgba(238, 231, 214, 0.66)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontVariantNumeric: "tabular-nums",
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const svgAxisMutedTextStyle: CSSProperties = {
  ...svgAxisTextStyle,
  fill: "rgba(238, 231, 214, 0.36)",
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

function yDomain(values: number[], viewMode: ViewMode, scaleMode: ScaleMode, investmentAmount: number) {
  const baseAmount = Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : DEFAULT_INVESTMENT_AMOUNT;

  if (values.length === 0) {
    return viewMode === "ROLLING_3Y" ? { min: -5, max: 5 } : { min: baseAmount * 0.88, max: baseAmount * 1.12 };
  }

  if (viewMode === "POINT_TO_POINT" && scaleMode === "LOG") {
    const min = Math.max(Math.min(...values, baseAmount) * 0.92, 1);
    const max = Math.max(...values, baseAmount) * 1.08;
    return { min, max: Math.max(max, min + 1) };
  }

  const minValue = Math.min(...values, viewMode === "ROLLING_3Y" ? 0 : baseAmount);
  const maxValue = Math.max(...values, viewMode === "ROLLING_3Y" ? 0 : baseAmount);
  const padding = Math.max((maxValue - minValue) * 0.12, viewMode === "ROLLING_3Y" ? 2 : baseAmount * 0.08);
  return { min: viewMode === "ROLLING_3Y" ? minValue - padding : Math.max(0, minValue - padding), max: maxValue + padding };
}

function xForIndex(index: number, total: number) {
  return VIEW_BOX.left + (index / Math.max(total - 1, 1)) * (VIEW_BOX.right - VIEW_BOX.left);
}

function yForValue(value: number, domain: { min: number; max: number }, viewMode: ViewMode, scaleMode: ScaleMode) {
  if (viewMode === "POINT_TO_POINT" && scaleMode === "LOG") {
    const safeValue = Math.max(value, 1);
    const logMin = Math.log(Math.max(domain.min, 1));
    const logMax = Math.log(Math.max(domain.max, domain.min + 1));
    const ratio = (Math.log(safeValue) - logMin) / Math.max(logMax - logMin, 1);
    return VIEW_BOX.bottom - ratio * (VIEW_BOX.bottom - VIEW_BOX.top);
  }

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
  stats,
  benchmarkCagr,
  commentary,
}: {
  selectedFund: SelectedFund;
  stats: { totalReturn: number; cagr: number };
  benchmarkCagr: number;
  commentary: string;
}) {
  const alpha = computeAlphaVsBenchmark(stats.cagr, benchmarkCagr);

  return (
    <article
      style={{
        display: "grid",
        gap: "0.52rem",
        border: "1px solid rgba(255, 242, 209, 0.105)",
        borderRadius: OUTER_RADIUS,
        padding: "0.7rem 0.74rem",
        background:
          "linear-gradient(145deg, rgba(255, 242, 209, 0.045), transparent 46%), linear-gradient(180deg, rgba(24, 23, 20, 0.58), rgba(7, 7, 6, 0.58))",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: "0.38rem", minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: "0.46rem", height: "0.46rem", borderRadius: CHIP_RADIUS, background: selectedFund.color }} />
        <strong
          style={{
            minWidth: 0,
            overflow: "hidden",
            color: "rgba(255, 250, 235, 0.9)",
            fontFamily: FONT_SANS,
            fontSize: "0.84rem",
            fontWeight: 700,
            lineHeight: 1.1,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedFund.fund.shortName}
        </strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.42rem" }}>
        <div>
          <span style={monoLabelStyle}>Return</span>
          <strong style={{ ...statValueStyle, color: stats.totalReturn >= 0 ? "#9ee3b5" : "#e7a2a2" }}>{formatSignedPercent(stats.totalReturn, 1)}</strong>
        </div>
        <div>
          <span style={monoLabelStyle}>CAGR</span>
          <strong style={{ ...statValueStyle, color: stats.cagr >= 0 ? "#9ee3b5" : "#e7a2a2" }}>{formatSignedPercent(stats.cagr, 1)}</strong>
        </div>
        <div>
          <span style={monoLabelStyle}>Alpha</span>
          <strong style={{ ...statValueStyle, color: alpha >= 0 ? "#9ee3b5" : "#e7a2a2" }}>{formatSignedPercent(alpha, 1)}</strong>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          overflow: "hidden",
          color: "rgba(238, 231, 214, 0.68)",
          fontFamily: FONT_SANS,
          fontSize: "0.7rem",
          fontStyle: "normal",
          fontWeight: 500,
          lineHeight: 1.42,
        }}
      >
        {commentary}
      </p>
    </article>
  );
}

function BenchmarkStatRow({ stats }: { stats: { totalReturn: number; cagr: number } }) {
  return (
    <article
      style={{
        display: "grid",
        gap: "0.42rem",
        border: "1px dashed rgba(255, 253, 240, 0.13)",
        borderRadius: OUTER_RADIUS,
        padding: "0.54rem 0.62rem",
        color: "rgba(238, 231, 214, 0.58)",
        background: "rgba(255, 242, 209, 0.026)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.42rem" }}>
        <span
          aria-hidden="true"
          style={{
            width: "1.5rem",
            height: 0,
            borderTop: "1px dashed rgba(255, 253, 240, 0.48)",
          }}
        />
        <strong style={{ color: "rgba(255, 250, 235, 0.66)", fontSize: "0.62rem", fontWeight: 650 }}>{BENCHMARK_LABEL}</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.42rem" }}>
        <div>
          <span style={monoLabelStyle}>Return</span>
          <strong style={statValueStyle}>{formatSignedPercent(stats.totalReturn, 1)}</strong>
        </div>
        <div>
          <span style={monoLabelStyle}>CAGR</span>
          <strong style={statValueStyle}>{formatSignedPercent(stats.cagr, 1)}</strong>
        </div>
      </div>
    </article>
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
  return (
    <div
      aria-label={`${date} performance tooltip`}
      style={{
        ...tooltipChromeStyle,
        left: `clamp(0.46rem, calc(${left}% + 0.72rem), calc(100% - 20.5rem))`,
        top: `clamp(0.36rem, calc(${top}% - 0.62rem), calc(100% - 10.4rem))`,
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
                color: "rgba(238, 231, 214, 0.58)",
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
                color: row.value === null ? "rgba(238, 231, 214, 0.42)" : "rgba(255, 250, 235, 0.82)",
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
  scaleMode,
  viewMode,
  investmentInput,
  investmentAmount,
  onInvestmentInputChange,
  onInvestmentInputBlur,
  showInceptionNote,
}: {
  series: ChartSeries[];
  benchmarkSeries: ChartSeries;
  domainDates: string[];
  timeRange: TimeRange;
  scaleMode: ScaleMode;
  viewMode: ViewMode;
  investmentInput: string;
  investmentAmount: number;
  onInvestmentInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onInvestmentInputBlur: () => void;
  showInceptionNote: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(domainDates.length - 1);
  const [cursor, setCursor] = useState({ x: 78, y: 22 });
  const [isPointerActive, setIsPointerActive] = useState(false);
  const effectiveScale = viewMode === "ROLLING_3Y" ? "LINEAR" : scaleMode;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(domainDates.length - 1, 0));
  const activeDate = domainDates[safeActiveIndex] ?? domainDates[domainDates.length - 1] ?? "";
  const allSeries = [...series, benchmarkSeries];
  const numericValues = allSeries.flatMap((item) => item.points.map((point) => point.value).filter((value): value is number => typeof value === "number"));
  const rawDomain = yDomain(numericValues, viewMode, effectiveScale, investmentAmount);
  const pointTickStep = Math.max(1, Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(investmentAmount, 1))) - 1)));
  const yTicks = niceRoundTicks(
    viewMode === "POINT_TO_POINT" && rawDomain.min > investmentAmount * 0.75 ? investmentAmount : rawDomain.min,
    rawDomain.max,
    viewMode === "ROLLING_3Y" ? 8 : effectiveScale === "LOG" ? 5 : 4,
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
          y: point.value === null ? null : yForValue(point.value, domain, viewMode, effectiveScale),
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

  return (
    <div style={{ position: "relative", minHeight: CHART_MIN_HEIGHT }}>
      {viewMode === "ROLLING_3Y" ? (
        <p style={axisTitleStyle}>3Y rolling CAGR (%)</p>
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
            onChange={onInvestmentInputChange}
            onBlur={onInvestmentInputBlur}
            onFocus={(event) => event.currentTarget.select()}
            style={{
              ...investmentAmountInputStyle,
              width: `${Math.min(Math.max((investmentInput.length || 5) + 3, 9), 18)}ch`,
            }}
          />
          <span>invested</span>
        </label>
      )}
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
          const y = yForValue(tick, domain, viewMode, effectiveScale);
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
            item.segments.map((segment, index) => (
              <path key={`${item.id}-area-${index}`} d={areaPathForSegment(segment)} fill={item.color} opacity="0.06" />
            )),
          )}

        {coordinatesBySeries.map((item) =>
          item.segments.map((segment, index) => {
            const path = pathForSegment(segment);
            if (item.dashed) {
              return <path key={`${item.id}-${index}`} className="portfolio-chart-benchmark-line" d={path} style={{ strokeWidth: 0.36 }} />;
            }

            return (
              <g key={`${item.id}-${index}`}>
                <path className="portfolio-chart-line-glass" d={path} style={{ stroke: item.color, strokeWidth: 0.88, opacity: 0.13 }} />
                <path
                  className="portfolio-chart-line"
                  d={path}
                  style={{
                    stroke: item.color,
                    strokeWidth: 0.44,
                    filter: `drop-shadow(0 0 0.18rem ${item.color}42) drop-shadow(0 0 0.5rem rgba(236, 215, 110, 0.12))`,
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
            color: "rgba(238, 231, 214, 0.44)",
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
  const [scaleMode, setScaleMode] = useState<ScaleMode>("LINEAR");
  const [viewMode, setViewMode] = useState<ViewMode>("POINT_TO_POINT");
  const [investmentInput, setInvestmentInput] = useState(() => formatInvestmentInput(DEFAULT_INVESTMENT_AMOUNT));
  const [isHelpVisible, setIsHelpVisible] = useState(false);
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
      <section aria-label="Performance controls" style={controlShellStyle}>
        <div style={controlGroupStyle}>
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              className="funds-performance-control-pill"
              aria-pressed={range === timeRange}
              onClick={() => setTimeRange(range)}
              style={range === timeRange ? { ...pillStyle, ...activePillStyle } : pillStyle}
            >
              {range}
            </button>
          ))}
        </div>
        <span aria-hidden="true" style={dividerStyle} />
        <div style={controlGroupStyle}>
          {(["LINEAR", "LOG"] as ScaleMode[]).map((scale) => (
            <button
              key={scale}
              type="button"
              className="funds-performance-control-pill"
              aria-pressed={scale === scaleMode}
              onClick={() => setScaleMode(scale)}
              style={scale === scaleMode ? { ...pillStyle, ...activePillStyle } : pillStyle}
            >
              {scale}
            </button>
          ))}
        </div>
        <span aria-hidden="true" style={dividerStyle} />
        <div style={controlGroupStyle}>
          {[
            { label: "POINT-TO-POINT", value: "POINT_TO_POINT" },
            { label: "ROLLING 3Y", value: "ROLLING_3Y" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className="funds-performance-control-pill"
              aria-pressed={item.value === viewMode}
              onClick={() => setViewMode(item.value as ViewMode)}
              style={item.value === viewMode ? { ...pillStyle, ...activePillStyle } : pillStyle}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span aria-hidden="true" />
        <div style={{ position: "relative", justifySelf: "end" }}>
          <button
            type="button"
            aria-label="About rolling returns"
            onMouseEnter={() => setIsHelpVisible(true)}
            onMouseLeave={() => setIsHelpVisible(false)}
            onFocus={() => setIsHelpVisible(true)}
            onBlur={() => setIsHelpVisible(false)}
            style={{
              width: "1.45rem",
              height: "1.45rem",
              border: "1px solid rgba(255, 242, 209, 0.13)",
              borderRadius: CHIP_RADIUS,
              display: "grid",
              placeItems: "center",
              color: "rgba(255, 242, 209, 0.72)",
              background: "rgba(255, 242, 209, 0.035)",
              cursor: "help",
              fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
              fontSize: "0.56rem",
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
                top: "2.12rem",
                width: "18rem",
                color: "rgba(238, 231, 214, 0.68)",
                fontSize: "0.64rem",
                lineHeight: 1.35,
              }}
            >
              Rolling returns show how the fund performed across all possible 3-year holding periods, not just one start-to-end stretch. Less misleading than point-to-point returns.
            </div>
          ) : null}
        </div>
      </section>

      <section className="portfolio-glass-panel" aria-label="Performance chart and stats" style={heroStyle}>
        <div style={chartPaneStyle}>
          <PerformanceChart
            series={chartData.series}
            benchmarkSeries={chartData.benchmarkSeries}
            domainDates={domainDates}
            timeRange={timeRange}
            scaleMode={scaleMode}
            viewMode={viewMode}
            investmentInput={investmentInput}
            investmentAmount={investmentAmount}
            onInvestmentInputChange={handleInvestmentInputChange}
            onInvestmentInputBlur={handleInvestmentInputBlur}
            showInceptionNote={showInceptionNote}
          />
        </div>

        <aside aria-label="Performance stats" style={statsPaneStyle}>
          {sideStats.funds.map((item, index) => (
            <FundStatCard
              key={item.selectedFund.fund.id}
              selectedFund={item.selectedFund}
              stats={{ totalReturn: item.totalReturn, cagr: item.cagr }}
              benchmarkCagr={sideStats.benchmarkStats.cagr}
              commentary={item.commentary}
            />
          ))}
          <BenchmarkStatRow stats={sideStats.benchmarkStats} />
        </aside>
      </section>

      <p
        style={{
          margin: 0,
          color: "rgba(238, 231, 214, 0.44)",
          fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: "0.5rem",
          lineHeight: 1.3,
          textTransform: "uppercase",
        }}
      >
        All return figures are based on mock NAV history and are illustrative only. Past performance does not predict future returns.
      </p>
    </div>
  );
}
