import type { CSSProperties } from "react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../../app/GlobalBrandNav";
import type { Sector } from "../../types";
import { PREMIUM_ORANGE_THEME } from "./eventsData";
import type { GeotaggedNewsItem } from "./eventsTypes";
import { severityClass } from "./eventsUtils";

interface NewsArticleViewProps extends GlobalBrandNavHandlers {
  news: GeotaggedNewsItem;
  sectors: Sector[];
  selectedSectorId: string;
  onOpenFeed: () => void;
  onSectorSelect: (sectorId: string) => void;
}

export function NewsArticleView({
  news,
  sectors,
  selectedSectorId,
  onOpenFeed,
  onSectorSelect,
  ...navHandlers
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
      <GlobalBrandNav activeView="article" {...navHandlers} />

      <header className="news-article-contextbar">
        <p>Intelligence brief</p>
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

        <div className="news-article-brief-layout">
          <div className="news-article-body">
            <section>
              <h2>What happened</h2>
              <p>{news.summary}</p>
            </section>
            <section>
              <h2>Why it matters</h2>
              <p>{news.aiInsight}</p>
            </section>
            <section>
              <h2>Market read</h2>
              <p>{news.marketRead}</p>
            </section>
          </div>

          <aside className="news-article-impact-panel" aria-label="Evidence and exposure context">
            <span>Exposure path</span>
            <strong>{news.sectors[0]?.label ?? "Sector exposure"}</strong>
            <p>{news.marketRead}</p>
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
          </aside>
        </div>

        <section className="news-article-sectors" aria-label="Connected sectors">
          <h2>Affected sectors</h2>
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
        <div className="news-article-evidence-row">
          <span>{news.source}</span>
          <span>Source-limited</span>
          <span>Inspect exposure</span>
        </div>
      </article>
    </main>
  );
}
