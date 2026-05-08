export type AppView = "lens" | "news" | "article" | "markets" | "earnings" | "screener" | "funds" | "watchlist" | "portfolio";

export const NEWS_DASHBOARD_PATH = "/news-pulse";
export const NEWS_ARTICLE_PREFIX = `${NEWS_DASHBOARD_PATH}/`;
export const MARKETS_PATH = "/markets";
export const EARNINGS_PATH = "/earnings";
export const FUNDS_PATH = "/funds";
export const SCREENER_PATH = "/screener";
export const WATCHLIST_PATH = "/watchlist";
export const PORTFOLIO_PATH = "/portfolio";

export function routeToView(pathname: string): AppView {
  if (pathname.startsWith(NEWS_ARTICLE_PREFIX)) return "article";
  if (pathname === MARKETS_PATH) return "markets";
  if (pathname === EARNINGS_PATH) return "earnings";
  if (pathname === FUNDS_PATH) return "funds";
  if (pathname === SCREENER_PATH) return "screener";
  if (pathname === WATCHLIST_PATH) return "watchlist";
  if (pathname === PORTFOLIO_PATH) return "portfolio";
  return pathname === NEWS_DASHBOARD_PATH ? "news" : "lens";
}

export function newsArticlePath(newsId: string) {
  return `${NEWS_ARTICLE_PREFIX}${encodeURIComponent(newsId)}`;
}

export function newsIdFromArticlePath(pathname: string) {
  if (!pathname.startsWith(NEWS_ARTICLE_PREFIX)) return null;
  const encodedId = pathname.slice(NEWS_ARTICLE_PREFIX.length).split("/")[0];
  if (!encodedId) return null;

  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
}
