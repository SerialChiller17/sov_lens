from typing import Literal

from pydantic import BaseModel, Field


RiskLabel = Literal["Stable", "Developing", "High Risk"]
TradeFlow = Literal["export", "import"]


class Coordinates(BaseModel):
    lat: float
    lng: float


class TensionBreakdown(BaseModel):
    structural: float = Field(ge=1, le=10)
    sentiment: float = Field(ge=1, le=10)
    live_trigger: float = Field(ge=1, le=10)
    last_structural_update: str
    last_sentiment_update: str


class TradePartner(BaseModel):
    iso3: str
    name: str
    flow: TradeFlow
    share: float
    thesis: str


class MarketPoint(BaseModel):
    label: str
    value: float


class MarketIndex(BaseModel):
    symbol: str
    name: str
    currency: str
    change_24h: float
    series: list[MarketPoint]


class FxPulse(BaseModel):
    pair: str
    rate: float
    volatility_24h: float
    trigger: str


class Country(BaseModel):
    iso3: str
    iso_numeric: str
    name: str
    flag: str
    capital: str
    coordinates: Coordinates
    gdp_usd_bn: float
    population_mn: float
    gdp_growth_pct: float
    gdp_per_capita_usd: int
    gini: float
    tension_score: float = Field(ge=1, le=10)
    tension_label: RiskLabel
    tension_breakdown: TensionBreakdown
    groups: list[str]
    industry_criticality: list[str]
    trade_partners: list[TradePartner]
    market_index: MarketIndex
    fx: FxPulse
    contrarian_insight: str


class PulseAlert(BaseModel):
    id: str
    severity: RiskLabel
    region: str
    headline: str
    impact: str
    age_minutes: int


class GlobalPulse(BaseModel):
    alerts: list[PulseAlert]
    daily_briefs: list[str]
    last_structural_update: str
    last_sentiment_update: str


class MarketMovement(BaseModel):
    id: str
    instrument: str
    move_pct: float
    region: str
    trigger: str


class SectorArc(BaseModel):
    source: str
    target: str
    intensity: float = Field(ge=0, le=1)
    waypoint: str | None = None


class Chokepoint(BaseModel):
    id: str
    name: str
    coordinates: Coordinates
    watch: str


class Sector(BaseModel):
    id: str
    name: str
    color: str
    market_value: str
    systemic_multiplier: str
    sensitivity: float = Field(ge=1, le=10)
    power_nodes: list[str]
    consumption_nodes: list[str]
    arcs: list[SectorArc]
    chokepoints: list[Chokepoint]
    brief: str
    alpha: str
    equity_proxy: str
