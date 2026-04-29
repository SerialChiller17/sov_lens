import type { MonitorAffectedSector, MonitorAffectedStock, MonitorEventDetail, MonitorRelatedNews, MonitorSuggestedPlay } from "./types";

function monitorImageDataUri(base: string, wash: string, accent: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${base}"/>
          <stop offset="0.58" stop-color="${wash}"/>
          <stop offset="1" stop-color="#070707"/>
        </linearGradient>
        <radialGradient id="r" cx="72%" cy="34%" r="58%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.55"/>
          <stop offset="0.52" stop-color="${accent}" stop-opacity="0.12"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="p" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 17H34M17 0V34" stroke="#ffffff" stroke-opacity="0.07"/>
        </pattern>
      </defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <rect width="640" height="360" fill="url(#r)"/>
      <rect width="640" height="360" fill="url(#p)"/>
      <path d="M72 248C176 148 288 294 414 116C470 38 552 82 594 36" fill="none" stroke="${accent}" stroke-width="5" stroke-opacity="0.58"/>
      <path d="M86 286C198 206 288 312 420 170C506 78 560 118 612 82" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.22"/>
      <circle cx="454" cy="112" r="32" fill="${accent}" fill-opacity="0.24" stroke="${accent}" stroke-opacity="0.82" stroke-width="3"/>
      <circle cx="454" cy="112" r="8" fill="${accent}"/>
      <text x="42" y="62" fill="#ffffff" fill-opacity="0.72" font-family="IBM Plex Mono, Consolas, monospace" font-size="22" letter-spacing="3">${label}</text>
      <text x="42" y="318" fill="#ffffff" fill-opacity="0.42" font-family="IBM Plex Mono, Consolas, monospace" font-size="15" letter-spacing="2">SOVEREIGN LENS SIGNAL</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const logisticsSectors: MonitorAffectedSector[] = [
  { label: "Shipping", exposure: "High", signal: "Route premiums and vessel delays move first." },
  { label: "Energy", exposure: "High", signal: "Crude freight and fuel hedges reprice quickly." },
  { label: "Insurance", exposure: "Medium", signal: "War-risk coverage becomes the transmission channel." },
];

const policySectors: MonitorAffectedSector[] = [
  { label: "Defense", exposure: "High", signal: "Procurement and security budgets gain attention." },
  { label: "Industrials", exposure: "Medium", signal: "Capex plans become more sensitive to policy language." },
  { label: "Banks", exposure: "Medium", signal: "Rates, sanctions, and credit tone shape flows." },
];

const macroSectors: MonitorAffectedSector[] = [
  { label: "Materials", exposure: "High", signal: "Commodity demand expectations set the first read." },
  { label: "Machinery", exposure: "Medium", signal: "Equipment orders react to investment momentum." },
  { label: "Consumer", exposure: "Medium", signal: "Confidence and credit feed earnings expectations." },
];

const techSectors: MonitorAffectedSector[] = [
  { label: "Semiconductors", exposure: "High", signal: "Memory, AI servers, and export controls dominate." },
  { label: "Hardware", exposure: "Medium", signal: "Supply timing affects margins and channel inventory." },
  { label: "FX Sensitive Exporters", exposure: "Medium", signal: "Currency moves change revenue translation." },
];

const energySectors: MonitorAffectedSector[] = [
  { label: "Refiners", exposure: "High", signal: "Crack spreads and import bills are the fastest signals." },
  { label: "Utilities", exposure: "Medium", signal: "Fuel cost pass-through becomes the key question." },
  { label: "Freight", exposure: "Medium", signal: "Bunker costs influence regional route economics." },
];

const shippingStocks: MonitorAffectedStock[] = [
  { ticker: "ZIM", name: "ZIM Integrated", exposure: "High", signal: "Spot freight sensitivity" },
  { ticker: "FRO", name: "Frontline", exposure: "Medium", signal: "Tanker route premiums" },
  { ticker: "XOM", name: "Exxon Mobil", exposure: "Medium", signal: "Crude risk hedge" },
];

const policyStocks: MonitorAffectedStock[] = [
  { ticker: "LMT", name: "Lockheed Martin", exposure: "High", signal: "Defense budget read-through" },
  { ticker: "BA", name: "Boeing", exposure: "Medium", signal: "Trade and security orders" },
  { ticker: "JPM", name: "JPMorgan", exposure: "Medium", signal: "Policy and rates channel" },
];

const macroStocks: MonitorAffectedStock[] = [
  { ticker: "BHP", name: "BHP Group", exposure: "High", signal: "Iron ore and copper beta" },
  { ticker: "CAT", name: "Caterpillar", exposure: "Medium", signal: "Capex cycle proxy" },
  { ticker: "RIO", name: "Rio Tinto", exposure: "Medium", signal: "China demand proxy" },
];

const techStocks: MonitorAffectedStock[] = [
  { ticker: "NVDA", name: "NVIDIA", exposure: "High", signal: "AI server demand" },
  { ticker: "TSM", name: "Taiwan Semi", exposure: "High", signal: "Foundry continuity" },
  { ticker: "MU", name: "Micron", exposure: "Medium", signal: "Memory pricing" },
];

const energyStocks: MonitorAffectedStock[] = [
  { ticker: "RELIANCE", name: "Reliance Industries", exposure: "High", signal: "Refining margin sensitivity" },
  { ticker: "SHEL", name: "Shell", exposure: "Medium", signal: "LNG and crude flows" },
  { ticker: "BP", name: "BP", exposure: "Medium", signal: "Energy route risk" },
];

function related(id: string, title: string, summary: string): MonitorRelatedNews[] {
  return [
    {
      id: `${id}-markets`,
      title,
      source: "Reuters",
      timestamp: "10 min ago",
      summary,
    },
    {
      id: `${id}-flows`,
      title: "Cross-asset desks watch the second-order flow",
      source: "CNBC",
      timestamp: "24 min ago",
      summary: "Rates, FX, freight, and sector ETFs are being checked for confirmation before risk is repriced more broadly.",
    },
    {
      id: `${id}-policy`,
      title: "Policy response timing becomes the next catalyst",
      source: "Bloomberg",
      timestamp: "42 min ago",
      summary: "The next official statement matters because it can turn a local event into a broader capital-allocation signal.",
    },
  ];
}

function suggestedPlays(id: string, sectors: MonitorAffectedSector[], stocks: MonitorAffectedStock[]): MonitorSuggestedPlay[] {
  const primarySector = sectors[0];
  const secondarySector = sectors[1] ?? sectors[0];
  const primaryStock = stocks[0];
  const secondaryStock = stocks[1] ?? stocks[0];

  return [
    {
      id: `${id}-stock-watch`,
      assetType: "Stock",
      title: `${primaryStock.ticker} stock watch`,
      thesis: `Cash-market watch on ${primaryStock.name} and listed peers if ${primarySector.signal.toLowerCase()}`,
      horizon: "1-3w",
      confidence: "Medium",
    },
    {
      id: `${id}-etf-watch`,
      assetType: "ETF",
      title: `${secondarySector.label} ETF watch`,
      thesis: `Track sector ETF or mutual fund exposure tied to ${secondarySector.label.toLowerCase()} as confirmation builds.`,
      horizon: "2-6w",
      confidence: "Low",
    },
  ];
}

function detail(
  image: [string, string, string, string],
  aiInsight: string,
  affectedSectors: MonitorAffectedSector[],
  affectedStocks: MonitorAffectedStock[],
  relatedNews: MonitorRelatedNews[],
): MonitorEventDetail {
  return {
    imageUrl: monitorImageDataUri(...image),
    aiInsight,
    affectedSectors,
    affectedStocks,
    suggestedPlays: suggestedPlays(image[3].toLowerCase().replace(/\s+/g, "-"), affectedSectors, affectedStocks),
    relatedNews,
  };
}

export const MONITOR_EVENT_DETAILS: Record<string, MonitorEventDetail> = {
  "red-sea-shipping-risk": detail(
    ["#1a1716", "#4e2924", "#ff4d3f", "RED SEA"],
    "The practical risk is not the headline itself, but the cost of avoiding it. If carriers keep rerouting, freight prices, delivery schedules, and energy cargo insurance can all tighten at once. That makes this a margin-pressure story before it becomes a demand story.",
    logisticsSectors,
    shippingStocks,
    related("red-sea", "Freight desks keep Red Sea detours in base-case models", "Forwarders are still pricing a slower route network, keeping delivery buffers and insurance premiums elevated."),
  ),
  "usa-policy-cycle": detail(
    ["#151719", "#30343a", "#c88452", "US POLICY"],
    "This is a policy-volatility event. Markets usually absorb regulation when timing is clear, but uncertainty around scope can delay capex and raise discount rates for strategic sectors. The impact is highest where revenue depends on licenses, subsidies, or export permissions.",
    policySectors,
    policyStocks,
    related("usa-policy", "Washington signals keep strategic sectors on watch", "Investors are mapping policy language into defense, banks, industrials, and advanced technology exposure."),
  ),
  "canada-critical-minerals": detail(
    ["#122019", "#2c3a33", "#e4a15f", "MINERALS"],
    "Critical minerals are becoming a security asset, not just a commodity input. The market impact builds through permitting speed, offtake agreements, and grid bottlenecks. Battery and defense supply chains benefit if the corridor turns from announcement to capacity.",
    energySectors,
    [
      { ticker: "ALB", name: "Albemarle", exposure: "High", signal: "Lithium supply beta" },
      { ticker: "LAC", name: "Lithium Americas", exposure: "High", signal: "North America project optionality" },
      { ticker: "NEM", name: "Newmont", exposure: "Medium", signal: "Mining risk read-through" },
    ],
    related("canada-minerals", "North American mineral corridors draw fresh capital", "Battery, grid, and defense buyers are watching whether policy support becomes faster project execution."),
  ),
  "mexico-nearshoring": detail(
    ["#181512", "#3b3328", "#dc9d52", "NEARSHORE"],
    "Nearshoring only helps margins if border throughput and power reliability keep up. This event matters because it can turn a structural opportunity into a near-term bottleneck, especially for auto suppliers and electronics assemblers.",
    [
      { label: "Autos", exposure: "High", signal: "Border dwell time directly hits production flow." },
      { label: "Industrial Parks", exposure: "Medium", signal: "Power and water access set leasing quality." },
      { label: "Logistics", exposure: "High", signal: "Truck and rail capacity becomes a premium asset." },
    ],
    [
      { ticker: "GM", name: "General Motors", exposure: "Medium", signal: "Mexico production footprint" },
      { ticker: "KSU", name: "Kansas City Southern", exposure: "Medium", signal: "Rail corridor sensitivity" },
      { ticker: "APTV", name: "Aptiv", exposure: "Medium", signal: "Auto supply chain proxy" },
    ],
    related("mexico-nearshore", "Border capacity becomes the nearshoring pressure point", "Manufacturing commitments are rising, but logistics reliability is still the deciding variable."),
  ),
  "peru-copper-output": detail(
    ["#171412", "#3a2921", "#c98248", "COPPER"],
    "Copper risk has an outsized market signal because inventories are thin. Even a modest production wobble can move expectations for industrial metals, mining equities, and inflation-sensitive infrastructure names.",
    macroSectors,
    macroStocks,
    related("peru-copper", "Copper traders watch mine output and port movement", "The market is looking for confirmation that supply can meet a firmer industrial demand impulse."),
  ),
  "china-demand-pulse": detail(
    ["#171719", "#322d29", "#e96048", "CHINA"],
    "China demand is a global risk switch. If credit support turns into real activity, commodities and machinery get a tailwind. If the data stays soft, the pressure moves into exporters, luxury demand, and commodity currencies.",
    macroSectors,
    macroStocks,
    related("china-demand", "China credit impulse remains central to global risk tone", "Commodity desks and exporters are waiting for demand data to confirm whether stimulus is reaching the real economy."),
  ),
  "japan-yen-intervention": detail(
    ["#121923", "#263342", "#7fb3ff", "YEN"],
    "Yen pressure matters because it can change the global funding mood. Intervention risk can steady imported inflation, but it also makes exporters and carry trades more sensitive to official language.",
    [
      { label: "Exporters", exposure: "High", signal: "Currency translation drives earnings revisions." },
      { label: "Banks", exposure: "Medium", signal: "Yield-curve expectations affect margins." },
      { label: "Travel", exposure: "Medium", signal: "FX moves shape inbound spending." },
    ],
    [
      { ticker: "TM", name: "Toyota", exposure: "High", signal: "Exporter FX beta" },
      { ticker: "SONY", name: "Sony", exposure: "Medium", signal: "Revenue translation" },
      { ticker: "MUFG", name: "Mitsubishi UFJ", exposure: "Medium", signal: "JGB yield sensitivity" },
    ],
    related("japan-yen", "FX desks parse Japan intervention language", "Markets are watching whether official comments become action as yen volatility remains elevated."),
  ),
  "korea-memory-cycle": detail(
    ["#101923", "#25313d", "#a46cff", "MEMORY"],
    "Korea is a clean read on the AI hardware cycle. Memory pricing can show whether data-center demand is broadening beyond the headline chip leaders into suppliers, exporters, and regional FX.",
    techSectors,
    techStocks,
    related("korea-memory", "Memory pricing keeps Korea linked to AI server demand", "HBM and DRAM signals are being used as confirmation for the broader semiconductor cycle."),
  ),
  "india-energy-imports": detail(
    ["#151817", "#303525", "#e7a24b", "INDIA"],
    "India's risk is a current-account and margin story. Higher crude and shipping costs can pressure refiners, the rupee, and consumer fuel sensitivity, even if domestic demand remains healthy.",
    energySectors,
    energyStocks,
    related("india-energy", "India watches crude volatility and shipping premiums", "Energy import costs remain one of the fastest channels from global route risk into domestic markets."),
  ),
  "sri-lanka-port-flows": detail(
    ["#101916", "#25332e", "#63d0a4", "PORTS"],
    "Port-flow data is useful because it often moves before official trade releases. A change in transshipment patterns can reveal stress in Indian Ocean routing, bunker demand, and regional container availability.",
    logisticsSectors,
    shippingStocks,
    related("sri-lanka-ports", "Indian Ocean transshipment trends stay in focus", "Container and bunker indicators are being watched for early signs of rerouting stress."),
  ),
  "france-eu-diplomacy": detail(
    ["#15161b", "#2f3038", "#d8b16a", "EU TRACK"],
    "This is a coordination-risk event. The market cares less about one meeting and more about whether Europe can align security spending, trade posture, and fiscal messaging without widening sovereign spreads.",
    policySectors,
    policyStocks,
    related("france-eu", "European security and trade files remain linked", "Investors are watching whether coordinated policy reduces uncertainty or creates new budget pressure."),
  ),
  "spain-energy-terminal": detail(
    ["#10191d", "#27343b", "#5ab7d8", "LNG"],
    "Iberian LNG flexibility matters when Europe needs optionality. Terminal utilization, TTF spreads, and power margins can show whether gas supply is abundant or simply better distributed.",
    energySectors,
    energyStocks,
    related("spain-lng", "Iberian LNG terminals stay relevant to gas flexibility", "European gas desks continue to monitor send-out, storage, and power-market margins."),
  ),
  "hong-kong-capital-flow": detail(
    ["#12141b", "#252a34", "#b48cff", "HK FLOW"],
    "Hong Kong is a flow signal for China risk. Liquidity, IPO appetite, and southbound buying can reveal whether investors are adding exposure or simply trading short-term policy optimism.",
    [
      { label: "Banks", exposure: "High", signal: "HIBOR and liquidity move risk appetite." },
      { label: "Exchanges", exposure: "High", signal: "Listings and turnover affect earnings." },
      { label: "Internet Platforms", exposure: "Medium", signal: "China beta flows through quickly." },
    ],
    [
      { ticker: "HKXCY", name: "Hong Kong Exchanges", exposure: "High", signal: "Listing and turnover beta" },
      { ticker: "BABA", name: "Alibaba", exposure: "Medium", signal: "China sentiment proxy" },
      { ticker: "HSBC", name: "HSBC", exposure: "Medium", signal: "HK liquidity channel" },
    ],
    related("hong-kong-flow", "Hong Kong liquidity gives a fast read on China risk", "Capital-market activity is being watched as a real-time confidence indicator."),
  ),
  "philippines-maritime-pressure": detail(
    ["#1a1515", "#3d2726", "#ff5b4d", "MARITIME"],
    "Maritime pressure is a regional security premium. The first impact is not broad war risk; it is higher insurance, more cautious shipping behavior, and a firmer bid for defense and surveillance exposure.",
    logisticsSectors,
    shippingStocks,
    related("philippines-maritime", "Regional maritime incidents keep insurers alert", "Shipping, defense, and fisheries exposure remain the active market transmission points."),
  ),
  "malaysia-malacca-flow": detail(
    ["#111815", "#26342f", "#ff8d4d", "MALACCA"],
    "Malacca is a concentration-risk corridor. Any stress here matters because energy, containers, and electronics move through the same narrow path, creating a single chokepoint for multiple sectors.",
    logisticsSectors,
    [
      { ticker: "MAERSK-B", name: "Maersk", exposure: "High", signal: "Container flow proxy" },
      { ticker: "SHEL", name: "Shell", exposure: "Medium", signal: "Energy cargo exposure" },
      { ticker: "TSM", name: "Taiwan Semi", exposure: "Medium", signal: "Electronics supply route" },
    ],
    related("malacca-flow", "Malacca corridor remains a core logistics monitor", "Energy, container, and electronics markets are watching vessel density for early stress."),
  ),
};
