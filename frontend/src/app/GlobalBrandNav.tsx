import { useEffect, useRef } from "react";

import type { AppView } from "./routes";

interface GlobalBrandNavProps {
  activeView: AppView;
  onHome: () => void;
  onMarkets: () => void;
  onEarnings: (query?: string) => void;
  onFunds: () => void;
  onScreener: () => void;
  onWatchlist: () => void;
  onPortfolio: () => void;
}

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
  const isLensActive = !["markets", "earnings", "screener", "funds", "watchlist", "portfolio"].includes(activeView);
  const navLinksRef = useRef<HTMLDivElement | null>(null);
  const activeNavLinkRef = useRef<HTMLButtonElement | null>(null);

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
          <button
            type="button"
            className={`global-nav-link global-nav-link-lens${isLensActive ? " is-active" : ""}`}
            ref={isLensActive ? activeNavLinkRef : undefined}
            aria-label="Open global intelligence lens"
            aria-current={isLensActive ? "page" : undefined}
            onClick={onHome}
          >
            <span>Lens</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-markets${activeView === "markets" ? " is-active" : ""}`}
            ref={activeView === "markets" ? activeNavLinkRef : undefined}
            aria-label="Open Indian Markets"
            aria-current={activeView === "markets" ? "page" : undefined}
            onClick={onMarkets}
          >
            <span>Indian Markets</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-earnings${activeView === "earnings" ? " is-active" : ""}`}
            ref={activeView === "earnings" ? activeNavLinkRef : undefined}
            aria-label="Open earnings"
            aria-current={activeView === "earnings" ? "page" : undefined}
            onClick={() => onEarnings()}
          >
            <span>Earnings</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-screener${activeView === "screener" ? " is-active" : ""}`}
            ref={activeView === "screener" ? activeNavLinkRef : undefined}
            aria-label="Open screener"
            aria-current={activeView === "screener" ? "page" : undefined}
            onClick={() => onScreener()}
          >
            <span>Screener</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-funds${activeView === "funds" ? " is-active" : ""}`}
            ref={activeView === "funds" ? activeNavLinkRef : undefined}
            aria-label="Open funds"
            aria-current={activeView === "funds" ? "page" : undefined}
            onClick={onFunds}
          >
            <span>Funds</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-watchlist${activeView === "watchlist" ? " is-active" : ""}`}
            ref={activeView === "watchlist" ? activeNavLinkRef : undefined}
            aria-label="Open watchlist"
            aria-current={activeView === "watchlist" ? "page" : undefined}
            onClick={onWatchlist}
          >
            <span>Watchlist</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-portfolio${activeView === "portfolio" ? " is-active" : ""}`}
            ref={activeView === "portfolio" ? activeNavLinkRef : undefined}
            aria-label="Open your portfolio"
            aria-current={activeView === "portfolio" ? "page" : undefined}
            onClick={onPortfolio}
          >
            <span>Portfolio</span>
          </button>
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
