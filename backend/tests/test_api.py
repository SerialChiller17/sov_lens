from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_countries_include_full_sidebar_data() -> None:
    response = client.get("/api/countries")
    assert response.status_code == 200
    countries = response.json()
    assert len(countries) >= 12
    india = next(country for country in countries if country["iso3"] == "IND")
    assert india["market_index"]["series"]
    assert india["trade_partners"]
    assert india["contrarian_insight"]


def test_country_lookup_and_404() -> None:
    response = client.get("/api/countries/TWN")
    assert response.status_code == 200
    assert response.json()["tension_label"] == "High Risk"

    missing = client.get("/api/countries/ZZZ")
    assert missing.status_code == 404


def test_global_pulse() -> None:
    response = client.get("/api/global-pulse")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["alerts"]) == 3
    assert len(payload["daily_briefs"]) == 3


def test_market_pulse() -> None:
    response = client.get("/api/market-pulse")
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_sectors_include_arcs_and_chokepoints() -> None:
    response = client.get("/api/sectors")
    assert response.status_code == 200
    sectors = response.json()
    assert {sector["id"] for sector in sectors} == {"semiconductors", "hydrocarbons", "critical-minerals"}
    assert all(sector["arcs"] for sector in sectors)
    assert all(sector["chokepoints"] for sector in sectors)


def test_sector_lookup_and_404() -> None:
    response = client.get("/api/sectors/semiconductors")
    assert response.status_code == 200
    assert response.json()["equity_proxy"] == "SOXX / TSM"

    missing = client.get("/api/sectors/unknown")
    assert missing.status_code == 404
