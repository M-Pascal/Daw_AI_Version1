import { getDiseases, getRegions } from "@/lib/data/store";
import { LiveForecastDashboard } from "@/components/live-forecast/live-forecast-dashboard";

export default async function LiveForecastPage() {
  const [diseases, regions] = await Promise.all([getDiseases(), getRegions()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Live Model Forecast
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forecasts served directly from the Python/LightGBM model through the FastAPI backend,
          with a drug-allocation planning estimate alongside the chart.
        </p>
      </div>
      <LiveForecastDashboard regions={regions} diseases={diseases} />
    </div>
  );
}
