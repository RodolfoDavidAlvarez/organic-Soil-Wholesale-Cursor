import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

export type TranscriptMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
};

export type VoiceCartItem = {
  productId: number;
  productName: string;
  productSlug: string;
  format: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

export type VoiceCustomerInfo = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type VoiceCartSummary = {
  sessionId: string;
  items: VoiceCartItem[];
  totalItems: number;
  totalPrice: number;
  pickupAt: string | null;
  pickupKind: "standard" | "coordinated" | null;
  customer: VoiceCustomerInfo;
  isLargeOrder: boolean;
};

type Status = "idle" | "connecting" | "listening" | "speaking" | "thinking" | "ended" | "error";

const POLL_INTERVAL_MS = 2000;

export function useElevenLabsAgent() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [cart, setCart] = useState<VoiceCartSummary | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const fetchCart = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/voice-agent/cart/${sessionId}`);
      if (!res.ok) return;
      const data = (await res.json()) as VoiceCartSummary;
      setCart(data);
    } catch {
      /* network blip — try again next tick */
    }
  }, []);

  async function callBackend(tool: string, params: Record<string, unknown>) {
    const res = await fetch(`/api/voice-agent/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const text = await res.text();
    let data: any;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) {
      return { error: data?.error || `tool_${tool}_failed`, message: data?.message, status: res.status, ...data };
    }
    return data;
  }

  const clientTools = {
    get_products: async (params: Record<string, unknown> = {}) => callBackend("get_products", params),
    recommend: async (params: Record<string, unknown>) => callBackend("recommend", params),
    add_to_cart: async (params: Record<string, unknown>) => {
      const result = await callBackend("add_to_cart", params);
      void fetchCart();
      return result;
    },
    update_quantity: async (params: Record<string, unknown>) => {
      const result = await callBackend("update_quantity", params);
      void fetchCart();
      return result;
    },
    remove_item: async (params: Record<string, unknown>) => {
      const result = await callBackend("remove_item", params);
      void fetchCart();
      return result;
    },
    get_cart: async (params: Record<string, unknown>) => callBackend("get_cart", params),
    get_pickup_options: async (params: Record<string, unknown> = {}) => callBackend("get_pickup_options", params),
    set_pickup_time: async (params: Record<string, unknown>) => {
      const result = await callBackend("set_pickup_time", params);
      void fetchCart();
      return result;
    },
    request_large_order: async (params: Record<string, unknown>) => {
      const result = await callBackend("request_large_order", params);
      void fetchCart();
      return result;
    },
    set_customer_info: async (params: Record<string, unknown>) => {
      const result = await callBackend("set_customer_info", params);
      void fetchCart();
      return result;
    },
    start_checkout: async (params: Record<string, unknown>) => callBackend("start_checkout", params),
  };

  const conversation = useConversation({
    clientTools,
    onConnect: () => setStatus("listening"),
    onDisconnect: () => setStatus("ended"),
    onError: (err: any) => {
      console.error("[voice-agent] error", err);
      setErrorMessage(typeof err === "string" ? err : err?.message || "Connection error");
      setStatus("error");
    },
    onMessage: (msg: any) => {
      if (!msg) return;
      const source: "user" | "assistant" = msg.source === "user" ? "user" : "assistant";
      const text: string = msg.message ?? msg.text ?? "";
      if (!text.trim()) return;
      setTranscript((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          role: source,
          text,
          at: Date.now(),
        },
      ]);
      void fetchCart();
    },
    onModeChange: (mode: any) => {
      const m = mode?.mode || mode;
      if (m === "speaking") setStatus("speaking");
      else if (m === "listening") setStatus("listening");
      else if (m === "thinking") setStatus("thinking");
    },
  } as any);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setTranscript([]);
    setCart(null);
    setStatus("connecting");
    let signedUrl: string;
    let sessionId: string;
    try {
      const res = await fetch("/api/voice-agent/signed-url", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "voice_agent_daily_cap_reached") {
          setErrorMessage("The voice assistant has paused for the day. Try again tomorrow or use the standard order form.");
        } else if (body?.error === "voice_agent_not_configured") {
          setErrorMessage("Voice assistant is not configured yet.");
        } else {
          setErrorMessage("Could not start the assistant. Please try again.");
        }
        setStatus("error");
        return;
      }
      const data = await res.json();
      signedUrl = data.signedUrl;
      sessionId = data.sessionId;
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Could not reach the assistant service.");
      return;
    }
    sessionIdRef.current = sessionId;
    try {
      await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        dynamicVariables: { session_id: sessionId },
      } as any);
    } catch (err: any) {
      console.error("[voice-agent] startSession failed", err);
      setStatus("error");
      setErrorMessage("Could not connect to the assistant.");
      return;
    }
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(fetchCart, POLL_INTERVAL_MS);
    void fetchCart();
  }, [conversation, fetchCart]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setStatus((prev) => (prev === "error" ? prev : "ended"));
  }, [conversation]);

  const reset = useCallback(() => {
    setTranscript([]);
    setCart(null);
    setErrorMessage(null);
    sessionIdRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
  }, []);

  const createCheckout = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) throw new Error("No active voice session");
    const res = await fetch(`/api/voice-agent/create-checkout-session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok || !data?.url) {
      const message =
        data?.error === "cart_empty" ? "Your cart is empty."
        : data?.error === "pickup_missing" ? "No pickup time set yet."
        : data?.message || "Could not start checkout.";
      throw new Error(message);
    }
    return data as { url: string; sessionId: string; orderId: number; pickupKind: string };
  }, []);

  return {
    status,
    errorMessage,
    transcript,
    cart,
    sessionId: sessionIdRef.current,
    start,
    stop,
    reset,
    createCheckout,
    isMuted: (conversation as any).isMuted ?? false,
    setMuted: (m: boolean) => {
      const c: any = conversation;
      if (typeof c.setVolume === "function") c.setVolume({ volume: m ? 0 : 1 });
      if (typeof c.setMuted === "function") c.setMuted(m);
    },
    getInputVolume: () => {
      const c: any = conversation;
      return typeof c.getInputVolume === "function" ? c.getInputVolume() : 0;
    },
  };
}
