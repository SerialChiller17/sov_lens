import { useEffect, useState } from "react";
import { getBootstrapData } from "../api";
import { GLOBAL_MARKET_TAPE } from "../features/market-tape/marketTapeData";
import { MarketTape } from "../features/market-tape/MarketTape";
import { EventsDashboard } from "../features/events/EventsDashboard";
import { DEFAULT_NEWS_ID, GEO_NEWS_FEED } from "../features/events/eventsData";
import { NewsArticleView } from "../features/events/NewsArticleView";
import { PortfolioScreen } from "../features/portfolio/PortfolioScreen";
import { FundsScreen } from "../funds/FundsScreen";
import { GlobeMonitor } from "../globe-monitor/GlobeMonitor";
import type { BootstrapData } from "../types";
import { GlobalBrandNav } from "./GlobalBrandNav";
import { FUNDS_PATH, newsIdFromArticlePath, PORTFOLIO_PATH, routeToView, NEWS_DASHBOARD_PATH } from "./routes";

function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [selectedNewsId, setSelectedNewsId] = useState(() => newsIdFromArticlePath(window.location.pathname) ?? DEFAULT_NEWS_ID);
  const [activeView, setActiveView] = useState(() => routeToView(window.location.pathname));

  useEffect(() => {
    if (activeView === "funds" || activeView === "portfolio" || data) return;

    getBootstrapData()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [activeView, data]);

  useEffect(() => {
    const onPopState = () => {
      const articleNewsId = newsIdFromArticlePath(window.location.pathname);
      if (articleNewsId) setSelectedNewsId(articleNewsId);
      setActiveView(routeToView(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const sectors = data?.sectors ?? [];
  const selectedSector = sectors.find((sector) => sector.id === selectedSectorId) ?? sectors[0];
  const selectedNews = GEO_NEWS_FEED.find((news) => news.id === selectedNewsId) ?? GEO_NEWS_FEED[0];

  const navigateToNewsDashboard = () => {
    setActiveView("news");
    if (window.location.pathname !== NEWS_DASHBOARD_PATH) {
      window.history.pushState({}, "", NEWS_DASHBOARD_PATH);
    }
  };

  const navigateToLensDashboard = () => {
    setActiveView("lens");
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  };

  const navigateToFunds = () => {
    setActiveView("funds");
    if (window.location.pathname !== FUNDS_PATH) {
      window.history.pushState({}, "", FUNDS_PATH);
    }
  };

  const navigateToPortfolio = () => {
    setActiveView("portfolio");
    if (window.location.pathname !== PORTFOLIO_PATH) {
      window.history.pushState({}, "", PORTFOLIO_PATH);
    }
  };

  if (activeView === "funds") {
    return (
      <FundsScreen
        navigation={
          <GlobalBrandNav activeView="funds" onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />
        }
      />
    );
  }

  if (activeView === "portfolio") {
    return <PortfolioScreen onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />;
  }

  if (error) {
    return (
      <main className="app-shell error-shell">
        <div className="status-panel">
          <p className="eyebrow">API offline</p>
          <h1>Sovereign Lens cannot reach the intelligence feed.</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <div className="loading-panel">
          <span className="pulse-dot" />
          <p>Calibrating sovereign risk layers</p>
        </div>
      </main>
    );
  }

  if (activeView === "news") {
    return <EventsDashboard data={data} onBack={navigateToLensDashboard} />;
  }

  if (activeView === "article") {
    return (
      <NewsArticleView
        news={selectedNews}
        sectors={sectors}
        selectedSectorId={selectedSector?.id ?? selectedSectorId}
        onBack={navigateToLensDashboard}
        onOpenFeed={navigateToNewsDashboard}
        onSectorSelect={setSelectedSectorId}
      />
    );
  }

  return (
    <main className="app-shell global-monitor-app">
      <GlobalBrandNav activeView={activeView} onHome={navigateToLensDashboard} onFunds={navigateToFunds} onPortfolio={navigateToPortfolio} />
      <MarketTape basket={GLOBAL_MARKET_TAPE} />
      <GlobeMonitor />
    </main>
  );
}

export default App;
