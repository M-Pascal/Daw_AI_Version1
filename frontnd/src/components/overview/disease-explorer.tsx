"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MostAffectedChart } from "@/components/overview/most-affected-chart";
import type { Disease, DiseaseId } from "@/lib/types";
import type { OutbreakEntry } from "@/lib/data/derive";

export function DiseaseExplorer({
  diseases,
  outbreaksByDisease,
}: {
  diseases: Disease[];
  outbreaksByDisease: Record<DiseaseId, OutbreakEntry[]>;
}) {
  const [selected, setSelected] = useState<DiseaseId>(diseases[0]?.id ?? "hiv");
  const activeDisease = diseases.find((d) => d.id === selected) ?? diseases[0];
  const outbreak = outbreaksByDisease[selected] ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Most affected areas &middot; {activeDisease?.name}</CardTitle>
            <CardDescription>
              Regions ranked by current {activeDisease?.name} case burden.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {diseases.map((disease) => (
              <button
                key={disease.id}
                type="button"
                onClick={() => setSelected(disease.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selected === disease.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                )}
              >
                {disease.name}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MostAffectedChart data={outbreak} diseaseName={activeDisease?.name ?? ""} />
      </CardContent>
    </Card>
  );
}
