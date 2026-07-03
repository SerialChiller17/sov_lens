import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { BootstrapData } from "./types";

const financeFinishCss = readFileSync("src/styles/finance-finish.css", "utf8");
const marketTapeCss = readFileSync("src/features/market-tape/MarketTape.css", "utf8");
const designDoc = readFileSync("../DESIGN.md", "utf8");

vi.mock("cobe", () => ({
  default: vi.fn(() => ({
    update: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("@paper-design/shaders", () => ({
  liquidMetalFragmentShader: "void main() {}",
  ShaderMount: vi.fn(() => ({
    dispose: vi.fn(),
    setSpeed: vi.fn(),
  })),
}));

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

const bootstrap: BootstrapData = {
  countries: [
    {
      iso3: "IND",
      iso_numeric: "356",
      name: "India",
      flag: "https://flagcdn.com/in.svg",
      capital: "New Delhi",
      coordinates: { lat: 28.6, lng: 77.2 },
      gdp_usd_bn: 3940,
      population_mn: 1428.6,
      gdp_growth_pct: 6.8,
      gdp_per_capita_usd: 2730,
      gini: 35.7,
      tension_score: 4.9,
      tension_label: "Developing",
      tension_breakdown: {
        structural: 4.4,
        sentiment: 5.2,
        live_trigger: 5.1,
        last_structural_update: "March 2026",
        last_sentiment_update: "April 13, 2026",
      },
      groups: ["G20", "BRICS+", "QUAD"],
      industry_criticality: ["Digital public infrastructure"],
      trade_partners: [
        { iso3: "USA", name: "United States", flow: "export", share: 17.8, thesis: "Services" },
        { iso3: "CHN", name: "China", flow: "import", share: 15.4, thesis: "Electronics" },
      ],
      market_index: {
        symbol: "NIFTY",
        name: "Nifty 50",
        currency: "INR",
        change_24h: 0.4,
        series: [
          { label: "1D", value: 100 },
          { label: "1W", value: 101 },
        ],
      },
      fx: { pair: "USD/INR", rate: 83.45, volatility_24h: 0.5, trigger: "Crude volatility" },
      contrarian_insight: "India gains when crude cools.",
    },
    {
      iso3: "USA",
      iso_numeric: "840",
      name: "United States",
      flag: "https://flagcdn.com/us.svg",
      capital: "Washington, D.C.",
      coordinates: { lat: 38.9, lng: -77 },
      gdp_usd_bn: 28780,
      population_mn: 341.8,
      gdp_growth_pct: 2.5,
      gdp_per_capita_usd: 83400,
      gini: 41.4,
      tension_score: 4.6,
      tension_label: "Developing",
      tension_breakdown: {
        structural: 3.9,
        sentiment: 5.4,
        live_trigger: 4.8,
        last_structural_update: "March 2026",
        last_sentiment_update: "April 13, 2026",
      },
      groups: ["G7", "G20"],
      industry_criticality: ["Semiconductor design"],
      trade_partners: [{ iso3: "IND", name: "India", flow: "export", share: 4, thesis: "Services" }],
      market_index: {
        symbol: "SPX",
        name: "S&P 500",
        currency: "USD",
        change_24h: -0.6,
        series: [
          { label: "1D", value: 100 },
          { label: "1W", value: 99 },
        ],
      },
      fx: { pair: "DXY", rate: 105.2, volatility_24h: 0.7, trigger: "Yields" },
      contrarian_insight: "Reshoring capex supports industrials.",
    },
    {
      iso3: "CHN",
      iso_numeric: "156",
      name: "China",
      flag: "https://flagcdn.com/cn.svg",
      capital: "Beijing",
      coordinates: { lat: 39.9, lng: 116.4 },
      gdp_usd_bn: 18530,
      population_mn: 1409.7,
      gdp_growth_pct: 4.7,
      gdp_per_capita_usd: 13150,
      gini: 38.2,
      tension_score: 6.6,
      tension_label: "Developing",
      tension_breakdown: {
        structural: 5.8,
        sentiment: 7,
        live_trigger: 6.9,
        last_structural_update: "March 2026",
        last_sentiment_update: "April 13, 2026",
      },
      groups: ["G20"],
      industry_criticality: ["Rare earth processing"],
      trade_partners: [{ iso3: "USA", name: "United States", flow: "export", share: 14.8, thesis: "Demand" }],
      market_index: {
        symbol: "CSI300",
        name: "CSI 300",
        currency: "CNY",
        change_24h: -1.2,
        series: [
          { label: "1D", value: 100 },
          { label: "1W", value: 98 },
        ],
      },
      fx: { pair: "USD/CNY", rate: 7.24, volatility_24h: 0.8, trigger: "Controls" },
      contrarian_insight: "Battery leverage remains.",
    },
  ],
  globalPulse: {
    alerts: [
      {
        id: "alert-1",
        severity: "High Risk",
        region: "Taiwan Strait",
        headline: "Air activity raises hedge demand",
        impact: "Chip suppliers trade wider.",
        age_minutes: 42,
      },
    ],
    daily_briefs: ["Semiconductor risk is clustering around chokepoints."],
    last_structural_update: "March 2026",
    last_sentiment_update: "April 13, 2026",
  },
  marketPulse: [
    {
      id: "move-1",
      instrument: "TAIEX",
      move_pct: -1.8,
      region: "Taiwan",
      trigger: "Chip continuity hedges.",
    },
  ],
  sectors: [
    {
      id: "semiconductors",
      name: "Semiconductors",
      color: "#00ffff",
      market_value: "$600B direct",
      systemic_multiplier: "$3.5T+ industrial dependency",
      sensitivity: 9.8,
      power_nodes: ["USA"],
      consumption_nodes: ["CHN", "IND"],
      arcs: [{ source: "USA", target: "CHN", intensity: 0.85, waypoint: null }],
      chokepoints: [
        {
          id: "malacca",
          name: "Strait of Malacca",
          coordinates: { lat: 1.4, lng: 103.8 },
          watch: "Controls flow.",
        },
      ],
      brief: "Chips are the new oil.",
      alpha: "Watch the Netherlands.",
      equity_proxy: "SOXX / TSM",
    },
    {
      id: "hydrocarbons",
      name: "Hydrocarbons",
      color: "#ffb000",
      market_value: "$2.1T direct",
      systemic_multiplier: "Global CPI",
      sensitivity: 8.5,
      power_nodes: ["USA"],
      consumption_nodes: ["IND"],
      arcs: [{ source: "USA", target: "IND", intensity: 0.7, waypoint: null }],
      chokepoints: [],
      brief: "Route risk reprices inflation.",
      alpha: "Track LNG.",
      equity_proxy: "XLE",
    },
  ],
};

beforeEach(() => {
  window.history.pushState({}, "", "/");
  setViewportWidth(1024);
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const path = new URL(url).pathname;
      const responses: Record<string, unknown> = {
        "/api/countries": bootstrap.countries,
        "/api/global-pulse": bootstrap.globalPulse,
        "/api/market-pulse": bootstrap.marketPulse,
        "/api/sectors": bootstrap.sectors,
      };

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[path]),
      });
    }),
  );
});

describe("Sovereign Lens app", () => {
  it("shows the desktop-first message instead of the app on phone widths", () => {
    setViewportWidth(390);

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Finance Terminal is currently available on larger screens/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This product is designed for PC, laptops, and tablets/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mobile version and app are coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/Please open this on a PC, laptop, or tablet/i)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Global Intelligence Monitor/i })).not.toBeInTheDocument();
  });

  it("renders the product at the tablet breakpoint", async () => {
    setViewportWidth(768);

    render(<App />);

    expect(await screen.findByRole("region", { name: /Global Intelligence Monitor/i })).toBeInTheDocument();
  });

  it("uses the finance movement font for green and red number values outside the globe screen", () => {
    expect(financeFinishCss).toMatch(
      /--finance-move-font:\s*Manrope,\s*Inter,\s*ui-sans-serif,\s*system-ui,/,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app \.markets-asset-move,[\s\S]*?\.portfolio-app \.markets-news-card-top em,[\s\S]*?\.portfolio-app \.portfolio-heatmap-tile em,[\s\S]*?\.portfolio-app \.portfolio-standout-price em,[\s\S]*?font-family:\s*var\(--finance-move-font\) !important;/s,
    );
    expect(marketTapeCss).toMatch(
      /\.portfolio-app \.market-tape-move,[\s\S]*?\.events-dashboard-shell \.market-tape-move,[\s\S]*?\.news-article-shell \.market-tape-move,[\s\S]*?\.ai-answer-shell \.market-tape-move\s*\{[^}]*font-family:\s*Manrope,/s,
    );
    expect(marketTapeCss).not.toMatch(/\.global-monitor-app \.market-tape-move\s*\{/);
  });

  it("renders animated suggestive search prompts on finance search surfaces", async () => {
    window.history.pushState({}, "", "/markets");
    const { unmount } = render(<App />);

    const marketsSearch = await screen.findByRole("search", { name: /Search Indian Markets workspace/i });
    expect(marketsSearch).toHaveClass("has-animated-search-prompt");
    expect(marketsSearch.querySelector(".animated-search-prompt")).toHaveTextContent(/Which sectors are leading/i);
    expect(marketsSearch.querySelector(".animated-search-prompt-line")).toBeInTheDocument();
    fireEvent.change(within(marketsSearch).getByRole("searchbox"), { target: { value: "banks" } });
    expect(marketsSearch).toHaveClass("has-search-value");
    unmount();

    window.history.pushState({}, "", "/news-pulse");
    const eventsView = render(<App />);
    const eventsSearch = await screen.findByRole("searchbox", { name: /Search events, regions, or topics/i });
    expect(eventsSearch.closest(".events-search")).toHaveClass("has-animated-search-prompt");
    expect(eventsSearch.closest(".events-search")?.querySelector(".animated-search-prompt")).toHaveTextContent(/Which events could move Indian equities/i);
    eventsView.unmount();

    window.history.pushState({}, "", "/funds");
    render(<App />);
    const fundsScreen = await screen.findByRole("region", { name: /Funds comparison screen/i });
    const fundsCommand = within(fundsScreen).getByRole("button", { name: /Search funds or compare category/i });
    expect(fundsCommand).toHaveClass("has-animated-search-prompt");
    expect(fundsCommand.querySelector(".animated-search-prompt")).toHaveTextContent(/Which funds beat NIFTY/i);

    expect(financeFinishCss).toMatch(/font-weight:\s*var\(--animated-search-font-weight,\s*460\);/);
    expect(financeFinishCss).toMatch(/--animated-search-font-weight:\s*430;/);
    expect(financeFinishCss).toMatch(/@keyframes animated-search-prompt-cycle/s);
    expect(financeFinishCss).toMatch(/prefers-reduced-motion:\s*reduce/s);
    expect(financeFinishCss).toMatch(
      /\.has-animated-search-prompt:focus-within \.animated-search-prompt,[\s\S]*?\.has-animated-search-prompt\.has-search-value \.animated-search-prompt/s,
    );
  });

  it("renders the cinematic global intelligence monitor", async () => {
    render(<App />);

    expect(await screen.findByRole("region", { name: /Global Intelligence Monitor/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Live geopolitical and market event surface/i })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Market and risk tape/i })).toBeInTheDocument();
    expect(screen.getByText("Live Markets")).toBeInTheDocument();
    const panel = screen.getByRole("complementary", { name: /Global intelligence monitor panel/i });
    expect(within(panel).getByRole("button", { name: "Filter" })).toBeInTheDocument();
    expect(within(panel).queryByRole("heading", { name: /Live News Feed: High Impact Events/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /System status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Selected event details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "REQUEST DETAILED ANALYSIS" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Sovereign AI analysis/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Selected globe news panel/i)).toHaveTextContent(/Red Sea Shipping Risk/i);
    expect(screen.getByRole("region", { name: /Most affected sectors and stocks/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Related news/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Egypt Trade Context/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Active data context/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open event details: China Demand Pulse/i })).toBeInTheDocument();
  });

  it("toggles globe cards into the AI context", async () => {
    render(<App />);
    await screen.findByRole("button", { name: /Open event details: Red Sea Shipping Risk/i });

    fireEvent.click(screen.getByRole("button", { name: /Open event details: China Demand Pulse/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Open event details: China Demand Pulse/i })).toHaveClass("is-selected"));
    expect(screen.getByRole("region", { name: /Sovereign AI analysis/i })).toHaveTextContent(/China/i);
    expect(screen.getByLabelText(/Selected globe news panel/i)).toHaveTextContent(/China Demand Pulse/i);
    fireEvent.click(screen.getByRole("button", { name: /Open event details: China Demand Pulse/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Open event details: China Demand Pulse/i })).not.toHaveClass("is-selected"));
    expect(screen.getByRole("region", { name: /Sovereign AI analysis/i })).not.toHaveTextContent(/China/i);
    expect(screen.queryByRole("region", { name: /Selected event details/i })).not.toBeInTheDocument();
  });

  it("filters the monitor by issue type using mock data", async () => {
    render(<App />);
    await screen.findByRole("button", { name: /Open event details: Red Sea Shipping Risk/i });

    const filterButton = screen.getByRole("button", { name: "Filter" });
    fireEvent.click(filterButton);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Energy" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Open event details: Energy Import Exposure/i })).toBeInTheDocument());
    expect(filterButton).toHaveClass("is-active");
    expect(screen.queryByRole("button", { name: /Open event details: Red Sea Shipping Risk/i })).not.toBeInTheDocument();
  });

  it("opens the portfolio screen from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Portfolio screen/i })).toBeInTheDocument());
    expect(screen.getByRole("tablist", { name: /Portfolio workspace sections/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Portfolio dashboard/i })).toHaveTextContent(/Portfolio read/i);
    expect(screen.getByRole("region", { name: /Reduce private-bank concentration/i })).toHaveTextContent(/Portfolio read/i);
    expect(screen.getByRole("heading", { name: /Today's P&L/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Market drivers affecting your portfolio/i })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/portfolio");
  });

  it("opens the top-level screener screen from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open screener/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Screener screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Indian equity screens/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/screener");
  });

  it("opens Indian Markets from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open Indian Markets/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Indian Markets screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Top Metrics/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Market Summary/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/markets");
  });

  it("places market summary in the main column and top metrics in the right rail", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const workspace = await screen.findByRole("region", { name: /Indian market workspace/i });
    const mainColumn = within(workspace).getByRole("region", { name: /Market summary workspace/i });
    const marketSummary = within(mainColumn).getByRole("region", { name: /Market Summary/i });
    const topMetricsRail = within(workspace).getByRole("complementary", { name: /Top metrics/i });
    const marketSummaryUpdated = within(marketSummary).getByText(/Updated 1 minute ago/i);

    expect(within(mainColumn).getByRole("heading", { name: /Market Summary/i })).toBeInTheDocument();
    expect(marketSummaryUpdated).toBeInTheDocument();
    expect(marketSummaryUpdated).toHaveClass("portfolio-update-status-text");
    expect(designDoc).toMatch(/Within a route, repeated section headers should share one size/i);
    expect(financeFinishCss).toMatch(/--markets-section-heading-size:\s*23px;/);
    expect(financeFinishCss).toMatch(/font-size:\s*var\(--markets-section-heading-size\) !important;/);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app \.portfolio-update-status-text\s*\{[^}]*font-size:\s*12px !important;[^}]*font-weight:\s*440 !important;[^}]*line-height:\s*1\.2 !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app \.portfolio-market-summary-panel \.market-summary-heading \.portfolio-update-status-text,[\s\S]*?font-size:\s*12px !important;[\s\S]*?font-weight:\s*440 !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-heading h2\s*\{[^}]*font-size:\s*var\(--markets-section-heading-size\) !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-title-block h2\s*\{[^}]*font-size:\s*var\(--markets-section-heading-size\) !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-sector-performance-heading h2\s*\{[^}]*font-size:\s*var\(--markets-section-heading-size\) !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-market-summary-panel\s*\{[^}]*gap:\s*var\(--markets-associated-panel-gap\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.portfolio-market-overview-panel\s*\{[^}]*gap:\s*var\(--markets-associated-panel-gap\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.market-summary-updated\s*\{[^}]*flex:\s*0 0 auto;[^}]*font-size:\s*12px !important;[^}]*font-weight:\s*440 !important;/s,
    );
    expect(within(marketSummary).getAllByRole("article")).toHaveLength(5);
    expect(within(marketSummary).queryByText(/Air India Slashes/i)).not.toBeInTheDocument();
    expect(within(marketSummary).getByRole("button", { name: /Indian Markets Open Higher/i })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(within(marketSummary).getByRole("button", { name: /Show 1 more/i }));

    await waitFor(() => expect(within(marketSummary).getAllByRole("article")).toHaveLength(6));
    expect(within(marketSummary).getByText(/Air India Slashes/i)).toBeInTheDocument();
    expect(within(marketSummary).getByRole("button", { name: /Show fewer/i })).toBeInTheDocument();

    expect(within(topMetricsRail).getByRole("heading", { name: /Top Metrics/i })).toBeInTheDocument();
    const topMetricsGrid = topMetricsRail.querySelector(".portfolio-index-grid") as HTMLElement;
    expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(6);
    expect(within(topMetricsGrid).getByText("INDIA VIX")).toBeInTheDocument();
    expect(within(topMetricsGrid).getByText("USD/INR")).toBeInTheDocument();
    expect(within(topMetricsGrid).getByText("BANK NIFTY")).toBeInTheDocument();
    expect(within(topMetricsGrid).getByText("MIDCAP 150")).toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText("SMALLCAP 250")).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Large-cap benchmark/i)).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Broad benchmark/i)).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Volatility gauge/i)).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Rupee reference/i)).not.toBeInTheDocument();
    const niftyMetricCard = within(topMetricsGrid).getByRole("article", {
      name: /NIFTY 50 24,330\.95, \+1\.24%, \+298\.15/i,
    });
    expect(niftyMetricCard.querySelector(".markets-asset-identity .markets-asset-value")).toHaveTextContent("24,330.95");
    expect(niftyMetricCard.querySelector(".markets-asset-percent svg")).toBeInTheDocument();
    expect(niftyMetricCard.querySelector(".markets-asset-percent span")).toHaveTextContent("+1.24%");
    expect(niftyMetricCard.querySelector(".markets-asset-change")).toHaveTextContent("+298.15");
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.portfolio-index-card\s*\{[^}]*min-height:\s*76px;[^}]*padding:\s*9px 10px 7px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.markets-asset-percent\s*\{[^}]*font-size:\s*13\.5px;[^}]*font-weight:\s*650;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.markets-asset-change\s*\{[^}]*font-size:\s*10\.5px !important;[^}]*opacity:\s*0\.72;/s,
    );

    const indicatorPicker = within(topMetricsRail).getByRole("button", { name: /Choose top metrics/i });
    expect(indicatorPicker).toHaveTextContent("6/6");
    expect(financeFinishCss).toMatch(
      /\.markets-indicator-picker-button\s*\{[^}]*gap:\s*5px;[^}]*min-height:\s*26px;[^}]*padding:\s*0 8px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-indicator-picker-button span\s*\{[^}]*font-size:\s*11px;/s,
    );
    fireEvent.click(indicatorPicker);

    const pickerMenu = within(topMetricsRail).getByRole("group", { name: /Choose visible top metrics/i });
    expect(within(pickerMenu).getByText(/Remove one to add another/i)).toBeInTheDocument();
    const removeNifty = within(pickerMenu).getByRole("checkbox", { name: /Remove NIFTY 50 from top metrics/i });
    const blockedSmallcap = within(pickerMenu).getByRole("checkbox", { name: /Remove one indicator before adding SMALLCAP 250/i });
    expect(removeNifty).toHaveAttribute("aria-checked", "true");
    expect(removeNifty.querySelector(".markets-indicator-option-action svg")).toBeInTheDocument();
    expect(blockedSmallcap).toHaveAttribute("aria-checked", "false");
    expect(blockedSmallcap).toHaveAttribute("aria-disabled", "true");
    expect(blockedSmallcap).not.toBeDisabled();

    fireEvent.click(removeNifty);

    await waitFor(() => expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(5));
    expect(within(topMetricsGrid).queryByText("NIFTY 50")).not.toBeInTheDocument();
    const addSmallcap = within(pickerMenu).getByRole("checkbox", { name: /Add SMALLCAP 250 to top metrics/i });
    expect(addSmallcap).not.toHaveAttribute("aria-disabled", "true");

    fireEvent.click(addSmallcap);

    await waitFor(() => expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(6));
    expect(within(topMetricsGrid).getByText("SMALLCAP 250")).toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText("NIFTY 50")).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Breadth check/i)).not.toBeInTheDocument();
  });

  it("lays out the market heatmap, stock news rail, and lower rail sections", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Market heatmap workspace/i });
    expect(within(heatmapSection).getByRole("heading", { name: /NIFTY 50 Heatmap/i })).toBeInTheDocument();
    expect(within(heatmapSection).queryByText(/Size by market cap/i)).not.toBeInTheDocument();
    const heatmapRail = within(heatmapSection).getByRole("complementary", { name: /Heatmap right rail/i });
    expect(within(heatmapRail).getByRole("region", { name: /Stocks in news today/i })).toBeInTheDocument();
    const heatmapMain = heatmapSection.querySelector(".markets-heatmap-main") as HTMLElement;
    const heatmapBlock = heatmapMain.querySelector(":scope > .portfolio-heatmap-section-block") as HTMLElement;
    const heatmapHeader = heatmapBlock.querySelector(":scope > .portfolio-heatmap-header") as HTMLElement;
    const marketDepth = within(heatmapHeader).getByRole("group", { name: /Market depth/i });
    const heatmapPanel = heatmapBlock.querySelector(".portfolio-heatmap-panel");
    const heatmapStage = within(heatmapMain).getByRole("img", {
      name: /NIFTY 50 stock heatmap grouped by sector/i,
    });

    expect(heatmapPanel).not.toContainElement(heatmapHeader);
    expect(heatmapStage.closest(".portfolio-heatmap-panel")).toBe(heatmapPanel);
    expect(within(heatmapPanel as HTMLElement).queryByRole("heading", { name: /NIFTY 50 Heatmap/i })).not.toBeInTheDocument();
    const heatmapTitleBlock = heatmapHeader.querySelector(":scope > .portfolio-heatmap-title-block") as HTMLElement;
    const expandHeatmapButton = within(heatmapHeader).getByRole("button", { name: /Expand NIFTY 50 heatmap/i });
    expect(expandHeatmapButton).toHaveTextContent(/Expand/i);
    expect(expandHeatmapButton.querySelector(".lucide-move-diagonal2")).toBeInTheDocument();
    expect(heatmapHeader.querySelector(".portfolio-heatmap-header-row")).not.toBeInTheDocument();
    expect(heatmapTitleBlock).toContainElement(marketDepth);
    expect(heatmapHeader.querySelector(":scope > .portfolio-heatmap-control-cluster")).toContainElement(
      expandHeatmapButton,
    );
    expect(within(marketDepth).getByText(/Adv/i)).toBeInTheDocument();
    expect(within(marketDepth).getByText(/Dec/i)).toBeInTheDocument();
    const moreMarketStats = within(heatmapHeader).getByText(/More market stats/i);
    fireEvent.click(moreMarketStats);
    expect(within(heatmapHeader).getByText(/52W H\/L/i)).toBeInTheDocument();
    expect(within(heatmapHeader).getByText(/FII/i)).toBeInTheDocument();
    expect(within(heatmapHeader).getByText(/DII/i)).toBeInTheDocument();
    const hdfcTile = within(heatmapMain).getByRole("button", { name: /HDFC Bank, \+1\.40%/i });
    expect(within(hdfcTile).getByText("HDFCBANK")).toBeInTheDocument();
    expect(within(hdfcTile).queryByText("HDFC Bank")).not.toBeInTheDocument();
    expect(within(heatmapSection).queryByText(/DEMO NIFTY 50 MARKET DATA/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Compact market breadth strip/i })).not.toBeInTheDocument();
    expect(financeFinishCss).toMatch(
      /\.markets-heatmap-section\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(380px,\s*420px\);/s,
    );
    expect(financeFinishCss).toMatch(/--markets-sticky-rail-top:\s*96px;/);
    expect(financeFinishCss).toMatch(
      /\.markets-heatmap-section\s*\{[^}]*align-items:\s*stretch;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-heatmap-rail\s*\{[^}]*align-self:\s*stretch;[^}]*align-content:\s*start;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-lower-rail\s*\{[^}]*position:\s*sticky;[^}]*top:\s*var\(--markets-sticky-rail-top\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-panel\s*\{[^}]*padding:\s*8px 8px 12px !important;[^}]*background:\s*#141414 !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-heatmap-main \.portfolio-heatmap-stage\s*\{[^}]*height:\s*clamp\(484px,\s*36vw,\s*560px\);[^}]*min-height:\s*484px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-header\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto;[^}]*align-items:\s*end;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-control-cluster\s*\{[^}]*gap:\s*6px;[^}]*transform:\s*translateY\(4px\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-action\s*\{[^}]*min-height:\s*23px;[^}]*padding:\s*0 7px;[^}]*font-size:\s*11\.5px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-stat-details summary\s*\{[^}]*height:\s*23px;[^}]*min-height:\s*23px;[^}]*padding:\s*0 7px;/s,
    );
    expect(designDoc).toMatch(/one tight association gap for `header -> panel` and one larger component gap/i);
    expect(financeFinishCss).toMatch(/--markets-associated-panel-gap:\s*8px;/);
    expect(financeFinishCss).toMatch(/--markets-component-gap:\s*24px;/);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-heatmap-section-block,[\s\S]*?\.portfolio-app-view-markets \.portfolio-standouts-section\s*\{[^}]*gap:\s*var\(--markets-associated-panel-gap\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-lower-main,[\s\S]*?\.markets-lower-rail\s*\{[^}]*gap:\s*var\(--markets-component-gap\);/s,
    );

    const lowerWorkspace = screen.getByRole("region", { name: /Indian market lower workspace/i });
    expect(within(lowerWorkspace).getByRole("heading", { name: /Recent Developments/i })).toBeInTheDocument();
    const sectorPanel = within(lowerWorkspace).getByRole("region", { name: /Sectoral Performance/i });
    expect(sectorPanel).toBeInTheDocument();
    const sectorSurface = sectorPanel.querySelector(".portfolio-sector-performance-panel") as HTMLElement;
    expect(sectorSurface).toBeInTheDocument();
    expect(sectorSurface).not.toContainElement(within(sectorPanel).getByRole("heading", { name: /Sectors trending today/i }));
    expect(designDoc).toMatch(/Section headers should live outside the panel they represent by default/i);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-sector-performance-section\s*\{[^}]*display:\s*grid;[^}]*gap:\s*var\(--markets-associated-panel-gap\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-sector-performance-heading\s*\{[^}]*padding:\s*0 2px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-sector-performance-bar\s*\{[^}]*column-gap:\s*2px;/s,
    );
    expect(within(sectorPanel).queryByText(/^Sectoral performance$/i)).not.toBeInTheDocument();
    expect(within(sectorPanel).queryByText(/NSE universe/i)).not.toBeInTheDocument();
    expect(within(sectorPanel).queryByText(/advancing/i)).not.toBeInTheDocument();
    const standoutsPanel = within(lowerWorkspace).getByRole("region", { name: /Standouts/i });
    expect(within(standoutsPanel).getByRole("heading", { name: /Names moving with force/i })).toBeInTheDocument();
    expect(within(standoutsPanel).queryByText(/^Standouts$/i)).not.toBeInTheDocument();
    expect(standoutsPanel.querySelector(".portfolio-standouts-panel")).not.toHaveClass("portfolio-workspace-panel");
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-standouts-panel\s*\{[^}]*border:\s*0 !important;[^}]*background:\s*transparent !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-standout-card\s*\{[^}]*border-radius:\s*18px;[^}]*background:\s*[\s\S]*linear-gradient\(180deg,\s*rgba\(32,\s*32,\s*34,\s*0\.96\),\s*rgba\(16,\s*16,\s*18,\s*0\.98\)\),[\s\S]*var\(--markets-surface-soft\);/s,
    );

    expect(heatmapMain).toContainElement(lowerWorkspace);
    const lowerRail = within(heatmapRail).getByRole("complementary", { name: /Market movers/i });
    expect(within(lowerRail).getByRole("heading", { name: /Live Indian movers/i })).toBeInTheDocument();
    expect(within(lowerRail).queryByText(/^Market movers$/i)).not.toBeInTheDocument();
    expect(within(lowerRail).queryByRole("region", { name: /Sectoral Performance/i })).not.toBeInTheDocument();
    expect(within(lowerRail).queryByRole("region", { name: /Stocks in news today/i })).not.toBeInTheDocument();
  });

  it("renders market mover filters as a semantic slider without sample-data meta text", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const lowerRail = await screen.findByRole("complementary", { name: /Market movers/i });
    const moversHeading = within(lowerRail).getByRole("heading", { name: /Live Indian movers/i });
    const moversPanel = moversHeading.closest("section");
    expect(moversPanel).toBeTruthy();
    const moverSurface = (moversPanel as HTMLElement).querySelector(".portfolio-market-movers-panel") as HTMLElement;
    expect(moverSurface).toBeInTheDocument();
    expect(moverSurface).not.toHaveClass("portfolio-workspace-panel");

    const tabGroup = within(moversPanel as HTMLElement).getByRole("group", { name: /Market mover category/i });
    const gainersButton = within(tabGroup).getByRole("button", { name: /Show gainers movers/i });
    const losersButton = within(tabGroup).getByRole("button", { name: /Show losers movers/i });
    const activeButton = within(tabGroup).getByRole("button", { name: /Show active movers/i });

    expect(within(moversPanel as HTMLElement).queryByText(/Sample data/i)).not.toBeInTheDocument();
    expect(tabGroup).toHaveClass("portfolio-mover-tabs", "is-gainers");
    expect(moverSurface.querySelector(".portfolio-company-avatar")).toBeInTheDocument();
    expect(moverSurface.querySelector(".portfolio-mover-identity")).toHaveTextContent(/ZOMATO \/ NSE/i);
    expect(moverSurface.querySelector(".portfolio-mover-price")).toHaveTextContent(/₹203\.50/);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-market-movers-panel\s*\{[^}]*border:\s*1px solid var\(--markets-border\) !important;[^}]*border-radius:\s*10px !important;[^}]*linear-gradient\(180deg,\s*rgba\(31,\s*31,\s*33,\s*0\.92\),\s*rgba\(16,\s*16,\s*18,\s*0\.98\)\)/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-market-movers-panel \.portfolio-mover-row\s*\{[^}]*grid-template-columns:\s*36px minmax\(0,\s*1fr\) auto;[^}]*padding:\s*10px 12px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app\.portfolio-app-view-markets \.portfolio-mover-tabs\s*\{[^}]*border-bottom:\s*1px solid rgba\(232,\s*233,\s*229,\s*0\.066\) !important;[^}]*border-radius:\s*0 !important;[^}]*background:\s*rgba\(232,\s*233,\s*229,\s*0\.035\) !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app\.portfolio-app-view-markets \.portfolio-mover-tabs button\.is-active::after\s*\{[^}]*height:\s*2px;[^}]*background:\s*var\(--markets-text\);/s,
    );
    expect((tabGroup as HTMLElement).style.getPropertyValue("--mover-active-index")).toBe("0");
    expect(gainersButton).toHaveAttribute("data-mover-tab", "gainers");
    expect(gainersButton).toHaveClass("is-mover-gainers", "is-active");
    expect(losersButton).toHaveAttribute("aria-pressed", "false");
    expect(activeButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(losersButton);

    await waitFor(() => {
      expect(tabGroup).toHaveClass("is-losers");
      expect((tabGroup as HTMLElement).style.getPropertyValue("--mover-active-index")).toBe("1");
      expect(losersButton).toHaveClass("is-mover-losers", "is-active");
    });

    fireEvent.click(activeButton);

    await waitFor(() => {
      expect(tabGroup).toHaveClass("is-active");
      expect((tabGroup as HTMLElement).style.getPropertyValue("--mover-active-index")).toBe("2");
      expect(activeButton).toHaveClass("is-mover-active", "is-active");
    });
  });

  it("renders all right-rail stock news cards without overflow controls", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Market heatmap workspace/i });
    const newsPanel = within(heatmapSection).getByRole("region", { name: /Stocks in news today/i });

    expect(newsPanel).toHaveClass("markets-news-panel");
    expect(newsPanel).not.toHaveClass("portfolio-workspace-panel");
    expect(within(newsPanel).getByRole("heading", { name: /Stocks in news today/i })).toBeInTheDocument();
    expect(within(newsPanel).queryByText(/^Stock news$/i)).not.toBeInTheDocument();
    expect(within(newsPanel).queryByText(/briefs/i)).not.toBeInTheDocument();
    expect(within(newsPanel).getByRole("article", { name: /BPCL news/i })).toBeInTheDocument();
    expect(within(newsPanel).getByRole("article", { name: /Nykaa news/i })).toBeInTheDocument();
    expect(within(newsPanel).getByRole("article", { name: /Varun Beverages news/i })).toBeInTheDocument();
    expect(within(newsPanel).getByRole("article", { name: /Parle Industries news/i })).toBeInTheDocument();
    expect(within(newsPanel).getByRole("article", { name: /Tata Motors news/i })).toBeInTheDocument();
    expect(within(newsPanel).getAllByRole("article")).toHaveLength(5);
    const bpclNewsCard = within(newsPanel).getByRole("article", { name: /BPCL news/i });
    const bpclNewsTop = bpclNewsCard.querySelector(".markets-news-card-top") as HTMLElement;
    expect(bpclNewsTop).toContainElement(within(bpclNewsCard).getByText("BPCL"));
    expect(bpclNewsTop).toContainElement(within(bpclNewsCard).getByText("-0.39%"));
    expect(bpclNewsCard.querySelector(":scope > .markets-news-company")).not.toBeInTheDocument();
    expect(within(newsPanel).queryByText("PARLEIND")).not.toBeInTheDocument();
    expect(within(newsPanel).queryByText("TATAMOTORS")).not.toBeInTheDocument();
    expect(within(newsPanel).queryByText("NYKAA")).not.toBeInTheDocument();
    expect(designDoc).toMatch(/Avoid duplicate identity text in compact feeds/i);
    expect(within(newsPanel).queryByRole("button", { name: /Read more stock news/i })).not.toBeInTheDocument();
    expect(within(newsPanel).queryByRole("button", { name: /Show fewer stock news cards/i })).not.toBeInTheDocument();

    expect(designDoc).toMatch(/Use one visible box per content unit[\s\S]*box-inside-box feel/i);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-panel\s*\{[^}]*border:\s*0 !important;[^}]*background:\s*transparent !important;[^}]*box-shadow:\s*none !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card\s*\{[^}]*min-height:\s*118px;[^}]*padding:\s*10px 11px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;[^}]*gap:\s*10px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card\s*\{[^}]*background:\s*[\s\S]*linear-gradient\(180deg,\s*rgba\(32,\s*32,\s*34,\s*0\.96\),\s*rgba\(16,\s*16,\s*18,\s*0\.98\)\),[\s\S]*var\(--markets-surface-soft\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card-top\s*\{[^}]*grid-template-columns:\s*34px minmax\(0,\s*1fr\) auto;[^}]*align-items:\s*center;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card p\s*\{[^}]*-webkit-line-clamp:\s*2;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-news-card time\s*\{[^}]*align-self:\s*end;[^}]*justify-self:\s*start;[^}]*font-size:\s*6px;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-lower-workspace\s*\{[^}]*display:\s*block;[^}]*margin-top:\s*0;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-heatmap-main\s*\{[^}]*gap:\s*var\(--markets-component-gap\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.markets-heatmap-rail\s*\{[^}]*gap:\s*var\(--markets-component-gap\);/s,
    );
  });

  it("keeps NIFTY heatmap sector labels on the shared stage background", async () => {
    window.history.pushState({}, "", "/markets");
    setViewportWidth(1440);
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Market heatmap workspace/i });
    const stage = within(heatmapSection).getByRole("img", {
      name: /NIFTY 50 stock heatmap grouped by sector/i,
    });
    const sectorLabels = Array.from(
      stage.querySelectorAll<HTMLElement>(
        ".portfolio-heatmap-sector:not(.is-label-none) .portfolio-heatmap-sector-label",
      ),
    );

    expect(sectorLabels.length).toBeGreaterThan(0);

    sectorLabels.forEach((label) => {
      const sector = label.closest<HTMLElement>(".portfolio-heatmap-sector");
      const reserve = Number.parseFloat(sector?.style.getPropertyValue("--heatmap-sector-header") ?? "");
      const expectedReserve = sector?.classList.contains("is-label-full") ? 3.4 : 2.8;
      const maxReserve = sector?.classList.contains("is-label-full") ? 4.4 : 3.4;

      expect(label.querySelector("span")).toBeNull();
      expect(reserve).toBeGreaterThanOrEqual(expectedReserve);
      expect(reserve).toBeLessThanOrEqual(maxReserve);
      expect(sector?.style.getPropertyValue("--heatmap-sector-header-size")).toMatch(/%$/);
    });

    const firstSector = sectorLabels[0].closest<HTMLElement>(".portfolio-heatmap-sector");
    expect(Number.parseFloat(firstSector?.style.left ?? "")).toBeGreaterThanOrEqual(0.16);

    expect(financeFinishCss).toMatch(/\.portfolio-app-view-markets \.portfolio-heatmap-sector\s*\{[^}]*border-color:\s*transparent;[^}]*background:\s*transparent;/s);
    expect(financeFinishCss).toMatch(/\.portfolio-app-view-markets \.portfolio-heatmap-sector-label\s*\{[^}]*background:\s*transparent;/s);
  });

  it("uses refined NIFTY heatmap tones for strong gain and loss moves", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Market heatmap workspace/i });
    const strongGainTile = within(heatmapSection).getByRole("button", { name: /Zomato, \+3\.80%/i });
    const strongLossTile = within(heatmapSection).getByRole("button", { name: /Oil & Natural Gas Corp, -3\.16%/i });

    expect(strongGainTile.style.getPropertyValue("--heatmap-bg")).toBe("#6aa24a");
    expect(strongGainTile.style.getPropertyValue("--heatmap-border")).toBe("rgba(139, 190, 96, 0.24)");
    expect(strongLossTile.style.getPropertyValue("--heatmap-bg")).toBe("#bf576b");
    expect(strongLossTile.style.getPropertyValue("--heatmap-border")).toBe("rgba(214, 107, 128, 0.25)");
  });

  it("cycles recent developments one card at a time", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const developments = await screen.findByRole("region", { name: /Recent Developments/i });

    expect(within(developments).getByText(/Sensex, Nifty Break Four-Day Losing Streak Wednesday/i)).toBeInTheDocument();
    expect(within(developments).getByText(/IT Shares Tumble Following OpenAI Enterprise Investment/i)).toBeInTheDocument();
    expect(within(developments).getByText(/FII Outflows Exceeding/i)).toBeInTheDocument();
    expect(within(developments).queryByText(/Gold & Silver Import Duty Hiked/i)).not.toBeInTheDocument();
    expect(within(developments).queryByText(/Based on \d+ sources/i)).not.toBeInTheDocument();

    fireEvent.click(within(developments).getByRole("button", { name: /Show next recent development/i }));

    await waitFor(() => expect(within(developments).queryByText(/Sensex, Nifty Break Four-Day Losing Streak Wednesday/i)).not.toBeInTheDocument());
    expect(within(developments).getByText(/IT Shares Tumble Following OpenAI Enterprise Investment/i)).toBeInTheDocument();
    expect(within(developments).getByText(/FII Outflows Exceeding/i)).toBeInTheDocument();
    expect(within(developments).getByText(/Gold & Silver Import Duty Hiked/i)).toBeInTheDocument();

    fireEvent.click(within(developments).getByRole("button", { name: /Show previous recent development/i }));

    await waitFor(() => expect(within(developments).getByText(/Sensex, Nifty Break Four-Day Losing Streak Wednesday/i)).toBeInTheDocument());
    expect(within(developments).queryByText(/Gold & Silver Import Duty Hiked/i)).not.toBeInTheDocument();
  });

  it("places market carousel edge controls beside the card rail instead of the heading", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const developments = await screen.findByRole("region", { name: /Recent Developments/i });
    const developmentMeta = developments.querySelector(".portfolio-recent-developments-meta");
    const developmentSyncButton = within(developments).getByRole("button", { name: /Refresh recent developments/i });
    const developmentPreviousButton = within(developments).getByRole("button", { name: /Show previous recent development/i });
    const developmentNextButton = within(developments).getByRole("button", { name: /Show next recent development/i });
    const developmentStage = developments.querySelector(".markets-carousel-stage");

    expect(developmentMeta).toContainElement(within(developments).getByText(/Updated 12 minutes ago/i));
    expect(within(developments).getByText(/Updated 12 minutes ago/i)).toHaveClass("portfolio-update-status-text");
    expect(developmentMeta).toContainElement(developmentSyncButton);
    expect(developmentSyncButton).not.toHaveTextContent(/sync/i);
    expect(developmentSyncButton.querySelector("svg")).toBeInTheDocument();
    expect(financeFinishCss).toMatch(/\.portfolio-app-view-markets \.portfolio-recent-developments-meta strong\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*440;/s);
    expect(within(developments).queryByText(/1-3\s*\/\s*6/i)).not.toBeInTheDocument();
    expect(developmentStage).toContainElement(developmentPreviousButton);
    expect(developmentStage).toContainElement(developmentNextButton);
    expect(developmentPreviousButton).toHaveClass("is-previous");
    expect(developmentNextButton).toHaveClass("is-next");
    expect(developmentPreviousButton.closest(".portfolio-recent-developments-heading")).toBeNull();
    expect(developmentNextButton.closest(".portfolio-recent-developments-heading")).toBeNull();

    const standouts = screen.getByRole("region", { name: /Standouts/i });
    expect(standouts.querySelector(".markets-carousel-stage")).toBeInTheDocument();
    expect(within(standouts).queryByText(/^Standouts$/i)).not.toBeInTheDocument();
  });

  it("removes decorative panel eyebrow text across non-globe finance routes", async () => {
    const financeRoutes = [
      { path: "/markets", label: /Indian Markets screen/i },
      { path: "/earnings", label: /Earnings screen/i },
      { path: "/screener", label: /Screener screen/i },
      { path: "/watchlist", label: /Watchlist screen/i },
      { path: "/portfolio", label: /Portfolio screen/i },
    ];

    for (const route of financeRoutes) {
      window.history.pushState({}, "", route.path);
      const { unmount } = render(<App />);
      await waitFor(() => expect(screen.getByRole("region", { name: route.label })).toBeInTheDocument());

      expect(document.querySelectorAll(".portfolio-workspace-panel-heading span")).toHaveLength(0);

      unmount();
    }
  });

  it("places sectoral performance in the left market rail above standouts", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const sectorPanel = await screen.findByRole("region", { name: /Sectoral Performance/i });
    const standouts = screen.getByRole("region", { name: /Standouts/i });
    const lowerMain = document.querySelector(".markets-lower-main");
    const lowerRail = document.querySelector(".markets-lower-rail");

    expect(lowerMain).toContainElement(sectorPanel);
    expect(lowerRail).not.toContainElement(sectorPanel);
    expect(sectorPanel.compareDocumentPosition(standouts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(sectorPanel).getByText(/Gainers\/Losers/i)).toBeInTheDocument();
    expect(within(sectorPanel).getByText(/1D price change/i)).toBeInTheDocument();
  });

  it("keeps the funds add button on the restored glass liquid-metal treatment", async () => {
    window.history.pushState({}, "", "/funds");
    render(<App />);

    const fundsScreen = await screen.findByRole("region", { name: /Funds comparison screen/i });
    const addFundButton = within(fundsScreen).getByRole("button", { name: /Add fund/i });

    expect(addFundButton).toHaveClass("fund-picker-trigger", "liquid-metal-button");
    expect(financeFinishCss).toMatch(/Funds premium glass restoration/s);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-funds \.fund-picker-trigger\.liquid-metal-button\s*\{[^}]*--funds-liquid-rim/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-funds \.fund-picker-trigger\.liquid-metal-button \.liquid-metal-button-shader\s*\{[^}]*display:\s*block !important/s,
    );
    expect(financeFinishCss).toMatch(/@keyframes funds-liquid-outline-flow/s);
  });

  it("opens Earnings from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open earnings/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Earnings screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /^Earnings$/i })).toBeInTheDocument();
    expect(screen.getByText("Earnings Tape")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /^Earnings calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /Earnings calls for selected date/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /Earnings market rail/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Earnings screen/i })).not.toHaveTextContent(/static sample|browser-only|demo only/i);
    expect(window.location.pathname).toBe("/earnings");
  });

  it("renders the Perplexity-style earnings calendar, selected-date list, and market rail", async () => {
    window.history.pushState({}, "", "/earnings");
    render(<App />);

    const earningsScreen = await screen.findByRole("region", { name: /Earnings screen/i });
    expect(within(earningsScreen).getByRole("heading", { name: /Earnings Calendar/i })).toBeInTheDocument();

    const calendar = within(earningsScreen).getByRole("region", { name: /^Earnings calendar$/i });
    expect(within(calendar).getByRole("button", { name: /Wed May 6/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(calendar).getByRole("button", { name: /Thu May 7/i })).toBeInTheDocument();

    const selectedList = within(earningsScreen).getByRole("list", { name: /Earnings calls for selected date/i });
    expect(within(selectedList).getByRole("link", { name: /Reliance Industries earnings/i })).toBeInTheDocument();
    expect(within(selectedList).getByRole("link", { name: /Infosys earnings/i })).toBeInTheDocument();
    expect(within(earningsScreen).queryByRole("region", { name: /Selected company earnings dossier/i })).not.toBeInTheDocument();

    fireEvent.click(within(calendar).getByRole("button", { name: /Thu May 7/i }));
    expect(within(calendar).getByRole("button", { name: /Thu May 7/i })).toHaveAttribute("aria-pressed", "true");
    expect(window.location.search).toContain("selectedDate=May+7");

    fireEvent.click(within(selectedList).getByRole("link", { name: /Maruti Suzuki earnings/i }));
    expect(window.location.search).toContain("selected=MARUTI");

    expect(within(earningsScreen).getByText(/Ask anything about Indian company earnings/i)).toBeInTheDocument();

    const rail = within(earningsScreen).getByRole("complementary", { name: /Earnings market rail/i });
    expect(within(rail).getByRole("heading", { name: /Create Watchlist/i })).toBeInTheDocument();
    expect(within(rail).queryByRole("heading", { name: /Prediction Markets/i })).not.toBeInTheDocument();
    expect(within(rail).getByRole("heading", { name: /Gainers/i })).toBeInTheDocument();
    expect(earningsScreen).not.toHaveTextContent(/static sample|browser-only|sample\/static|demo only/i);
  });

  it("supports the Perplexity-style earnings toolbar controls", async () => {
    window.history.pushState({}, "", "/earnings");
    render(<App />);

    const earningsScreen = await screen.findByRole("region", { name: /Earnings screen/i });
    const calendar = within(earningsScreen).getByRole("region", { name: /^Earnings calendar$/i });

    fireEvent.click(within(calendar).getByRole("button", { name: /Next earnings week/i }));
    expect(within(calendar).getByRole("button", { name: /Wed May 13/i })).toHaveAttribute("aria-pressed", "true");
    expect(window.location.search).toContain("selectedDate=May+13");

    fireEvent.click(within(calendar).getByRole("button", { name: /^Today$/i }));
    expect(within(calendar).getByRole("button", { name: /Wed May 6/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(calendar).getByRole("button", { name: /Open earnings date picker/i }));
    const datePicker = within(calendar).getByRole("dialog", { name: /Choose earnings date/i });
    expect(within(datePicker).getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
    fireEvent.click(within(datePicker).getByRole("button", { name: /May 8, 2026/i }));
    fireEvent.click(within(datePicker).getByRole("button", { name: /Apply earnings date/i }));
    expect(within(calendar).getByRole("button", { name: /Fri May 8/i })).toHaveAttribute("aria-pressed", "true");
    expect(window.location.search).toContain("selectedDate=May+8");

    fireEvent.click(within(calendar).getByRole("button", { name: /Filter earnings calendar/i }));
    const filterMenu = within(calendar).getByRole("dialog", { name: /Filter earnings calendar/i });
    fireEvent.click(within(filterMenu).getByRole("checkbox", { name: /TCS\.NS/i }));
    expect(within(filterMenu).getByRole("checkbox", { name: /TCS\.NS/i })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(within(calendar).getByRole("button", { name: /Thu May 7/i }));
    const selectedList = within(earningsScreen).getByRole("list", { name: /Earnings calls for selected date/i });
    expect(within(selectedList).getByRole("link", { name: /Tata Consultancy Services earnings/i })).toBeInTheDocument();
    expect(within(selectedList).queryByRole("link", { name: /Maruti Suzuki earnings/i })).not.toBeInTheDocument();

    fireEvent.click(within(calendar).getByRole("button", { name: /Filter earnings calendar/i }));
    const reopenedFilterMenu = within(calendar).getByRole("dialog", { name: /Filter earnings calendar/i });
    fireEvent.click(within(reopenedFilterMenu).getByRole("button", { name: /Reset earnings filters/i }));
    expect(within(selectedList).getByRole("link", { name: /Maruti Suzuki earnings/i })).toBeInTheDocument();
  });

  it("keeps the earnings ask cursor on the prompt and runs suggested searches", async () => {
    window.history.pushState({}, "", "/earnings");
    render(<App />);

    const composer = await screen.findByRole("search", { name: /Ask about Indian company earnings/i });
    const askInput = within(composer).getByRole("searchbox", { name: /Ask anything about Indian company earnings/i });
    expect(askInput).toHaveAttribute("placeholder", "Ask anything about Indian company earnings");
    expect(composer.querySelector(".earnings-pplx-composer-input-row")).toContainElement(askInput);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-earnings \.earnings-pplx-main\s*\{[^}]*padding-bottom:\s*var\(--earnings-pplx-composer-clearance\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-earnings \.earnings-pplx-composer\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*max\(18px,\s*env\(safe-area-inset-bottom\)\);/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-earnings \.earnings-pplx-composer\.is-expanded\s*\{[^}]*z-index:\s*44;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-earnings \.earnings-pplx-composer\s*\{[^}]*left:\s*calc\(max\(0px,\s*calc\(\(100vw - 1480px\) \/ 2\)\) \+ var\(--earnings-pplx-page-gutter\)\);/s,
    );
    expect(financeFinishCss).toMatch(
      /@media \(min-width:\s*768px\) and \(max-width:\s*1180px\)[\s\S]*?\.portfolio-app-view-earnings \.earnings-pplx-composer\s*\{[^}]*right:\s*var\(--earnings-pplx-page-gutter\);[^}]*left:\s*var\(--earnings-pplx-page-gutter\);/s,
    );

    fireEvent.focus(askInput);

    const suggestions = within(composer).getByRole("list", { name: /Suggested earnings searches/i });
    expect(within(suggestions).getByRole("button", { name: /Reliance Industries earnings question/i })).toBeInTheDocument();
    expect(within(suggestions).getByRole("button", { name: /private bank NIM commentary/i })).toBeInTheDocument();

    fireEvent.click(within(suggestions).getByRole("button", { name: /Reliance Industries earnings question/i }));

    await waitFor(() => expect(window.location.pathname).toBe("/answer"));
    expect(window.location.search).toContain("Reliance");
  });

  it("opens Watchlist from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open watchlist/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Watchlist screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Tracked Indian assets/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/watchlist");
  });

  it("renders a Perplexity-style Indian-only watchlist workspace", async () => {
    window.history.pushState({}, "", "/watchlist");
    render(<App />);

    const watchlistScreen = await screen.findByRole("region", { name: /Watchlist screen/i });
    expect(within(watchlistScreen).getByRole("heading", { name: /My Watchlist/i })).toBeInTheDocument();
    expect(within(watchlistScreen).getByRole("button", { name: /Manage Watchlist/i })).toBeInTheDocument();

    const returnsTable = within(watchlistScreen).getByRole("table", { name: /Indian equity watchlist returns/i });
    expect(within(returnsTable).getByRole("columnheader", { name: /^Price$/i })).toBeInTheDocument();
    expect(within(returnsTable).getByRole("columnheader", { name: /^1D$/i })).toBeInTheDocument();
    expect(within(returnsTable).getByRole("columnheader", { name: /^5D$/i })).toBeInTheDocument();
    expect(within(returnsTable).getByRole("columnheader", { name: /^1M$/i })).toBeInTheDocument();
    expect(within(returnsTable).getByRole("columnheader", { name: /^6M$/i })).toBeInTheDocument();
    expect(within(returnsTable).getAllByText(/RELIANCE/i).length).toBeGreaterThan(0);

    const movers = within(watchlistScreen).getByRole("region", { name: /Watchlist Movers/i });
    fireEvent.click(within(movers).getByRole("button", { name: /^1M$/i }));
    expect(within(movers).getByRole("button", { name: /^1M$/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(movers).getByRole("button", { name: /Compare/i })).toBeInTheDocument();

    const composer = within(watchlistScreen).getByRole("search", { name: /Ask about Indian company watchlist/i });
    const askInput = within(composer).getByRole("searchbox", { name: /Ask anything about Indian company watchlist/i });
    expect(askInput).toHaveAttribute("placeholder", "Ask anything about Indian company watchlist");

    expect(within(watchlistScreen).getByRole("region", { name: /Notable Price Movement/i })).toBeInTheDocument();
    expect(within(watchlistScreen).getByRole("heading", { name: /Watchlist News/i })).toBeInTheDocument();

    const rail = within(watchlistScreen).getByRole("complementary", { name: /Watchlist market rail/i });
    expect(within(rail).queryByRole("heading", { name: /Prediction Markets/i })).not.toBeInTheDocument();
    expect(within(rail).getByRole("heading", { name: /Gainers/i })).toBeInTheDocument();
    expect(within(rail).getByRole("heading", { name: /Equity Sectors/i })).toBeInTheDocument();
    const watchlistMoverPanel = rail.querySelector(".watchlist-pplx-mover-panel") as HTMLElement;
    expect(watchlistMoverPanel).toBeInTheDocument();
    expect(watchlistMoverPanel.closest(".watchlist-pplx-mover-card")).toBeInTheDocument();
    expect(within(watchlistMoverPanel).getByRole("group", { name: /Watchlist rail movers/i })).toHaveClass(
      "portfolio-mover-tabs",
      "watchlist-pplx-rail-tabs",
    );
    expect(watchlistMoverPanel.querySelector(".portfolio-mover-row")).toBeInTheDocument();
    expect(watchlistMoverPanel.querySelector(".portfolio-mover-identity")).toHaveTextContent(/ZOMATO\.NS/i);
    expect(watchlistMoverPanel.querySelector(".portfolio-mover-price")).toHaveTextContent(/\+3\.80%/);
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-watchlist \.watchlist-pplx-mover-card\s*\{[^}]*background:\s*transparent !important;[^}]*box-shadow:\s*none !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-watchlist \.watchlist-pplx-mover-panel \.watchlist-pplx-rail-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*border-radius:\s*0 !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-watchlist \.watchlist-pplx-mover-panel \.watchlist-pplx-rail-tabs button\.is-active::after\s*\{/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-watchlist \.watchlist-pplx-mover-panel \.portfolio-mover-row\s*\{[^}]*border-radius:\s*0 !important;[^}]*background:\s*transparent !important;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-watchlist \.watchlist-pplx-mover-panel \.portfolio-company-avatar\s*\{[^}]*background:\s*#f2f0e8 !important;/s,
    );

    expect(watchlistScreen).not.toHaveTextContent(/US Markets|NASDAQ|NYSE|Popular Cryptocurrencies|Bitcoin|Ethereum/i);
    expect(watchlistScreen).not.toHaveTextContent(/static sample|browser-only|sample\/static|demo only/i);
  });

  it("opens the screener from a direct route with the query initialized", async () => {
    window.history.pushState({}, "", "/screener?q=TCS");
    render(<App />);

    await waitFor(() => expect(screen.getByRole("region", { name: /Screener screen/i })).toBeInTheDocument());
    expect(screen.getAllByDisplayValue("TCS").length).toBeGreaterThan(0);
    expect(screen.getByText("Tata Consultancy Services")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/screener");
  });

  it("opens standalone finance sections from direct routes", async () => {
    window.history.pushState({}, "", "/markets");
    const { unmount } = render(<App />);
    await waitFor(() => expect(screen.getByRole("region", { name: /Indian Markets screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Top Metrics/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Market Summary/i })).toBeInTheDocument();
    unmount();

    window.history.pushState({}, "", "/earnings");
    const earningsView = render(<App />);
    await waitFor(() => expect(screen.getByRole("region", { name: /Earnings screen/i })).toBeInTheDocument());
    expect(screen.getByRole("list", { name: /Earnings calls for selected date/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /Earnings market rail/i })).toBeInTheDocument();
    earningsView.unmount();

    window.history.pushState({}, "", "/earnings?q=MARUTI");
    const queriedEarningsView = render(<App />);
    await waitFor(() => expect(screen.getByRole("region", { name: /Earnings screen/i })).toBeInTheDocument());
    expect(screen.getAllByDisplayValue("MARUTI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Maruti Suzuki").length).toBeGreaterThan(0);
    queriedEarningsView.unmount();

    window.history.pushState({}, "", "/watchlist");
    render(<App />);
    await waitFor(() => expect(screen.getByRole("region", { name: /Watchlist screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Tracked Indian assets/i })).toBeInTheDocument();
  });

  it("keeps standalone finance sections out of the portfolio workspace", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));

    await screen.findByRole("region", { name: /Portfolio screen/i });
    expect(screen.queryByRole("tablist", { name: /Portfolio finance sections/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Indian market overview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Earnings calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Tracked Indian assets/i })).not.toBeInTheDocument();
  });

  it("redirects portfolio workspace search to the top-level screener", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));
    await screen.findByRole("region", { name: /Portfolio screen/i });

    const searchInput = screen.getByRole("searchbox", { name: /Search portfolio workspace/i });
    fireEvent.change(searchInput, { target: { value: "RELIANCE" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => expect(screen.getByRole("region", { name: /Screener screen/i })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/screener");
    expect(window.location.search).toBe("?q=RELIANCE");
    expect(screen.getAllByDisplayValue("RELIANCE").length).toBeGreaterThan(0);
    expect(screen.getByText("Reliance Industries")).toBeInTheDocument();
  });

  it("opens the global events dashboard from a direct route", async () => {
    window.history.pushState({}, "", "/news-pulse");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Global Event Archive/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search events, regions, or topics/i })).toBeInTheDocument();
    expect(screen.getByText("G20 Summit: Climate Deal Reached")).toBeInTheDocument();
    expect(screen.queryByText("Worldwide event analysis")).not.toBeInTheDocument();
    expect(screen.queryByText(/Significant global political/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/A comprehensive list of recent global events/i)).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/news-pulse");

    fireEvent.click(screen.getByRole("button", { name: /Open global intelligence lens/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Global Intelligence Monitor/i })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/");
  });

  it("opens a full article from a direct article route", async () => {
    window.history.pushState({}, "", "/news-pulse/red-sea-freight");
    render(<App />);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Red Sea security posture keeps freight insurance bid/i })).toBeInTheDocument());
    expect(screen.queryByText("Intelligence brief")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/news-pulse/red-sea-freight");
  });

  it("uses article sector controls without breaking the legacy article view", async () => {
    window.history.pushState({}, "", "/news-pulse/red-sea-freight");
    render(<App />);
    await screen.findByRole("heading", { name: /Red Sea security posture keeps freight insurance bid/i });

    const hydrocarbons = screen.getByRole("button", { name: /Hydrocarbons Route premium/i });
    fireEvent.click(hydrocarbons);

    expect(hydrocarbons).toHaveClass("is-active");
  });
});
