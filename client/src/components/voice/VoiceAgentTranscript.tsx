import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { TranscriptMessage } from "@/hooks/useElevenLabsAgent";

type Props = {
  transcript: TranscriptMessage[];
  emptyHint?: string;
};

export default function VoiceAgentTranscript({ transcript, emptyHint }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript.length]);

  if (transcript.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-stone-500">
          {emptyHint ||
            "Just say what you need — area to cover, plants you're feeding, or a soil question. I'll handle the rest."}
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex h-full flex-col gap-2.5 overflow-y-auto px-4 py-4">
      {transcript.map((m) => (
        <div
          key={m.id}
          className={`max-w-[88%] animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            m.role === "user" ? "self-end" : "self-start"
          }`}
        >
          <div
            className={`rounded-2xl px-4 py-2.5 text-[15px] leading-snug shadow-sm ${
              m.role === "user"
                ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white"
                : "border border-stone-200/80 bg-white text-stone-800"
            }`}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}
