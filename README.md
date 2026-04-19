# Sovereign Lens MVP

High-fidelity local MVP for a geopolitical risk and market intelligence globe.

## Run Locally

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173`.

From the repo root, after dependencies are installed:

```bash
npm run dev:backend
npm run dev:frontend
```

## Test

```bash
npm run test:backend
npm run test:frontend
```

If npm hangs on this Windows machine because Node attempts IPv6 registry connections, start the local proxy in a separate terminal and install through it:

```bash
python scripts\npm_registry_proxy.py
cd frontend
npm --registry=http://127.0.0.1:4873 install
```

## API

- `GET /api/health`
- `GET /api/countries`
- `GET /api/countries/{iso3}`
- `GET /api/global-pulse`
- `GET /api/market-pulse`
- `GET /api/sectors`
- `GET /api/sectors/{sectorId}`

The backend intentionally serves deterministic dummy data only.
