import type { ChatMessage } from "@/types";

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

/** Sends the conversation to /api/ai and streams the reply. onText receives the whole reply so far. */
export async function askAI(
  messages: ChatMessage[],
  onText?: (full: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new AIError("Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    let msg = "The AI request failed.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = String(j.error);
    } catch {
      /* keep the generic message */
    }
    throw new AIError(msg, res.status);
  }
  if (!res.body) throw new AIError("The server sent an empty reply.");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      full += dec.decode(value, { stream: true });
      onText?.(full);
    }
    full += dec.decode();
    onText?.(full);
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new AIError("The reply was interrupted. Try again.");
  }
  return full;
}
