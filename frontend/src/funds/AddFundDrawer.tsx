import { useMemo, useState, type CSSProperties } from "react";
import { formatIndianCrores, formatPercent } from "./fundUtils";
import type { Fund, FundCategory } from "./types";

const FILTERS: Array<FundCategory | "All"> = [
  "All",
  "Large Cap",
  "Flexi Cap",
  "Mid Cap",
  "Small Cap",
  "ELSS",
  "Sector ETF",
  "Foreign ETF",
  "Gold",
  "Debt",
  "Hybrid",
];

const OUTER_RADIUS = "8px";
const CHIP_RADIUS = "999px";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 30,
  background: "linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.34) 100%)",
  transition: "opacity 180ms ease",
};

const drawerBaseStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: "30vw",
  minWidth: "25rem",
  maxWidth: "34rem",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: "0.88rem",
  padding: "1rem",
  borderLeft: "1px solid rgba(255, 242, 209, 0.12)",
  borderRadius: `${OUTER_RADIUS} 0 0 ${OUTER_RADIUS}`,
  color: "#f4f1e9",
  background:
    "linear-gradient(145deg, rgba(255, 242, 209, 0.055), transparent 44%), linear-gradient(180deg, rgba(24, 23, 20, 0.88), rgba(7, 7, 6, 0.86))",
  boxShadow: "inset 1px 0 0 rgba(255, 250, 235, 0.055), -28px 0 72px rgba(0, 0, 0, 0.48)",
  backdropFilter: "blur(20px) saturate(1.05)",
  transition: "transform 220ms cubic-bezier(0.22, 0.9, 0.28, 1)",
};

const closeButtonStyle: CSSProperties = {
  width: "1.85rem",
  height: "1.85rem",
  border: "1px solid rgba(255, 242, 209, 0.14)",
  borderRadius: CHIP_RADIUS,
  display: "grid",
  placeItems: "center",
  padding: 0,
  color: "rgba(255, 242, 209, 0.78)",
  background: "rgba(0, 0, 0, 0.24)",
  cursor: "pointer",
  lineHeight: 1,
};

const chipStyle: CSSProperties = {
  flex: "0 0 auto",
  border: "1px solid rgba(255, 242, 209, 0.13)",
  borderRadius: CHIP_RADIUS,
  padding: "0.42rem 0.64rem",
  color: "rgba(238, 231, 214, 0.62)",
  background: "rgba(255, 242, 209, 0.035)",
  cursor: "pointer",
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  fontSize: "0.54rem",
  fontWeight: 700,
  textTransform: "uppercase",
};

export function AddFundDrawer({
  isOpen,
  funds,
  hasOpenSlot,
  onClose,
  onAddFund,
}: {
  isOpen: boolean;
  funds: Fund[];
  hasOpenSlot: boolean;
  onClose: () => void;
  onAddFund: (fund: Fund) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<FundCategory | "All">("All");
  const [query, setQuery] = useState("");
  const visibleFunds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return funds.filter((fund) => {
      const matchesCategory = activeFilter === "All" || fund.category === activeFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        fund.name.toLowerCase().includes(normalizedQuery) ||
        fund.shortName.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, funds, query]);

  return (
    <div
      aria-hidden={!isOpen}
      style={{
        ...overlayStyle,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      <aside
        aria-label="Add fund drawer"
        style={{
          ...drawerBaseStyle,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <span
              style={{
                color: "rgba(238, 231, 214, 0.46)",
                fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: "0.58rem",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Compare universe
            </span>
            <h2
              style={{
                margin: "0.28rem 0 0",
                color: "rgba(255, 250, 235, 0.94)",
                fontFamily: '"Blacker Pro Text Condensed", "Blacker Pro", Georgia, serif',
                fontSize: "2.15rem",
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Add fund
            </h2>
          </div>
          <button type="button" aria-label="Close add fund drawer" onClick={onClose} style={closeButtonStyle}>
            {"\u00d7"}
          </button>
        </header>

        <div style={{ display: "grid", gap: "0.68rem", minWidth: 0 }}>
          <label>
            <span className="sr-only">Search funds</span>
            <input
              type="search"
              placeholder="Search funds..."
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              style={{
                width: "100%",
                minHeight: "2.45rem",
                border: "1px solid rgba(255, 242, 209, 0.12)",
                borderRadius: OUTER_RADIUS,
                padding: "0 0.82rem",
                color: "rgba(255, 250, 235, 0.88)",
                background: "rgba(0, 0, 0, 0.22)",
                outline: "none",
              }}
            />
          </label>

          <div
            aria-label="Fund category filters"
            style={{
              display: "flex",
              gap: "0.42rem",
              minWidth: 0,
              overflowX: "auto",
              paddingBottom: "0.18rem",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255, 242, 209, 0.28) transparent",
            }}
          >
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={filter === activeFilter}
                onClick={() => setActiveFilter(filter)}
                style={
                  filter === activeFilter
                    ? {
                        ...chipStyle,
                        borderColor: "rgba(255, 242, 209, 0.32)",
                        color: "rgba(255, 250, 235, 0.94)",
                        background: "rgba(255, 242, 209, 0.1)",
                      }
                    : chipStyle
                }
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            alignContent: "start",
            gap: "0.58rem",
            minHeight: 0,
            overflowY: "auto",
            paddingRight: "0.18rem",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 242, 209, 0.28) transparent",
          }}
        >
          {visibleFunds.map((fund) => (
            <article
              key={fund.id}
              className="portfolio-glass-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                alignItems: "center",
                gap: "0.72rem",
                padding: "0.68rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.42rem", minWidth: 0 }}>
                  <strong
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      color: "rgba(255, 250, 235, 0.9)",
                      fontSize: "0.76rem",
                      fontWeight: 650,
                      lineHeight: 1.2,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fund.name}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.36rem",
                    marginTop: "0.42rem",
                    color: "rgba(238, 231, 214, 0.52)",
                    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                    fontSize: "0.52rem",
                    textTransform: "uppercase",
                  }}
                >
                  <span>{fund.category}</span>
                  <span>{formatIndianCrores(fund.aum)}</span>
                  <span>Exp {formatPercent(fund.expenseRatio)}</span>
                  <span>5Y {formatPercent(fund.trailingReturns[5], 1)}</span>
                </div>
              </div>

              <button
                type="button"
                className="monitor-cta-button"
                disabled={!hasOpenSlot}
                onClick={() => onAddFund(fund)}
                style={{
                  width: "4rem",
                  minHeight: "2.2rem",
                  marginTop: 0,
                  borderRadius: OUTER_RADIUS,
                  opacity: hasOpenSlot ? 1 : 0.42,
                  cursor: hasOpenSlot ? "pointer" : "not-allowed",
                }}
              >
                Add
              </button>
            </article>
          ))}
          {visibleFunds.length === 0 ? (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "8rem",
                border: "1px dashed rgba(255, 242, 209, 0.16)",
                borderRadius: OUTER_RADIUS,
                color: "rgba(238, 231, 214, 0.54)",
                fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: "0.62rem",
                textTransform: "uppercase",
              }}
            >
              No funds match this filter
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
