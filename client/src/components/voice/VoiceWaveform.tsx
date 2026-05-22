type Props = {
  level: number;
  active: boolean;
  bars?: number;
};

export default function VoiceWaveform({ level, active, bars = 5 }: Props) {
  const normalized = Math.max(0, Math.min(1, level * 2));
  return (
    <div className="flex h-5 items-end gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => {
        const center = (bars - 1) / 2;
        const distFromCenter = Math.abs(i - center);
        const baseHeight = active ? 0.28 + (1 - distFromCenter / center) * 0.42 : 0.2;
        const dynamic = active ? normalized * (0.3 + (1 - distFromCenter / center) * 0.5) : 0;
        const height = Math.min(1, baseHeight + dynamic);
        return (
          <span
            key={i}
            className={`block w-[3px] rounded-full transition-[height,background-color] duration-100 ${
              active ? "bg-emerald-300" : "bg-white/30"
            }`}
            style={{
              height: `${Math.round(height * 100)}%`,
              animation: active ? `voice-wave-pulse 1.${i}s ease-in-out infinite` : undefined,
              animationDelay: `${i * 80}ms`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes voice-wave-pulse {
          0%, 100% { transform: scaleY(0.85); }
          50% { transform: scaleY(1.1); }
        }
      `}</style>
    </div>
  );
}
