import type { WatchContract } from "@/types";
import { VenueDetail } from "@/components/venue-detail";
import { formatTime } from "@/lib/utils";

export function WatchContractCard({ contract }: { contract: WatchContract }) {
  const { match, primary, backup, arriveBy, transitWarning, route } = contract;
  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {match.stage}
            </div>
            <h2 className="text-xl font-bold">
              {match.homeTeam} v {match.awayTeam}
            </h2>
            <p className="text-sm text-muted-foreground">
              {match.venueName} · kickoff {formatTime(match.kickoff)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Arrive by
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">
              {formatTime(arriveBy)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              kickoff − 45 min
            </div>
          </div>
        </div>
      </header>

      {transitWarning && (
        <div className="rounded-xl border border-likely/40 bg-likely/10 p-3 text-sm text-likely">
          ⚠️ {transitWarning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <VenueDetail scored={primary} role="primary" />
        <VenueDetail scored={backup} role="backup" />
      </div>

      {route && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Route to {primary.venue.name}</span>
            <span className="text-muted-foreground">
              {route.distanceKm} km · ~{route.durationMin} min ({route.mode})
            </span>
          </div>
          {route.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-likely">
              {route.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
