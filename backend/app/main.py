from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.data import COUNTRIES, GLOBAL_PULSE, MARKET_PULSE, SECTORS
from app.models import Country, GlobalPulse, MarketMovement, Sector


app = FastAPI(
    title="Sovereign Lens MVP API",
    version="0.1.0",
    description="Deterministic dummy-data API for the Sovereign Lens frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sovereign-lens-api"}


@app.get("/api/countries", response_model=list[Country])
def list_countries() -> list[Country]:
    return list(COUNTRIES.values())


@app.get("/api/countries/{iso3}", response_model=Country)
def get_country(iso3: str) -> Country:
    key = iso3.upper()
    if key not in COUNTRIES:
        raise HTTPException(status_code=404, detail=f"Country '{key}' is not available in the MVP dataset.")
    return COUNTRIES[key]


@app.get("/api/global-pulse", response_model=GlobalPulse)
def get_global_pulse() -> GlobalPulse:
    return GLOBAL_PULSE


@app.get("/api/market-pulse", response_model=list[MarketMovement])
def get_market_pulse() -> list[MarketMovement]:
    return MARKET_PULSE


@app.get("/api/sectors", response_model=list[Sector])
def list_sectors() -> list[Sector]:
    return list(SECTORS.values())


@app.get("/api/sectors/{sector_id}", response_model=Sector)
def get_sector(sector_id: str) -> Sector:
    if sector_id not in SECTORS:
        raise HTTPException(status_code=404, detail=f"Sector '{sector_id}' is not available in the MVP dataset.")
    return SECTORS[sector_id]
