import { useMemo, type CSSProperties } from "react";
import { GlobalBrandNav, type GlobalBrandNavHandlers } from "../../app/GlobalBrandNav";
import globeTextureUrl from "../../assets/globe-premium-dark.svg";
import type { BootstrapData, PulseAlert } from "../../types";
import { EVENT_ARCHIVE_ROWS, HORIZON_EVENTS, PREMIUM_ORANGE_THEME } from "./eventsData";
import type { EventArchiveRow } from "./eventsTypes";
import { formatAlertAge } from "./eventsUtils";

interface EventsDashboardProps extends GlobalBrandNavHandlers {
  data: BootstrapData;
}

function archiveRowFromAlert(alert: PulseAlert, index: number): EventArchiveRow {
  const locationByRegion: Record<string, string> = {
    "Taiwan Strait": "Taipei / Strait",
    "Persian Gulf": "Hormuz corridor",
    "US, EU, China": "Washington / Brussels",
  };
  const leaderByRegion: Record<string, string> = {
    "Taiwan Strait": "Regional commands",
    "Persian Gulf": "Shipping insurers",
    "US, EU, China": "Trade regulators",
  };

  return {
    id: `live-${alert.id}`,
    eventType: alert.severity === "High Risk" ? "Security Flash" : index % 2 === 0 ? "Policy Shift" : "Market Signal",
    region: alert.region,
    location: locationByRegion[alert.region] ?? alert.region,
    leaders: leaderByRegion[alert.region] ?? "Analyst desk",
    impact: alert.impact,
    dateOccurred: formatAlertAge(alert.age_minutes),
    live: true,
  };
}

export function EventsDashboard({ data, ...navHandlers }: EventsDashboardProps) {
  const archiveRows = useMemo(
    () => [...data.globalPulse.alerts.map(archiveRowFromAlert), ...EVENT_ARCHIVE_ROWS],
    [data.globalPulse.alerts],
  );

  return (
    <main
      className="events-dashboard-shell"
      style={
        {
          "--accent": PREMIUM_ORANGE_THEME.accent,
          "--accent-rgb": PREMIUM_ORANGE_THEME.rgb,
          "--accent-on": PREMIUM_ORANGE_THEME.onAccent,
        } as CSSProperties
      }
    >
      <GlobalBrandNav activeView="news" {...navHandlers} />

      <header className="events-dashboard-contextbar">
        <p>Worldwide event analysis</p>
        <label className="events-search">
          <span className="sr-only">Search events, regions, or topics</span>
          <input type="search" placeholder="Search events, regions, or topics..." />
          <span className="events-search-icon" aria-hidden="true" />
        </label>
      </header>

      <section className="events-panel events-history-panel" aria-label="Upcoming events">
        <div>
          <h2>Upcoming Events</h2>
          <p>Significant global political or economic milestones to watch next</p>
        </div>
        <div className="upcoming-events-list">
          {HORIZON_EVENTS.map((event) => (
            <article key={event.id} className="upcoming-event-card">
              <time>{event.date}</time>
              <strong>{event.label}</strong>
              <small>{event.location}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="events-globe-stage" aria-label="Global events map">
        <div className="events-globe">
          <div className="events-globe-map" style={{ backgroundImage: `url(${globeTextureUrl})` }} />
          <span className="events-map-node node-north-america" aria-hidden="true" />
          <span className="events-map-node node-caribbean" aria-hidden="true" />
          <span className="events-map-node node-south-america" aria-hidden="true" />
          <span className="events-map-node node-atlantic" aria-hidden="true" />
          <span className="events-map-node node-europe" aria-hidden="true" />
          <span className="events-map-node node-asia" aria-hidden="true" />
        </div>
        <article className="events-map-callout">
          <time>Nov 10, 2024</time>
          <h1>G20 Summit: Climate Deal Reached</h1>
          <p>Rio de Janeiro, Brazil</p>
        </article>
      </section>

      <section className="events-panel events-archive-panel" aria-label="Global event archive">
        <header>
          <div>
            <h2>Global Event Archive</h2>
            <p>A comprehensive list of recent global events, from diplomatic summits to natural disasters</p>
          </div>
          <div className="archive-sort-controls" aria-label="Archive sort order">
            <button type="button">Newest</button>
            <button type="button">Oldest</button>
          </div>
        </header>

        <div className="events-table-wrap">
          <table>
            <caption className="sr-only">Global event archive</caption>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Region</th>
                <th>Location</th>
                <th>Key Leaders</th>
                <th>Impact Level</th>
                <th>Date Occurred</th>
              </tr>
            </thead>
            <tbody>
              {archiveRows.map((row) => (
                <tr key={row.id} className={row.live ? "is-live" : undefined}>
                  <td>{row.eventType}</td>
                  <td>{row.region}</td>
                  <td>{row.location}</td>
                  <td>{row.leaders}</td>
                  <td>{row.impact}</td>
                  <td>{row.dateOccurred}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
