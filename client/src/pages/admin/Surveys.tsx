import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SurveyKind = "all" | "garden-class" | "purchase" | string;

type SurveyRow = {
  id: string;
  created_at: string;
  survey_kind: string;
  event_key: string | null;
  source: string;
  first_name: string;
  email_normalized: string;
  customer_id: number | null;
  would_come_back: string | null;
  notes: string | null;
  scores: Record<string, string | number> | null;
  user_agent: string | null;
  coupon_code: string | null;
};

type SurveyInbox = {
  kind: SurveyKind;
  counts: Record<string, number>;
  rows: SurveyRow[];
};

const KIND_FILTERS: Array<{ id: SurveyKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "garden-class", label: "Garden class" },
  { id: "purchase", label: "Purchase" },
];

function phoenixStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminSurveys() {
  const [kind, setKind] = useState<SurveyKind>("all");

  const { data, isLoading, error } = useQuery<SurveyInbox>({
    queryKey: ["adminSurveys", kind],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (kind && kind !== "all") params.set("kind", kind);
      const query = params.toString();
      const response = await fetch(`/api/admin/surveys${query ? `?${query}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load surveys");
      return response.json();
    },
  });

  const counts = data?.counts || { all: 0 };
  const extraKinds = Object.keys(counts).filter(
    (key) => key !== "all" && !KIND_FILTERS.some((item) => item.id === key),
  );

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
            <p className="mt-1 text-sm text-gray-600">
              One table. Filter by kind. Class has no coupon.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {KIND_FILTERS.concat(extraKinds.map((id) => ({ id, label: id }))).map((item) => {
              const selected = kind === item.id;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className="min-h-11"
                  onClick={() => setKind(item.id)}
                >
                  {item.label}
                  <Badge variant="secondary" className="ml-2">
                    {counts[item.id] || 0}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading surveys...</p>
          ) : error ? (
            <p className="text-sm text-red-700">Could not load surveys.</p>
          ) : !data?.rows?.length ? (
            <p className="text-sm text-gray-500">No replies in this view yet.</p>
          ) : (
            <div className="space-y-3">
              {data.rows.map((row) => (
                <article key={row.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{row.first_name}</span>
                    <Badge variant="outline">{row.survey_kind}</Badge>
                    {row.event_key ? <Badge variant="secondary">{row.event_key}</Badge> : null}
                    {row.coupon_code ? <Badge>coupon</Badge> : null}
                    <span className="ml-auto text-xs text-gray-500">{phoenixStamp(row.created_at)}</span>
                  </div>
                  <p className="mt-2 break-all text-sm text-gray-700">{row.email_normalized}</p>
                  {row.would_come_back ? (
                    <p className="mt-1 text-sm text-gray-700">
                      Would come back: <span className="font-medium">{row.would_come_back}</span>
                    </p>
                  ) : null}
                  {row.notes ? <p className="mt-2 text-sm leading-6 text-gray-800">{row.notes}</p> : null}
                  {row.scores && Object.keys(row.scores).length > 0 ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {Object.entries(row.scores)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-gray-500">
                    source {row.source}
                    {row.customer_id ? ` · customer ${row.customer_id}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
