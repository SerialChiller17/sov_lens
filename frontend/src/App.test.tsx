import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { BootstrapData } from "./types";

vi.mock("cobe", () => ({
  default: vi.fn(() => ({
    update: vi.fn(),
    destroy: vi.fn(),
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
    expect(screen.getByRole("region", { name: /Portfolio dashboard/i })).toHaveTextContent(/Today's primary portfolio action/i);
    expect(screen.getByRole("region", { name: /Today's primary portfolio action/i })).toHaveTextContent(/Reduce private-bank concentration/i);
    expect(screen.getByRole("heading", { name: /Today's P&L/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Market drivers affecting your portfolio/i })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/portfolio");
  });

  it("opens the top-level screener screen from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open screener/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Screener screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Indian equity screener/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/screener");
  });

  it("opens Indian Markets from the top navigation", async () => {
    render(<App />);
    await screen.findByRole("region", { name: /Global Intelligence Monitor/i });

    fireEvent.click(screen.getByRole("button", { name: /Open Indian Markets/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Indian Markets screen/i })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Indian market overview/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/markets");
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
    expect(screen.getByRole("heading", { name: /Indian market overview/i })).toBeInTheDocument();
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

    const searchInput = screen.getByPlaceholderText("Search Indian stocks, sectors, funds...");
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

    fireEvent.click(screen.getByRole("button", { name: "Lens" }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Global Intelligence Monitor/i })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/");
  });

  it("opens a full article from a direct article route", async () => {
    window.history.pushState({}, "", "/news-pulse/red-sea-freight");
    render(<App />);

    await waitFor(() => expect(screen.getByRole("heading", { name: /Red Sea security posture keeps freight insurance bid/i })).toBeInTheDocument());
    expect(screen.getByText("Full news article")).toBeInTheDocument();
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
