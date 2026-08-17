export type DiseaseId = "hiv" | "tb" | "malaria";

export type RegionId =
  | "nairobi"
  | "central"
  | "coast"
  | "eastern"
  | "northEastern"
  | "nyanza"
  | "riftValley"
  | "western";

export interface Region {
  id: RegionId;
  name: string;
  mapRect: { x: number; y: number; w: number; h: number };
}

export interface Disease {
  id: DiseaseId;
  name: string;
  fullName: string;
  description: string;
}

export interface HistoricalPoint {
  month: string;
  cases: number;
  type: "historical";
}

export interface ForecastPoint {
  month: string;
  cases: number;
  low: number;
  high: number;
  type: "forecast";
}

export type MonthlyPoint = HistoricalPoint | ForecastPoint;

export interface DiseaseMonthlyData {
  meta: {
    isSynthetic: boolean;
    note: string;
    currentMonth: string;
    historicalMonths: string[];
    forecastMonths: string[];
    generatedAt: string;
  };
  series: Record<DiseaseId, Record<RegionId, MonthlyPoint[]>>;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  googleId?: string;
  createdAt: string;
}

export type TrendStatus = "rising" | "declining" | "stable";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  [key: string]: unknown;
}
