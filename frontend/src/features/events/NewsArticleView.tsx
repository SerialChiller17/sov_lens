import type { CSSProperties } from "react";
import type { Sector } from "../../types";
import { PREMIUM_ORANGE_THEME } from "./eventsData";
import type { GeotaggedNewsItem } from "./eventsTypes";
import { severityClass } from "./eventsUtils";

interface NewsArticleViewProps {
  news: GeotaggedNewsItem;
  sectors: Sector[];
  selectedSectorId: string;
  onBack: () => void;
  onOpenFeed: () => void;
  onSectorSelect: (sectorId: string) => void;
}

export function NewsArticleView({
  news,
  sectors,
  selectedSectorId,
  onBack,
  onOpenFeed,
  onSectorSelect,
}: NewsArticleViewProps) {
  const knownSectors = new Set(sectors.map((sector) => sector.id));

  return (
    <main
      className="news-article-shell"
      style={
        {
          "--accent": PREMIUM_ORANGE_THEME.accent,
          "--accent-rgb": PREMIUM_ORANGE_THEME.rgb,
          "--accent-on": PREMIUM_ORANGE_THEME.onAccent,
        } as CSSProperties
      }
    >
      <header className="news-article-topbar">
        <button type="button" className="events-wordmark" onClick={onBack}>
          <span>Sovereign</span>
          <strong>Lens</strong>
        </button>
        <span className="events-topbar-rule" aria-hidden="true" />
        <p>Full news article</p>
        <button type="button" className="events-back-button" onClick={onOpenFeed}>
          News Feed
        </button>
      </header>

      <article className={`news-article-card severity-${severityClass(news.severity)}`}>
        <div className="news-article-kicker">
          <span>{news.region}</span>
          <time>{news.time}</time>
          <strong>{news.severity}</strong>
        </div>
        <h1>{news.title}</h1>
        <p className="news-article-location">{news.location}</p>

        <div className="news-article-body">
          <p>{news.summary}</p>
          <p>{news.aiInsight}</p>
          <p>{news.marketRead}</p>
        </div>

        <dl className="news-article-facts">
          <div>
            <dt>Source</dt>
            <dd>{news.source}</dd>
          </div>
          <div>
            <dt>Geotag</dt>
            <dd>
              {news.lat.toFixed(1)}, {news.lng.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt>Conflict link</dt>
            <dd>{news.conflictId.split("-").join(" ")}</dd>
          </div>
        </dl>

        <section className="news-article-sectors" aria-label="Connected sectors">
          <h2>Connected sectors</h2>
          <div>
            {news.sectors.map((sector) => (
              <button
                key={`${news.id}-${sector.id}`}
                type="button"
                className={sector.id === selectedSectorId ? "is-active" : undefined}
                onClick={() => {
                  if (knownSectors.has(sector.id)) onSectorSelect(sector.id);
                }}
              >
                <strong>{sector.label}</strong>
                <span>{sector.signal}</span>
              </button>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
