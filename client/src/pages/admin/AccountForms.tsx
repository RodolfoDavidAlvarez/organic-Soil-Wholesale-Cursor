import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Calendar,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Status = "submitted" | "approved" | "rejected" | "needs_info";

const statusColor: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-gray-100 text-gray-500",
  needs_info: "bg-yellow-100 text-yellow-800",
};

interface AccountFormSummary {
  id: string;
  full_legal_business_name: string;
  submitted_by_name: string;
  billing_contact_email: string | null;
  status: string;
  signed_date: string | null;
  created_at: string;
}

interface AccountFormDetail extends AccountFormSummary {
  company_address: string | null;
  ein_tax_id: string | null;
  business_registration_number: string | null;
  arizona_tpt_license: string | null;
  preferred_payment_method: string | null;
  billing_contact_name: string | null;
  preferred_payment_terms: string | null;
  sales_tax_exemption_status: string | null;
  operations_contact_name: string | null;
  operations_contact_phone: string | null;
  signature_data: string | null;
  certification_accepted: boolean;
  source: string | null;
  notes: string | null;
}

function AdminAccountFormsInner() {
  const token = localStorage.getItem("adminToken");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: list = [], isLoading } = useQuery<AccountFormSummary[]>({
    queryKey: ["adminAccountForms"],
    queryFn: async () => {
      const res = await fetch("/api/account-form/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: detail } = useQuery<AccountFormDetail | undefined>({
    queryKey: ["adminAccountFormDetail", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await fetch(`/api/account-form/${selectedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch detail");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/account-form/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAccountForms"] });
      queryClient.invalidateQueries({ queryKey: ["adminAccountFormDetail"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const formLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/account-form`
      : "/account-form";

  function copyLink() {
    navigator.clipboard.writeText(formLink);
    setCopied(true);
    toast({ title: "Link copied" });
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Account Forms</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Submissions from the public client account form.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 bg-neutral-100 px-3 py-2 rounded text-xs font-mono break-all">
              {formLink}
            </div>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy link
            </Button>
            <a
              href={formLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center text-sm px-3 py-2 border rounded hover:bg-neutral-50"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open form
            </a>
          </div>
        </div>

        {isLoading && <div className="text-neutral-500">Loading...</div>}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16 border rounded-lg bg-white">
            <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600">No submissions yet.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Share the form link above. Submissions will appear here.
            </p>
          </div>
        )}

        {!isLoading && list.length > 0 && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="p-3">Business</th>
                  <th className="p-3 hidden md:table-cell">Submitted by</th>
                  <th className="p-3 hidden sm:table-cell">Email</th>
                  <th className="p-3 hidden md:table-cell">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-neutral-50">
                    <td className="p-3 font-medium">{item.full_legal_business_name}</td>
                    <td className="p-3 hidden md:table-cell text-neutral-700">
                      {item.submitted_by_name}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-neutral-700">
                      {item.billing_contact_email || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="p-3 hidden md:table-cell text-neutral-600">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Badge className={statusColor[item.status] || "bg-neutral-100 text-neutral-700"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedId(item.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Account Form Submission</DialogTitle>
            </DialogHeader>
            {detail ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <Building2 className="w-5 h-5" />
                      {detail.full_legal_business_name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(detail.created_at).toLocaleString()}
                      </span>
                      {detail.source && <span>via {detail.source}</span>}
                    </div>
                  </div>
                  <Select
                    value={detail.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: detail.id, status: v })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="needs_info">Needs info</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Section title="Company">
                  <Field label="Address" value={detail.company_address} />
                  <Field label="Tax ID / EIN" value={detail.ein_tax_id} />
                  <Field label="Business registration" value={detail.business_registration_number} />
                  <Field label="Arizona TPT license" value={detail.arizona_tpt_license} />
                </Section>

                <Section title="Billing">
                  <Field label="Payment method" value={detail.preferred_payment_method} />
                  <Field label="Payment terms" value={detail.preferred_payment_terms} />
                  <Field label="Sales tax exemption" value={detail.sales_tax_exemption_status} />
                  <Field label="Billing contact" value={detail.billing_contact_name} />
                  <Field
                    label="Billing email"
                    value={detail.billing_contact_email}
                    icon={<Mail className="w-3 h-3" />}
                  />
                </Section>

                <Section title="Operations contact">
                  <Field label="Name" value={detail.operations_contact_name} />
                  <Field
                    label="Phone"
                    value={detail.operations_contact_phone}
                    icon={<Phone className="w-3 h-3" />}
                  />
                </Section>

                <Section title="Signature">
                  <Field label="Submitted by" value={detail.submitted_by_name} />
                  <Field label="Signed date" value={detail.signed_date} />
                  <Field
                    label="Certification"
                    value={detail.certification_accepted ? "Accepted" : "Not accepted"}
                  />
                  {detail.signature_data && (
                    <div className="mt-2">
                      <div className="text-xs text-neutral-500 mb-1">Signature</div>
                      <img
                        src={detail.signature_data}
                        alt="signature"
                        className="border rounded bg-white max-w-xs"
                      />
                    </div>
                  )}
                </Section>

                {detail.notes && (
                  <Section title="Notes">
                    <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                  </Section>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-500">Loading...</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-primary border-b border-neutral-200 pb-1 mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  if (!value) {
    return (
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-neutral-500">{label}</div>
        <div className="col-span-2 text-neutral-400">—</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-neutral-500">{label}</div>
      <div className="col-span-2 flex items-center gap-1">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

export default function AdminAccountForms() {
  return (
    <ProtectedAdminRoute>
      <AdminAccountFormsInner />
    </ProtectedAdminRoute>
  );
}
