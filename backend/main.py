"""FastAPI service exposing the Kenya disease forecasting model.

Run locally with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from predictor import DISEASE_IDS, ForecastInputError, REGION_NAMES, get_forecast

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Kenya Disease Forecasting API",
    description="Serves regional disease-case forecasts for the DawAI dashboard.",
    version="1.0.0",
)

# The Next.js frontend runs on localhost:3000 in dev; the browser enforces
# CORS on the fetch() calls made from the dashboard, so the API must
# explicitly allow that origin or every request fails preflight.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta() -> dict[str, list[dict[str, str]]]:
    """Region/disease options for building frontend dropdowns."""
    return {
        "regions": [{"id": rid, "name": name} for rid, name in REGION_NAMES.items()],
        "diseases": [{"id": did} for did in DISEASE_IDS],
    }


@app.get("/api/forecast")
def forecast(
    region: str = Query(..., description="Region id, e.g. 'nairobi', or 'national' for all regions."),
    months: int = Query(..., ge=1, le=36, description="Forecast horizon in months."),
    disease: str | None = Query(
        None, description="Optional disease id ('hiv', 'tb', 'malaria'). Omit to sum all diseases."
    ),
) -> dict:
    try:
        return get_forecast(region=region, months=months, disease=disease)
    except ForecastInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        logger.exception("Forecast data source missing")
        raise HTTPException(status_code=500, detail=f"Forecast data unavailable: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 - surfaced to the client as a 500
        logger.exception("Unexpected error while computing forecast")
        raise HTTPException(status_code=500, detail="Internal error while computing forecast.") from exc
