"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, UserPreferences } from "@/lib/chat-engine";
import { SUGGESTED_PROMPTS } from "@/lib/chat-engine";
import PreferenceSliders from "./PreferenceSliders";
import RecommendationCard from "./RecommendationCard";
import { Bot, Send, Sparkles, User } from "lucide-react";

const SCAN_STEPS = [
  "Pulling Eventbrite…",
  "Scanning r/nyc…",
  "Updating map heat…",
  "Routing from Chelsea…",
];

const BOOT_LINE =
  "France 2–1 Senegal is live. Where do you want to watch? I'll pin it on the map.";

interface ActiveFanGuideProps {
  prefs: UserPreferences;
  onPrefsChange: (prefs: UserPreferences) => void;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onSelectPlace: (id: string) => void;
  onAskRoute?: () => void;
}

export default function ActiveFanGuide({
  prefs,
  onPrefsChange,
  messages,
  loading,
  onSend,
  onSelectPlace,
  onAskRoute,
}: ActiveFanGuideProps) {
  const [input, setInput] = useState("");
  const [booted, setBooted] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [bootText, setBootText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, bootText]);

  useEffect(() => {
    let i = 0;
    const type = setInterval(() => {
      i += 2;
      setBootText(BOOT_LINE.slice(0, i));
      if (i >= BOOT_LINE.length) {
        clearInterval(type);
        setBooted(true);
      }
    }, 8);
    return () => clearInterval(type);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setScanIdx((i) => (i + 1) % SCAN_STEPS.length), 750);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(() => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    onSend(t);
  }, [input, loading, onSend]);

  const showBoot = messages.length === 0 && !loading && !booted;
  const showPrompts = booted && messages.length === 0 && !loading;

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#2563eb] via-[#6366f1] to-[#16a34a] shadow-[0_0_40px_rgba(37,99,235,0.1)] h-full min-h-0 flex flex-col">
      <div className="flex flex-col rounded-2xl bg-[#080a12] overflow-hidden h-full min-h-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-[#2563eb]/10 via-transparent to-[#16a34a]/10">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Match guide</h2>
            <p className="text-[11px] text-[#a5b4fc] font-medium mt-0.5 transition-all duration-200">
              {loading ? "Thinking…" : SCAN_STEPS[scanIdx]}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onAskRoute && (
            <button
              type="button"
              onClick={onAskRoute}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#F5C518] text-[#050508] hover:brightness-110 transition-colors"
            >
              Route to match
            </button>
          )}
        </div>
      </div>

      <PreferenceSliders prefs={prefs} onChange={onPrefsChange} collapsed={false} />

      <div className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4 space-y-3 min-h-0 bg-[#060810]/80">
        {showBoot && (
          <Bubble role="assistant">
            {bootText}
          <span className="inline-block w-0.5 h-3.5 bg-[#6366f1] ml-0.5 animate-pulse align-middle" />
          </Bubble>
        )}

        {showPrompts && (
          <div className="flex flex-wrap gap-2 chat-fade-in-fast">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSend(prompt)}
                className="text-[11px] font-medium px-3 py-2 rounded-full border border-[#2563eb]/30 bg-[#2563eb]/10 text-white/80 hover:bg-[#2563eb]/20 hover:border-[#60a5fa]/50 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 chat-fade-in-fast ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <MiniAvatar role={msg.role} />
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-md bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] text-white border border-[#60a5fa]/30"
                  : "rounded-tl-md bg-[#111827] text-white/90 border border-white/[0.08]"
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
          <div className="flex gap-2.5 chat-fade-in-fast">
            <MiniAvatar role="assistant" pulse />
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 bg-[#111827] border border-[#6366f1]/20">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-bounce"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/[0.06] bg-[#0a0c14] shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Ask where to watch or how to get to the match…"
            className="flex-1 rounded-xl bg-[#111827] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6366f1]/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!input.trim() || loading}
            className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] text-white flex items-center justify-center disabled:opacity-30 hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
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
    <div className="flex gap-2.5 chat-fade-in-fast">
      <MiniAvatar role={role} />
      <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[13px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#6366f1]/25 text-white/90 leading-relaxed">
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
      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
        role === "user"
          ? "bg-white/10 border border-white/15"
          : "bg-gradient-to-br from-[#2563eb] to-[#6366f1] border border-white/20"
      } ${pulse ? "animate-pulse" : ""}`}
    >
      {role === "user" ? (
        <User className="w-3.5 h-3.5 text-white/80" />
      ) : (
        <Bot className="w-3.5 h-3.5 text-white" />
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
