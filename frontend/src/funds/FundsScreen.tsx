import { useMemo, useState, type CSSProperties } from "react";
import { Search } from "lucide-react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../app/GlobalBrandNav";
import { MarketTape } from "../features/market-tape/MarketTape";
import { FUNDS_MARKET_TAPE } from "../features/market-tape/marketTapeData";
import { FundSelector } from "./FundSelector";
import { MOCK_FUNDS } from "./mockFunds";
import { PerformanceTab } from "./tabs/PerformanceTab";
import type { Fund, FundSlot } from "./types";

type ComparisonTab = "Performance" | "Allocation" | "Risk" | "Overlap";

const COMPARISON_TABS: ComparisonTab[] = ["Performance", "Allocation", "Risk", "Overlap"];

const shellStyle: CSSProperties = {
  minWidth: 0,
  overflowX: "hidden",
  overflowY: "auto",
};

const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";

const contentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "1fr",
  alignContent: "start",
  gap: "0.56rem",
  minHeight: "100%",
  padding: "5.92rem clamp(1rem, 2.35vw, 2.7rem) 1.1rem",
  isolation: "isolate",
};

const bodyPanelStyle: CSSProperties = {
  minHeight: "22rem",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: "0.46rem",
  padding: "0.56rem",
};

const tabStripStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  justifySelf: "start",
  overflow: "hidden",
  border: "1px solid rgba(255, 242, 209, 0.105)",
  borderRadius: OUTER_RADIUS,
  background: "rgba(0, 0, 0, 0.34)",
};

const tabButtonStyle: CSSProperties = {
  position: "relative",
  minHeight: "1.82rem",
  border: 0,
  borderRight: "1px solid rgba(255, 242, 209, 0.09)",
  padding: "0 0.66rem",
  color: "rgba(238, 231, 214, 0.68)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.02)), rgba(0, 0, 0, 0.26)",
  cursor: "pointer",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.54rem",
  fontWeight: 700,
  textTransform: "uppercase",
};

const activeTabStyle: CSSProperties = {
  color: "rgba(255, 250, 235, 0.96)",
  textShadow: "0 0 0.7rem rgba(255, 242, 209, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255, 242, 209, 0.22), rgba(255, 242, 209, 0.075) 48%, rgba(255, 242, 209, 0.035)), rgba(18, 17, 15, 0.92)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 250, 235, 0.22), inset 0 -1px 0 rgba(255, 242, 209, 0.1), 0 0.62rem 1.35rem rgba(0, 0, 0, 0.28)",
};

const placeholderStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  minHeight: "18rem",
  textAlign: "center",
};

const placeholderCardStyle: CSSProperties = {
  width: "min(30rem, 100%)",
  border: "1px solid rgba(255, 242, 209, 0.105)",
  borderRadius: OUTER_RADIUS,
  padding: "1.25rem",
  color: "rgba(238, 231, 214, 0.68)",
  background:
    "linear-gradient(145deg, rgba(255, 242, 209, 0.055), transparent 44%), linear-gradient(180deg, rgba(24, 23, 20, 0.72), rgba(7, 7, 6, 0.68))",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.08), 0 22px 58px rgba(0, 0, 0, 0.36)",
  backdropFilter: "blur(18px) saturate(1.04)",
};

const previewPanelStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  alignContent: "start",
  gap: "0.92rem",
  minHeight: "14rem",
  marginTop: "0.78rem",
  border: "1px solid rgba(255, 242, 209, 0.12)",
  borderRadius: OUTER_RADIUS,
  overflow: "hidden",
  padding: "1.05rem",
  background:
    "linear-gradient(145deg, rgba(255, 242, 209, 0.04), transparent 42%), linear-gradient(180deg, rgba(12, 12, 11, 0.54), rgba(0, 0, 0, 0.3))",
};

const previewBadgeStyle: CSSProperties = {
  justifySelf: "start",
  border: "1px solid rgba(255, 242, 209, 0.14)",
  borderRadius: CHIP_RADIUS,
  padding: "0.24rem 0.5rem",
  color: "rgba(255, 242, 209, 0.62)",
  background: "rgba(255, 242, 209, 0.04)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.52rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const previewPointGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.62rem",
};

const previewPointStyle: CSSProperties = {
  border: "1px solid rgba(255, 242, 209, 0.105)",
  borderRadius: OUTER_RADIUS,
  padding: "0.72rem",
  color: "rgba(238, 231, 214, 0.72)",
  background: "rgba(255, 255, 255, 0.026)",
  fontSize: "0.78rem",
  lineHeight: 1.35,
};

const FUND_TAB_PREVIEWS: Record<
  Exclude<ComparisonTab, "Performance">,
  { eyebrow: string; title: string; description: string; points: string[]; note: string }
> = {
  Allocation: {
    eyebrow: "Preview: data not connected",
    title: "Allocation view preview",
    description: "This view should compare equity, debt, cash, sector, and market-cap exposure once full fund holdings are connected.",
    points: ["Asset mix", "Sector weights", "Market-cap tilt"],
    note: "Not connected to full fund holdings data in demo.",
  },
  Risk: {
    eyebrow: "Preview: data not connected",
    title: "Risk comparison preview",
    description: "This view should compare drawdown, volatility, beta, Sharpe, Sortino, and recovery time without pretending mock risk is complete.",
    points: ["Drawdown", "Volatility", "Recovery"],
    note: "Requires richer risk history before this can support decisions.",
  },
  Overlap: {
    eyebrow: "Preview: holdings required",
    title: "Overlap analysis preview",
    description: "This view should show shared holdings, sector crowding, and whether adding a fund actually diversifies the selected set.",
    points: ["Shared holdings", "Sector crowding", "True diversification"],
    note: "Overlap analysis requires holdings-level fund data.",
  },
};

function initialFundSlots(): FundSlot[] {
  const largeCap = MOCK_FUNDS.find((fund) => fund.id === "nippon-india-large-cap") ?? MOCK_FUNDS[0];
  const flexiCap = MOCK_FUNDS.find((fund) => fund.id === "parag-parikh-flexi-cap") ?? MOCK_FUNDS[1];
  return [largeCap, flexiCap, null, null];
}

function FundPreviewTab({ tab }: { tab: ComparisonTab }) {
  if (tab === "Performance") return null;

  const preview = FUND_TAB_PREVIEWS[tab];

  return (
    <section aria-label={preview.title} style={previewPanelStyle}>
      <span style={previewBadgeStyle}>{preview.eyebrow}</span>
      <div>
        <h2
          style={{
            margin: 0,
            color: "rgba(255, 250, 235, 0.94)",
            fontSize: "1.05rem",
            lineHeight: 1.12,
          }}
        >
          {preview.title}
        </h2>
        <p
          style={{
            maxWidth: "52rem",
            margin: "0.42rem 0 0",
            color: "rgba(238, 231, 214, 0.68)",
            fontSize: "0.82rem",
            lineHeight: 1.42,
          }}
        >
          {preview.description}
        </p>
      </div>
      <div style={previewPointGridStyle}>
        {preview.points.map((point) => (
          <div key={point} style={previewPointStyle}>
            {point}
          </div>
        ))}
      </div>
      <p
        style={{
          margin: 0,
          color: "rgba(238, 231, 214, 0.54)",
          fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
          fontSize: "0.58rem",
          lineHeight: 1.35,
          textTransform: "uppercase",
        }}
      >
        {preview.note}
      </p>
    </section>
  );
}

function ComparisonBody({
  filledCount,
  activeTab,
  fundSlots,
  onTabChange,
  onOpenDrawer,
}: {
  filledCount: number;
  activeTab: ComparisonTab;
  fundSlots: FundSlot[];
  onTabChange: (tab: ComparisonTab) => void;
  onOpenDrawer: () => void;
}) {
  if (filledCount === 0) {
    return (
      <section className="portfolio-glass-panel" aria-label="Fund comparison empty state" style={{ ...bodyPanelStyle, gridTemplateRows: "minmax(0, 1fr)" }}>
        <div style={placeholderStyle}>
          <div style={placeholderCardStyle}>
            <p
              style={{
                margin: 0,
                color: "rgba(255, 250, 235, 0.9)",
                fontSize: "1.12rem",
                fontWeight: 600,
              }}
            >
              Add a fund to start.
            </p>
            <button
              type="button"
              className="monitor-cta-button"
              onClick={onOpenDrawer}
              style={{ width: "auto", minHeight: "2.65rem", margin: "1rem auto 0", padding: "0 1.1rem", borderRadius: OUTER_RADIUS }}
            >
              Add fund
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portfolio-glass-panel" aria-label="Fund comparison body" style={bodyPanelStyle}>
      <div aria-label="Fund comparison tabs" style={tabStripStyle}>
        {COMPARISON_TABS.map((tab, index) => (
          <button
            key={tab}
            type="button"
            aria-pressed={tab === activeTab}
            onClick={() => onTabChange(tab)}
            style={{
              ...tabButtonStyle,
              ...(tab === activeTab ? activeTabStyle : {}),
              borderRight: index === COMPARISON_TABS.length - 1 ? 0 : tabButtonStyle.borderRight,
            }}
          >
            {tab}
            {tab === activeTab ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: "0.58rem",
                  bottom: 0,
                  left: "0.58rem",
                  height: "2px",
                  borderRadius: CHIP_RADIUS,
                  background: "linear-gradient(90deg, transparent, rgba(255, 242, 209, 0.72), transparent)",
                  boxShadow: "0 0 0.55rem rgba(255, 242, 209, 0.24)",
                }}
              />
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "Performance" ? <PerformanceTab fundSlots={fundSlots} /> : <FundPreviewTab tab={activeTab} />}
    </section>
  );
}

export function FundsScreen(navHandlers: GlobalBrandNavHandlers) {
  const [fundSlots, setFundSlots] = useState<FundSlot[]>(initialFundSlots);
  const [isFundPickerOpen, setIsFundPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ComparisonTab>("Performance");

  const filledCount = useMemo(() => fundSlots.filter(Boolean).length, [fundSlots]);

  const removeFund = (slotIndex: number) => {
    setFundSlots((currentSlots) => currentSlots.map((fund, index) => (index === slotIndex ? null : fund)));
  };

  const addFund = (fund: Fund) => {
    setFundSlots((currentSlots) => {
      if (currentSlots.some((slot) => slot?.id === fund.id)) return currentSlots;
      const emptyIndex = currentSlots.findIndex((slot) => !slot);
      if (emptyIndex === -1) return currentSlots;
      return currentSlots.map((slot, index) => (index === emptyIndex ? fund : slot));
    });
    setIsFundPickerOpen(false);
  };

  return (
    <main className="app-shell portfolio-app portfolio-app-view-funds" style={shellStyle}>
      <GlobalBrandNav activeView="funds" {...navHandlers} />
      <MarketTape basket={FUNDS_MARKET_TAPE} includeGlobalItems={false} statusLabel="Benchmarks" />

      <section className="portfolio-screen" aria-label="Funds comparison screen" style={contentStyle}>
        <div className="portfolio-background-grid" aria-hidden="true" />

        <section className="portfolio-dashboard" aria-label="Funds compare workspace">
          <header className="portfolio-section-header">
            <div>
              <h1>Funds</h1>
              <p>Static sample fund comparison. NAV history is illustrative.</p>
            </div>
            <button type="button" className="portfolio-funds-command" onClick={() => setIsFundPickerOpen(true)}>
              <Search aria-hidden="true" />
              <span>Search funds or compare category...</span>
            </button>
          </header>

          <FundSelector
            slots={fundSlots}
            funds={MOCK_FUNDS}
            isPickerOpen={isFundPickerOpen}
            onPickerOpenChange={setIsFundPickerOpen}
            onRemove={removeFund}
            onAddFund={addFund}
          />

          <ComparisonBody
            filledCount={filledCount}
            activeTab={activeTab}
            fundSlots={fundSlots}
            onTabChange={setActiveTab}
            onOpenDrawer={() => setIsFundPickerOpen(true)}
          />
        </section>
      </section>
    </main>
  );
}
