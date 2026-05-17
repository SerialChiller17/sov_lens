import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../../app/GlobalBrandNav";
import { MARKET_DEVELOPMENTS } from "../portfolio/portfolioWorkspaceData";
import type { MarketDevelopment } from "../portfolio/portfolioWorkspaceData";

type AiAnswerViewProps = GlobalBrandNavHandlers;

function sourceInitials(name: string) {
  const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const initials = parts.length > 1 ? parts.slice(0, 2).map((part) => part[0]) : name.slice(0, 2).split("");
  return initials.join("").toUpperCase();
}

function faviconUrl(domain?: string) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function SourceChip({ source }: { source: MarketDevelopment["sources"][number] }) {
  const [hasImageError, setHasImageError] = useState(false);
  const iconUrl = faviconUrl(source.domain);
  const icon =
    iconUrl && !hasImageError ? <img src={iconUrl} alt="" loading="lazy" onError={() => setHasImageError(true)} /> : sourceInitials(source.name);

  const content = (
    <>
      <span aria-hidden="true">{icon}</span>
      {source.name}
    </>
  );

  if (!source.url) {
    return <span className="ai-answer-source-chip">{content}</span>;
  }

  return (
    <a className="ai-answer-source-chip" href={source.url} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function fallbackDevelopment(query: string, title: string, summary: string): MarketDevelopment {
  return {
    id: "ad-hoc-answer",
    title,
    summary,
    timeAgo: "Just now",
    sources: [],
    aiQuery: query,
    tone: "neutral",
    answer: {
      shortAnswer: summary || "This market question is ready for the AI answer service once a backend thread endpoint is connected.",
      lead:
        "This route is wired as the frontend handoff for AI answers. The current build can carry the query and context into the answer experience; a backend thread service can later replace this local explanatory fallback.",
      sections: [
        {
          title: "Market Context",
          body: query || "No query was provided with this answer route.",
        },
        {
          title: "Backend Hook Needed",
          body:
            "Connect this page to the production AI thread creation endpoint to generate live answers, citations, and follow-up messages from the submitted query.",
        },
      ],
    },
  };
}

function developmentFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event") ?? "";
  const query = params.get("q") ?? "";
  const title = params.get("title") ?? "Market AI answer";
  const summary = params.get("summary") ?? "";
  return MARKET_DEVELOPMENTS.find((item) => item.id === eventId) ?? fallbackDevelopment(query, title, summary);
}

export function AiAnswerView(navHandlers: AiAnswerViewProps) {
  const development = developmentFromLocation();
  const sourceCue = development.sources.length ? `Based on ${development.sources.length} sources` : "Source unavailable";

  return (
    <main className="ai-answer-shell" aria-label="AI synthesis">
      <GlobalBrandNav activeView="answer" {...navHandlers} />

      <header className="ai-answer-contextbar">
        <button type="button" onClick={navHandlers.onMarkets} aria-label="Back to Indian Markets">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Markets</span>
        </button>
        <div className="ai-answer-tabs" aria-label="AI answer mode">
          <strong>Synthesis</strong>
        </div>
      </header>

      <article className={`ai-answer-thread ${development.sources.length > 0 ? "has-sources" : "is-source-limited"}`}>
        <section className="ai-answer-prompt" aria-label="Submitted query">
          <span>Command</span>
          <p>{development.aiQuery || "No command supplied. Showing local synthesis fallback."}</p>
        </section>

        <section className="ai-answer-summary" aria-label="Short answer">
          <div className="ai-answer-summary-meta">
            <span>What matters now</span>
            <em>{sourceCue}</em>
          </div>
          <p>{development.answer.shortAnswer}</p>
        </section>

        <div className="ai-answer-body">
          <p className="ai-answer-lead">
            {development.answer.lead}{" "}
            {development.sources.length > 0 ? (
              <span className="ai-answer-inline-citations">
                {development.sources.slice(0, 2).map((source) => (
                  <em key={`${development.id}-${source.name}`}>{source.name}</em>
                ))}
              </span>
            ) : null}
          </p>

          {development.answer.sections.map((section) => (
            <section key={section.title} className="ai-answer-section">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.citations?.length ? (
                <div className="ai-answer-section-citations" aria-label={`${section.title} sources`}>
                  {section.citations.map((citation) => (
                    <em key={`${section.title}-${citation}`}>{citation}</em>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className="ai-answer-inspect-next" aria-label="Inspect next">
          <strong>Inspect next</strong>
          <div>
            <button type="button" onClick={navHandlers.onMarkets}>Review market context</button>
            <span>{sourceCue}</span>
            <span>Portfolio data local if used</span>
          </div>
        </section>

        {development.sources.length > 0 ? (
          <aside className="ai-answer-sources" aria-label="Sources">
            <h2>Sources</h2>
            <div>
              {development.sources.map((source) => (
                <SourceChip key={`${development.id}-${source.name}`} source={source} />
              ))}
            </div>
          </aside>
        ) : null}
      </article>
    </main>
  );
}
