import type { ConfidenceLevel } from "@/types";
import { CONFIDENCE_META } from "@/lib/confidence";
import { cn } from "@/lib/utils";

export function ConfidenceBadge({
  level,
  className,
  title,
}: {
  level: ConfidenceLevel;
  className?: string;
  title?: string;
}) {
  const meta = CONFIDENCE_META[level];
  return (
    <span
      title={title ?? meta.explain}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.bg,
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.hex }}
      />
      {meta.label}
    </span>
  );
}
