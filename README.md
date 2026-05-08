# Sovereign Lens

Sovereign Lens is a desktop/tablet-first finance terminal for geopolitical risk, market intelligence, portfolio exposure, and research workflows.

The canonical project brief is [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md). Future Codex/UI instructions live in [AGENTS.md](AGENTS.md).

## Run Locally

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

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
