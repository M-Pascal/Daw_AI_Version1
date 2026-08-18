"""Prediction logic for the Kenya disease forecasting model.

Trained artifacts (54 LightGBM quantile boosters + label/feature maps) are
produced by ``Notebook/kenya_disease_forecasting_training.ipynb`` inside
Google Colab and saved to Google Drive -- they are not part of this repo.
Until those files are copied into ``MODEL_DIR``, ``get_forecast`` serves
real, model-derived numbers from the notebook's own
``disease-monthly-data.json`` export (see notebook section 11), which the
Next.js dashboard already reads. The moment ``MODEL_DIR`` is populated with
the files listed below, ``get_forecast`` switches to live on-demand
LightGBM inference automatically -- no API changes required.

MODEL_DIR must contain, once available:
    - ``{Disease}_h{1..6}_{p10,p50,p90}.txt``  (notebook section 7)
    - ``label_maps.json``, ``feature_sets.json``  (notebook section 5)
    - ``latest_features.json``  (notebook section 11e)
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent

MODEL_DIR = Path(os.environ.get("MODEL_DIR", BACKEND_DIR / "models"))
DASHBOARD_JSON_PATH = Path(
    os.environ.get(
        "DASHBOARD_JSON_PATH",
        REPO_ROOT / "frontnd" / "src" / "data" / "disease-monthly-data.json",
    )
)

REGION_NAMES: dict[str, str] = {
    "nairobi": "Nairobi",
    "central": "Central",
    "coast": "Coast",
    "eastern": "Eastern",
    "northEastern": "North Eastern",
    "nyanza": "Nyanza",
    "riftValley": "Rift Valley",
    "western": "Western",
}
REGION_IDS = list(REGION_NAMES)

# dashboard id -> CSV/model name, matching DISEASE_ID_MAP in the notebook
DISEASE_NAMES: dict[str, str] = {"hiv": "HIV", "tb": "TB", "malaria": "Malaria"}
DISEASE_IDS = list(DISEASE_NAMES)

MAX_TRAINED_HORIZON_MONTHS = 6  # HORIZONS = [1..6] in the training notebook
QUANTILE_MODELS = ("p10", "p50", "p90")

REQUIRED_LIVE_FILES = ("label_maps.json", "feature_sets.json", "latest_features.json")


class ForecastInputError(ValueError):
    """Bad region/disease/months input. Callers should map this to HTTP 400."""


def _validate_inputs(region: str, months: int, disease: str | None) -> None:
    if region != "national" and region not in REGION_IDS:
        raise ForecastInputError(
            f"Unknown region '{region}'. Expected 'national' or one of: "
            f"{', '.join(REGION_IDS)}."
        )
    if disease is not None and disease not in DISEASE_IDS:
        raise ForecastInputError(
            f"Unknown disease '{disease}'. Expected one of: {', '.join(DISEASE_IDS)}."
        )
    if not isinstance(months, int) or isinstance(months, bool):
        raise ForecastInputError("'months' must be an integer.")
    if months < 1 or months > 36:
        raise ForecastInputError("'months' must be between 1 and 36.")


def _model_artifacts_available() -> bool:
    return MODEL_DIR.is_dir() and all((MODEL_DIR / name).exists() for name in REQUIRED_LIVE_FILES)


@lru_cache(maxsize=1)
def _load_dashboard_export() -> dict[str, Any]:
    with open(DASHBOARD_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _forecast_from_export(region: str, months: int, disease: str | None) -> dict[str, Any]:
    """Fallback path: sum the notebook's precomputed forecast export."""
    data = _load_dashboard_export()
    diseases = [disease] if disease else DISEASE_IDS
    regions = REGION_IDS if region == "national" else [region]

    forecast_months: list[str] = data["meta"]["forecastMonths"]
    available = min(months, len(forecast_months))
    target_months = forecast_months[:available]

    recent_history_months: list[str] = data["meta"]["historicalMonths"][-6:]

    totals = {m: {"cases": 0, "low": 0, "high": 0} for m in target_months}
    history_totals = {m: 0 for m in recent_history_months}

    for d in diseases:
        per_region = data["series"].get(d, {})
        for r in regions:
            for point in per_region.get(r, []):
                if point["type"] == "forecast" and point["month"] in totals:
                    totals[point["month"]]["cases"] += point["cases"]
                    totals[point["month"]]["low"] += point.get("low", point["cases"])
                    totals[point["month"]]["high"] += point.get("high", point["cases"])
                elif point["type"] == "historical" and point["month"] in history_totals:
                    history_totals[point["month"]] += point["cases"]

    return {
        "source": "json_export",
        "modelNote": (
            "Served from the training notebook's precomputed forecast export "
            "(disease-monthly-data.json). Drop the trained LightGBM artifacts "
            "into MODEL_DIR for live on-demand inference."
        ),
        "generatedAt": data["meta"].get("generatedAt"),
        "availableMonths": len(forecast_months),
        "history": [{"month": m, "cases": history_totals[m]} for m in recent_history_months],
        "forecast": [
            {
                "month": m,
                "cases": totals[m]["cases"],
                "low": totals[m]["low"],
                "high": totals[m]["high"],
            }
            for m in target_months
        ],
    }


def _forecast_live(region: str, months: int, disease: str | None) -> dict[str, Any]:
    """Live path: real LightGBM quantile-regression inference from MODEL_DIR."""
    import lightgbm as lgb

    with open(MODEL_DIR / "latest_features.json", "r", encoding="utf-8") as f:
        latest_rows: list[dict[str, Any]] = json.load(f)
    with open(MODEL_DIR / "feature_sets.json", "r", encoding="utf-8") as f:
        feature_sets: dict[str, list[str]] = json.load(f)

    disease_names = [DISEASE_NAMES[disease]] if disease else list(DISEASE_NAMES.values())
    rows = [
        r
        for r in latest_rows
        if (region == "national" or r["region"] == region) and r["disease_name"] in disease_names
    ]
    if not rows:
        raise ForecastInputError(f"No trained data available for region '{region}'.")

    booster_cache: dict[str, "lgb.Booster"] = {}

    def get_booster(disease_name: str, horizon: int, quantile: str) -> "lgb.Booster":
        key = f"{disease_name}_h{horizon}_{quantile}"
        if key not in booster_cache:
            booster_cache[key] = lgb.Booster(model_file=str(MODEL_DIR / f"{key}.txt"))
        return booster_cache[key]

    rows_by_disease: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        rows_by_disease.setdefault(row["disease_name"], []).append(row)

    available = min(months, MAX_TRAINED_HORIZON_MONTHS)

    forecast_points = []
    for h in range(1, available + 1):
        totals = {"p10": 0.0, "p50": 0.0, "p90": 0.0}
        target_month = None
        for disease_name, group in rows_by_disease.items():
            feature_names = feature_sets[disease_name]
            X = [[row["features"][feat] for feat in feature_names] for row in group]
            for q in QUANTILE_MODELS:
                preds = get_booster(disease_name, h, q).predict(X)
                totals[q] += float(sum(max(0.0, p) for p in preds))
            target_month = group[0]["target_months"][h - 1]

        forecast_points.append(
            {
                "month": target_month,
                "cases": round(totals["p50"]),
                "low": round(totals["p10"]),
                "high": round(totals["p90"]),
            }
        )

    return {
        "source": "lightgbm_live",
        "modelNote": "Served from live LightGBM quantile-regression inference (MODEL_DIR).",
        "generatedAt": None,
        "availableMonths": MAX_TRAINED_HORIZON_MONTHS,
        "history": [],
        "forecast": forecast_points,
    }


def get_forecast(region: str, months: int, disease: str | None = None) -> dict[str, Any]:
    """Forecast for `region` ("national" for all 8 regions summed) over `months` ahead.

    Raises ForecastInputError for bad input. The trained model only covers a
    6-month horizon; requests beyond that come back truncated (with
    ``truncated: true``) rather than erroring, since the caller may still
    want whatever real forecast is available.
    """
    _validate_inputs(region, months, disease)

    result = (
        _forecast_live(region, months, disease)
        if _model_artifacts_available()
        else _forecast_from_export(region, months, disease)
    )

    forecast_points = result["forecast"]

    return {
        "region": region,
        "regionName": "National (all regions)" if region == "national" else REGION_NAMES[region],
        "disease": disease,
        "diseaseName": DISEASE_NAMES.get(disease, "All diseases") if disease else "All diseases",
        "requestedMonths": months,
        "availableMonths": result["availableMonths"],
        "truncated": months > result["availableMonths"],
        "source": result["source"],
        "modelNote": result["modelNote"],
        "generatedAt": result["generatedAt"],
        "timeline": [p["month"] for p in forecast_points],
        "cases": [p["cases"] for p in forecast_points],
        "low": [p["low"] for p in forecast_points],
        "high": [p["high"] for p in forecast_points],
        "history": result["history"],
        "totalForecastedCases": sum(p["cases"] for p in forecast_points),
    }
