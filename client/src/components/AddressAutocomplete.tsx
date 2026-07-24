import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

export type AddressSuggestion = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

type AddressAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (street: string) => void;
  onSelect: (address: AddressSuggestion) => void;
  /** Delivery ZIP — biases suggestions toward that area (falls back to Phoenix). */
  biasZip?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  biasZip = "",
  placeholder = "Start typing your street address",
  className,
  inputClassName,
  disabled,
  autoFocus = false,
}: AddressAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const skipFetchRef = useRef(false);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (biasZip && /^\d{5}$/.test(biasZip)) params.set("zip", biasZip);

        const res = await fetch(`/api/address/suggest?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;

        const next = Array.isArray(data?.suggestions) ? (data.suggestions as AddressSuggestion[]) : [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [biasZip],
  );

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      void fetchSuggestions(value);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    try {
      sessionStorage.removeItem("osw-focus-street");
    } catch {
      // ignore
    }
    const handle = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: false });
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 160);
    return () => window.clearTimeout(handle);
  }, [autoFocus]);

  const pick = (suggestion: AddressSuggestion) => {
    skipFetchRef.current = true;
    onChange(suggestion.street);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="street-address"
          className={cn("h-11 pr-10 text-base", inputClassName)}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </span>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition",
                  index === activeIndex ? "bg-[#264027]/10 text-[#264027]" : "hover:bg-stone-50",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(suggestion)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b38a58]" />
                <span>
                  <span className="block font-semibold text-stone-900">{suggestion.street}</span>
                  <span className="block text-xs text-stone-500">
                    {[suggestion.city, suggestion.state, suggestion.zip].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-stone-100 px-3 py-1.5 text-[10px] text-stone-400">
            Pick a suggestion to fill city, state, and ZIP
          </li>
        </ul>
      )}
    </div>
  );
}

export default AddressAutocomplete;
