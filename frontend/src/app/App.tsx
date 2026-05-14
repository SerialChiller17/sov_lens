import { useEffect, useState } from "react";
import { getBootstrapData } from "../api";
import { GLOBAL_MARKET_TAPE } from "../features/market-tape/marketTapeData";
import { MarketTape } from "../features/market-tape/MarketTape";
import { AiAnswerView } from "../features/answer/AiAnswerView";
import { EventsDashboard } from "../features/events/EventsDashboard";
import { DEFAULT_NEWS_ID, GEO_NEWS_FEED } from "../features/events/eventsData";
import { NewsArticleView } from "../features/events/NewsArticleView";
import { EarningsScreen, IndianMarketsScreen, PortfolioScreen, ScreenerScreen, WatchlistScreen } from "../features/portfolio/PortfolioScreen";
import { FundsScreen } from "../funds/FundsScreen";
import { GlobeMonitor } from "../globe-monitor/GlobeMonitor";
import type { BootstrapData } from "../types";
import { GlobalBrandNav } from "./GlobalBrandNav";
import {
  ANSWER_PATH,
  EARNINGS_PATH,
  FUNDS_PATH,
  MARKETS_PATH,
  newsIdFromArticlePath,
  PORTFOLIO_PATH,
  routeToView,
  NEWS_DASHBOARD_PATH,
  SCREENER_PATH,
  WATCHLIST_PATH,
} from "./routes";

function App() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState("semiconductors");
  const [selectedNewsId, setSelectedNewsId] = useState(() => newsIdFromArticlePath(window.location.pathname) ?? DEFAULT_NEWS_ID);
  const [activeView, setActiveView] = useState(() => routeToView(window.location.pathname));

  useEffect(() => {
    if (["answer", "markets", "earnings", "screener", "funds", "watchlist", "portfolio"].includes(activeView) || data) return;

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

  const navigateToMarkets = () => {
    setActiveView("markets");
    if (window.location.pathname !== MARKETS_PATH) {
      window.history.pushState({}, "", MARKETS_PATH);
    }
  };

  const navigateToEarnings = (query?: string) => {
    const trimmedQuery = query?.trim() ?? "";
    const nextPath = trimmedQuery ? `${EARNINGS_PATH}?q=${encodeURIComponent(trimmedQuery)}` : EARNINGS_PATH;

    setActiveView("earnings");
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  const navigateToFunds = () => {
    setActiveView("funds");
    if (window.location.pathname !== FUNDS_PATH) {
      window.history.pushState({}, "", FUNDS_PATH);
    }
  };

  const navigateToScreener = (query?: string) => {
    const trimmedQuery = query?.trim() ?? "";
    const nextPath = trimmedQuery ? `${SCREENER_PATH}?q=${encodeURIComponent(trimmedQuery)}` : SCREENER_PATH;

    setActiveView("screener");
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  const navigateToWatchlist = () => {
    setActiveView("watchlist");
    if (window.location.pathname !== WATCHLIST_PATH) {
      window.history.pushState({}, "", WATCHLIST_PATH);
    }
  };

  const navigateToPortfolio = () => {
    setActiveView("portfolio");
    if (window.location.pathname !== PORTFOLIO_PATH) {
      window.history.pushState({}, "", PORTFOLIO_PATH);
    }
  };

  const navigateToAnswer = ({ id, query, title, summary }: { id?: string; query: string; title?: string; summary?: string }) => {
    const params = new URLSearchParams();
    if (id) params.set("event", id);
    if (query.trim()) params.set("q", query.trim());
    if (title?.trim()) params.set("title", title.trim());
    if (summary?.trim()) params.set("summary", summary.trim());
    const nextPath = `${ANSWER_PATH}?${params.toString()}`;

    setActiveView("answer");
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  const financeNavigation = {
    onHome: navigateToLensDashboard,
    onMarkets: navigateToMarkets,
    onEarnings: navigateToEarnings,
    onFunds: navigateToFunds,
    onScreener: navigateToScreener,
    onWatchlist: navigateToWatchlist,
    onPortfolio: navigateToPortfolio,
    onAnswer: navigateToAnswer,
  };

  if (activeView === "markets") {
    return <IndianMarketsScreen {...financeNavigation} />;
  }

  if (activeView === "earnings") {
    return (
      <EarningsScreen
        initialQuery={new URLSearchParams(window.location.search).get("q") ?? ""}
        {...financeNavigation}
      />
    );
  }

  if (activeView === "funds") {
    return (
      <FundsScreen
        navigation={<GlobalBrandNav activeView="funds" {...financeNavigation} />}
      />
    );
  }

  if (activeView === "screener") {
    return (
      <ScreenerScreen
        initialQuery={new URLSearchParams(window.location.search).get("q") ?? ""}
        {...financeNavigation}
      />
    );
  }

  if (activeView === "watchlist") {
    return <WatchlistScreen {...financeNavigation} />;
  }

  if (activeView === "portfolio") {
    return <PortfolioScreen {...financeNavigation} />;
  }

  if (activeView === "answer") {
    return <AiAnswerView onBackToMarkets={navigateToMarkets} />;
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
      <GlobalBrandNav
        activeView={activeView}
        {...financeNavigation}
      />
      <MarketTape basket={GLOBAL_MARKET_TAPE} />
      <GlobeMonitor />
    </main>
  );
}

export default App;
