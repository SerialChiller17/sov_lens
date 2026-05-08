import type { MarketTapeBasket } from "../../types";
import { formatPortfolioTapePrice } from "./portfolioFormatters";
import type { PortfolioHolding, PortfolioHoldingContext, PortfolioNewsCard, PortfolioPerformancePoint, PortfolioSuggestedPlay } from "./portfolioTypes";

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  {
    ticker: "ICICIBANK",
    name: "ICICI Bank",
    exchange: "NSE",
    sector: "Financials",
    shares: 96,
    price: 1809.9,
    value: 173750.4,
    allocation: 18.4,
    dayMove: 1.86,
    risk: "Medium",
    impact: "Bank Nifty leadership and credit growth",
  },
  {
    ticker: "TATAMOTORS",
    name: "Tata Motors",
    exchange: "NSE",
    sector: "Auto",
    shares: 180,
    price: 846.4,
    value: 152352,
    allocation: 16.1,
    dayMove: 2.25,
    risk: "High",
    impact: "EV cycle, JLR margin, and export demand",
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    sector: "IT Services",
    shares: 38,
    price: 3952.1,
    value: 150179.8,
    allocation: 15.9,
    dayMove: 0.52,
    risk: "Low",
    impact: "US tech spending and rupee translation",
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    exchange: "NSE",
    sector: "Financials",
    shares: 72,
    price: 1784.2,
    value: 128462.4,
    allocation: 13.6,
    dayMove: 1.4,
    risk: "Low",
    impact: "Deposit growth and rate-cycle sensitivity",
  },
  {
    ticker: "LT",
    name: "Larsen & Toubro",
    exchange: "NSE",
    sector: "Industrials",
    shares: 34,
    price: 3684.5,
    value: 125273,
    allocation: 13.1,
    dayMove: 0.74,
    risk: "Low",
    impact: "Domestic capex and order book visibility",
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    exchange: "NSE",
    sector: "Energy / Consumer",
    shares: 84,
    price: 1437.85,
    value: 120779.4,
    allocation: 12.8,
    dayMove: -1.8,
    risk: "Medium",
    impact: "Crude, refining margin, and telecom retail mix",
  },
  {
    ticker: "INFY",
    name: "Infosys",
    exchange: "NSE",
    sector: "IT Services",
    shares: 82,
    price: 1167.2,
    value: 95710.4,
    allocation: 10.1,
    dayMove: -0.93,
    risk: "Medium",
    impact: "Deal wins, US demand, and currency tailwind",
  },
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

export const PORTFOLIO_HOLDING_CONTEXT: Record<string, PortfolioHoldingContext> = {
  ICICIBANK: {
    riskReason: "High-quality bank, but it moves with the same private-bank cycle as HDFC Bank.",
    signal: "Leadership holding; confirms Bank Nifty breadth.",
    nextCheck: "Deposit cost and credit growth commentary.",
    exposureCluster: "Private banks",
  },
  TATAMOTORS: {
    riskReason: "Higher beta because JLR margins, exports, and EV demand can reprice quickly.",
    signal: "Main upside driver today, but momentum is already crowded.",
    nextCheck: "JLR margin and domestic PV volume.",
    exposureCluster: "Auto / exports",
  },
  TCS: {
    riskReason: "Lower balance-sheet risk, but exposed to US tech spending and guidance tone.",
    signal: "Quality anchor; needs demand confirmation.",
    nextCheck: "Order book, BFSI demand, and margin guidance.",
    exposureCluster: "IT services",
  },
  HDFCBANK: {
    riskReason: "Lower stock-specific risk, but adds to private-bank concentration.",
    signal: "Stability sleeve inside financials.",
    nextCheck: "NIM stabilisation and deposit growth.",
    exposureCluster: "Private banks",
  },
  LT: {
    riskReason: "Execution risk exists, but order-book visibility makes the holding cleaner.",
    signal: "Domestic capex exposure with steadier fundamentals.",
    nextCheck: "Order inflow and margin delivery.",
    exposureCluster: "Domestic capex",
  },
  RELIANCE: {
    riskReason: "Mixed conglomerate exposure; crude and refining spreads can offset consumer growth.",
    signal: "Main drag today from O2C uncertainty.",
    nextCheck: "Refining spread, Jio ARPU, and retail margin commentary.",
    exposureCluster: "Energy / consumer",
  },
  INFY: {
    riskReason: "Medium risk from US discretionary spending and cautious guidance.",
    signal: "Weak spot unless deal wins broaden.",
    nextCheck: "BFSI recovery and FY guidance tone.",
    exposureCluster: "IT services",
  },
};

export const PORTFOLIO_AI_TRUST = {
  lastUpdated: "Updated 9m ago",
  sourceCount: 49,
  confidence: "Medium-high",
  changedToday: ["Private banks widened leadership", "Tata Motors added most upside", "Reliance stayed the main drag"],
  assumptions: [
    "Portfolio values are local sample holdings, not a broker sync.",
    "Market/news references are frontend product-demo context.",
    "Recommendations are sizing logic, not trade execution.",
  ],
  needsConfirmation: ["Bank Nifty breadth after earnings", "JLR margin commentary", "IT demand beyond currency support"],
};

export const PORTFOLIO_INVESTED_VALUE = 900000;
export const PORTFOLIO_DAY_RETURN_PERCENT = 0.86;

export const PORTFOLIO_ALLOCATION_COLORS: Record<string, string> = {
  ICICIBANK: "#ecd76e",
  TATAMOTORS: "#ffb25f",
  TCS: "#57d7d2",
  HDFCBANK: "#74e59c",
  LT: "#9b7cff",
  RELIANCE: "#ff7aa8",
  INFY: "#8fd3ff",
};

export const PORTFOLIO_DONUT_SEGMENT_GAP = 0.38;

export const PORTFOLIO_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 825000 },
  { label: "Feb", value: 846500 },
  { label: "Mar", value: 832200 },
  { label: "Apr", value: 885400 },
  { label: "May", value: 912800 },
  { label: "Jun", value: 946507 },
];

export const NIFTY_50_PERFORMANCE: PortfolioPerformancePoint[] = [
  { label: "Jan", value: 825000 },
  { label: "Feb", value: 837600 },
  { label: "Mar", value: 829900 },
  { label: "Apr", value: 858300 },
  { label: "May", value: 884100 },
  { label: "Jun", value: 910500 },
];

export const PORTFOLIO_AI_NEWS: PortfolioNewsCard[] = [
  {
    id: "bank-nifty-credit-cycle",
    impact: "Banks / credit",
    headline: "Private banks lead as credit growth steadies and deposit costs cool",
    source: "Exchange feed",
    time: "1h ago",
    summary: "ICICI Bank and HDFC Bank are doing most of the portfolio's daily heavy lifting as financials recover leadership.",
    severity: "High Impact",
    tickers: ["ICICIBANK", "HDFCBANK"],
  },
  {
    id: "crude-relief-india",
    impact: "Crude / margins",
    headline: "Lower crude gives India-linked margins a cleaner macro backdrop",
    source: "Reuters",
    time: "2h ago",
    summary: "Energy-sensitive names get relief, but Reliance remains exposed to refining spread and O2C volatility.",
    severity: "High Impact",
    tickers: ["RELIANCE", "TATAMOTORS"],
  },
  {
    id: "it-rupee-translation",
    impact: "IT / currency",
    headline: "Rupee softness keeps IT translation support in focus",
    source: "Market desk",
    time: "3h ago",
    summary: "Infosys and TCS remain tied to US demand signals, but currency support softens downside in the near term.",
    severity: "Medium Impact",
    tickers: ["TCS", "INFY"],
  },
  {
    id: "capex-order-book",
    impact: "Capex / orders",
    headline: "Domestic capex visibility supports industrial order books",
    source: "Company filings",
    time: "4h ago",
    summary: "L&T remains the portfolio's cleanest domestic capex expression, helped by infrastructure and energy transition orders.",
    severity: "Low Impact",
    tickers: ["LT"],
  },
  {
    id: "auto-export-risk",
    impact: "Auto / exports",
    headline: "Auto names extend rally, but export sensitivity remains elevated",
    source: "Broker note",
    time: "5h ago",
    summary: "Tata Motors adds momentum but also lifts portfolio sensitivity to JLR margins, EV demand, and global risk appetite.",
    severity: "Medium Impact",
    tickers: ["TATAMOTORS"],
  },
  {
    id: "quality-fund-buffer",
    impact: "Fund buffer",
    headline: "Large-cap fund flows favor quality and lower volatility buffers",
    source: "AMFI sample",
    time: "6h ago",
    summary: "A diversified large-cap or flexi-cap fund can reduce single-stock risk while keeping Indian equity exposure intact.",
    severity: "Medium Impact",
    tickers: ["ICICIBANK", "HDFCBANK", "TCS"],
  },
];

export const PORTFOLIO_SUGGESTED_PLAYS: PortfolioSuggestedPlay[] = [
  {
    id: "trim-concentration",
    context: "Portfolio",
    priority: "High",
    riskLabel: "High risk",
    headline: "Reduce private-bank concentration",
    analysis: "ICICI Bank and HDFC Bank together drive a large share of portfolio behavior.",
    command: "Keep financials below a 30% sleeve before adding more bank exposure.",
    explanation:
      "Both banks are high-quality names, but the account now depends heavily on one sector cycle. This is a sizing risk, not a bearish call on banks.",
    logic: [
      "Financials carry the largest combined allocation and will move together when rates, deposits, or asset-quality expectations change.",
      "A 30% sleeve keeps bank leadership in the portfolio while creating room for industrials, consumption, or diversified funds.",
      "The goal is to reduce sector crowding without exiting the strongest part of the current market tape.",
    ],
    primaryAction: "Set sleeve target",
    secondaryAction: "View logic",
    confidence: "Medium",
    wouldChange: "This becomes less urgent if non-bank holdings regain leadership or financials fall below a 30% sleeve.",
    reasons: [
      { icon: "chip", text: "ICICI + HDFC = 32.0% allocation", emphasis: "32.0%" },
      { icon: "risk", text: "Main risk: bank cycle crowding" },
      { icon: "goal", text: "Goal: lower sector concentration", emphasis: "lower sector" },
    ],
  },
  {
    id: "watch-auto-beta",
    context: "Stock",
    priority: "High",
    riskLabel: "High risk",
    headline: "Wait for JLR margin confirmation",
    analysis: "Tata Motors is adding momentum, but its risk profile is still linked to global demand and JLR margins.",
    command: "Track JLR margin and EV volume before increasing exposure.",
    explanation:
      "Auto momentum can reverse quickly when export demand or margin commentary weakens. This brief treats Tata Motors as a higher-beta growth holding.",
    logic: [
      "Tata Motors now contributes meaningful upside, but the same position can increase drawdown if JLR commentary weakens.",
      "The clean confirmation set is JLR margin, domestic PV volume, EV order momentum, and commodity cost pressure.",
      "Waiting for confirmation reduces the chance of adding exposure after a momentum-led rally.",
    ],
    primaryAction: "Track margin",
    secondaryAction: "View logic",
    confidence: "High",
    wouldChange: "This turns constructive if JLR margin holds and EV volume grows without valuation stretching further.",
    reasons: [
      { icon: "chip", text: "Tata Motors = 16.1% allocation", emphasis: "16.1%" },
      { icon: "risk", text: "Main risk: export and margin beta" },
      { icon: "goal", text: "Goal: confirm before adding exposure", emphasis: "confirm" },
    ],
  },
  {
    id: "add-fund-buffer",
    context: "Mutual Fund",
    priority: "Medium",
    riskLabel: "Medium risk",
    headline: "Add a broad fund buffer",
    analysis: "A large-cap or flexi-cap fund can reduce single-stock risk while preserving Indian equity exposure.",
    command: "Compare one large-cap or flexi-cap fund against the current stock basket.",
    explanation:
      "A fund buffer is a risk-control tool, not a forecast. It keeps market participation while lowering dependence on a few direct stocks.",
    logic: [
      "Direct stock selection is concentrated in banks, IT, auto, energy, and capex.",
      "A broad fund buffer adds diversified exposure without forcing a full exit from the current winners.",
      "This recommendation is defensive sizing logic, not a bearish call on Indian equities.",
    ],
    primaryAction: "Compare funds",
    secondaryAction: "View logic",
    confidence: "Medium",
    wouldChange: "This is less important if direct-stock concentration falls or a broader diversified sleeve already exists.",
    reasons: [
      { icon: "chip", text: "7 stocks drive current portfolio behavior", emphasis: "7 stocks" },
      { icon: "risk", text: "Main risk: single-stock concentration" },
      { icon: "goal", text: "Goal: lower concentration", emphasis: "lower concentration" },
    ],
  },
];
