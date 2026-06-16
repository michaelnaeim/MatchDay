"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildTickerMessages,
  nextLiveMessage,
  type LiveFanMessage,
} from "@/lib/live-simulation";

interface LiveChatTickerProps {
  teamCode?: string;
}

export default function LiveChatTicker({ teamCode }: LiveChatTickerProps) {
  const [mounted, setMounted] = useState(false);
  const [stream, setStream] = useState<LiveFanMessage[]>([]);

  useEffect(() => {
    setMounted(true);
    setStream(buildTickerMessages(20));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fast = setInterval(() => {
      setStream((prev) => {
        const next = nextLiveMessage(teamCode);
        return [...prev.slice(-30), next];
      });
    }, 280);
    return () => clearInterval(fast);
  }, [mounted, teamCode]);

  const rowA = useMemo(() => [...stream, ...stream], [stream]);
  const rowB = useMemo(
    () => [...stream.slice().reverse(), ...stream.slice().reverse()],
    [stream]
  );

  if (!mounted) {
    return (
      <div className="h-[88px] rounded-xl bg-premium-elevated/50 animate-pulse" />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-muted">
          Live fan wire
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-premium-live font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-premium-live opacity-75" />
            <span className="relative rounded-full h-1.5 w-1.5 bg-premium-live" />
          </span>
          {stream.length}+ messages · updating live
        </span>
      </div>

      <div className="ticker-mask overflow-hidden rounded-xl border border-white/[0.06] bg-black/30">
        <div className="flex animate-ticker whitespace-nowrap py-2.5 gap-3">
          {rowA.map((msg, i) => (
            <TickerChip key={`a-${msg.id}-${i}`} msg={msg} />
          ))}
        </div>
      </div>

      <div className="ticker-mask overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
        <div className="flex animate-ticker-reverse whitespace-nowrap py-2.5 gap-3">
          {rowB.map((msg, i) => (
            <TickerChip key={`b-${msg.id}-${i}`} msg={msg} variant="alt" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickerChip({
  msg,
  variant,
}: {
  msg: LiveFanMessage;
  variant?: "alt";
}) {
  const teamColor =
    msg.team === "FRA"
      ? "border-premium-france-light/30 bg-premium-france/20"
      : msg.team === "SEN"
        ? "border-premium-senegal-light/30 bg-premium-senegal/20"
        : "border-white/10 bg-white/[0.04]";

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs shrink-0 ${
        variant === "alt" ? "opacity-90" : ""
      } ${teamColor}`}
    >
      <span className="text-sm">{msg.avatar}</span>
      <span className="text-premium-muted font-medium">@{msg.user}</span>
      <span className="text-white/20">·</span>
      <span className="text-premium-cream/90 max-w-[220px] truncate">
        {msg.text}
      </span>
      <span className="text-[10px] text-premium-muted/60 hidden sm:inline">
        {msg.zone}
      </span>
    </span>
  );
}
