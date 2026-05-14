import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { MarketSummaryItem, MarketSummarySource } from "./portfolioWorkspaceData";

interface MarketSummaryProps {
  items: MarketSummaryItem[];
  sources: MarketSummarySource[];
  updatedLabel?: string;
}

function sourceInitials(sourceName: string) {
  const parts = sourceName
    .replace(/\.[a-z]+$/i, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const initials = parts.length > 1 ? parts.slice(0, 2).map((part) => part[0]) : sourceName.slice(0, 2).split("");
  return initials.join("").toUpperCase();
}

function faviconUrl(domain?: string) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function SourceIcon({ source, compact = false }: { source: MarketSummarySource; compact?: boolean }) {
  const [hasImageError, setHasImageError] = useState(false);
  const iconUrl = faviconUrl(source.domain);
  const initials = sourceInitials(source.sourceName);

  if (!iconUrl || hasImageError) {
    return (
      <span className={`market-summary-source-icon${compact ? " is-compact" : ""}`} aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    <span className={`market-summary-source-icon${compact ? " is-compact" : ""}`} aria-hidden="true">
      <img src={iconUrl} alt="" loading="lazy" onError={() => setHasImageError(true)} />
    </span>
  );
}

function SourcesPill({ sources, onOpen }: { sources: MarketSummarySource[]; onOpen: () => void }) {
  const sourceCount = sources.length;

  return (
    <button
      type="button"
      className="market-summary-sources-pill"
      onClick={onOpen}
      disabled={sourceCount === 0}
      aria-label={sourceCount > 0 ? `Open ${sourceCount} market summary sources` : "No market summary sources available"}
    >
      {sourceCount > 0 ? (
        <span className="market-summary-source-stack" aria-hidden="true">
          {sources.slice(0, 3).map((source, index) => (
            <SourceIcon key={`${source.sourceName}-${source.title}-${index}`} source={source} compact />
          ))}
        </span>
      ) : null}
      <span>{sourceCount > 0 ? `${sourceCount} sources` : "No sources"}</span>
    </button>
  );
}

function SourcesDrawer({ sources, isOpen, onClose }: { sources: MarketSummarySource[]; isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="market-summary-sources-overlay" role="presentation">
      <div className="market-summary-sources-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="market-summary-sources-drawer" role="dialog" aria-modal="true" aria-label="Market summary sources">
        <header className="market-summary-sources-header">
          <h3>{sources.length} sources</h3>
          <button type="button" className="market-summary-sources-close" onClick={onClose} aria-label="Close sources panel">
            <X size={22} strokeWidth={1.8} />
          </button>
        </header>
        <div className="market-summary-sources-list">
          {sources.map((source, index) => {
            const sourceContent = (
              <>
                <SourceIcon source={source} />
                <div>
                  <span>{source.sourceName}</span>
                  <strong>{source.title}</strong>
                  <p>{source.snippet}</p>
                </div>
              </>
            );

            return source.url ? (
              <a key={`${source.sourceName}-${source.title}-${index}`} className="market-summary-source-item" href={source.url} target="_blank" rel="noreferrer">
                {sourceContent}
              </a>
            ) : (
              <article key={`${source.sourceName}-${source.title}-${index}`} className="market-summary-source-item">
                {sourceContent}
              </article>
            );
          })}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export function MarketSummary({ items, sources, updatedLabel = "Updated 1 minute ago" }: MarketSummaryProps) {
  const accordionId = useId();
  const [openItemId, setOpenItemId] = useState<string | null>(items[0]?.id ?? null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setOpenItemId(null);
      return;
    }

    if (openItemId && !items.some((item) => item.id === openItemId)) {
      setOpenItemId(items[0].id);
    }
  }, [items, openItemId]);

  return (
    <section className="portfolio-market-summary-panel" aria-labelledby="market-summary-heading">
      <header className="portfolio-workspace-panel-heading market-summary-heading">
        <div>
          <h2 id="market-summary-heading">Market Summary</h2>
        </div>
        <strong>{updatedLabel}</strong>
      </header>

      <div className="market-summary-card">
        <div className="market-summary-accordion">
          {items.map((item) => {
            const isOpen = openItemId === item.id;
            const panelId = `${accordionId}-${item.id}-panel`;
            const triggerId = `${accordionId}-${item.id}-trigger`;

            return (
              <article key={item.id} className={`market-summary-row is-${item.tone}${isOpen ? " is-open" : ""}`}>
                <button
                  id={triggerId}
                  type="button"
                  className="market-summary-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenItemId(isOpen ? null : item.id)}
                >
                  <span>{item.title}</span>
                  <ChevronDown className="market-summary-chevron" size={19} strokeWidth={1.9} aria-hidden="true" />
                </button>
                <div id={panelId} className="market-summary-answer" role="region" aria-labelledby={triggerId} aria-hidden={!isOpen}>
                  <div className="market-summary-answer-inner">
                    <p>{item.summary}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="market-summary-card-footer">
          <SourcesPill sources={sources} onOpen={() => setIsSourcesOpen(true)} />
        </div>
      </div>

      <SourcesDrawer sources={sources} isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} />
    </section>
  );
}
