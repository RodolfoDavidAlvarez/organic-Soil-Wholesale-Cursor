import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Loader2, ArrowRight, PhoneOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import VoiceAgentTranscript from "./VoiceAgentTranscript";
import VoiceAgentCartPreview from "./VoiceAgentCartPreview";
import VoiceWaveform from "./VoiceWaveform";
import { useElevenLabsAgent } from "@/hooks/useElevenLabsAgent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function statusCopy(status: string) {
  switch (status) {
    case "connecting": return "Connecting";
    case "listening": return "Listening";
    case "speaking": return "Speaking";
    case "thinking": return "Thinking";
    case "ended": return "Call ended";
    case "error": return "Connection error";
    default: return "Ready";
  }
}

export default function VoiceAgentModal({ open, onOpenChange }: Props) {
  const agent = useElevenLabsAgent();
  const [isHandoff, setIsHandoff] = useState(false);
  const [muted, setMuted] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const meterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      void agent.stop();
      agent.reset();
      setMuted(false);
      setIsHandoff(false);
      setHandoffError(null);
      setInputLevel(0);
    }
  }, [open]);

  useEffect(() => {
    if (open && agent.status === "idle") {
      void agent.start();
    }
  }, [open, agent.status]);

  useEffect(() => {
    if (!open) return;
    if (meterTimerRef.current) window.clearInterval(meterTimerRef.current);
    meterTimerRef.current = window.setInterval(() => {
      setInputLevel(agent.getInputVolume?.() ?? 0);
    }, 80);
    return () => {
      if (meterTimerRef.current) window.clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    };
  }, [open, agent]);

  const cart = agent.cart;
  const hasItems = (cart?.items.length ?? 0) > 0;
  const hasCustomer = !!(cart?.customer?.name || cart?.customer?.phone || cart?.customer?.email);
  const showOrderPanel = hasItems || hasCustomer;
  const totalPrice = cart?.totalPrice ?? 0;
  const canPay = hasItems && !!cart?.pickupAt && !isHandoff;
  const isLive = agent.status === "listening" || agent.status === "speaking" || agent.status === "thinking";
  const isCallActive = agent.status !== "idle" && agent.status !== "ended" && agent.status !== "error";
  const payHint = isHandoff
    ? null
    : !hasItems
      ? isCallActive
        ? "Tell the assistant what you'd like to add"
        : null
      : !cart?.pickupAt
        ? "Pick a pickup time with the assistant"
        : null;

  const handlePay = useCallback(async () => {
    if (!cart || !hasItems) return;
    setIsHandoff(true);
    setHandoffError(null);
    try {
      const result = await agent.createCheckout();
      await agent.stop();
      window.location.href = result.url;
    } catch (err: any) {
      setIsHandoff(false);
      setHandoffError(err?.message || "Could not start checkout. Please try again.");
    }
  }, [agent, cart, hasItems]);

  const adjustQuantity = useCallback(
    async (productId: number, format: string, nextQuantity: number) => {
      const sessionId = agent.sessionId;
      if (!sessionId) return;
      const endpoint = nextQuantity <= 0 ? "remove_item" : "update_quantity";
      const body: Record<string, unknown> = { session_id: sessionId, product_id: productId, format };
      if (nextQuantity > 0) body.quantity = nextQuantity;
      try {
        const res = await fetch(`/api/voice-agent/tools/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        await fetch(`/api/voice-agent/cart/${sessionId}`).catch(() => null);
      } catch {
        /* swallow */
      }
    },
    [agent.sessionId],
  );

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    agent.setMuted(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden border-0 bg-stone-50 p-0 [&>button.absolute]:hidden sm:h-[680px] sm:max-h-[92vh] sm:!max-w-[440px] sm:rounded-3xl sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]"
      >
        {/* Dark glass header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 px-5 py-4 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full blur-3xl transition-colors duration-700 ${
              agent.status === "speaking" ? "bg-amber-500/20" : "bg-emerald-400/15"
            }`}
          />
          <div className="relative flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              {isLive && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
              )}
              <VoiceWaveform level={inputLevel} active={isLive} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[15px] font-semibold tracking-tight">
                Soil & Seed Assistant
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-200/80">
                {agent.status === "thinking" ? (
                  <span className="inline-flex items-center gap-0.5">
                    Thinking
                    <span className="ml-1 inline-block animate-bounce">·</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: "120ms" }}>·</span>
                    <span className="inline-block animate-bounce" style={{ animationDelay: "240ms" }}>·</span>
                  </span>
                ) : (
                  <>
                    {statusCopy(agent.status)}
                    {agent.status === "connecting" && "…"}
                  </>
                )}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error banners */}
        {agent.errorMessage && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {agent.errorMessage}
          </div>
        )}
        {handoffError && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {handoffError}
          </div>
        )}

        {/* Body */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className={`min-h-0 min-w-0 overflow-hidden transition-[flex-grow] duration-300 ${showOrderPanel ? "flex-[3]" : "flex-1"}`}>
            <VoiceAgentTranscript transcript={agent.transcript} />
          </div>
          {showOrderPanel && (
            <div className="min-h-0 min-w-0 flex-[2] overflow-hidden border-t border-stone-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <VoiceAgentCartPreview
                cart={cart}
                onAdjustQuantity={adjustQuantity}
                onRemoveItem={(productId, format) => adjustQuantity(productId, format, 0)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 overflow-hidden border-t border-stone-200 bg-white px-3 py-3">
          {hasItems ? (
            <div className="mb-3 flex items-baseline justify-between px-1">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Total</span>
              <span className="text-2xl font-bold tabular-nums text-stone-900">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          ) : payHint ? (
            <div className="mb-3 px-1 text-center text-xs font-medium text-stone-500">{payHint}</div>
          ) : null}
          {hasItems && payHint && (
            <div className="-mt-1 mb-3 px-1 text-center text-xs font-medium text-amber-700">{payHint}</div>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              disabled={agent.status === "idle" || agent.status === "ended" || agent.status === "error"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 disabled:opacity-40"
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => agent.stop()}
              aria-label="End call"
              disabled={agent.status === "idle" || agent.status === "ended" || agent.status === "error"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={!canPay}
              className={`group relative flex h-12 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-[15px] font-semibold text-white shadow-lg transition-all ${
                canPay
                  ? "bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-[1.02]"
                  : "cursor-not-allowed bg-stone-300 text-stone-500 shadow-none"
              }`}
            >
              {canPay && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {isHandoff ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
                  </>
                ) : hasItems ? (
                  <>
                    Pay ${totalPrice.toFixed(2)}
                    {canPay && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                  </>
                ) : (
                  "Pay"
                )}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
