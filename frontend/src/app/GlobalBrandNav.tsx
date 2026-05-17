import { useEffect, useRef } from "react";

import type { AppView } from "./routes";

export interface GlobalBrandNavHandlers {
  onHome: () => void;
  onMarkets: () => void;
  onEarnings: (query?: string) => void;
  onFunds: () => void;
  onScreener: (query?: string) => void;
  onWatchlist: () => void;
  onPortfolio: () => void;
}

interface GlobalBrandNavProps extends GlobalBrandNavHandlers {
  activeView: AppView;
}

type GlobalNavItem = {
  id: "lens" | "markets" | "earnings" | "screener" | "funds" | "watchlist" | "portfolio";
  label: string;
  className: string;
  ariaLabel: string;
  activeViews: AppView[];
  onSelect: (handlers: GlobalBrandNavHandlers) => void;
};

const GLOBAL_NAV_ITEMS: GlobalNavItem[] = [
  {
    id: "lens",
    label: "Lens",
    className: "global-nav-link-lens",
    ariaLabel: "Open global intelligence lens",
    activeViews: ["lens", "news", "article", "answer"],
    onSelect: ({ onHome }) => onHome(),
  },
  {
    id: "markets",
    label: "Indian Markets",
    className: "global-nav-link-markets",
    ariaLabel: "Open Indian Markets",
    activeViews: ["markets"],
    onSelect: ({ onMarkets }) => onMarkets(),
  },
  {
    id: "earnings",
    label: "Earnings",
    className: "global-nav-link-earnings",
    ariaLabel: "Open earnings",
    activeViews: ["earnings"],
    onSelect: ({ onEarnings }) => onEarnings(),
  },
  {
    id: "screener",
    label: "Screener",
    className: "global-nav-link-screener",
    ariaLabel: "Open screener",
    activeViews: ["screener"],
    onSelect: ({ onScreener }) => onScreener(),
  },
  {
    id: "funds",
    label: "Funds",
    className: "global-nav-link-funds",
    ariaLabel: "Open funds",
    activeViews: ["funds"],
    onSelect: ({ onFunds }) => onFunds(),
  },
  {
    id: "watchlist",
    label: "Watchlist",
    className: "global-nav-link-watchlist",
    ariaLabel: "Open watchlist",
    activeViews: ["watchlist"],
    onSelect: ({ onWatchlist }) => onWatchlist(),
  },
  {
    id: "portfolio",
    label: "Portfolio",
    className: "global-nav-link-portfolio",
    ariaLabel: "Open your portfolio",
    activeViews: ["portfolio"],
    onSelect: ({ onPortfolio }) => onPortfolio(),
  },
];

export function GlobalBrandNav({
  activeView,
  onHome,
  onMarkets,
  onEarnings,
  onFunds,
  onScreener,
  onWatchlist,
  onPortfolio,
}: GlobalBrandNavProps) {
  const navLinksRef = useRef<HTMLDivElement | null>(null);
  const activeNavLinkRef = useRef<HTMLButtonElement | null>(null);
  const navHandlers: GlobalBrandNavHandlers = {
    onHome,
    onMarkets,
    onEarnings,
    onFunds,
    onScreener,
    onWatchlist,
    onPortfolio,
  };

  useEffect(() => {
    const scrollActiveLinkIntoView = () => {
      const navLinks = navLinksRef.current;
      const activeNavLink = activeNavLinkRef.current;

      if (!navLinks || !activeNavLink) {
        return;
      }

      const maxScrollLeft = navLinks.scrollWidth - navLinks.clientWidth;

      if (maxScrollLeft <= 0) {
        return;
      }

      const centeredScrollLeft = activeNavLink.offsetLeft - (navLinks.clientWidth - activeNavLink.offsetWidth) / 2;
      navLinks.scrollLeft = Math.min(Math.max(centeredScrollLeft, 0), maxScrollLeft);
    };

    scrollActiveLinkIntoView();

    const frameId = window.requestAnimationFrame(scrollActiveLinkIntoView);
    const timeoutId = window.setTimeout(scrollActiveLinkIntoView, 120);
    window.addEventListener("resize", scrollActiveLinkIntoView);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", scrollActiveLinkIntoView);
    };
  }, [activeView]);

  return (
    <nav className="global-brand-nav" aria-label="Primary navigation">
      <div className="global-brand-shell">
        <button type="button" className="global-brand-button" onClick={onHome} aria-label="Go to Sovereign Lens home">
          <span className="global-brand-mark">SOV</span>
          <span className="global-brand-wordmark">
            <span>Sovereign</span>
            <strong>Lens</strong>
          </span>
        </button>

        <div className="global-nav-links" aria-label="Workspace sections" ref={navLinksRef}>
          {GLOBAL_NAV_ITEMS.map((item) => {
            const isActive = item.activeViews.includes(activeView);

            return (
              <button
                key={item.id}
                type="button"
                className={`global-nav-link ${item.className}${isActive ? " is-active" : ""}`}
                ref={isActive ? activeNavLinkRef : undefined}
                aria-label={item.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                onClick={() => item.onSelect(navHandlers)}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="global-nav-actions" aria-label="Account actions">
          <button type="button" className="global-nav-login" aria-label="Login coming soon" title="Login coming soon" disabled>
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
