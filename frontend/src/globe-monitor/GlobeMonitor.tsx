import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe, { type Globe, type Marker } from "cobe";
import { InsightCompanion, dispatchInsightCompanionLookAt } from "../InsightCompanion";
import { MONITOR_EVENT_DETAILS } from "./mockDetails";
import { GLOBE_MONITOR_EVENTS, IMPACT_RANK, MONITOR_FILTERS } from "./mockEvents";
import type { GlobeMonitorEvent, MonitorEventCategory, MonitorEventDetail } from "./types";

type MonitorFilter = MonitorEventCategory | "All";

const INITIAL_SELECTED_EVENT_ID = "red-sea-shipping-risk";
const GLOBE_RADIUS = 0.875;
const LABEL_SAFE_TOP = 76;
const LABEL_SAFE_BOTTOM = 18;
const LABEL_SAFE_EDGE = 12;
const LABEL_BOX_WIDTH = 116;
const LABEL_BOX_HEIGHT = 38;
const HOTSPOT_SAFE_EDGE = 56;

interface ProjectedPosition {
  x: number;
  y: number;
  visible: boolean;
}

interface LabelAnchor {
  x: number;
  y: number;
}

function impactClass(impact: GlobeMonitorEvent["impact"]) {
  return impact.toLowerCase();
}

function compactRelativeTime(timestamp: string) {
  const normalized = timestamp.trim().toLowerCase().replace(/\s+/g, " ");
  const minuteMatch = normalized.match(/^(\d+)\s*(?:m|min|mins|minute|minutes)(?: ago)?$/);
  if (minuteMatch) return `${minuteMatch[1]}m`;

  const hourMatch = normalized.match(/^(\d+)\s*(?:h|hr|hrs|hour|hours)(?: ago)?$/);
  if (hourMatch) return `${hourMatch[1]}h`;

  const dayMatch = normalized.match(/^(\d+)\s*(?:d|day|days)(?: ago)?$/);
  if (dayMatch) return `${dayMatch[1]}d`;

  return timestamp.replace(/\s+ago$/i, "");
}

function relatedNewsCategoryLabel(category: MonitorEventCategory) {
  return category === "Conflict Zones" ? "Conflict" : category;
}

function markerSize(event: GlobeMonitorEvent, selectedIds: string[], hoveredId: string | null) {
  const baseSize = event.impact === "Critical" ? 0.052 : event.impact === "High" ? 0.042 : event.impact === "Elevated" ? 0.034 : 0.026;
  if (selectedIds.includes(event.id)) return baseSize + 0.018;
  if (event.id === hoveredId) return baseSize + 0.012;
  return baseSize;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = { width: Math.round(rect.width), height: Math.round(rect.height) };
      setSize((currentSize) =>
        currentSize.width === nextSize.width && currentSize.height === nextSize.height ? currentSize : nextSize,
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);
    window.visualViewport?.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
      window.visualViewport?.removeEventListener("resize", updateSize);
    };
  }, []);

  return { ref, size };
}

function useDevicePixelRatio() {
  const readPixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  const [pixelRatio, setPixelRatio] = useState(readPixelRatio);

  useEffect(() => {
    let frame = 0;

    const updatePixelRatio = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextPixelRatio = readPixelRatio();
        setPixelRatio((currentPixelRatio) => (currentPixelRatio === nextPixelRatio ? currentPixelRatio : nextPixelRatio));
      });
    };

    updatePixelRatio();
    window.addEventListener("resize", updatePixelRatio);
    window.visualViewport?.addEventListener("resize", updatePixelRatio);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePixelRatio);
      window.visualViewport?.removeEventListener("resize", updatePixelRatio);
    };
  }, []);

  return pixelRatio;
}

function sortByPriority(a: GlobeMonitorEvent, b: GlobeMonitorEvent) {
  const impactDelta = IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact];
  if (impactDelta !== 0) return impactDelta;
  return a.priority - b.priority;
}

function locationVector(lat: number, lng: number) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  return [-cosLat * Math.cos(lngRad), Math.sin(latRad), cosLat * Math.sin(lngRad)] as const;
}

function projectLocation(
  event: GlobeMonitorEvent,
  width: number,
  height: number,
  phi: number,
  theta: number,
  scale: number,
): ProjectedPosition {
  const [vx, vy, vz] = locationVector(event.lat, event.lng);
  const x0 = vx * GLOBE_RADIUS;
  const y0 = vy * GLOBE_RADIUS;
  const z0 = vz * GLOBE_RADIUS;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const aspect = width / Math.max(height, 1);
  const projectedX = cosPhi * x0 + sinPhi * z0;
  const projectedY = sinPhi * sinTheta * x0 + cosTheta * y0 - cosPhi * sinTheta * z0;
  const depth = -sinPhi * cosTheta * x0 + sinTheta * y0 + cosPhi * cosTheta * z0;

  return {
    x: ((projectedX / aspect) * scale + 1) * 0.5 * width,
    y: (-projectedY * scale + 1) * 0.5 * height,
    visible: depth > -0.04,
  };
}

function projectEvents(events: GlobeMonitorEvent[], width: number, height: number, phi: number, theta: number, scale: number) {
  return Object.fromEntries(events.map((event) => [event.id, projectLocation(event, width, height, phi, theta, scale)]));
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function globeRenderScale(width: number, height: number) {
  const minSide = Math.min(width, height);
  const haloGuardPx = clampNumber(minSide * 0.05, 36, 58);
  const safeBodyRadius = 1 - (haloGuardPx * 2) / Math.max(minSide, 1);
  return clampNumber(safeBodyRadius / 0.8, 1.04, 1.18);
}

function maxVisibleLabels(stageSize: { width: number; height: number }) {
  const minSide = Math.min(stageSize.width, stageSize.height);
  if (minSide < 620) return 5;
  if (minSide < 760) return 7;
  if (minSide < 980) return 9;
  return 11;
}

function labelAnchor(event: GlobeMonitorEvent, position: ProjectedPosition, stageSize: { width: number; height: number }): LabelAnchor {
  const preferredX = position.x + (event.labelOffset?.x ?? 0);
  const preferredY = position.y - LABEL_BOX_HEIGHT + (event.labelOffset?.y ?? 0);
  const halfWidth = LABEL_BOX_WIDTH / 2;
  const halfHeight = LABEL_BOX_HEIGHT / 2;

  return {
    x: clampNumber(preferredX, LABEL_SAFE_EDGE + halfWidth, stageSize.width - LABEL_SAFE_EDGE - halfWidth),
    y: clampNumber(preferredY, LABEL_SAFE_TOP + halfHeight, stageSize.height - LABEL_SAFE_BOTTOM - halfHeight),
  };
}

function labelCollisionScore(event: GlobeMonitorEvent, selectedIds: string[], hoveredId: string | null) {
  if (selectedIds.includes(event.id)) return -100;
  if (event.id === hoveredId) return -90;
  return event.priority * 10 - IMPACT_RANK[event.impact];
}

function labelsOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function GlobeHotspotLayer({
  events,
  selectedEventIds,
  hoveredEventId,
  onHover,
  onToggle,
}: {
  events: GlobeMonitorEvent[];
  selectedEventIds: string[];
  hoveredEventId: string | null;
  onHover: (id: string | null) => void;
  onToggle: (event: GlobeMonitorEvent) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<Globe | null>(null);
  const phiRef = useRef(-0.78);
  const pointerStartRef = useRef<number | null>(null);
  const dragStartPhiRef = useRef(0);
  const isPointerActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const [projectedPositions, setProjectedPositions] = useState<Record<string, ProjectedPosition>>({});
  const { ref: stageRef, size } = useElementSize<HTMLDivElement>();
  const pixelRatio = useDevicePixelRatio();

  const visibleLabelEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        labelCollisionScore(a, selectedEventIds, hoveredEventId) - labelCollisionScore(b, selectedEventIds, hoveredEventId) ||
        sortByPriority(a, b),
    );

    if (size.width <= 0 || size.height <= 0 || Object.keys(projectedPositions).length === 0) {
      return sorted.filter((event) => event.priority <= 2 || selectedEventIds.includes(event.id) || event.id === hoveredEventId).slice(0, 8);
    }

    const accepted: GlobeMonitorEvent[] = [];
    const occupied: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    const labelLimit = maxVisibleLabels(size);
    const collisionPadding = size.width < 760 ? 12 : 8;

    for (const event of sorted) {
      const isPinned = selectedEventIds.includes(event.id) || event.id === hoveredEventId;
      const position = projectedPositions[event.id];

      if (!position?.visible) continue;
      if (!isPinned && event.priority > 2 && accepted.length >= labelLimit) continue;

      const anchor = labelAnchor(event, position, size);
      const halfWidth = LABEL_BOX_WIDTH / 2 + collisionPadding;
      const halfHeight = LABEL_BOX_HEIGHT / 2 + collisionPadding;
      const rect = {
        left: anchor.x - halfWidth,
        right: anchor.x + halfWidth,
        top: anchor.y - halfHeight,
        bottom: anchor.y + halfHeight,
      };

      if (!isPinned && occupied.some((existingRect) => labelsOverlap(rect, existingRect))) continue;

      accepted.push(event);
      occupied.push(rect);

      if (accepted.length >= labelLimit && !sorted.some((candidate) => selectedEventIds.includes(candidate.id) && !accepted.includes(candidate))) {
        break;
      }
    }

    return accepted;
  }, [events, hoveredEventId, projectedPositions, selectedEventIds, size]);

  const markers = useMemo<Marker[]>(
    () =>
      events.map((event) => ({
        id: event.id,
        location: [event.lat, event.lng],
        size: markerSize(event, selectedEventIds, hoveredEventId),
        color: selectedEventIds.includes(event.id) || event.id === hoveredEventId ? [1, 0.94, 0.78] : [0.92, 0.86, 0.68],
      })),
    [events, hoveredEventId, selectedEventIds],
  );

  const eventsRef = useRef(events);
  const markersRef = useRef(markers);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width < 120 || size.height < 120) return;

    let frame = 0;
    let frameCount = 0;
    let width = size.width;
    let height = size.height;
    const theta = size.width < 720 ? 0.18 : 0.25;
    const scale = globeRenderScale(width, height);

    const globe = createGlobe(canvas, {
      width,
      height,
      devicePixelRatio: pixelRatio,
      phi: phiRef.current,
      theta,
      dark: 1,
      diffuse: 1.35,
      mapSamples: size.width < 720 ? 15000 : 30000,
      mapBrightness: 12.8,
      mapBaseBrightness: 0.018,
      baseColor: [0.12, 0.115, 0.1],
      markerColor: [0.96, 0.9, 0.72],
      glowColor: [0.86, 0.82, 0.68],
      markerElevation: 0.075,
      opacity: 0.96,
      scale,
      offset: [0, 0],
      markers: markersRef.current,
      context: {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      },
    });

    globeRef.current = globe;

    const render = () => {
      if (!isPointerActiveRef.current && !isPausedRef.current) {
        phiRef.current += 0.0016;
      }
      frameCount += 1;

      globe.update({
        width,
        height,
        phi: phiRef.current,
        theta,
        scale,
        offset: [0, 0],
        markers: markersRef.current,
      });

      if (frameCount % 2 === 0) {
        setProjectedPositions(projectEvents(eventsRef.current, width, height, phiRef.current, theta, scale));
      }

      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      globe.destroy();
      if (globeRef.current === globe) globeRef.current = null;
    };
  }, [pixelRatio, size.height, size.width]);

  const directCompanionTowardGlobe = (target: HTMLDivElement, clientX?: number, clientY?: number, duration = 60000) => {
    const rect = target.getBoundingClientRect();
    dispatchInsightCompanionLookAt({
      clientX: clientX ?? rect.left + rect.width * 0.5,
      clientY: clientY ?? rect.top + rect.height * 0.5,
      duration,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = event.clientX;
    dragStartPhiRef.current = phiRef.current;
    isPointerActiveRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartRef.current === null) return;
    const delta = event.clientX - pointerStartRef.current;
    phiRef.current = dragStartPhiRef.current + delta / 260;
  };

  const endPointerInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = null;
    isPointerActiveRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={stageRef}
      className="monitor-globe-stage"
      onMouseEnter={(event) => {
        isPausedRef.current = true;
        directCompanionTowardGlobe(event.currentTarget);
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
        onHover(null);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointerInteraction}
      onPointerCancel={endPointerInteraction}
    >
      <canvas ref={canvasRef} className="monitor-globe-canvas" aria-label="Dotted global intelligence globe" />
      <div className="monitor-hotspot-overlay" aria-label="Global intelligence hotspots">
        {events.map((event) => (
          <button
            key={`target-${event.id}`}
            type="button"
            className={[
              "monitor-hotspot-target",
              `impact-${impactClass(event.impact)}`,
              selectedEventIds.includes(event.id) ? "is-selected" : "",
              event.id === hoveredEventId ? "is-hovered" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={hotspotPositionStyle(event, projectedPositions[event.id], size)}
            aria-label={`Open event details: ${event.title}`}
            aria-pressed={selectedEventIds.includes(event.id)}
            onClick={() => onToggle(event)}
            onMouseEnter={() => onHover(event.id)}
            onMouseLeave={() => onHover(null)}
          >
            <span aria-hidden="true" />
          </button>
        ))}

        {visibleLabelEvents.map((event) => (
          <button
            key={`label-${event.id}`}
            type="button"
            className={[
              "monitor-floating-label",
              `impact-${impactClass(event.impact)}`,
              `priority-${event.priority}`,
              selectedEventIds.includes(event.id) ? "is-selected" : "",
              event.id === hoveredEventId ? "is-hovered" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={labelPositionStyle(event, projectedPositions[event.id], size)}
            aria-pressed={selectedEventIds.includes(event.id)}
            onClick={() => onToggle(event)}
            onMouseEnter={() => onHover(event.id)}
            onMouseLeave={() => onHover(null)}
          >
            <strong>{event.label}</strong>
            <small>{event.impact}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function hotspotPositionStyle(
  event: GlobeMonitorEvent,
  position: ProjectedPosition | undefined,
  stageSize?: { width: number; height: number },
) {
  const hasSafeStage = Boolean(stageSize && stageSize.width > HOTSPOT_SAFE_EDGE * 2 && stageSize.height > HOTSPOT_SAFE_EDGE * 2);
  const safeX = position && hasSafeStage ? clampNumber(position.x, HOTSPOT_SAFE_EDGE, stageSize!.width - HOTSPOT_SAFE_EDGE) : position?.x;
  const safeY = position && hasSafeStage ? clampNumber(position.y, HOTSPOT_SAFE_EDGE, stageSize!.height - HOTSPOT_SAFE_EDGE) : position?.y;

  return {
    "--anchor-visible": `${position?.visible === false ? 0 : 0.98}`,
    "--screen-x": typeof safeX === "number" ? `${safeX.toFixed(2)}px` : undefined,
    "--screen-y": typeof safeY === "number" ? `${safeY.toFixed(2)}px` : undefined,
    "--fallback-x": `${event.fallbackPosition?.x ?? 50}%`,
    "--fallback-y": `${event.fallbackPosition?.y ?? 50}%`,
    "--label-x": `${event.labelOffset?.x ?? 0}px`,
    "--label-y": `${event.labelOffset?.y ?? 0}px`,
  } as React.CSSProperties & Record<string, string | undefined>;
}

function labelPositionStyle(
  event: GlobeMonitorEvent,
  position: ProjectedPosition | undefined,
  stageSize: { width: number; height: number },
) {
  if (!position || stageSize.width <= 0 || stageSize.height <= 0) {
    return hotspotPositionStyle(event, position);
  }

  const anchor = labelAnchor(event, position, stageSize);

  return {
    "--anchor-visible": `${position.visible === false ? 0 : 0.98}`,
    "--screen-x": `${anchor.x.toFixed(2)}px`,
    "--screen-y": `${anchor.y.toFixed(2)}px`,
    "--fallback-x": `${event.fallbackPosition?.x ?? 50}%`,
    "--fallback-y": `${event.fallbackPosition?.y ?? 50}%`,
  } as React.CSSProperties & Record<string, string | undefined>;
}

function SelectedEventPanel({ event, detail }: { event: GlobeMonitorEvent | null; detail: MonitorEventDetail | null }) {
  if (!event || !detail) return null;

  return (
    <article className="monitor-selected-news-panel" aria-label="Selected globe news panel">
      <img src={detail.imageUrl} alt="" />
      <div>
        <span>
          {event.country} / {event.impact}
        </span>
        <h2>{event.title}</h2>
        <p>{event.headline}</p>
      </div>
    </article>
  );
}

function IntelligencePanel({
  activeEvent,
  activeDetail,
  activeFilter,
  onFilterChange,
}: {
  activeEvent: GlobeMonitorEvent | null;
  activeDetail: MonitorEventDetail | null;
  activeFilter: MonitorFilter;
  onFilterChange: (filter: MonitorFilter) => void;
}) {
  const filterOptions = useMemo(() => ["All", ...MONITOR_FILTERS] as MonitorFilter[], []);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isScrollCueEnabled, setIsScrollCueEnabled] = useState(false);
  const aiHudRef = useRef<HTMLElement | null>(null);

  const selectFilter = (filter: MonitorFilter) => {
    onFilterChange(filter);
    setIsFilterMenuOpen(false);
  };

  useEffect(() => {
    const aiHud = aiHudRef.current;
    if (!aiHud) return;

    const updateScrollCue = () => {
      setIsScrollCueEnabled(aiHud.scrollHeight - aiHud.clientHeight - aiHud.scrollTop > 2);
    };

    updateScrollCue();
    aiHud.addEventListener("scroll", updateScrollCue, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateScrollCue);
      observer.observe(aiHud);
      Array.from(aiHud.children).forEach((child) => observer?.observe(child));
    }

    const frame = window.requestAnimationFrame(updateScrollCue);

    return () => {
      window.cancelAnimationFrame(frame);
      aiHud.removeEventListener("scroll", updateScrollCue);
      observer?.disconnect();
    };
  }, [activeDetail]);

  const scrollAiHudDown = () => {
    const aiHud = aiHudRef.current;
    if (!aiHud) return;

    aiHud.scrollBy({
      top: Math.max(aiHud.clientHeight * 0.72, 220),
      behavior: "smooth",
    });
  };

  return (
    <aside className="monitor-intelligence-panel" aria-label="Global intelligence monitor panel">
      <section className="monitor-filter-card" aria-label="Category filter">
        <div className="monitor-filter-shell">
          <button
            type="button"
            className={[
              "monitor-filter-trigger",
              activeFilter !== "All" ? "is-active" : "",
              isFilterMenuOpen ? "is-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-expanded={isFilterMenuOpen}
            aria-haspopup="menu"
            aria-label="Filter"
            onClick={() => setIsFilterMenuOpen((isOpen) => !isOpen)}
          >
            <span className="monitor-filter-name">Filter</span>
            <span className="monitor-filter-chevron" aria-hidden="true" />
          </button>
          <div className="monitor-filter-menu" role="menu" hidden={!isFilterMenuOpen}>
            {filterOptions.map((filter) => (
              <button
                key={filter}
                type="button"
                className={filter === activeFilter ? "is-active" : undefined}
                role="menuitemradio"
                aria-checked={filter === activeFilter}
                onClick={() => selectFilter(filter)}
                title={filter}
              >
                <span className="monitor-filter-name">{filter}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section ref={aiHudRef} className="monitor-ai-hud" aria-label="Sovereign AI analysis">
        <div className="monitor-ai-header">
          <div className="monitor-ai-title-row">
            <h2>sovereign AI</h2>
            <InsightCompanion />
          </div>
        </div>

        <div className="monitor-ai-response" aria-label="AI response">
          {activeEvent && activeDetail ? (
            <>
              <p>{activeDetail.aiInsight}</p>
              <p>
                Watch {activeEvent.watchlist.join(", ").toLowerCase()} as the near-term confirmation set for {activeEvent.country}.
              </p>
            </>
          ) : (
            <p>Select a globe card to open a news panel and generate a market-impact readout.</p>
          )}
        </div>

        {activeEvent && activeDetail ? (
          <>
            <section className="monitor-impact-grid" aria-label="Most affected sectors and stocks">
              <div>
                <span>Most Affected Sectors</span>
                <div className="monitor-impact-list">
                  {activeDetail.affectedSectors.map((sector) => (
                    <article key={`${activeEvent.id}-${sector.label}`}>
                      <strong>{sector.label}</strong>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <span>Most Affected Stocks</span>
                <div className="monitor-impact-list">
                  {activeDetail.affectedStocks.map((stock) => (
                    <article key={`${activeEvent.id}-${stock.ticker}`}>
                      <strong>
                        {stock.ticker}
                        <span>{stock.name}</span>
                      </strong>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="monitor-suggested-plays" aria-label="Suggested plays">
              <span>Suggested Plays</span>
              <div>
                {activeDetail.suggestedPlays.map((play) => (
                  <button key={play.id} type="button" aria-label={`Suggested play: ${play.title}`}>
                    <strong>{play.title}</strong>
                    <p>{play.thesis}</p>
                    <small>
                      <span>{play.assetType}</span>
                      <span>{play.horizon}</span>
                      <span>{play.confidence}</span>
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className="monitor-related-news" aria-label="Related news">
              <span>Related News</span>
              <div>
                {activeDetail.relatedNews.slice(0, 2).map((item) => (
                  <article key={item.id}>
                    <time className="monitor-related-time">{compactRelativeTime(item.timestamp)}</time>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                    <small className="monitor-related-meta">
                      <span>{item.source}</span>
                      <span>{relatedNewsCategoryLabel(activeEvent.category)}</span>
                    </small>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>

      <button
        type="button"
        className="monitor-scroll-cue"
        aria-label="Scroll Sovereign AI panel down"
        aria-hidden={!isScrollCueEnabled}
        disabled={!isScrollCueEnabled}
        tabIndex={isScrollCueEnabled ? 0 : -1}
        onClick={scrollAiHudDown}
      >
        <span />
      </button>
    </aside>
  );
}

export function GlobeMonitor() {
  const [activeFilter, setActiveFilter] = useState<MonitorFilter>("All");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([INITIAL_SELECTED_EVENT_ID]);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const visibleEvents = useMemo(
    () =>
      activeFilter === "All"
        ? GLOBE_MONITOR_EVENTS
        : GLOBE_MONITOR_EVENTS.filter((event) => event.category === activeFilter),
    [activeFilter],
  );

  const selectedEvents = useMemo(
    () =>
      selectedEventIds
        .map((id) => GLOBE_MONITOR_EVENTS.find((event) => event.id === id))
        .filter((event): event is GlobeMonitorEvent => Boolean(event)),
    [selectedEventIds],
  );
  const activeEvent = selectedEvents[selectedEvents.length - 1] ?? null;
  const activeDetail = activeEvent ? MONITOR_EVENT_DETAILS[activeEvent.id] : null;

  const toggleEvent = (event: GlobeMonitorEvent) => {
    setSelectedEventIds((currentIds) =>
      currentIds.includes(event.id) ? currentIds.filter((id) => id !== event.id) : [...currentIds, event.id],
    );
    setHoveredEventId(null);
  };

  const changeFilter = (filter: MonitorFilter) => {
    setActiveFilter(filter);
    const nextEvents = filter === "All" ? GLOBE_MONITOR_EVENTS : GLOBE_MONITOR_EVENTS.filter((event) => event.category === filter);
    const nextEventIds = new Set(nextEvents.map((event) => event.id));
    setSelectedEventIds((currentIds) => currentIds.filter((id) => nextEventIds.has(id)));
  };

  return (
    <section className="global-monitor-shell" aria-label="Global Intelligence Monitor">
      <div className="monitor-background-grid" aria-hidden="true" />
      <div className="monitor-globe-zone">
        <GlobeHotspotLayer
          events={visibleEvents}
          selectedEventIds={selectedEventIds}
          hoveredEventId={hoveredEventId}
          onHover={setHoveredEventId}
          onToggle={toggleEvent}
        />
        <SelectedEventPanel event={activeEvent} detail={activeDetail} />
      </div>

      <IntelligencePanel
        activeEvent={activeEvent}
        activeDetail={activeDetail}
        activeFilter={activeFilter}
        onFilterChange={changeFilter}
      />
    </section>
  );
}
