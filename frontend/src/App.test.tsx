import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { BootstrapData } from "./types";

const financeFinishCss = readFileSync("src/styles/finance-finish.css", "utf8");

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

  it("opens the synced portfolio screen from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Synced portfolio screen/i })).toBeInTheDocument());
    expect(screen.getByRole("tablist", { name: /Portfolio workspace sections/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Portfolio dashboard/i })).toHaveTextContent(/What matters now/i);
    expect(screen.getByRole("region", { name: /What matters now/i })).toHaveTextContent(/Reduce private-bank concentration/i);
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

    expect(within(mainColumn).getByRole("heading", { name: /Market Summary/i })).toBeInTheDocument();
    expect(within(marketSummary).getByText(/Updated 1 minute ago/i)).toBeInTheDocument();
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.portfolio-market-summary-panel \.market-summary-heading strong\s*\{[^}]*color:\s*var\(--markets-muted\) !important;[^}]*font-family:\s*var\(--font-ui\) !important;[^}]*font-size:\s*13px !important;[^}]*font-weight:\s*500 !important;/s,
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
    expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(4);
    expect(within(topMetricsGrid).getByText("INDIA VIX")).toBeInTheDocument();
    expect(within(topMetricsGrid).getByText("USD/INR")).toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText("BANK NIFTY")).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText("MIDCAP 150")).not.toBeInTheDocument();
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
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.markets-asset-percent\s*\{[^}]*font-size:\s*18px;[^}]*font-weight:\s*640;/s,
    );
    expect(financeFinishCss).toMatch(
      /\.portfolio-app-view-markets \.markets-top-assets-rail \.markets-asset-change\s*\{[^}]*font-size:\s*12px !important;[^}]*opacity:\s*0\.74;/s,
    );

    const indicatorPicker = within(topMetricsRail).getByRole("button", { name: /Choose top metrics/i });
    expect(indicatorPicker).toHaveTextContent("4/4");
    fireEvent.click(indicatorPicker);

    const pickerMenu = within(topMetricsRail).getByRole("group", { name: /Choose visible top metrics/i });
    expect(within(pickerMenu).getByText(/Remove one to add another/i)).toBeInTheDocument();
    const removeNifty = within(pickerMenu).getByRole("checkbox", { name: /Remove NIFTY 50 from top metrics/i });
    const blockedBankNifty = within(pickerMenu).getByRole("checkbox", { name: /Remove one indicator before adding BANK NIFTY/i });
    expect(removeNifty).toHaveAttribute("aria-checked", "true");
    expect(removeNifty.querySelector(".markets-indicator-option-action svg")).toBeInTheDocument();
    expect(blockedBankNifty).toHaveAttribute("aria-checked", "false");
    expect(blockedBankNifty).toHaveAttribute("aria-disabled", "true");
    expect(blockedBankNifty).not.toBeDisabled();

    fireEvent.click(removeNifty);

    await waitFor(() => expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(3));
    expect(within(topMetricsGrid).queryByText("NIFTY 50")).not.toBeInTheDocument();
    const addBankNifty = within(pickerMenu).getByRole("checkbox", { name: /Add BANK NIFTY to top metrics/i });
    expect(addBankNifty).not.toHaveAttribute("aria-disabled", "true");

    fireEvent.click(addBankNifty);

    await waitFor(() => expect(within(topMetricsGrid).getAllByRole("article")).toHaveLength(4));
    expect(within(topMetricsGrid).getByText("BANK NIFTY")).toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText("NIFTY 50")).not.toBeInTheDocument();
    expect(within(topMetricsGrid).queryByText(/Private bank leadership/i)).not.toBeInTheDocument();
  });

  it("lays out the market heatmap, breadth strip, and lower rail sections", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Full-width market heatmap/i });
    expect(within(heatmapSection).getByRole("heading", { name: /NIFTY 50 Heatmap/i })).toBeInTheDocument();
    const heatmapHeader = within(heatmapSection).getByRole("banner");
    const marketDepth = within(heatmapHeader).getByRole("group", { name: /Market depth/i });
    const heatmapPanel = heatmapSection.querySelector(".portfolio-heatmap-panel");
    const heatmapStage = within(heatmapSection).getByRole("img", {
      name: /NIFTY 50 stock heatmap grouped by sector/i,
    });

    expect(heatmapPanel).not.toContainElement(heatmapHeader);
    expect(heatmapStage.closest(".portfolio-heatmap-panel")).toBe(heatmapPanel);
    expect(within(heatmapPanel as HTMLElement).queryByRole("heading", { name: /NIFTY 50 Heatmap/i })).not.toBeInTheDocument();
    expect(within(marketDepth).getByText(/Adv/i)).toBeInTheDocument();
    expect(within(marketDepth).getByText(/Dec/i)).toBeInTheDocument();
    expect(within(marketDepth).getByText(/52W H\/L/i)).toBeInTheDocument();
    expect(within(marketDepth).getByText(/FII/i)).toBeInTheDocument();
    expect(within(marketDepth).getByText(/DII/i)).toBeInTheDocument();
    expect(within(heatmapSection).queryByText(/DEMO NIFTY 50 MARKET DATA/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Compact market breadth strip/i })).not.toBeInTheDocument();

    const lowerWorkspace = screen.getByRole("region", { name: /Indian market lower workspace/i });
    expect(within(lowerWorkspace).getByRole("heading", { name: /Recent Developments/i })).toBeInTheDocument();
    expect(within(lowerWorkspace).getByRole("heading", { name: /Names moving with force/i })).toBeInTheDocument();

    const lowerRail = within(lowerWorkspace).getByRole("complementary", { name: /Market movers and sectors/i });
    expect(within(lowerRail).getByRole("heading", { name: /Live Indian movers/i })).toBeInTheDocument();
    expect(within(lowerRail).getByRole("heading", { name: /Sector performance/i })).toBeInTheDocument();
  });

  it("renders market mover filters as a semantic slider without sample-data meta text", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const lowerRail = await screen.findByRole("complementary", { name: /Market movers and sectors/i });
    const moversHeading = within(lowerRail).getByRole("heading", { name: /Live Indian movers/i });
    const moversPanel = moversHeading.closest("section");
    expect(moversPanel).toBeTruthy();

    const tabGroup = within(moversPanel as HTMLElement).getByRole("group", { name: /Market mover category/i });
    const gainersButton = within(tabGroup).getByRole("button", { name: /Show gainers movers/i });
    const losersButton = within(tabGroup).getByRole("button", { name: /Show losers movers/i });
    const activeButton = within(tabGroup).getByRole("button", { name: /Show active movers/i });

    expect(within(moversPanel as HTMLElement).queryByText(/Sample data/i)).not.toBeInTheDocument();
    expect(tabGroup).toHaveClass("portfolio-mover-tabs", "is-gainers");
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

  it("keeps NIFTY heatmap sector labels on the shared stage background", async () => {
    window.history.pushState({}, "", "/markets");
    setViewportWidth(1440);
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Full-width market heatmap/i });
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

  it("uses vivid NIFTY heatmap tones for strong gain and loss moves", async () => {
    window.history.pushState({}, "", "/markets");
    render(<App />);

    const heatmapSection = await screen.findByRole("region", { name: /Full-width market heatmap/i });
    const strongGainTile = within(heatmapSection).getByRole("button", { name: /Zomato, \+3\.80%/i });
    const strongLossTile = within(heatmapSection).getByRole("button", { name: /Oil & Natural Gas Corp, -3\.16%/i });

    expect(strongGainTile.style.getPropertyValue("--heatmap-bg")).toBe("#63ad49");
    expect(strongGainTile.style.getPropertyValue("--heatmap-border")).toBe("rgba(126, 207, 91, 0.46)");
    expect(strongLossTile.style.getPropertyValue("--heatmap-bg")).toBe("#d25b75");
    expect(strongLossTile.style.getPropertyValue("--heatmap-border")).toBe("rgba(248, 116, 146, 0.46)");
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
    expect(screen.getByRole("heading", { name: /Earnings calendar/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/earnings");
  });

  it("opens Watchlist from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open watchlist/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Watchlist screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Tracked Indian assets/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/watchlist");
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
    expect(screen.getByRole("heading", { name: /Earnings calendar/i })).toBeInTheDocument();
    earningsView.unmount();

    window.history.pushState({}, "", "/watchlist");
    render(<App />);
    await waitFor(() => expect(screen.getByRole("region", { name: /Watchlist screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Tracked Indian assets/i })).toBeInTheDocument();
  });

  it("keeps standalone finance sections out of the portfolio workspace", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));

    await screen.findByRole("region", { name: /Synced portfolio screen/i });
    expect(screen.queryByRole("tablist", { name: /Portfolio finance sections/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Indian market overview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Earnings calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Tracked Indian assets/i })).not.toBeInTheDocument();
  });

  it("redirects portfolio workspace search to the top-level screener", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open your portfolio/i }));
    await screen.findByRole("region", { name: /Synced portfolio screen/i });

    const searchInput = screen.getByPlaceholderText("Search holdings, sectors, exposure...");
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
    expect(window.location.pathname).toBe("/news-pulse");

    fireEvent.click(screen.getByRole("button", { name: /Open global intelligence lens/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Global Intelligence Monitor/i })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/");
  });

  it("opens a full article from a direct article route", async () => {
    window.history.pushState({}, "", "/news-pulse/red-sea-freight");
    render(<App />);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Red Sea security posture keeps freight insurance bid/i })).toBeInTheDocument());
    expect(screen.getByText("Intelligence brief")).toBeInTheDocument();
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
