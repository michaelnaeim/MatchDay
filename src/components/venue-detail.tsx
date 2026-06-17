import type { ScoredVenue } from "@/types";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { SOURCE_LABEL } from "@/lib/confidence";
import { cn } from "@/lib/utils";

// Renders one scored venue with its transparent reasons[] breakdown.
export function VenueDetail({
  scored,
  role,
}: {
  scored: ScoredVenue;
  role: "primary" | "backup";
}) {
  const { venue, reasons, confidence, source, score, distanceKm, matchedEvent } =
    scored;
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        role === "primary"
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {role === "primary" ? "Primary" : "Backup"}
            </span>
            <ConfidenceBadge level={confidence} />
          </div>
          <h3 className="mt-1 text-lg font-semibold">{venue.name}</h3>
          <p className="text-sm text-muted-foreground">
            {venue.neighborhood} · {distanceKm} km away · {SOURCE_LABEL[source]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">{Math.round(score)}</div>
          <div className="text-[10px] uppercase text-muted-foreground">score</div>
        </div>
      </div>

      {matchedEvent && (
        <a
          href={matchedEvent.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-lg bg-confirmed/10 px-3 py-2 text-sm text-confirmed ring-1 ring-confirmed/30"
        >
          🎉 {matchedEvent.title}
        </a>
      )}

      {/* Transparent scoring: why this venue, point by point. */}
      <details className="mt-3 group" open={role === "primary"}>
        <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
          Why this venue? ({reasons.length} reasons)
        </summary>
        <ul className="mt-2 space-y-1">
          {reasons.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-foreground/90">{r.detail}</span>
              <span
                className={cn(
                  "tabular-nums font-medium",
                  r.delta >= 0 ? "text-confirmed" : "text-likely",
                )}
              >
                {r.delta >= 0 ? "+" : ""}
                {r.delta}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
