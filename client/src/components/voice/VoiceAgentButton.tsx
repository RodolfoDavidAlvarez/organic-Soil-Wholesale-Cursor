import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Mic, X, Sparkles } from "lucide-react";

const VoiceAgentModal = lazy(() => import("./VoiceAgentModal"));

const HINT_DISMISSED_KEY = "osw-voice-hint-dismissed";
const ENTRANCE_DELAY_MS = 1800;
const HINT_AUTO_DISMISS_MS = 14000;

type Props = {
  className?: string;
};

export default function VoiceAgentButton({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const entranceTimer = window.setTimeout(() => {
      setMounted(true);
      let dismissed = false;
      try {
        dismissed = sessionStorage.getItem(HINT_DISMISSED_KEY) === "1";
      } catch {
        /* ignore */
      }
      if (!dismissed) {
        setShowHint(true);
        hintTimerRef.current = window.setTimeout(() => {
          dismissHint();
        }, HINT_AUTO_DISMISS_MS);
      }
    }, ENTRANCE_DELAY_MS);

    return () => {
      window.clearTimeout(entranceTimer);
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  function dismissHint() {
    setShowHint(false);
    try {
      sessionStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  }

  function handleClick() {
    dismissHint();
    setOpen(true);
  }

  if (!mounted) return null;

  return (
    <>
      <div
        className={`pointer-events-none fixed z-[60] right-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] flex flex-col items-end gap-2 md:right-6 md:bottom-6 ${className || ""}`}
      >
        {showHint && (
          <div className="pointer-events-auto relative max-w-[300px] animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="overflow-hidden rounded-2xl bg-stone-900 pr-9 text-white shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-2 border-b border-white/10 bg-gradient-to-r from-emerald-700/40 to-emerald-900/40 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  AI is here
                </span>
              </div>
              <div className="px-4 py-3 text-[14px] leading-snug">
                You can order with your voice for pickup. Just tap and tell me what you need.
              </div>
            </div>
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Dismiss hint"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition-all hover:bg-white/20 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span
              aria-hidden
              className="absolute -bottom-1.5 right-9 h-3 w-3 rotate-45 rounded-sm bg-stone-900"
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Talk to OSW order assistant"
          className="pointer-events-auto group relative inline-flex animate-in fade-in slide-in-from-right-3 items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg duration-500 transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:px-5 md:py-3.5 md:text-base"
        >
          <span aria-hidden className="relative flex h-6 w-6 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-primary-foreground/30"
              style={{ animation: "voice-agent-pulse 2.4s cubic-bezier(0.4,0,0.2,1) infinite" }}
            />
            <Mic className="relative h-4 w-4 md:h-[18px] md:w-[18px]" />
          </span>
          <span className="leading-tight">
            <span className="block whitespace-nowrap">Tell me what you need</span>
            <span className="block text-[10px] font-normal uppercase tracking-[0.14em] opacity-80 md:text-[11px]">
              voice assistant
            </span>
          </span>
        </button>
      </div>
      <style>
        {`
          @keyframes voice-agent-pulse {
            0% { transform: scale(1); opacity: 0.5; }
            70% { transform: scale(1.7); opacity: 0; }
            100% { transform: scale(1.7); opacity: 0; }
          }
        `}
      </style>
      {open && (
        <Suspense fallback={null}>
          <VoiceAgentModal open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
