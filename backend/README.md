# Forecasting API

FastAPI service that exposes the Kenya disease forecasting model to the
`frontnd` Next.js dashboard.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then `GET http://127.0.0.1:8000/api/forecast?region=nairobi&months=6` (add
`&disease=malaria` to filter to one disease; omit it to sum all three).

## Data sources

`predictor.get_forecast()` picks its data source automatically:

1. **Now:** reads `frontnd/src/data/disease-monthly-data.json`, the forecast
   export already produced by `Notebook/kenya_disease_forecasting_training.ipynb`
   (section 11). No extra setup needed.
2. **Once you copy the trained artifacts out of Google Drive:** drop them into
   `backend/models/` (`MODEL_DIR`) --
   - `{Disease}_h{1..6}_{p10,p50,p90}.txt` (54 LightGBM boosters)
   - `label_maps.json`, `feature_sets.json`
   - `latest_features.json` (written by the notebook's new "11e" export cell)

   and the API switches to live on-demand LightGBM inference with no code
   changes. Check `source` in the API response (`"json_export"` vs
   `"lightgbm_live"`) to see which path served a given request.

The model was trained to a 6-month horizon. Requests for more months come
back truncated (`truncated: true`, `availableMonths: 6`) rather than
erroring.
