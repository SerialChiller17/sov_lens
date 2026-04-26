import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { BootstrapData } from "./types";

vi.mock("react-globe.gl", () => ({
  default: ({ polygonsData = [], onPolygonClick, objectsData = [], onObjectClick, onObjectHover }: any) => (
    <div data-testid="globe">
      {polygonsData
        .filter((feature: any) => feature.properties.iso3)
        .map((feature: any) => (
          <button
            key={feature.properties.iso3}
            data-testid={`polygon-${feature.properties.iso3}`}
            onClick={() => onPolygonClick(feature)}
          >
            {feature.properties.iso3}
          </button>
        ))}
      {objectsData.map((object: any) => (
        <button
          key={object.id}
          data-testid={`object-${object.id}`}
          onClick={() => onObjectClick?.(object)}
          onMouseEnter={() => onObjectHover?.(object, null)}
          onMouseLeave={() => onObjectHover?.(null, object)}
        >
          {object.name}
        </button>
      ))}
    </div>
  ),
}));

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
  it("renders the geotagged news intelligence layout around the globe", async () => {
    render(<App />);

    expect(await screen.findByRole("complementary", { name: /AI insight explainer/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bab el-Mandeb corridor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Red Sea security posture keeps freight insurance bid/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /Related geotagged news/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Red Sea security posture keeps freight insurance bid/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hydrocarbons Route premium/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open News Pulse dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search countries, sectors, or conflicts/i })).toBeInTheDocument();
    expect(screen.getByTestId("polygon-IND")).toBeInTheDocument();
    expect(screen.getByTestId("object-red-sea")).toBeInTheDocument();
  });

  it("opens the global events dashboard from the top news control", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Open News Pulse dashboard/i }));

    expect(await screen.findByRole("heading", { name: /Global Event Archive/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search events, regions, or topics/i })).toBeInTheDocument();
    expect(screen.getByText("G20 Summit: Climate Deal Reached")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/news-pulse");

    fireEvent.click(screen.getByRole("button", { name: "Lens" }));

    await waitFor(() => expect(screen.getByRole("complementary", { name: /AI insight explainer/i })).toBeInTheDocument());
    expect(window.location.pathname).toBe("/");
  });

  it("updates the AI insight from a globe location click", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Bab el-Mandeb corridor" });

    fireEvent.click(await screen.findByTestId("object-taiwan-strait"));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Taiwan Strait" })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Taiwan Strait activity widens chip continuity hedge/i })).toBeInTheDocument();
    expect(screen.getByText(/TAIEX, SOXX, KRW/i)).toBeInTheDocument();
  });

  it("uses connected sector buttons to switch the active sector", async () => {
    render(<App />);
    await screen.findByRole("complementary", { name: /AI insight explainer/i });

    const hydrocarbons = screen.getByRole("button", { name: /Hydrocarbons Route premium/i });
    fireEvent.click(hydrocarbons);

    expect(hydrocarbons).toHaveClass("is-active");
    expect(screen.getAllByText("Shipping Insurance").length).toBeGreaterThan(0);
    expect(screen.queryByText("NVIDIA")).not.toBeInTheDocument();
  });

  it("uses the related news cards to select the active location", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Bab el-Mandeb corridor" });

    fireEvent.click(screen.getByRole("button", { name: /Ukraine infrastructure risk keeps Europe energy hedge alive/i }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Ukraine / Black Sea" })).toBeInTheDocument());
    expect(screen.getByText(/European gas, wheat, defense primes/i)).toBeInTheDocument();
  });

  it("highlights the related card when a globe marker is hovered", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Bab el-Mandeb corridor" });

    fireEvent.mouseEnter(screen.getByTestId("object-myanmar"));

    expect(screen.getByRole("button", { name: /Myanmar border pressure disrupts rare-earth logistics/i })).toHaveClass("is-hovered");
  });

  it("keeps global tape items while swapping the sector tape items", async () => {
    render(<App />);
    await screen.findByRole("complementary", { name: /AI insight explainer/i });

    expect(screen.getAllByText("DXY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("US10Y").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NVIDIA").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Hydrocarbons Route premium/i }));

    expect(screen.getAllByText("DXY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("US10Y").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Shipping Insurance").length).toBeGreaterThan(0);
    expect(screen.queryByText("NVIDIA")).not.toBeInTheDocument();
  });
});
