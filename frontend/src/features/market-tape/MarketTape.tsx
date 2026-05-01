import type { MarketTapeBasket } from "../../types";
import { GLOBAL_MARKET_TAPE } from "./marketTapeData";
import "./MarketTape.css";

interface MarketTapeProps {
  basket: MarketTapeBasket;
  includeGlobalItems?: boolean;
  statusLabel?: string;
  baseBasket?: MarketTapeBasket;
}

export function MarketTape({
  basket,
  includeGlobalItems = true,
  statusLabel = "Live Markets",
  baseBasket = GLOBAL_MARKET_TAPE,
}: MarketTapeProps) {
  const globalLabels = new Set(baseBasket.items.map((item) => item.label));
  const lensItems = basket.items.filter((item) => !globalLabels.has(item.label));
  const items = includeGlobalItems ? [...baseBasket.items, ...lensItems] : basket.items;
  const tapeItems = [...items, ...items];

  return (
    <section className="market-tape" aria-label="Market and risk tape">
      <div className="market-tape-status">
        <span aria-hidden="true" />
        <strong>{statusLabel}</strong>
      </div>
      <div className="market-tape-viewport" aria-label="Global and active lens market tape">
        <div className="market-tape-track">
          {tapeItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className={`market-tape-item ${item.direction}`}
              aria-hidden={index >= items.length}
            >
              <span className="market-tape-label">{item.label}</span>
              <strong>{item.value}</strong>
              <span className="market-tape-move">{item.move}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
