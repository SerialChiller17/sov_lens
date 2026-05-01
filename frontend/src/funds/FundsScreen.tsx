import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AddFundDrawer } from "./AddFundDrawer";
import { FundSelector } from "./FundSelector";
import { MOCK_FUNDS } from "./mockFunds";
import { PerformanceTab } from "./tabs/PerformanceTab";
import type { Fund, FundSlot } from "./types";

type ComparisonTab = "Performance" | "Allocation" | "Risk" | "Cost" | "Stress Test";

const COMPARISON_TABS: ComparisonTab[] = ["Performance", "Allocation", "Risk", "Cost", "Stress Test"];

const BENCHMARK_TAPE = [
  { label: "NIFTY 50 TRI", value: "37,842.20", move: "+0.42%", direction: "up" },
  { label: "NIFTY 500 TRI", value: "34,510.84", move: "+0.37%", direction: "up" },
  { label: "NIFTY MIDCAP 150 TRI", value: "22,904.12", move: "+0.58%", direction: "up" },
  { label: "NIFTY SMALLCAP 250 TRI", value: "18,226.45", move: "-0.18%", direction: "down" },
  { label: "S&P 500 (INR)", value: "4,37,820", move: "+0.22%", direction: "up" },
  { label: "NIFTY DEBT INDEX", value: "2,918.64", move: "+0.04%", direction: "up" },
  { label: "GOLD INR", value: "\u20b972,840", move: "+0.31%", direction: "up" },
] as const;

const shellStyle: CSSProperties = {
  // Mobile is a separate project.
  minWidth: "1100px",
  overflowX: "auto",
};

const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";

const contentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "1fr",
  alignContent: "start",
  gap: "0.72rem",
  minHeight: "100%",
  padding: "6.58rem clamp(1rem, 2.35vw, 2.7rem) 1.1rem",
  isolation: "isolate",
};

const bodyPanelStyle: CSSProperties = {
  minHeight: "22rem",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: "0.62rem",
  padding: "0.68rem",
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
  minHeight: "2.02rem",
  border: 0,
  borderRight: "1px solid rgba(255, 242, 209, 0.09)",
  padding: "0 0.76rem",
  color: "rgba(238, 231, 214, 0.58)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.02)), rgba(0, 0, 0, 0.26)",
  cursor: "pointer",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.56rem",
  fontWeight: 700,
  textTransform: "uppercase",
};

const activeTabStyle: CSSProperties = {
  color: "rgba(255, 250, 235, 0.96)",
  background:
    "linear-gradient(180deg, rgba(255, 242, 209, 0.12), rgba(255, 242, 209, 0.038)), rgba(10, 10, 9, 0.72)",
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

const wireframeShellStyle: CSSProperties = {
  position: "relative",
  minHeight: "19rem",
  marginTop: "0.78rem",
  border: "1px solid rgba(255, 242, 209, 0.12)",
  borderRadius: OUTER_RADIUS,
  overflow: "hidden",
  padding: "1rem",
  background:
    "linear-gradient(145deg, rgba(255, 242, 209, 0.04), transparent 42%), linear-gradient(180deg, rgba(10, 10, 9, 0.46), rgba(0, 0, 0, 0.26))",
};

const developmentChipStyle: CSSProperties = {
  position: "absolute",
  top: "0.72rem",
  right: "0.72rem",
  zIndex: 2,
  border: "1px solid rgba(255, 242, 209, 0.14)",
  borderRadius: CHIP_RADIUS,
  padding: "0.22rem 0.48rem",
  color: "rgba(255, 242, 209, 0.62)",
  background: "rgba(255, 242, 209, 0.04)",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.48rem",
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "uppercase",
};

const wireShapeBaseStyle: CSSProperties = {
  border: "1px solid rgba(255, 242, 209, 0.18)",
  borderRadius: OUTER_RADIUS,
  background:
    "linear-gradient(135deg, rgba(255, 242, 209, 0.18), rgba(255, 242, 209, 0.09)), rgba(255, 255, 255, 0.035)",
  boxShadow: "inset 0 1px 0 rgba(255, 250, 235, 0.08)",
  opacity: 1,
};

function initialFundSlots(): FundSlot[] {
  const largeCap = MOCK_FUNDS.find((fund) => fund.id === "nippon-india-large-cap") ?? MOCK_FUNDS[0];
  const flexiCap = MOCK_FUNDS.find((fund) => fund.id === "parag-parikh-flexi-cap") ?? MOCK_FUNDS[1];
  return [largeCap, flexiCap, null, null];
}

function WireShape({ style }: { style?: CSSProperties }) {
  return <span aria-hidden="true" style={{ ...wireShapeBaseStyle, ...style }} />;
}

function InDevelopmentChip() {
  return <span style={developmentChipStyle}>IN DEVELOPMENT</span>;
}

function ChartFrame({ height = "13.5rem" }: { height?: string }) {
  return (
    <div style={{ ...wireShapeBaseStyle, position: "relative", height, overflow: "hidden" }}>
      {[18, 38, 58, 78].map((top) => (
        <span
          key={top}
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "0.85rem",
            left: "0.85rem",
            top: `${top}%`,
            height: "1px",
            background: "rgba(255, 242, 209, 0.16)",
          }}
        />
      ))}
      {[24, 44, 64, 84].map((left) => (
        <span
          key={left}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "0.85rem",
            bottom: "1.15rem",
            left: `${left}%`,
            width: "1px",
            background: "rgba(255, 242, 209, 0.12)",
          }}
        />
      ))}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "1rem",
          bottom: "1.15rem",
          left: "1.15rem",
          height: "28%",
          border: "1px solid rgba(255, 242, 209, 0.2)",
          borderTop: "0",
          borderRight: "0",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "1.3rem",
          bottom: "2rem",
          left: "1.35rem",
          height: "48%",
          borderRadius: CHIP_RADIUS,
          borderTop: "2px solid rgba(255, 242, 209, 0.28)",
          transform: "skewY(-7deg)",
          transformOrigin: "left bottom",
        }}
      />
    </div>
  );
}

function ChartWithLegend({ height = "13.5rem" }: { height?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 11rem", gap: "0.82rem" }}>
      <ChartFrame height={height} />
      <div style={{ display: "grid", alignContent: "start", gap: "0.5rem" }}>
        <WireShape style={{ height: "1.1rem", width: "74%" }} />
        <WireShape style={{ height: "1.1rem", width: "88%" }} />
        <WireShape style={{ height: "1.1rem", width: "66%" }} />
        <WireShape style={{ height: "4.8rem", marginTop: "0.38rem" }} />
      </div>
    </div>
  );
}

function StackedAllocationBar() {
  return (
    <div style={{ ...wireShapeBaseStyle, height: "3.55rem", display: "grid", alignItems: "center", padding: "0.72rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "34fr 28fr 21fr 17fr", gap: "0.18rem" }}>
        {[0, 1, 2, 3].map((item) => (
          <WireShape key={item} style={{ height: "1.2rem", borderRadius: CHIP_RADIUS }} />
        ))}
      </div>
    </div>
  );
}

function DonutPlaceholder() {
  return (
    <div style={{ ...wireShapeBaseStyle, minHeight: "7.4rem", display: "grid", placeItems: "center" }}>
      <span
        aria-hidden="true"
        style={{
          width: "min(5.9rem, 68%)",
          aspectRatio: "1",
          border: "0.76rem solid rgba(255, 242, 209, 0.18)",
          borderTopColor: "rgba(255, 242, 209, 0.28)",
          borderRightColor: "rgba(255, 242, 209, 0.12)",
          borderRadius: CHIP_RADIUS,
          background: "rgba(0, 0, 0, 0.16)",
          boxShadow: "inset 0 0 0 1px rgba(255, 250, 235, 0.08)",
        }}
      />
    </div>
  );
}

function OverlapWarningBar() {
  return (
    <div style={{ ...wireShapeBaseStyle, height: "3.25rem", display: "grid", alignItems: "center", padding: "0.74rem" }}>
      <div style={{ position: "relative", height: "1.1rem" }}>
        <WireShape style={{ position: "absolute", inset: "0 auto 0 0", width: "68%", borderRadius: CHIP_RADIUS }} />
        <WireShape style={{ position: "absolute", inset: "0 0 0 auto", width: "56%", borderRadius: CHIP_RADIUS, opacity: 0.84 }} />
      </div>
    </div>
  );
}

function AllocationWireframe() {
  return (
    <div style={wireframeShellStyle}>
      <InDevelopmentChip />
      <div style={{ display: "grid", gap: "1rem", paddingRight: "7.8rem" }}>
        <StackedAllocationBar />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.82rem" }}>
          {[0, 1, 2].map((item) => (
            <DonutPlaceholder key={item} />
          ))}
        </div>
        <OverlapWarningBar />
      </div>
    </div>
  );
}

function RiskWireframe() {
  return (
    <div style={wireframeShellStyle}>
      <InDevelopmentChip />
      <div style={{ display: "grid", gap: "0.9rem", paddingRight: "7.8rem" }}>
        <ChartFrame height="12.6rem" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.64rem" }}>
          {[0, 1, 2, 3].map((item) => (
            <WireShape key={item} style={{ height: "3.35rem" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CostWireframe() {
  return (
    <div style={wireframeShellStyle}>
      <InDevelopmentChip />
      <div style={{ display: "grid", gap: "0.88rem", paddingRight: "7.8rem" }}>
        <WireShape style={{ height: "3.2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, max-content)", gap: "0.48rem" }}>
          {[0, 1, 2, 3].map((item) => (
            <WireShape key={item} style={{ width: "5.2rem", height: "1.65rem", borderRadius: CHIP_RADIUS }} />
          ))}
        </div>
        <ChartFrame height="10.2rem" />
      </div>
    </div>
  );
}

function StressTestWireframe() {
  return (
    <div style={wireframeShellStyle}>
      <InDevelopmentChip />
      <div style={{ display: "grid", gap: "0.88rem", paddingRight: "7.8rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.72rem" }}>
          {["COVID Crash", "2022 Correction", "2008 GFC"].map((label) => (
            <div key={label} style={{ ...wireShapeBaseStyle, minHeight: "4rem", display: "grid", placeItems: "center" }}>
              <span
                style={{
                  color: "rgba(238, 231, 214, 0.4)",
                  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <ChartWithLegend height="11.4rem" />
      </div>
    </div>
  );
}

function TabWireframe({ tab }: { tab: ComparisonTab }) {
  if (tab === "Allocation") return <AllocationWireframe />;
  if (tab === "Risk") return <RiskWireframe />;
  if (tab === "Cost") return <CostWireframe />;
  if (tab === "Stress Test") return <StressTestWireframe />;
  return null;
}

function FundsMarketTape() {
  const tapeItems = [...BENCHMARK_TAPE, ...BENCHMARK_TAPE];

  return (
    <section className="market-tape" aria-label="Fund benchmark tape">
      <div className="market-tape-status">
        <span aria-hidden="true" />
        <strong>Benchmarks</strong>
      </div>
      <div className="market-tape-viewport" aria-label="Fund comparison benchmark tape" style={{ paddingLeft: "1.18rem" }}>
        <div className="market-tape-track">
          {tapeItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className={`market-tape-item ${item.direction}`}
              aria-hidden={index >= BENCHMARK_TAPE.length}
            >
              <span className="market-tape-label">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="market-tape-move">{item.move}</span>
            </div>
          ))}
        </div>
      </div>
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
  if (filledCount < 2) {
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
              Add at least two funds to compare.
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
          </button>
        ))}
      </div>

      {activeTab === "Performance" ? <PerformanceTab fundSlots={fundSlots} /> : <TabWireframe tab={activeTab} />}
    </section>
  );
}

export function FundsScreen({ navigation }: { navigation: ReactNode }) {
  const [fundSlots, setFundSlots] = useState<FundSlot[]>(initialFundSlots);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ComparisonTab>("Performance");

  const filledCount = useMemo(() => fundSlots.filter(Boolean).length, [fundSlots]);
  const hasOpenSlot = fundSlots.some((fund) => !fund);

  const removeFund = (slotIndex: number) => {
    setFundSlots((currentSlots) => currentSlots.map((fund, index) => (index === slotIndex ? null : fund)));
  };

  const addFund = (fund: Fund) => {
    setFundSlots((currentSlots) => {
      const emptyIndex = currentSlots.findIndex((slot) => !slot);
      if (emptyIndex === -1) return currentSlots;
      return currentSlots.map((slot, index) => (index === emptyIndex ? fund : slot));
    });
    setIsDrawerOpen(false);
  };

  return (
    <main className="app-shell portfolio-app" style={shellStyle}>
      {navigation}
      <FundsMarketTape />

      <section className="portfolio-screen" aria-label="Funds comparison screen" style={contentStyle}>
        <div className="portfolio-background-grid" aria-hidden="true" />

        <section className="portfolio-dashboard" aria-label="Funds compare workspace">
          <header className="portfolio-section-header">
            <div>
              <span>Mutual Fund Comparison</span>
              <h1>Funds</h1>
              <p
                style={{
                  maxWidth: "34rem",
                  margin: "0.45rem 0 0",
                  color: "rgba(238, 231, 214, 0.58)",
                  fontSize: "0.86rem",
                  lineHeight: 1.5,
                }}
              >
                Compare up to 4 funds across performance, allocation, risk, and cost.
              </p>
            </div>
          </header>

          <FundSelector slots={fundSlots} onRemove={removeFund} onOpenDrawer={() => setIsDrawerOpen(true)} />

          <ComparisonBody
            filledCount={filledCount}
            activeTab={activeTab}
            fundSlots={fundSlots}
            onTabChange={setActiveTab}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        </section>
      </section>

      <AddFundDrawer
        isOpen={isDrawerOpen}
        funds={MOCK_FUNDS}
        hasOpenSlot={hasOpenSlot}
        onClose={() => setIsDrawerOpen(false)}
        onAddFund={addFund}
      />
    </main>
  );
}
