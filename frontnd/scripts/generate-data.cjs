// Generates synthetic/demo disease case data for DawAI.
// This is NOT real epidemiological data. It is produced from generalized,
// publicly-known regional patterns (e.g. higher malaria/HIV burden around
// the Lake Victoria basin, higher TB burden in dense urban areas) combined
// with seasonal curves and deterministic pseudo-random noise, per the
// project proposal's synthetic-dataset methodology.
const fs = require("fs");
const path = require("path");

const REGIONS = [
  { id: "nairobi", name: "Nairobi", rect: { x: 260, y: 320, w: 90, h: 60 } },
  { id: "central", name: "Central", rect: { x: 250, y: 210, w: 140, h: 100 } },
  { id: "coast", name: "Coast", rect: { x: 300, y: 525, w: 170, h: 85 } },
  { id: "eastern", name: "Eastern", rect: { x: 250, y: 390, w: 200, h: 125 } },
  { id: "northEastern", name: "North Eastern", rect: { x: 260, y: 20, w: 200, h: 180 } },
  { id: "nyanza", name: "Nyanza", rect: { x: 10, y: 270, w: 90, h: 140 } },
  { id: "riftValley", name: "Rift Valley", rect: { x: 110, y: 30, w: 130, h: 470 } },
  { id: "western", name: "Western", rect: { x: 10, y: 150, w: 90, h: 120 } },
];

const DISEASES = [
  {
    id: "hiv",
    name: "HIV",
    fullName: "Human Immunodeficiency Virus",
    description: "Monthly newly reported HIV cases across public hospitals.",
    nationalBaseline: 1500,
    monthlyTrendRate: 0.0005,
    seasonal: [0.93, 0.97, 1.0, 1.02, 1.03, 1.05, 1.04, 1.02, 1.0, 0.99, 0.97, 0.92],
    regionWeights: {
      nyanza: 0.27, nairobi: 0.16, coast: 0.13, western: 0.12,
      riftValley: 0.11, eastern: 0.1, central: 0.07, northEastern: 0.04,
    },
  },
  {
    id: "tb",
    name: "TB",
    fullName: "Tuberculosis",
    description: "Monthly notified TB cases across public hospitals.",
    nationalBaseline: 2200,
    monthlyTrendRate: -0.002,
    seasonal: [0.97, 0.96, 0.98, 1.0, 1.0, 1.05, 1.08, 1.06, 1.0, 0.98, 0.97, 0.98],
    regionWeights: {
      nairobi: 0.22, coast: 0.15, nyanza: 0.14, riftValley: 0.13,
      eastern: 0.12, western: 0.1, central: 0.08, northEastern: 0.06,
    },
  },
  {
    id: "malaria",
    name: "Malaria",
    fullName: "Malaria",
    description: "Monthly confirmed malaria cases across public hospitals.",
    nationalBaseline: 18000,
    monthlyTrendRate: -0.0015,
    seasonal: [0.9, 0.85, 0.95, 1.25, 1.35, 1.15, 0.95, 0.85, 0.8, 0.95, 1.2, 1.15],
    regionWeights: {
      nyanza: 0.24, western: 0.18, coast: 0.16, eastern: 0.12,
      riftValley: 0.12, northEastern: 0.09, central: 0.05, nairobi: 0.04,
    },
  },
];

// Deterministic PRNG (mulberry32) so the "database" is stable across regenerations.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

const START_MONTH = "2021-01"; // earliest historical month
const CURRENT_MONTH = "2026-07"; // latest complete historical month
const FORECAST_MONTHS = 6;

function monthIndex(yearMonth) {
  const [y, m] = yearMonth.split("-").map(Number);
  return y * 12 + (m - 1);
}
const HISTORICAL_MONTHS = monthIndex(CURRENT_MONTH) - monthIndex(START_MONTH) + 1;

function monthsBack(yearMonth, count) {
  const [y, m] = yearMonth.split("-").map(Number);
  const list = [];
  for (let i = count - 1; i >= 0; i--) {
    const total = (y * 12 + (m - 1)) - i;
    const yy = Math.floor(total / 12);
    const mm = (total % 12) + 1;
    list.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }
  return list;
}
function monthsForward(yearMonth, count) {
  const [y, m] = yearMonth.split("-").map(Number);
  const list = [];
  for (let i = 1; i <= count; i++) {
    const total = (y * 12 + (m - 1)) + i;
    const yy = Math.floor(total / 12);
    const mm = (total % 12) + 1;
    list.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }
  return list;
}

const historicalMonths = monthsBack(CURRENT_MONTH, HISTORICAL_MONTHS);
const forecastMonths = monthsForward(CURRENT_MONTH, FORECAST_MONTHS);
const allMonths = [...historicalMonths, ...forecastMonths];

const series = {};

for (const disease of DISEASES) {
  series[disease.id] = {};
  for (const region of REGIONS) {
    const rng = mulberry32(seedFromString(`${disease.id}:${region.id}`));
    const weight = disease.regionWeights[region.id];
    const points = [];

    allMonths.forEach((ym, t) => {
      const monthIndex = Number(ym.split("-")[1]) - 1;
      const seasonalFactor = disease.seasonal[monthIndex];
      const trendFactor = Math.pow(1 + disease.monthlyTrendRate, t);
      const base = disease.nationalBaseline * weight * seasonalFactor * trendFactor;
      const isForecast = t >= historicalMonths.length;

      if (!isForecast) {
        const noise = 0.94 + rng() * 0.12; // +-6%
        points.push({
          month: ym,
          cases: Math.max(0, Math.round(base * noise)),
          type: "historical",
        });
      } else {
        const horizon = t - historicalMonths.length + 1;
        const band = 0.05 + 0.02 * horizon;
        const cases = Math.round(base);
        points.push({
          month: ym,
          cases,
          low: Math.max(0, Math.round(cases * (1 - band))),
          high: Math.round(cases * (1 + band)),
          type: "forecast",
        });
      }
    });

    series[disease.id][region.id] = points;
  }
}

const output = {
  meta: {
    isSynthetic: true,
    note:
      "Sample/demo data generated for development and demonstration purposes only, per the DawAI project proposal's synthetic-dataset methodology. Not real hospital or surveillance records.",
    currentMonth: CURRENT_MONTH,
    historicalMonths,
    forecastMonths,
    generatedAt: new Date().toISOString(),
  },
  series,
};

const dataDir = path.join(__dirname, "..", "src", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(
  path.join(dataDir, "disease-monthly-data.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, "regions.json"),
  JSON.stringify(
    REGIONS.map((r) => ({ id: r.id, name: r.name, mapRect: r.rect })),
    null,
    2
  )
);

fs.writeFileSync(
  path.join(dataDir, "diseases.json"),
  JSON.stringify(
    DISEASES.map((d) => ({
      id: d.id,
      name: d.name,
      fullName: d.fullName,
      description: d.description,
    })),
    null,
    2
  )
);

const usersPath = path.join(dataDir, "users.json");
if (!fs.existsSync(usersPath)) {
  fs.writeFileSync(usersPath, JSON.stringify([], null, 2));
}

console.log("Generated disease-monthly-data.json, regions.json, diseases.json");
console.log(`Historical: ${historicalMonths[0]} .. ${historicalMonths[historicalMonths.length - 1]}`);
console.log(`Forecast:   ${forecastMonths[0]} .. ${forecastMonths[forecastMonths.length - 1]}`);
