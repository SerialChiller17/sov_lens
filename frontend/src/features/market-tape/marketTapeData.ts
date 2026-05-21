import type { MarketTapeBasket } from "../../types";

export const GLOBAL_MARKET_TAPE: MarketTapeBasket = {
  label: "Global Market + Risk Tape",
  items: [
    { label: "DXY", value: "106.42", move: "+0.18%", direction: "up" },
    { label: "US10Y", value: "4.61%", move: "+6 bp", direction: "up" },
    { label: "Gold Spot", value: "$2,386.40", move: "+0.42%", direction: "up" },
    { label: "Brent Crude", value: "$88.12", move: "-0.31%", direction: "down" },
    { label: "S&P 500", value: "5,214.08", move: "+0.18%", direction: "up" },
    { label: "Nasdaq 100", value: "18,084.70", move: "-0.27%", direction: "down" },
    { label: "Nifty 50", value: "24,152.80", move: "+0.36%", direction: "up" },
  ],
};

export const INDIAN_MARKET_TAPE: MarketTapeBasket = {
  label: "Indian Market Tape",
  items: [
    { label: "Nifty 50", value: "24,330.95", move: "+1.24%", direction: "up" },
    { label: "Sensex", value: "77,958.52", move: "+1.22%", direction: "up" },
    { label: "Bank Nifty", value: "55,981.05", move: "+2.63%", direction: "up" },
    { label: "Midcap 150", value: "22,904.12", move: "+0.58%", direction: "up" },
    { label: "India VIX", value: "13.84", move: "-2.10%", direction: "down" },
    { label: "USD/INR", value: "83.42", move: "-0.05%", direction: "down" },
  ],
};

export const WATCHLIST_MARKET_TAPE: MarketTapeBasket = {
  label: "Watchlist Tape",
  items: [
    { label: "Tracked", value: "6 names", move: "+4 up", direction: "up" },
    { label: "Alerts", value: "2 live", move: "+1", direction: "up" },
    { label: "Top Mover", value: "TATAMOTORS", move: "+2.25%", direction: "up" },
    { label: "Weak Spot", value: "RELIANCE", move: "-1.80%", direction: "down" },
    { label: "News Linked", value: "3 names", move: "+2", direction: "up" },
    { label: "Volume Flag", value: "ZOMATO", move: "+3.80%", direction: "up" },
  ],
};

export const FUNDS_MARKET_TAPE: MarketTapeBasket = {
  label: "Fund Benchmark Tape",
  items: [
    { label: "Nifty 50 TRI", value: "37,842.20", move: "+0.42%", direction: "up" },
    { label: "Nifty 500 TRI", value: "34,510.84", move: "+0.37%", direction: "up" },
    { label: "Midcap 150 TRI", value: "22,904.12", move: "+0.58%", direction: "up" },
    { label: "Smallcap 250 TRI", value: "18,226.45", move: "-0.18%", direction: "down" },
    { label: "Hybrid 50+50", value: "1,934.70", move: "+0.11%", direction: "up" },
    { label: "Nifty Debt", value: "2,918.64", move: "+0.04%", direction: "up" },
    { label: "Gold INR", value: "Rs 72,840", move: "+0.31%", direction: "up" },
  ],
};

export const EVENT_RISK_TAPE: MarketTapeBasket = {
  label: "Event Risk Tape",
  items: [
    { label: "Red Sea Risk", value: "Elevated", move: "+2", direction: "up" },
    { label: "Brent Crude", value: "$88.12", move: "-0.31%", direction: "down" },
    { label: "War Risk", value: "Firm", move: "+4 bp", direction: "up" },
    { label: "Gold Spot", value: "$2,386.40", move: "+0.42%", direction: "up" },
    { label: "Freight Basis", value: "Tight", move: "+1.8%", direction: "up" },
    { label: "DXY", value: "106.42", move: "+0.18%", direction: "up" },
  ],
};
