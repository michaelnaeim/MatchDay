import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_PREFS,
  generateChatReply,
  type UserPreferences,
} from "@/lib/chat-engine";
import { defaultRivalFor } from "@/lib/rival-banter";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = String(body.message ?? "").trim();
  const prefs: UserPreferences = {
    ...DEFAULT_PREFS,
    ...body.prefs,
    rivalTeam: body.prefs?.rivalTeam ?? defaultRivalFor(body.prefs?.team ?? DEFAULT_PREFS.team),
  };

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Simulate agent latency — swap for Groq/OpenAI later
  await new Promise((r) => setTimeout(r, 900));

  const { reply, ranked } = generateChatReply(message, prefs);

  return NextResponse.json({
    message: reply,
    places: ranked,
    updatedAt: new Date().toISOString(),
  });
}
