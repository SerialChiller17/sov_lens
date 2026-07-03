import { ChevronDown, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatedSearchPrompt } from "../components/search/AnimatedSearchPrompt";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { formatIndianCroresCompact, formatPercent } from "./fundUtils";
import type { Fund, FundCategory, FundSlot } from "./types";

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

const SLOT_COLORS = ["#B86A4B", "#D7D7CF", "#7E9A86", "#A1A8B3"];

export function FundSelector({
  slots,
  funds,
  isPickerOpen,
  onPickerOpenChange,
  onRemove,
  onAddFund,
}: {
  slots: FundSlot[];
  funds: Fund[];
  isPickerOpen: boolean;
  onPickerOpenChange: (isOpen: boolean) => void;
  onRemove: (slotIndex: number) => void;
  onAddFund: (fund: Fund) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<FundCategory | "All">("All");
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const maxFunds = slots.length;

  const selectedEntries = useMemo(
    () =>
      slots
        .map((fund, index) => (fund ? { fund, index, color: SLOT_COLORS[index] ?? SLOT_COLORS[0] } : null))
        .filter((entry): entry is { fund: Fund; index: number; color: string } => Boolean(entry)),
    [slots],
  );

  const selectedIds = useMemo(() => new Set(selectedEntries.map((entry) => entry.fund.id)), [selectedEntries]);
  const selectedCount = selectedEntries.length;
  const hasOpenSlot = selectedCount < maxFunds;

  const visibleFunds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return funds
      .filter((fund) => !selectedIds.has(fund.id))
      .filter((fund) => {
        const matchesCategory = activeFilter === "All" || fund.category === activeFilter;
        const matchesSearch =
          normalizedQuery.length === 0 ||
          fund.name.toLowerCase().includes(normalizedQuery) ||
          fund.shortName.toLowerCase().includes(normalizedQuery) ||
          fund.benchmark.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesSearch;
      });
  }, [activeFilter, funds, query, selectedIds]);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        onPickerOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onPickerOpenChange(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen, onPickerOpenChange]);

  const handleAddFund = (fund: Fund) => {
    if (!hasOpenSlot) return;
    onAddFund(fund);
    setQuery("");
    onPickerOpenChange(false);
  };

  return (
    <section className="fund-compare-tray portfolio-glass-panel" aria-label="Fund comparison controls">
      <div className="fund-compare-tray-topline">
        <div className="fund-picker-anchor" ref={pickerRef}>
          <LiquidMetalButton
            type="button"
            className="fund-picker-trigger"
            label={hasOpenSlot ? "Add fund" : "Manage funds"}
            aria-expanded={isPickerOpen}
            aria-haspopup="listbox"
            onClick={() => onPickerOpenChange(!isPickerOpen)}
          >
            {hasOpenSlot ? <Plus aria-hidden="true" size={15} /> : <Search aria-hidden="true" size={15} />}
            <span>{hasOpenSlot ? "Add fund" : "Manage funds"}</span>
            <ChevronDown aria-hidden="true" size={14} />
          </LiquidMetalButton>

          {isPickerOpen ? (
            <div className="fund-picker-menu" role="dialog" aria-label="Add fund menu">
              <label className={`fund-picker-search has-animated-search-prompt${query.trim() ? " has-search-value" : ""}`}>
                <Search aria-hidden="true" size={15} />
                <span className="sr-only">Search funds</span>
                <input
                  autoFocus
                  type="search"
                  placeholder=" "
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                />
                <AnimatedSearchPrompt
                  prompts={[
                    "Find funds with lower drawdowns",
                    "Search NIFTY benchmark funds",
                    "Compare flexi cap category leaders",
                    "Show funds with stronger rolling returns",
                  ]}
                />
              </label>

              <div className="fund-picker-filters" aria-label="Fund category filters">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={filter === activeFilter}
                    onClick={() => setActiveFilter(filter)}
                    className={filter === activeFilter ? "is-active" : undefined}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {selectedEntries.length > 0 ? (
                <div className="fund-picker-selection" aria-label="Current selected funds">
                  <div className="fund-picker-section-title">
                    <span>Current selection</span>
                    <strong>
                      {selectedCount}/{maxFunds}
                    </strong>
                  </div>
                  <div className="fund-picker-selection-list">
                    {selectedEntries.map(({ fund, index, color }) => (
                      <div key={`picker-${fund.id}-${index}`} className="fund-picker-selection-row" style={{ "--fund-color": color } as CSSProperties}>
                        <span aria-hidden="true" />
                        <strong title={fund.name}>{fund.shortName}</strong>
                        <em>{formatPercent(fund.trailingReturns[5], 1)}</em>
                        <button type="button" aria-label={`Remove ${fund.shortName}`} onClick={() => onRemove(index)}>
                          <X aria-hidden="true" size={12} strokeWidth={2.25} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="fund-picker-results" role="listbox" aria-label="Available funds">
                {!hasOpenSlot ? (
                  <div className="fund-picker-full-note">
                    <strong>Comparison set is full</strong>
                    <span>Remove one from current selection, then add another from this list.</span>
                  </div>
                ) : null}

                {visibleFunds.map((fund) => (
                  <button
                    key={fund.id}
                    type="button"
                    className="fund-picker-option"
                    disabled={!hasOpenSlot}
                    onClick={() => handleAddFund(fund)}
                  >
                    <span className="fund-picker-option-main">
                      <strong>{fund.shortName}</strong>
                      <span>
                        {fund.category} / {fund.benchmark}
                      </span>
                    </span>
                    <span className="fund-picker-option-metrics" aria-label={`${fund.shortName} metrics`}>
                      <span>{formatPercent(fund.trailingReturns[5], 1)}</span>
                      <span>{formatIndianCroresCompact(fund.aum)}</span>
                      <span>TER {formatPercent(fund.expenseRatio)}</span>
                    </span>
                  </button>
                ))}

                {visibleFunds.length === 0 ? (
                  <div className="fund-picker-empty">
                    <strong>No matching funds</strong>
                    <span>Try another category or search term.</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fund-chip-strip" aria-label="Selected funds">
        {selectedEntries.map(({ fund, index, color }) => (
          <article key={`${fund.id}-${index}`} className="fund-selected-chip" style={{ "--fund-color": color } as CSSProperties}>
            <span className="fund-selected-chip-marker" aria-hidden="true" />
            <div className="fund-selected-chip-main">
              <strong title={fund.name}>{fund.shortName}</strong>
              <span>{fund.category}</span>
            </div>
            <button type="button" aria-label={`Remove ${fund.shortName}`} onClick={() => onRemove(index)}>
              <X aria-hidden="true" size={13} strokeWidth={2.25} />
            </button>
          </article>
        ))}

        {selectedEntries.length === 0 ? (
          <button type="button" className="fund-selected-empty" onClick={() => onPickerOpenChange(true)}>
            <Plus aria-hidden="true" size={16} />
            <span>Add a fund to start analysis</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
