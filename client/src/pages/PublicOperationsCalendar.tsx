import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, Megaphone, Package, RefreshCw, Truck } from "lucide-react";
import { Helmet } from "react-helmet-async";

type OpsEvent = {
  id: string;
  title: string;
  reference: string;
  starts_at: string;
  day: string;
  time_label?: string | null;
  type: "pickup" | "delivery" | "operations";
  status: string;
  payment_status?: string | null;
  location_label: string;
  item_summary: string;
  items: Array<{ product_name: string; size?: string; quantity: number }>;
};

type CalendarResponse = {
  generated_at: string;
  counts: { total: number; pickups: number; orders: number };
  events: OpsEvent[];
};

const operationsEvents: OpsEvent[] = [
  {
    id: "visibility-launch-2026-06-08",
    title: "Visibility Active: Banners + Google Ads",
    reference: "Organic Soil Wholesale Drive-thru",
    starts_at: "2026-06-08T07:00:00-07:00",
    day: "2026-06-08",
    time_label: "Monday · all day",
    type: "operations",
    status: "scheduled",
    payment_status: null,
    location_label: "Phoenix yard drive-thru lanes",
    item_summary: "Banners installed and geo-targeted Google Ads active",
    items: [
      { product_name: "Drive-thru visibility", size: "Banners + Google Ads", quantity: 1 },
    ],
  },
];

function formatDay(day: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${day}T12:00:00`));
}

function formatTime(event: OpsEvent) {
  if (event.time_label) return event.time_label;
  if (!event.starts_at) return "Time pending";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Phoenix",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(event.starts_at));
}

function statusLabel(status?: string | null) {
  return (status || "pending").replace(/_/g, " ");
}

function tone(event: OpsEvent) {
  if (event.status === "in_progress" || event.status === "on_the_way") {
    return "border-amber-200 bg-amber-50";
  }
  if (event.type === "operations") {
    return "border-violet-200 bg-violet-50";
  }
  if (event.type === "delivery") {
    return "border-blue-200 bg-blue-50";
  }
  return "border-emerald-200 bg-emerald-50";
}

function statusTone(status?: string | null) {
  if (status === "in_progress" || status === "on_the_way") return "bg-amber-100 text-amber-900";
  if (status === "paid") return "bg-emerald-100 text-emerald-900";
  return "bg-slate-100 text-slate-700";
}

function eventTypeLabel(event: OpsEvent) {
  if (event.type === "operations") return "Operations";
  return event.type === "pickup" ? "Customer Pickup" : "Delivery";
}

function startOfCalendarMonth(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = first.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(first);
  start.setDate(first.getDate() + mondayOffset);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function dayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function PublicOperationsCalendar() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const qs = token ? `?days=180&token=${encodeURIComponent(token)}` : "?days=180";

    fetch(`https://myorganicsoil.com/api/public/operations-calendar${qs}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Could not load schedule");
        setData(json);
        const firstEvent = [...operationsEvents, ...(json.events || [])].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        )[0];
        setSelectedEventId(firstEvent?.id || null);
        setError(null);
      })
      .catch((err) => setError(err.message || "Could not load schedule"))
      .finally(() => setLoading(false));
  }, []);

  const calendarEvents = useMemo(() => {
    const liveEvents = data?.events || [];
    const liveIds = new Set(liveEvents.map((event) => event.id));
    return [
      ...operationsEvents.filter((event) => !liveIds.has(event.id)),
      ...liveEvents,
    ].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [data]);

  const calendarCounts = useMemo(() => ({
    total: calendarEvents.length,
    pickups: calendarEvents.filter((event) => event.type === "pickup").length,
    orders: calendarEvents.filter((event) => event.type === "pickup" || event.type === "delivery").length,
  }), [calendarEvents]);

  const grouped = useMemo(() => {
    const map = new Map<string, OpsEvent[]>();
    for (const event of calendarEvents) {
      if (!map.has(event.day)) map.set(event.day, []);
      map.get(event.day)!.push(event);
    }
    return Array.from(map.entries());
  }, [calendarEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, OpsEvent[]>();
    for (const event of calendarEvents) {
      if (!map.has(event.day)) map.set(event.day, []);
      map.get(event.day)!.push(event);
    }
    return map;
  }, [calendarEvents]);

  const monthDays = useMemo(() => {
    const start = startOfCalendarMonth(visibleMonth);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [visibleMonth]);

  const goMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedEventId(null);
  };

  return (
    <>
      <Helmet>
        <title>Operations Calendar | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Live Organic Soil Wholesale pickup and delivery calendar for partner coordination."
        />
      </Helmet>

      <div className="min-h-screen scroll-smooth bg-[#f6f7f3] text-slate-950">
        <header className="border-b border-emerald-950/10 bg-[#132018] text-white">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Organic Soil Wholesale
                </div>
                <h1 className="mt-2 text-2xl font-black leading-none tracking-tight sm:text-4xl lg:text-5xl">
                  Organic Soil Wholesale Drive-thru
                </h1>
                <p className="mt-2 max-w-2xl text-xs font-medium leading-4 text-white/75 sm:text-sm sm:leading-5">
                  Live pickup and delivery schedule for partner coordination at the Phoenix yard.
                  Times are shown in Arizona time.
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-2.5 py-2.5 sm:px-5 lg:px-8">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-900" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-white p-5 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-3 text-2xl font-black">No open scheduled work</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                New paid pickups and scheduled deliveries will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                    <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Calendar view</p>
                    <h2 className="text-lg font-black sm:text-2xl">{monthTitle(visibleMonth)}</h2>
                    </div>
                    <div className="flex items-center gap-2 pb-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      <span>{calendarCounts.total} total</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{calendarCounts.pickups} pickups</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{calendarCounts.orders} orders</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => goMonth(-1)}
                      className="min-h-9 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => goMonth(1)}
                      className="min-h-9 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[8px] font-black uppercase tracking-widest text-slate-400 sm:text-[10px]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                    <div key={label} className="px-1 py-1 sm:py-1.5">{label}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {monthDays.map((date) => {
                    const key = dayKey(date);
                    const events = eventsByDay.get(key) || [];
                    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                    const isToday = key === dayKey(new Date());
                    return (
                      <a
                        key={key}
                        href={events.length === 1 ? `#event-${events[0].id}` : events.length ? `#day-${key}` : undefined}
                        onClick={() => setSelectedEventId(events[0]?.id || null)}
                        className={[
                          "min-h-[50px] border-b border-r p-1 text-left transition duration-200 sm:min-h-[66px] lg:min-h-[78px] xl:min-h-[86px]",
                          events.length
                            ? "border-emerald-300 bg-emerald-50 shadow-[inset_0_0_0_2px_rgba(6,95,70,0.18)] hover:bg-emerald-100 active:scale-[0.99]"
                            : "border-slate-200",
                          !events.length && isCurrentMonth ? "bg-white" : "",
                          !events.length && !isCurrentMonth ? "bg-slate-50 text-slate-300" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={[
                            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black sm:h-7 sm:w-7 sm:text-xs",
                            isToday ? "bg-slate-950 text-white" : events.length ? "text-emerald-950" : "text-slate-700",
                            !isCurrentMonth && !isToday ? "text-slate-300" : "",
                          ].join(" ")}>
                            {date.getDate()}
                          </span>
                          {events.length ? (
                            <span className="rounded-full bg-emerald-950 px-1.5 py-0.5 text-[9px] font-black text-white">
                              {events.length}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-0.5 space-y-1 sm:mt-1">
                          {events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={[
                                "truncate rounded px-1 py-0.5 text-[8px] font-black leading-tight sm:text-[10px] lg:text-[11px]",
                                event.type === "pickup"
                                  ? "bg-emerald-100 text-emerald-950"
                                  : event.type === "operations"
                                    ? "bg-violet-100 text-violet-950"
                                    : "bg-blue-100 text-blue-950",
                              ].join(" ")}
                            >
                              <span className="hidden sm:inline">{eventTypeLabel(event)} · </span>
                              <span className="sm:hidden">
                                {event.type === "pickup" ? "Pickup" : event.type === "operations" ? "Ops" : "Delivery"} ·{" "}
                              </span>
                              {event.item_summary}
                            </div>
                          ))}
                          {events.length > 2 ? (
                            <div className="text-[10px] font-black text-slate-500">+{events.length - 2} more</div>
                          ) : null}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <aside className="hidden lg:block">
                <div className="sticky top-4 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Days</p>
                  <div className="mt-3 space-y-1">
                    {grouped.map(([day, events]) => (
                      <a
                        key={day}
                        href={`#day-${day}`}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <span>{formatDay(day).replace(/, \d+$/, "")}</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">
                          {events.length}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-4">
                {grouped.map(([day, events]) => (
                  <section id={`day-${day}`} key={day} className="scroll-mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Schedule</p>
                        <h2 className="text-xl font-black sm:text-3xl">{formatDay(day)}</h2>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                        {events.length} {events.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {events.map((event) => (
                        <article
                          id={`event-${event.id}`}
                          key={event.id}
                          className={[
                            "scroll-mt-4 p-4 transition duration-300 sm:p-5",
                            tone(event),
                            selectedEventId === event.id ? "ring-2 ring-emerald-800/25 shadow-md" : "",
                          ].join(" ")}
                        >
                          <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                                  {event.type === "pickup" ? (
                                    <Package className="h-3.5 w-3.5" />
                                  ) : event.type === "operations" ? (
                                    <Megaphone className="h-3.5 w-3.5" />
                                  ) : (
                                    <Truck className="h-3.5 w-3.5" />
                                  )}
                                  {eventTypeLabel(event)}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusTone(event.status)}`}>
                                  {statusLabel(event.status)}
                                </span>
                                {event.payment_status ? (
                                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusTone(event.payment_status)}`}>
                                    {statusLabel(event.payment_status)}
                                  </span>
                                ) : null}
                              </div>

                              <h3 className="mt-4 text-xl font-black leading-tight sm:text-2xl">
                                {event.type === "pickup" ? event.title.replace(/^Pickup\b/i, "Customer Pickup") : event.title}
                              </h3>
                              <p className="mt-1 text-sm font-bold text-slate-500">{event.reference}</p>
                              <p className="mt-4 text-base font-black text-slate-900 sm:text-lg">{event.item_summary}</p>

                              {event.items.length > 1 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {event.items.map((item, index) => (
                                    <span key={`${event.id}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                                      {item.quantity}x {item.product_name}{item.size ? ` · ${item.size}` : ""}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="grid gap-2">
                              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-black shadow-sm">
                                <Clock className="h-4 w-4 text-emerald-900" />
                                <span>{formatTime(event)}</span>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-black shadow-sm">
                                <MapPin className="h-4 w-4 text-emerald-900" />
                                <span>{event.location_label}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
