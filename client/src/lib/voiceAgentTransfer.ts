import type { CartItem } from "@/contexts/QuoteCartContext";

export type VoiceHandoffPayload = {
  items: CartItem[];
  totalPrice: number;
  pickupAt: string;
  pickupLabel: string;
};

export const VOICE_HANDOFF_STORAGE_KEY = "osw-voice-handoff";

export async function fetchVoiceHandoff(sessionId: string): Promise<VoiceHandoffPayload> {
  const res = await fetch(`/api/voice-agent/handoff/${sessionId}`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || body?.error || "handoff_failed");
  }
  return (await res.json()) as VoiceHandoffPayload;
}

export function stashVoiceHandoff(payload: VoiceHandoffPayload) {
  try {
    sessionStorage.setItem(VOICE_HANDOFF_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage errors */
  }
}

export function readAndClearVoiceHandoff(): VoiceHandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(VOICE_HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(VOICE_HANDOFF_STORAGE_KEY);
    return JSON.parse(raw) as VoiceHandoffPayload;
  } catch {
    return null;
  }
}
