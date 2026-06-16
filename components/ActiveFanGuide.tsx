"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat-engine";
import { SUGGESTED_PROMPTS } from "@/lib/chat-engine";
import RecommendationCard from "./RecommendationCard";
import { Bot, Send, Sparkles, User } from "lucide-react";

const SCAN_STEPS = [
  "Cross-checking Eventbrite listings…",
  "Reading r/nyc watch-party threads…",
  "Scoring spots against your sliders…",
  "Pinning the best match on the map…",
];

const BOOT_LINE =
  "Match Day online — France 2–1 Senegal live at MetLife. Tell me your vibe and I'll build a Watch Contract: where your fans gather, a backup if lines are long, transit from Chelsea, and optional rival roast mode if you want smoke.";

interface ActiveFanGuideProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onSelectPlace: (id: string) => void;
  onAskRoute?: () => void;
}

export default function ActiveFanGuide({
  messages,
  loading,
  onSend,
  onSelectPlace,
  onAskRoute,
}: ActiveFanGuideProps) {
  const [input, setInput] = useState("");
  const [scanIdx, setScanIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    const t = setInterval(() => setScanIdx((i) => (i + 1) % SCAN_STEPS.length), 900);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(() => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    onSend(t);
  }, [input, loading, onSend]);

  const showIntro = messages.length === 0 && !loading;

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#2563eb] via-[#6366f1] to-[#16a34a] shadow-[0_0_48px_rgba(37,99,235,0.12)] h-full min-h-0 flex flex-col">
      <div className="flex flex-col rounded-2xl bg-[#080a12] overflow-hidden h-full min-h-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-[#2563eb]/12 via-transparent to-[#16a34a]/12 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Match Day guide</h2>
              <p className="text-[11px] text-[#a5b4fc] font-medium mt-0.5 transition-all duration-200">
                {loading ? "Building your plan…" : SCAN_STEPS[scanIdx]}
              </p>
            </div>
          </div>
          {onAskRoute && (
            <button
              type="button"
              onClick={onAskRoute}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#F5C518] text-[#050508] hover:brightness-110 transition-colors shrink-0"
            >
              Route to match
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-3 min-h-0 bg-[#060810]/80">
          {showIntro && (
            <>
              <Bubble role="assistant">{BOOT_LINE}</Bubble>
              <div className="flex flex-col gap-1.5 chat-fade-in-fast">
                <p className="text-[10px] uppercase tracking-wider text-white/35 font-semibold px-1">
                  Try asking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onSend(prompt)}
                      className="text-left text-xs sm:text-sm font-medium px-2.5 py-2 rounded-lg border border-[#2563eb]/35 bg-[#2563eb]/10 text-white/90 hover:bg-[#2563eb]/20 hover:border-[#60a5fa]/50 transition-all leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 chat-fade-in-fast ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <MiniAvatar role={msg.role} />
              <div
                className={`max-w-[96%] rounded-2xl px-4 py-4 text-base leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-md bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] text-white border border-[#60a5fa]/30"
                    : "rounded-tl-md bg-[#111827] text-white/95 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
                }`}
              >
                <MessageBody content={msg.content} />
                {msg.recommendation && (
                  <RecommendationCard
                    rec={msg.recommendation}
                    onSelectPlace={onSelectPlace}
                  />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 chat-fade-in-fast">
              <MiniAvatar role="assistant" pulse />
              <div className="rounded-2xl rounded-tl-md px-4 py-3.5 bg-[#111827] border border-[#6366f1]/25">
                <span className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 p-3 border-t border-white/[0.08] bg-[#0a0c14]">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              rows={2}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask where to watch, what's surging on the map, or how to get to MetLife…"
              className="flex-1 rounded-xl bg-[#111827] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#6366f1]/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all resize-none min-h-[52px] max-h-[88px] leading-snug"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || loading}
              className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] text-white flex items-center justify-center disabled:opacity-30 hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "assistant";
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 chat-fade-in-fast">
      <MiniAvatar role={role} />
      <div className="rounded-2xl rounded-tl-md px-4 py-3.5 text-base leading-relaxed bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#6366f1]/30 text-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
        {children}
      </div>
    </div>
  );
}

function MiniAvatar({
  role,
  pulse,
}: {
  role: "user" | "assistant";
  pulse?: boolean;
}) {
  return (
    <div
      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        role === "user"
          ? "bg-white/10 border border-white/15"
          : "bg-gradient-to-br from-[#2563eb] to-[#6366f1] border border-white/20"
      } ${pulse ? "animate-pulse" : ""}`}
    >
      {role === "user" ? (
        <User className="w-4 h-4 text-white/80" />
      ) : (
        <Bot className="w-4 h-4 text-white" />
      )}
    </div>
  );
}

function MessageBody({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-[#F5C518]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}
