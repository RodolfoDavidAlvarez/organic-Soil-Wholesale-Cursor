function scoreWord(n: number, low: string, high: string) {
  if (n <= 3) return low;
  if (n >= 8) return high;
  return "in the middle";
}

export function ScoreSlider({
  id,
  legend,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  id: string;
  legend: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (next: number) => void;
}) {
  const visual = value ?? 5;
  const selected = value != null;
  const pct = ((visual - 1) / 9) * 100;
  const label = selected ? scoreWord(value, lowLabel, highLabel) : "Slide to choose";

  return (
    <fieldset className="rounded-2xl border border-[#e6dcc8] bg-white p-5 shadow-[0_8px_24px_rgba(38,64,39,0.06)]">
      <legend className="float-left mb-4 w-full px-0 text-base font-semibold text-[#264027]">{legend}</legend>
      <div className="clear-both text-center">
        <p
          className={`font-heading text-5xl font-bold tabular-nums leading-none ${
            selected ? "text-[#264027]" : "text-[#5c6658]"
          }`}
        >
          {selected ? value : visual}
        </p>
        <p className={`mt-2 min-h-5 text-sm font-semibold ${selected ? "text-[#b38a58]" : "text-[#6b7468]"}`}>
          {label}
        </p>
      </div>
      <div className="relative mt-6 h-12">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#cfd6c6]" />
        <div
          className={`pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full ${
            selected ? "bg-gradient-to-r from-[#264027] via-[#b38a58] to-[#d7b77d]" : "bg-[#264027]"
          }`}
          style={{ width: selected ? `${pct}%` : 0 }}
        />
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={1}
          value={visual}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={selected ? value : undefined}
          aria-valuetext={selected ? `${value} of 10, ${label}` : "Not set yet"}
          aria-label={legend}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={() => {
            if (value == null) onChange(visual);
          }}
          className={`garden-score-slider absolute inset-0 w-full ${selected ? "is-set" : ""}`}
        />
      </div>
      <div className="mt-3 flex justify-between gap-3 text-xs font-semibold leading-4 text-neutral-600">
        <span>1 {lowLabel}</span>
        <span className="text-right">10 {highLabel}</span>
      </div>
      <div className="mt-1 flex justify-between">
        {Array.from({ length: 10 }, (_, index) => {
          const n = index + 1;
          const active = selected && value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n}, ${legend}`}
              className={`flex min-h-11 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${
                active ? "bg-[#264027] text-white shadow-sm" : "text-[#6b7468]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
