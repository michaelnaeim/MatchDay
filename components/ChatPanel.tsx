"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, UserPreferences } from "@/lib/chat-engine";
import { SUGGESTED_PROMPTS } from "@/lib/chat-engine";
import PreferenceSliders from "./PreferenceSliders";
import RecommendationCard from "./RecommendationCard";
import { Send, Sparkles, User, Bot } from "lucide-react";

interface ChatPanelProps {
  prefs: UserPreferences;
  onPrefsChange: (prefs: UserPreferences) => void;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onSelectPlace: (id: string) => void;
}

export default function ChatPanel({
  prefs,
  onPrefsChange,
  messages,
  loading,
  onSend,
  onSelectPlace,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [slidersOpen, setSlidersOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    onSend(t);
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl glass-panel overflow-hidden shadow-panel">
      <div className="shrink-0 px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-premium-gold/10 border border-premium-gold/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-premium-gold" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-premium-cream">Fan Guide</h2>
          <p className="text-[10px] text-premium-muted">AI concierge · watch spots & routes</p>
        </div>
      </div>

      <PreferenceSliders
        prefs={prefs}
        onChange={onPrefsChange}
        collapsed={!slidersOpen}
        onToggle={() => setSlidersOpen((v) => !v)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-premium-muted leading-relaxed">
              France vs Senegal is live. Tell me your vibe — I&apos;ll find watch
              spots and transit from Chelsea.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSend(prompt)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-white/[0.08] bg-premium-elevated/80 text-premium-cream/70 hover:border-premium-gold/35 hover:text-premium-cream transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-white/10"
                  : "bg-premium-gold/10 border border-premium-gold/20"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-white/70" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-premium-gold" />
              )}
            </div>
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-premium-france/25 border border-premium-france-light/25 text-premium-cream"
                  : "bg-premium-elevated border border-white/[0.06] text-premium-cream/90"
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
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-premium-gold/10 border border-premium-gold/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-premium-gold animate-pulse" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-premium-elevated border border-white/[0.06]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 p-3 border-t border-white/[0.06] bg-premium-surface/80">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about France vs Senegal watch spots…"
            rows={2}
            className="flex-1 resize-none rounded-xl bg-premium-elevated border border-white/[0.08] px-3 py-2.5 text-sm text-premium-cream placeholder:text-premium-muted/60 focus:outline-none focus:border-premium-gold/40"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-premium-gold text-premium-bg flex items-center justify-center disabled:opacity-40 hover:brightness-110 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBody({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
