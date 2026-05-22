import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import * as tus from "tus-js-client";
import {
  Image as ImageIcon,
  Video,
  Download,
  Star,
  Check,
  X as XIcon,
  Eye,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  MapPin,
  Building2,
  User,
  MessageSquare,
  Pencil,
  Trash2,
  Plus,
  ImagePlus,
  Camera,
  AlertCircle,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://govktyrtmwzbzqkmzmrf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type Status = "all" | "pending" | "approved" | "published" | "rejected";

interface Media {
  id: string;
  filename: string;
  mime: string;
  size: number;
  watchUrl: string;
  downloadUrl: string;
}

interface Testimonial {
  id: string;
  client_name: string | null;
  client_company: string | null;
  client_city: string | null;
  product_or_service: string | null;
  note: string | null;
  submitted_by_name: string | null;
  status: "pending" | "approved" | "published" | "rejected";
  featured: boolean;
  created_at: string;
  published_at: string | null;
  media: Media[];
}

interface Response {
  testimonials: Testimonial[];
  stats: { total: number; pending: number; approved: number; published: number; rejected: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatBytes(b: number) {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminTestimonials() {
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");

  const { data, isLoading, refetch } = useQuery<Response>({
    queryKey: ["adminTestimonials", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/testimonials" : `/api/admin/testimonials?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] });
      setEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] });
      setConfirmDeleteId(null);
      setOpenId(null);
    },
  });

  const open = data?.testimonials.find((t) => t.id === openId) || null;
  const filtered = data?.testimonials || [];
  const stats = data?.stats || { total: 0, pending: 0, approved: 0, published: 0, rejected: 0 };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <Helmet>
          <title>Testimonials — Admin</title>
        </Helmet>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Testimonials</h1>
              <p className="text-sm text-gray-500 mt-1">Submissions from the team upload form</p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <StatPill label="Total" value={stats.total} />
              <StatPill label="Pending" value={stats.pending} color="amber" />
              <StatPill label="Approved" value={stats.approved} color="blue" />
              <StatPill label="Published" value={stats.published} color="green" />
              <Button onClick={() => setUploadOpen(true)} className="bg-[#264027] hover:bg-[#3c5233] ml-2">
                <Plus className="w-4 h-4 mr-1" /> Add testimonial
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "published", "rejected"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? "bg-[#264027] text-white border-[#264027]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <ImageIcon className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">
                No testimonials in this view. Share{" "}
                <a
                  href="https://www.organicsoilwholesale.com/team/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#264027] underline font-medium"
                >
                  the upload link
                </a>{" "}
                with the team or click "Add testimonial".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((t) => (
                <Card key={t.id} t={t} onOpen={() => { setOpenId(t.id); setEditing(false); }} />
              ))}
            </div>
          )}
        </div>

        {/* Detail / edit dialog */}
        <Dialog open={!!openId} onOpenChange={(o) => { if (!o) { setOpenId(null); setEditing(false); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {open && (
              editing ? (
                <EditForm
                  t={open}
                  onSave={(payload) => updateMut.mutate({ id: open.id, payload })}
                  onCancel={() => setEditing(false)}
                  saving={updateMut.isPending}
                />
              ) : (
                <DetailView
                  t={open}
                  onEdit={() => setEditing(true)}
                  onDelete={() => setConfirmDeleteId(open.id)}
                  onAction={(payload) => updateMut.mutate({ id: open.id, payload })}
                />
              )
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the record and all attached files from storage. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => confirmDeleteId && deleteMut.mutate(confirmDeleteId)}
              >
                {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Upload from admin */}
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            refetch();
          }}
        />
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}

function StatPill({ label, value, color = "gray" }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
  };
  return (
    <div className={`${colorMap[color]} rounded-lg px-4 py-2`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({ t, onOpen }: { t: Testimonial; onOpen: () => void }) {
  const first = t.media[0];
  const isVideo = first?.mime?.startsWith("video/");
  const title = t.client_company || t.client_name || (first?.filename || "Untitled");

  return (
    <button
      onClick={onOpen}
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#264027] hover:shadow-lg transition-all text-left"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {first ? (
          isVideo ? (
            <video
              src={first.watchUrl}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
              onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
              onMouseLeave={(e) => {
                const v = e.currentTarget as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
          ) : (
            <img src={first.watchUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon size={32} />
          </div>
        )}
        {isVideo && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white rounded-full p-1.5">
            <Video size={14} />
          </div>
        )}
        {t.media.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white rounded-full px-2 py-0.5 text-xs font-medium">
            +{t.media.length - 1}
          </div>
        )}
        {t.featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5">
            <Star size={14} className="fill-current" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm truncate" style={{ color: "#264027" }}>
          {title}
        </div>
        <div className="text-xs text-gray-500 truncate mt-0.5">
          {t.client_city || t.product_or_service || formatDate(t.created_at)}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge className={`${STATUS_COLORS[t.status]} border text-xs`}>{t.status}</Badge>
          {t.status === "published" ? (
            <CheckCircle2 size={14} className="text-green-600" />
          ) : t.status === "pending" ? (
            <Clock size={14} className="text-amber-600" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

function DetailView({
  t,
  onEdit,
  onDelete,
  onAction,
}: {
  t: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
  onAction: (payload: any) => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 flex-wrap">
          {t.client_company || t.client_name || "Untitled testimonial"}
          <Badge className={`${STATUS_COLORS[t.status]} border`}>{t.status}</Badge>
          {t.featured && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
              <Star className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {t.media.map((m) => (
          <MediaPreview key={m.id} m={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-4">
        <Field icon={<User size={14} />} label="Client" value={t.client_name} />
        <Field icon={<Building2 size={14} />} label="Company" value={t.client_company} />
        <Field icon={<MapPin size={14} />} label="City" value={t.client_city} />
        <Field icon={<MessageSquare size={14} />} label="Product" value={t.product_or_service} />
        <Field icon={<User size={14} />} label="Submitted by" value={t.submitted_by_name} />
        <Field icon={<Clock size={14} />} label="Submitted" value={formatDate(t.created_at)} />
      </div>
      {t.note && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="font-semibold mb-1 text-gray-700">Note</div>
          <div className="text-gray-600 whitespace-pre-wrap">{t.note}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
        <Button onClick={onEdit} variant="outline">
          <Pencil size={16} className="mr-1" /> Edit
        </Button>
        {t.status === "pending" && (
          <>
            <Button onClick={() => onAction({ status: "approved" })} className="bg-blue-600 hover:bg-blue-700">
              <Check size={16} className="mr-1" /> Approve
            </Button>
            <Button onClick={() => onAction({ status: "rejected" })} variant="outline">
              <XIcon size={16} className="mr-1" /> Reject
            </Button>
          </>
        )}
        {(t.status === "approved" || t.status === "published") && (
          <Button
            onClick={() => onAction({ status: t.status === "published" ? "approved" : "published" })}
            className={t.status === "published" ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
          >
            {t.status === "published" ? <><Eye size={16} className="mr-1" /> Unpublish</> : <><Send size={16} className="mr-1" /> Publish</>}
          </Button>
        )}
        <Button onClick={() => onAction({ featured: !t.featured })} variant="outline">
          <Star size={16} className={`mr-1 ${t.featured ? "fill-yellow-400 text-yellow-500" : ""}`} />
          {t.featured ? "Unfeature" : "Feature"}
        </Button>
        <Button onClick={onDelete} variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
          <Trash2 size={16} className="mr-1" /> Delete
        </Button>
        <div className="ml-auto flex gap-2 flex-wrap justify-end">
          {t.media.map((m) => (
            <a
              key={m.id}
              href={m.downloadUrl}
              className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1"
            >
              <Download size={14} /> Download
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function EditForm({
  t,
  onSave,
  onCancel,
  saving,
}: {
  t: Testimonial;
  onSave: (payload: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [client_name, setClientName] = useState(t.client_name || "");
  const [client_company, setClientCompany] = useState(t.client_company || "");
  const [client_city, setClientCity] = useState(t.client_city || "");
  const [product_or_service, setProduct] = useState(t.product_or_service || "");
  const [submitted_by_name, setSubmittedBy] = useState(t.submitted_by_name || "");
  const [note, setNote] = useState(t.note || "");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit testimonial</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <FormField label="Client name">
          <Input value={client_name} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Shawn" />
        </FormField>
        <FormField label="Company or farm">
          <Input value={client_company} onChange={(e) => setClientCompany(e.target.value)} placeholder="e.g. Wilcox Pistachio Orchard" />
        </FormField>
        <FormField label="City">
          <Input value={client_city} onChange={(e) => setClientCity(e.target.value)} placeholder="e.g. Wilcox, AZ" />
        </FormField>
        <FormField label="Product or service">
          <Input value={product_or_service} onChange={(e) => setProduct(e.target.value)} />
        </FormField>
        <FormField label="Submitted by">
          <Input value={submitted_by_name} onChange={(e) => setSubmittedBy(e.target.value)} />
        </FormField>
        <FormField label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </FormField>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          className="bg-[#264027] hover:bg-[#3c5233]"
          disabled={saving}
          onClick={() =>
            onSave({ client_name, client_company, client_city, product_or_service, submitted_by_name, note })
          }
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5 text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function MediaPreview({ m }: { m: Media }) {
  const isVideo = m.mime?.startsWith("video/");
  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      {isVideo ? (
        <video src={m.watchUrl} className="w-full" controls preload="metadata" />
      ) : (
        <img src={m.watchUrl} alt={m.filename} className="w-full" />
      )}
      <div className="p-2 text-xs text-gray-600 flex items-center justify-between">
        <span className="truncate flex-1 mr-2">{m.filename}</span>
        <span className="text-gray-400">{formatBytes(m.size)}</span>
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={value ? "font-medium" : "text-gray-400 italic"}>{value || "(not provided)"}</div>
      </div>
    </div>
  );
}

// =============== UPLOAD FROM ADMIN ===============

type UploadState = "queued" | "uploading" | "uploaded" | "error";

interface FileEntry {
  id: string;
  file: File;
  state: UploadState;
  progress: number;
  storagePath: string;
  upload?: tus.Upload;
  error?: string;
}

function UploadDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [testimonialId, setTestimonialId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [product, setProduct] = useState("");
  const [note, setNote] = useState("");
  const [submittedBy, setSubmittedBy] = useState("Rodo");
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setClientName("");
    setClientCompany("");
    setClientCity("");
    setProduct("");
    setNote("");
    setNotify(true);
    setSubmitError(null);
    fetch("/api/testimonials/init", { method: "POST" })
      .then((r) => r.json())
      .then((j) => j.testimonialId && setTestimonialId(j.testimonialId))
      .catch(() => {});
  }, [open]);

  const allUploaded = files.length > 0 && files.every((f) => f.state === "uploaded");
  const anyUploading = files.some((f) => f.state === "uploading" || f.state === "queued");

  function startUpload(entry: FileEntry) {
    if (!testimonialId) return;
    const upload = new tus.Upload(entry.file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000, 30000],
      headers: {
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "testimonials",
        objectName: entry.storagePath,
        contentType: entry.file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, state: "error", error: err.message || "Upload failed" } : f))
        );
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = Math.round((bytesUploaded / bytesTotal) * 100);
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, progress: pct } : f)));
      },
      onSuccess: () => {
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, state: "uploaded", progress: 100 } : f)));
      },
    });
    upload.start();
    setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, state: "uploading", upload } : f)));
  }

  function addFiles(picked: FileList | File[]) {
    if (!testimonialId) return;
    const arr = Array.from(picked).filter((f) => f.type.startsWith("video/") || f.type.startsWith("image/"));
    const entries: FileEntry[] = arr.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      return {
        id,
        file,
        state: "queued" as UploadState,
        progress: 0,
        storagePath: `${testimonialId}/${id}-${safeName}`,
      };
    });
    setFiles((prev) => [...prev, ...entries]);
    setTimeout(() => entries.forEach(startUpload), 50);
  }

  function removeFile(entry: FileEntry) {
    if (entry.upload) entry.upload.abort();
    setFiles((prev) => prev.filter((f) => f.id !== entry.id));
  }

  async function handleSubmit() {
    if (!testimonialId || !allUploaded) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch("/api/testimonials/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testimonialId,
          notify,
          fields: {
            clientName,
            clientCompany,
            clientCity,
            productOrService: product,
            note,
            submittedByName: submittedBy,
          },
          media: files.map((f) => ({ path: f.storagePath, mimeType: f.file.type, sizeBytes: f.file.size })),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Submit failed");
      onSuccess();
    } catch (e: any) {
      setSubmitError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add testimonial</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50">
            <p className="font-semibold text-base text-[#264027] mb-3">Add a video or photo</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => galleryInputRef.current?.click()} className="bg-[#3c5233] hover:bg-[#264027]">
                <ImagePlus className="w-4 h-4 mr-1" /> Pick from gallery
              </Button>
              <Button onClick={() => cameraInputRef.current?.click()} variant="outline">
                <Camera className="w-4 h-4 mr-1" /> Take new
              </Button>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="video/*,image/*"
              multiple
              hidden
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="video/*,image/*"
              capture="environment"
              hidden
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {/* File list */}
          {files.map((f) => (
            <div key={f.id} className="bg-white rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(f.file.size)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeFile(f)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${f.progress}%`,
                    background: f.state === "uploaded" ? "#16a34a" : f.state === "error" ? "#dc2626" : "#3c5233",
                  }}
                />
              </div>
              <div className="text-xs mt-1 text-gray-600">
                {f.state === "uploaded" ? "Uploaded" : f.state === "error" ? `Error: ${f.error}` : `Uploading… ${f.progress}%`}
              </div>
            </div>
          ))}

          {/* Form fields */}
          {files.length > 0 && (
            <>
              <FormField label="Client name">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Shawn" />
              </FormField>
              <FormField label="Company or farm">
                <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="e.g. Wilcox Pistachio Orchard" />
              </FormField>
              <FormField label="City">
                <Input value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="e.g. Wilcox, AZ" />
              </FormField>
              <FormField label="Product or service">
                <Input value={product} onChange={(e) => setProduct(e.target.value)} />
              </FormField>
              <FormField label="Submitted by">
                <Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} />
              </FormField>
              <FormField label="Note">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </FormField>

              {/* Notify toggle */}
              <label className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
                <Checkbox checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
                <span className="text-sm">
                  <span className="font-semibold">Notify the social team</span>
                  <span className="text-gray-600"> (Rodo, Gabriela, Sabrina, Kerry)</span>
                </span>
              </label>
            </>
          )}

          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {submitError}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#264027] hover:bg-[#3c5233]"
            disabled={!allUploaded || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving</> : anyUploading ? "Wait for upload…" : "Save testimonial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
