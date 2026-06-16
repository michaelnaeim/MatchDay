"use client";

import { formatUpdatedAt } from "@/lib/labels";

interface LiveBadgeProps {
  updatedAt: string;
}

export default function LiveBadge({ updatedAt }: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute h-full w-full rounded-full bg-[#4ade80] opacity-60" />
        <span className="relative rounded-full h-2 w-2 bg-[#22c55e]" />
      </span>
      <span className="text-white/50 font-medium">Live · {formatUpdatedAt(updatedAt)}</span>
    </div>
  );
}
