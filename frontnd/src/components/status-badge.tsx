import { cn } from "@/lib/utils";
import type { TrendStatus } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

// Trend direction maps onto the design system's shortage/surplus/balanced
// status colors for visual consistency, without using that inventory-style
// vocabulary in the disease-surveillance domain model itself.
const STATUS_CONFIG: Record<
  TrendStatus,
  { label: string; className: string; Icon: typeof ArrowUpRight }
> = {
  rising: {
    label: "Rising cases",
    className: "bg-shortage/10 text-shortage border-shortage/30",
    Icon: ArrowUpRight,
  },
  declining: {
    label: "Falling cases",
    className: "bg-surplus/15 text-surplus border-surplus/40",
    Icon: ArrowDownRight,
  },
  stable: {
    label: "Stable",
    className: "bg-balanced/10 text-balanced border-balanced/30",
    Icon: Minus,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TrendStatus;
  className?: string;
}) {
  const { label, className: statusClassName, Icon } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClassName,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
