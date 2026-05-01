import type { AppView } from "./routes";

interface GlobalBrandNavProps {
  activeView: AppView;
  onHome: () => void;
  onFunds: () => void;
  onPortfolio: () => void;
}

export function GlobalBrandNav({ activeView, onHome, onFunds, onPortfolio }: GlobalBrandNavProps) {
  const isLensActive = activeView !== "funds" && activeView !== "portfolio";

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

        <div className="global-nav-links" aria-label="Workspace sections">
          <button
            type="button"
            className={`global-nav-link global-nav-link-lens${isLensActive ? " is-active" : ""}`}
            aria-label="Open global intelligence lens"
            aria-current={isLensActive ? "page" : undefined}
            onClick={onHome}
          >
            <span>Lens</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-funds${activeView === "funds" ? " is-active" : ""}`}
            aria-label="Open funds"
            aria-current={activeView === "funds" ? "page" : undefined}
            onClick={onFunds}
          >
            <span>Funds</span>
          </button>
          <button
            type="button"
            className={`global-nav-link global-nav-link-portfolio${activeView === "portfolio" ? " is-active" : ""}`}
            aria-label="Open your portfolio"
            aria-current={activeView === "portfolio" ? "page" : undefined}
            onClick={onPortfolio}
          >
            <span>Portfolio</span>
          </button>
        </div>

        <div className="global-nav-actions" aria-label="Account actions">
          <button type="button" className="global-nav-login" aria-label="Log in">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
