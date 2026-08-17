# JalDrishti — Intelligent Groundwater System

JalDrishti runs as four local services:

```text
PostgreSQL → Express API (:5000) → React/Vite frontend (:5173)
                  ↓
             FastAPI ML service (:8000)
```

The frontend calls the Express API only; it does not call the ML service directly.

## Project layout

| Directory | Purpose |
| --- | --- |
| `frontend/` | React + Vite UI |
| `backend/` | Express API, Prisma, NWDP ingestion and ML orchestration |
| `backend/prisma/` | PostgreSQL schema, migrations and seed script |
| `ml-service/` | FastAPI ML endpoints |

## Prerequisites

- Node.js 20+ and npm
- Python 3.10+
- PostgreSQL running on port `5432`

Expected connection:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/jaldrishti
```

> Current diagnostic: `Get-Service *postgres*` returned no service and `Test-NetConnection localhost -Port 5432` failed. Install and start PostgreSQL before the backend can return data.

## 1. Start PostgreSQL

Install PostgreSQL using its official installer, then create the database:

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE jaldrishti;"
```

Verify it:

```powershell
Test-NetConnection localhost -Port 5432
psql -U postgres -h localhost -p 5432 -d jaldrishti -c "SELECT current_database();"
```

`TcpTestSucceeded` must be `True`.

## 2. Environment configuration

### `backend/.env`

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/jaldrishti
ML_BASE_URL=http://localhost:8000
NWDP_BASE_URL=https://nwdp.nwic.gov.in
NWDP_API_PATH=/api/action/datastore_search
NWDP_RESOURCE_ID=7a821ef4-b73b-4243-9a42-4f1a6f300230
DEFAULT_STATE=Maharashtra
NWDP_BATCH_SIZE=1000
ENABLE_SCHEDULER=false
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_DATA=false
```

### `ml-service/.env`

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/jaldrishti
```

The ML extraction layer reads `DATABASE_URL`; do not configure separate database credentials.

## 3. Install backend dependencies and migrate

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

Inspect tables and data:

```powershell
npx prisma studio
psql -U postgres -h localhost -p 5432 -d jaldrishti -c "\dt"
psql -U postgres -h localhost -p 5432 -d jaldrishti -c "SELECT COUNT(*) AS stations FROM \"Station\";"
psql -U postgres -h localhost -p 5432 -d jaldrishti -c "SELECT COUNT(*) AS readings FROM \"GroundwaterReading\";"
```

Optional metadata/assessment seed (requires station data and `ml-service/gsda_matched_review.csv`):

```powershell
npx prisma db seed
```

For a new development-only schema change:

```powershell
npx prisma migrate dev --name <migration_name>
```

Do not use `prisma migrate reset` against data you need to retain.

## 4. Start ML service

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Verify from another terminal:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

## 5. Start backend

```powershell
cd backend
npm install
npm run dev
```

Verify database-backed health:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/health
```

Both endpoints must report a connected database. HTTP `500` means PostgreSQL, credentials, database name, or migrations require attention.

## 6. Ingest real NWDP data

```powershell
Invoke-RestMethod -Method Post http://localhost:5000/api/ingestion/start
```

Then verify API data:

```powershell
Invoke-RestMethod http://localhost:5000/api/stations
Invoke-RestMethod http://localhost:5000/api/districts
Invoke-RestMethod http://localhost:5000/api/alerts
```

## 7. Start frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). In DevTools → Network, station, district and alert calls must target `http://localhost:5000/api/...` and return HTTP `200`.

## API reference

| Endpoint | Data source |
| --- | --- |
| `GET /health`, `GET /api/health` | PostgreSQL connectivity |
| `GET /api/stations` | `Station`, latest readings, recharge and assessment data |
| `GET /api/stations/:stationId` | Station details |
| `GET /api/stations/:stationId/readings` | `GroundwaterReading` |
| `GET /api/stations/:stationId/recharge` | `RechargeResult` / ML calculation |
| `GET /api/stations/:stationId/forecast` | Backend → ML forecast |
| `GET /api/districts` | Aggregated station, assessment, reading and alert data |
| `GET /api/alerts` | Recorded `Alert` rows only |
| `POST /api/ingestion/start` | NWDP → PostgreSQL ingestion |

## Validation

```powershell
# Frontend
cd frontend
npm run build
npm run lint
npm test -- --run

# Backend source checks
cd ..\backend
node --check src\controllers\station.controller.js
node --check src\controllers\alert.controller.js

# Service connectivity
Test-NetConnection localhost -Port 5432
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/stations
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Frontend API error | Confirm `VITE_API_BASE_URL=http://localhost:5000/api`, backend is running, and inspect DevTools Network. |
| Backend HTTP 500 | Run `Test-NetConnection localhost -Port 5432`, then check credentials and apply migrations. |
| API returns `[]` | Run ingestion and check `Station` / `GroundwaterReading` counts. Empty data is intentionally shown as an empty state. |
| Forecast/recharge fails | Confirm `Invoke-RestMethod http://localhost:8000/health` succeeds and `ML_BASE_URL` is correct. |
| ML imports fail | Activate `.venv` and rerun `pip install -r requirements.txt`. |

## Data integrity behaviour

- The frontend API service does not fall back to `mockData` on failure.
- Station Explorer, Map, Station Detail and Alerts use backend API data with loading, error and empty states.
- The backend does not auto-create demo alerts or generate random reading values.
