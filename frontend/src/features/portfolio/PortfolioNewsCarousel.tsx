import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import type { PortfolioNewsCard } from "./portfolioTypes";

interface PortfolioNewsCarouselProps {
  items: PortfolioNewsCard[];
}

export function PortfolioNewsCarousel({ items }: PortfolioNewsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const activeItem = items[activeIndex];
  const showPreviousNews = () => setActiveIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length);
  const showNextNews = () => setActiveIndex((currentIndex) => (currentIndex + 1) % items.length);

  return (
    <section className="portfolio-news-carousel" aria-label="News affecting portfolio">
      <div className="portfolio-news-heading">
        <span>News Affecting Portfolio</span>
      </div>

      <div className="portfolio-news-stack" aria-live="polite">
        {items.map((item, index) => {
          const stackPosition = (index - activeIndex + items.length) % items.length;
          const visibleStackPosition = Math.min(stackPosition, 5);
          const isActive = stackPosition === 0;

          return (
            <article
              key={item.id}
              className={`portfolio-news-card stack-position-${visibleStackPosition}${isActive ? " is-active" : ""}`}
              aria-hidden={!isActive}
            >
              <div className="portfolio-news-copy">
                <p className="portfolio-news-impact">
                  <span>Impact: {item.impact}</span>
                  <Zap aria-hidden="true" />
                </p>
                <h3>{item.headline}</h3>
                <p className="portfolio-news-meta">
                  {item.source} <span aria-hidden="true">{"\u2022"}</span> {item.time}
                </p>
                <p className="portfolio-news-summary">{item.summary}</p>
                <div className="portfolio-news-tickers" aria-label={`Affected holdings: ${item.tickers.join(", ")}`}>
                  {item.tickers.map((ticker) => (
                    <span key={ticker}>{ticker}</span>
                  ))}
                </div>
                <div className="portfolio-news-footer">
                  <span>{item.severity}</span>
                  <i aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="portfolio-news-controls">
        <button type="button" aria-label="Previous portfolio news" onClick={showPreviousNews}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <div aria-label={`Portfolio news ${activeIndex + 1} of ${items.length}`}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              aria-label={`Show portfolio news ${index + 1}: ${item.headline}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <button type="button" aria-label="Next portfolio news" onClick={showNextNews}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <span className="portfolio-stack-sr-status">{`${activeItem.headline}, ${activeItem.severity}`}</span>
    </section>
  );
}
