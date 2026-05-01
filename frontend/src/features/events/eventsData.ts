import type { EventArchiveRow, EventTheme, GeotaggedNewsItem, HorizonEvent } from "./eventsTypes";

export const DEFAULT_NEWS_ID = "red-sea-freight";

export const PREMIUM_ORANGE_THEME: EventTheme = {
  accent: "#e88931",
  rgb: "232, 137, 49",
  onAccent: "#170a02",
};

function newsImageDataUri(primary: string, secondary: string, accent: string, motif: "shipping" | "strait" | "city" | "grid" | "border") {
  const motifPath = {
    shipping: `<path d="M48 132h352l-42 48H92z" fill="${accent}" opacity=".38"/><path d="M112 112h164l28 20H92z" fill="#f6efe8" opacity=".72"/><path d="M82 184c48-18 94-18 138 0s90 18 138 0" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="8" stroke-linecap="round"/>`,
    strait: `<path d="M120 56c64 64 46 136 0 224" fill="none" stroke="#f7efe7" stroke-opacity=".42" stroke-width="28" stroke-linecap="round"/><path d="M320 36c-78 88-46 160 10 240" fill="none" stroke="${accent}" stroke-opacity=".48" stroke-width="22" stroke-linecap="round"/><circle cx="238" cy="154" r="28" fill="#fff" opacity=".62"/>`,
    city: `<path d="M72 254h336" stroke="#fff" stroke-opacity=".34" stroke-width="8"/><path d="M104 124h48v130h-48zM174 82h64v172h-64zM260 112h50v142h-50zM330 62h44v192h-44z" fill="#f9f1e7" opacity=".52"/><circle cx="306" cy="90" r="46" fill="${accent}" opacity=".34"/>`,
    grid: `<path d="M76 78h306v172H76z" fill="#0b0e10" opacity=".42"/><path d="M96 102h266M96 132h266M96 162h266M96 192h266M96 222h266M130 92v166M178 92v166M226 92v166M274 92v166M322 92v166" stroke="#fff" stroke-opacity=".22" stroke-width="4"/><path d="M96 222l78-60 52 28 94-78 42 26" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    border: `<path d="M92 88c74-34 132-24 174 30 48 62 96 64 142 8" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="14" stroke-linecap="round"/><path d="M84 218c68-50 128-50 180 0 44 42 92 42 146 0" fill="none" stroke="${accent}" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/><circle cx="224" cy="160" r="54" fill="#fff" opacity=".18"/>`,
  }[motif];

  const dotField = Array.from({ length: 36 }, (_, index) => {
    const x = 34 + (index % 12) * 36;
    const y = 38 + Math.floor(index / 12) * 78;
    return `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset=".58" stop-color="${secondary}"/><stop offset="1" stop-color="#080a0c"/></linearGradient><radialGradient id="r" cx=".72" cy=".28" r=".55"><stop offset="0" stop-color="${accent}" stop-opacity=".72"/><stop offset=".52" stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="480" height="300" fill="url(#g)"/><rect width="480" height="300" fill="url(#r)"/><path d="M0 242c78-38 154-42 228-12s158 22 252-28v98H0z" fill="#050607" opacity=".42"/>${motifPath}<g opacity=".22">${dotField}</g></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const GEO_NEWS_FEED: GeotaggedNewsItem[] = [
  {
    id: DEFAULT_NEWS_ID,
    conflictId: "red-sea",
    title: "Red Sea security posture keeps freight insurance bid",
    location: "Bab el-Mandeb corridor",
    region: "Red Sea",
    lat: 16.8,
    lng: 41.6,
    severity: "High",
    time: "12m ago",
    source: "Shipping advisories / regional monitors",
    summary: "Rerouting remains the base case for exposed cargo while insurers keep war-risk premia elevated.",
    aiInsight:
      "The pressure point is not a single vessel delay. The route premium flows into landed energy costs, Asia-Europe inventory planning, and India-facing import buffers before physical scarcity appears.",
    marketRead: "Freight, crude optionality, and insurance spreads are the first signals to watch.",
    imageUrl: newsImageDataUri("#172023", "#513028", "#e96048", "shipping"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Route premium" },
      { id: "semiconductors", label: "Semiconductors", signal: "Asia-Europe lead times" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Battery inputs in transit" },
    ],
  },
  {
    id: "taiwan-air-maritime",
    conflictId: "taiwan-strait",
    title: "Taiwan Strait activity widens chip continuity hedge",
    location: "Taiwan Strait",
    region: "Indo-Pacific",
    lat: 24.2,
    lng: 119.7,
    severity: "Elevated",
    time: "25m ago",
    source: "Regional defense releases / market monitors",
    summary: "Air and maritime activity is keeping Taiwan-linked suppliers and Korea memory names under a wider risk lens.",
    aiInsight:
      "The investable read-through is broader than Taiwan beta. A short disruption window can hit substrate allocation, Japan specialty chemicals, Korea memory pricing, and US AI server delivery schedules.",
    marketRead: "TAIEX, SOXX, KRW, and supplier lead-time commentary should move first.",
    imageUrl: newsImageDataUri("#101f28", "#273d46", "#dc9d52", "strait"),
    sectors: [
      { id: "semiconductors", label: "Semiconductors", signal: "Foundry concentration" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Electronics inputs" },
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "LNG route risk" },
    ],
  },
  {
    id: "eastern-med-fragile",
    conflictId: "gaza-israel",
    title: "Eastern Mediterranean talks stay fragile",
    location: "Gaza / Israel",
    region: "Eastern Mediterranean",
    lat: 31.5,
    lng: 34.5,
    severity: "High",
    time: "38m ago",
    source: "UN / regional conflict trackers",
    summary: "Border operations and fragile talks continue to hold regional energy, defense, and FX channels in focus.",
    aiInsight:
      "The risk is a transmission chain. Diplomatic breakdown can push regional FX hedging, defense procurement expectations, and Eastern Mediterranean gas optionality without an immediate oil supply shock.",
    marketRead: "Watch Gulf FX, defense baskets, LNG headlines, and shipping insurance.",
    imageUrl: newsImageDataUri("#1d1918", "#4a342f", "#e96048", "city"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Gas optionality" },
      { id: "semiconductors", label: "Semiconductors", signal: "Defense electronics" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Battery supply redundancy" },
    ],
  },
  {
    id: "ukraine-infrastructure",
    conflictId: "ukraine",
    title: "Ukraine infrastructure risk keeps Europe energy hedge alive",
    location: "Ukraine / Black Sea",
    region: "Eastern Europe",
    lat: 49,
    lng: 31,
    severity: "Elevated",
    time: "1h ago",
    source: "Official releases / humanitarian trackers",
    summary: "Infrastructure exposure remains the key channel for gas, grain, and European industrial sentiment.",
    aiInsight:
      "The direct battlefield read matters less to markets than the asset class it threatens. Power assets, Black Sea grain routes, and European gas storage expectations keep the risk premium sticky.",
    marketRead: "European gas, wheat, defense primes, and EUR industrials carry the cleanest signal.",
    imageUrl: newsImageDataUri("#141b20", "#263136", "#dc9d52", "grid"),
    sectors: [
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Gas storage sensitivity" },
      { id: "critical-minerals", label: "Critical Minerals", signal: "Industrial input security" },
      { id: "semiconductors", label: "Semiconductors", signal: "Defense demand" },
    ],
  },
  {
    id: "myanmar-border",
    conflictId: "myanmar",
    title: "Myanmar border pressure disrupts rare-earth logistics",
    location: "Northern Myanmar",
    region: "Southeast Asia",
    lat: 21.9,
    lng: 95.9,
    severity: "Watch",
    time: "3h ago",
    source: "Conflict tracker / humanitarian monitors",
    summary: "Border pressure is keeping rare-earth and land-route logistics fragile across the Thailand and China corridor.",
    aiInsight:
      "This is a low-noise, high-leverage node. If border throughput deteriorates, battery and magnet supply chains feel it through processing bottlenecks before broad commodity screens react.",
    marketRead: "Rare earth processors, Thailand logistics, and China battery inputs are the early tells.",
    imageUrl: newsImageDataUri("#111c17", "#253229", "#b29b67", "border"),
    sectors: [
      { id: "critical-minerals", label: "Critical Minerals", signal: "Rare-earth logistics" },
      { id: "semiconductors", label: "Semiconductors", signal: "Magnet and tool inputs" },
      { id: "hydrocarbons", label: "Hydrocarbons", signal: "Regional transport costs" },
    ],
  },
];

export const HORIZON_EVENTS: HorizonEvent[] = [
  { id: "opec-review", label: "OPEC+ output guidance window", location: "Vienna", date: "17 Jun 2026" },
  { id: "g20-finance", label: "G20 finance deputies track", location: "New Delhi", date: "05 Jul 2026" },
  { id: "cop-brief", label: "Climate finance implementation brief", location: "Brasilia", date: "11 Aug 2026" },
];

export const EVENT_ARCHIVE_ROWS: EventArchiveRow[] = [
  {
    id: "eu-defense-pact",
    eventType: "Geopolitical",
    region: "Europe",
    location: "Paris",
    leaders: "Macron, Scholz",
    impact: "Major treaty",
    dateOccurred: "18 Nov 2025",
  },
  {
    id: "middle-east-corridor",
    eventType: "Resource Conflict",
    region: "Middle East",
    location: "Jerusalem",
    leaders: "Multiple parties",
    impact: "Low intensity",
    dateOccurred: "23 Jul 2025",
  },
  {
    id: "americas-trade",
    eventType: "Trade Agreement",
    region: "Americas",
    location: "Mexico City",
    leaders: "Trade envoys",
    impact: "High economic impact",
    dateOccurred: "14 Nov 2025",
  },
  {
    id: "indo-pacific-chip",
    eventType: "Technology Controls",
    region: "Indo-Pacific",
    location: "Taipei",
    leaders: "Regulators",
    impact: "Supply-chain premium",
    dateOccurred: "04 Dec 2025",
  },
  {
    id: "africa-food",
    eventType: "Food Security",
    region: "Africa",
    location: "Nairobi",
    leaders: "Regional bloc",
    impact: "Humanitarian watch",
    dateOccurred: "09 Jan 2026",
  },
];
