import type { CSSProperties } from "react";
import { formatIndianCrores, formatIndianCroresCompact, formatIndianCurrency, formatPercent } from "./fundUtils";
import type { FundSlot } from "./types";

const selectorGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "0.68rem",
};

const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";
const SLOT_COLORS = ["#74e59c", "#ecd76e", "#ff86a8", "#ffb35c"];

const slotStyle: CSSProperties = {
  position: "relative",
  minHeight: "8.9rem",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  gap: "0.58rem",
  padding: "0.7rem 0.78rem 0.72rem 0.9rem",
  overflow: "hidden",
};

const emptySlotStyle: CSSProperties = {
  position: "relative",
  minHeight: slotStyle.minHeight,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "0.42rem",
  border: "1px dashed rgba(255, 242, 209, 0.22)",
  borderRadius: OUTER_RADIUS,
  padding: "0.88rem",
  color: "rgba(255, 242, 209, 0.68)",
  background:
    "linear-gradient(145deg, rgba(255, 242, 209, 0.025), transparent 46%), linear-gradient(180deg, rgba(24, 23, 20, 0.36), rgba(7, 7, 6, 0.34))",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.035), 0 14px 38px rgba(0, 0, 0, 0.22)",
  opacity: 0.74,
  cursor: "pointer",
};

const slotRailStyle: CSSProperties = {
  position: "absolute",
  top: "0.72rem",
  bottom: "0.72rem",
  left: "0.42rem",
  width: "2px",
  borderRadius: CHIP_RADIUS,
  background: "var(--slot-color)",
  boxShadow: "0 0 0.9rem color-mix(in srgb, var(--slot-color) 42%, transparent)",
};

const topRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "0.52rem",
  minWidth: 0,
};

const categoryBadgeStyle: CSSProperties = {
  justifySelf: "start",
  border: "1px solid rgba(255, 242, 209, 0.13)",
  borderRadius: CHIP_RADIUS,
  padding: "0.2rem 0.48rem",
  color: "rgba(255, 242, 209, 0.64)",
  background: "rgba(255, 242, 209, 0.035)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.46rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const removeButtonStyle: CSSProperties = {
  width: "1.42rem",
  height: "1.42rem",
  border: "1px solid rgba(255, 242, 209, 0.12)",
  borderRadius: CHIP_RADIUS,
  display: "grid",
  placeItems: "center",
  padding: 0,
  color: "rgba(255, 242, 209, 0.7)",
  background: "rgba(0, 0, 0, 0.24)",
  cursor: "pointer",
  fontSize: "1rem",
  lineHeight: 1,
};

const identityStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "0.36rem",
  minWidth: 0,
};

const fundNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  color: "rgba(255, 250, 235, 0.94)",
  fontSize: "clamp(0.98rem, 1.1vw, 1.08rem)",
  fontWeight: 650,
  lineHeight: 1.1,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const benchmarkStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "0.42rem",
  minWidth: 0,
};

const benchmarkLabelStyle: CSSProperties = {
  color: "rgba(238, 231, 214, 0.38)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.46rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const benchmarkValueStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  color: "rgba(238, 231, 214, 0.62)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.56rem",
  fontWeight: 600,
  lineHeight: 1,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.42rem 0.72rem",
  margin: 0,
};

const metricStyle: CSSProperties = {
  minWidth: 0,
  borderTop: "1px solid rgba(255, 242, 209, 0.075)",
  padding: "0.38rem 0 0",
};

const metricLabelStyle: CSSProperties = {
  color: "rgba(238, 231, 214, 0.46)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.48rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const metricValueStyle: CSSProperties = {
  margin: "0.2rem 0 0",
  overflow: "hidden",
  color: "rgba(255, 250, 235, 0.86)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "clamp(0.62rem, 0.74vw, 0.72rem)",
  fontWeight: 650,
  lineHeight: 1.1,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function FundSelector({
  slots,
  onRemove,
  onOpenDrawer,
}: {
  slots: FundSlot[];
  onRemove: (slotIndex: number) => void;
  onOpenDrawer: () => void;
}) {
  return (
    <section aria-label="Fund selector row" style={selectorGridStyle}>
      {slots.map((fund, index) =>
        fund ? (
          <article
            key={`${fund.id}-${index}`}
            className="portfolio-glass-panel"
            style={{ ...slotStyle, "--slot-color": SLOT_COLORS[index] ?? SLOT_COLORS[0] } as CSSProperties}
          >
            <span aria-hidden="true" style={slotRailStyle} />
            <div style={topRowStyle}>
              <span style={categoryBadgeStyle}>{fund.category}</span>
              <button type="button" aria-label={`Remove ${fund.shortName}`} onClick={() => onRemove(index)} style={removeButtonStyle}>
                {"\u00d7"}
              </button>
            </div>

            <div style={identityStyle}>
              <strong title={fund.name} style={fundNameStyle}>
                {fund.shortName}
              </strong>
              <div style={benchmarkStyle}>
                <span style={benchmarkLabelStyle}>vs</span>
                <span title={fund.benchmark} style={benchmarkValueStyle}>
                  {fund.benchmark}
                </span>
              </div>
            </div>

            <dl style={metricsGridStyle}>
              <div style={metricStyle}>
                <dt style={metricLabelStyle}>5Y return</dt>
                <dd style={{ ...metricValueStyle, color: fund.trailingReturns[5] >= 0 ? "#9ee3b5" : "#e7a2a2" }}>{formatPercent(fund.trailingReturns[5], 1)}</dd>
              </div>
              <div style={metricStyle}>
                <dt style={metricLabelStyle}>AUM</dt>
                <dd style={metricValueStyle} title={formatIndianCrores(fund.aum)}>
                  {formatIndianCroresCompact(fund.aum)}
                </dd>
              </div>
              <div style={metricStyle}>
                <dt style={metricLabelStyle}>NAV</dt>
                <dd style={metricValueStyle}>{formatIndianCurrency(fund.nav)}</dd>
              </div>
              <div style={metricStyle}>
                <dt style={metricLabelStyle}>TER</dt>
                <dd style={metricValueStyle} title="Total expense ratio">
                  {formatPercent(fund.expenseRatio)}
                </dd>
              </div>
            </dl>
          </article>
        ) : (
          <button
            key={`empty-${index}`}
            type="button"
            className="portfolio-glass-panel"
            aria-label={`Add fund to slot ${index + 1}`}
            onClick={onOpenDrawer}
            style={emptySlotStyle}
          >
            <span
              aria-hidden="true"
              style={{
                width: "2rem",
                height: "2rem",
                border: "1px solid rgba(255, 242, 209, 0.2)",
                borderRadius: CHIP_RADIUS,
                display: "grid",
                placeItems: "center",
                color: "rgba(255, 250, 235, 0.82)",
                background: "rgba(255, 242, 209, 0.05)",
                fontSize: "1.2rem",
                lineHeight: 1,
              }}
            >
              +
            </span>
            <span
              style={{
                fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: 0,
                textTransform: "uppercase",
              }}
            >
              Add fund
            </span>
          </button>
        ),
      )}
    </section>
  );
}
