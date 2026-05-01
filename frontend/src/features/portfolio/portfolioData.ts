import type { MarketTapeBasket } from "../../types";
import { formatPortfolioTapePrice } from "./portfolioFormatters";
import type { PortfolioHolding, PortfolioPerformancePoint, PortfolioSuggestedPlay } from "./portfolioTypes";

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", shares: 210, price: 158.39, value: 33261.9, allocation: 18.4, dayMove: 1.6, risk: "Medium" },
  { ticker: "TSM", name: "Taiwan Semi", sector: "Foundry", shares: 94, price: 188.45, value: 17714.3, allocation: 9.8, dayMove: -0.7, risk: "High" },
  { ticker: "XOM", name: "Exxon Mobil", sector: "Energy", shares: 156, price: 117.28, value: 18295.68, allocation: 10.1, dayMove: 0.4, risk: "Medium" },
  { ticker: "LMT", name: "Lockheed Martin", sector: "Defense", shares: 27, price: 481.12, value: 12990.24, allocation: 7.2, dayMove: 0.9, risk: "Low" },
  { ticker: "ZIM", name: "ZIM Integrated", sector: "Shipping", shares: 530, price: 20.94, value: 11098.2, allocation: 6.1, dayMove: 2.8, risk: "High" },
  { ticker: "SPY", name: "S&P 500 ETF", sector: "Broad ETF", shares: 165, price: 521.41, value: 86032.65, allocation: 47.6, dayMove: 0.2, risk: "Low" },
];

export const PORTFOLIO_MARKET_TAPE: MarketTapeBasket = {
  label: "Portfolio Tape",
  items: PORTFOLIO_HOLDINGS.map((holding) => ({
    label: holding.ticker,
    value: formatPortfolioTapePrice(holding.price),
    move: `${holding.dayMove > 0 ? "+" : ""}${holding.dayMove.toFixed(2)}%`,
    direction: holding.dayMove >= 0 ? "up" : "down",
  })),
};

export const PORTFOLIO_INVESTED_VALUE = 184350.58;
export const PORTFOLIO_DAY_RETURN_PERCENT = 0.7;

export const PORTFOLIO_ALLOCATION_COLORS: Record<string, string> = {
  NVDA: "#ecd76e",
  TSM: "#ff7aa8",
  XOM: "#ffb25f",
  LMT: "#57d7d2",
  ZIM: "#9b7cff",
  SPY: "#74e59c",
};

export const PORTFOLIO_DONUT_SEGMENT_GAP = 0.38;

export const PORTFOLIO_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 162400 },
  { label: "Feb", value: 166900 },
  { label: "Mar", value: 164200 },
  { label: "Apr", value: 171800 },
  { label: "May", value: 176400 },
  { label: "Jun", value: 180940 },
];

export const NIFTY_50_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 162400 },
  { label: "Feb", value: 164150 },
  { label: "Mar", value: 163300 },
  { label: "Apr", value: 166850 },
  { label: "May", value: 169450 },
  { label: "Jun", value: 172980 },
];

export const PORTFOLIO_AI_NEWS = [
  { source: "Reuters", title: "Red Sea detours keep freight and energy risk bid", tickers: "ZIM, XOM", severity: "High" },
  { source: "Bloomberg", title: "Taiwan supplier checks lift chip continuity premium", tickers: "NVDA, TSM", severity: "High" },
  { source: "CNBC", title: "Defense names hold bid as budget language firms", tickers: "LMT", severity: "Medium" },
];

export const PORTFOLIO_SUGGESTED_PLAYS: PortfolioSuggestedPlay[] = [
  {
    id: "trim-concentration",
    context: "Portfolio",
    priority: "High",
    riskLabel: "High risk",
    headline: "Reduce SPY concentration",
    analysis: "SPY dominates account behavior; market beta now drives too much of the portfolio result.",
    command: "Cap allocation at 35% before adding more broad equity.",
    explanation:
      "SPY owns many stocks, but your account still depends heavily on one instrument. This brief flags account-level concentration, not SPY quality.",
    logic: [
      "SPY is diversified internally, but it is not diversified at the account level when it controls nearly half of total allocation.",
      "The portfolio's day-to-day behavior now tracks broad market beta more than individual security selection.",
      "A 35% cap keeps broad equity exposure while creating room for non-correlated holdings or targeted risk budgets.",
    ],
    primaryAction: "Set cap target",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "SPY = 47.6% allocation", emphasis: "47.6%" },
      { icon: "risk", text: "Main risk: one ETF drives behavior" },
      { icon: "goal", text: "Goal: lower single-instrument exposure", emphasis: "lower single-instrument" },
    ],
  },
  {
    id: "watch-shipping-beta",
    context: "Stock",
    priority: "High",
    riskLabel: "High risk",
    headline: "Confirm freight signal before adding ZIM",
    analysis: "ZIM is reacting to route stress; the premium can fade if freight rates stop confirming.",
    command: "Wait for freight-rate confirmation before increasing exposure.",
    explanation:
      "Shipping stocks can move quickly with insurance, route, and freight-rate changes. This brief treats ZIM as news-sensitive rather than a stable core holding.",
    logic: [
      "ZIM is a high-beta expression of freight stress, not a calm compounder. The signal needs confirmation from route premiums and insurance costs.",
      "If Red Sea rerouting pressure fades, the price premium can unwind faster than portfolio risk models usually expect.",
      "Waiting for freight-rate confirmation reduces the chance of adding exposure after the news premium has already peaked.",
    ],
    primaryAction: "Track freight",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "ZIM = 6.1% allocation", emphasis: "6.1%" },
      { icon: "risk", text: "Main risk: freight premium reverses" },
      { icon: "goal", text: "Goal: confirm before adding exposure", emphasis: "confirm" },
    ],
  },
  {
    id: "add-etf-buffer",
    context: "ETF / Fund",
    priority: "Medium",
    riskLabel: "Medium risk",
    headline: "Reduce chip concentration with a broad fund buffer",
    analysis: "A broad fund can reduce single-theme dependence while keeping market exposure.",
    command: "Compare one broad ETF or mutual fund against current chip exposure.",
    explanation:
      "A buffer is a risk-control tool, not a forecast. It helps keep market participation while lowering dependence on one sector headline.",
    logic: [
      "NVDA and TSM create a meaningful single-theme dependency even though they sit in different parts of the chip supply chain.",
      "A broad fund buffer keeps the account invested while lowering sensitivity to Taiwan, foundry continuity, and semiconductor headline shocks.",
      "This recommendation is defensive sizing logic, not a bearish call on chips.",
    ],
    primaryAction: "Compare funds",
    secondaryAction: "View logic",
    reasons: [
      { icon: "chip", text: "NVDA + TSM = 28.2% exposure", emphasis: "28.2%" },
      { icon: "risk", text: "Main risk: Taiwan / chip headlines" },
      { icon: "goal", text: "Goal: lower concentration", emphasis: "lower concentration" },
    ],
  },
];
