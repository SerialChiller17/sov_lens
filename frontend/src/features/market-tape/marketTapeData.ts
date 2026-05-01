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
