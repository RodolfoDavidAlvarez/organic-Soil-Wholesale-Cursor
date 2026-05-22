import { useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Helmet } from "react-helmet-async";
import { Camera, ImagePlus, Loader2, CheckCircle2, AlertCircle, X, Trash2, Pause, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://govktyrtmwzbzqkmzmrf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SSW_GREEN = "#264027";
const SSW_HUNTER = "#3c5233";
const SSW_CAMEL = "#b38a58";

type UploadState = "queued" | "uploading" | "paused" | "uploaded" | "error";

interface FileEntry {
  id: string;
  file: File;
  state: UploadState;
  progress: number;
  storagePath: string;
  upload?: tus.Upload;
  error?: string;
}

interface TeamMember {
  id: string;
  name: string;
  slug: string;
}

const LAST_TEAM_MEMBER_KEY = "ssw_last_team_member";

export default function TeamUpload() {
  const [testimonialId, setTestimonialId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamMember, setTeamMember] = useState<string>("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [productOrService, setProductOrService] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Init testimonial draft + load team members on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/testimonials/init", { method: "POST" });
        const j = await r.json();
        if (j.testimonialId) setTestimonialId(j.testimonialId);
      } catch (e) {
        console.error("Failed to init testimonial", e);
      }
      try {
        const r2 = await fetch("/api/team-members");
        const j2 = await r2.json();
        if (Array.isArray(j2.members)) setMembers(j2.members);
      } catch (e) {
        console.error("Failed to load team members", e);
      }
      const last = localStorage.getItem(LAST_TEAM_MEMBER_KEY);
      if (last) setTeamMember(last);
    })();
  }, []);

  // Cleanup any in-progress uploads on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.upload && f.state === "uploading") {
          f.upload.abort();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        console.error("Upload error", err);
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, state: "error", error: err.message || "Upload failed" } : f))
        );
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = Math.round((bytesUploaded / bytesTotal) * 100);
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, progress: pct } : f)));
      },
      onSuccess: () => {
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, state: "uploaded", progress: 100 } : f))
        );
      },
    });
    upload.start();
    setFiles((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, state: "uploading", upload } : f))
    );
  }

  function addFiles(picked: FileList | File[]) {
    if (!testimonialId) return;
    const arr = Array.from(picked);
    const valid = arr.filter((f) => f.type.startsWith("video/") || f.type.startsWith("image/"));
    if (valid.length !== arr.length) {
      alert("Only videos and images are allowed.");
    }
    const entries: FileEntry[] = valid.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${testimonialId}/${id}-${safeName}`;
      return {
        id,
        file,
        state: "queued",
        progress: 0,
        storagePath,
      };
    });
    setFiles((prev) => [...prev, ...entries]);
    // Kick off uploads (one frame later so React state has the entries)
    setTimeout(() => entries.forEach(startUpload), 50);
  }

  function pauseUpload(entry: FileEntry) {
    if (entry.upload && entry.state === "uploading") {
      entry.upload.abort();
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, state: "paused" } : f)));
    }
  }

  function resumeUpload(entry: FileEntry) {
    if (entry.upload) {
      entry.upload.start();
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, state: "uploading" } : f)));
    }
  }

  function removeFile(entry: FileEntry) {
    if (entry.upload) entry.upload.abort();
    setFiles((prev) => prev.filter((f) => f.id !== entry.id));
  }

  function retryFile(entry: FileEntry) {
    setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, state: "queued", progress: 0, error: undefined } : f)));
    setTimeout(() => startUpload(entry), 50);
  }

  async function addTeamMember() {
    const name = newMemberName.trim();
    if (!name) return;
    try {
      const r = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json();
      if (j.member) {
        setMembers((prev) => {
          if (prev.find((m) => m.id === j.member.id)) return prev;
          return [...prev, j.member].sort((a, b) => a.name.localeCompare(b.name));
        });
        setTeamMember(j.member.name);
        setNewMemberName("");
        setShowAddNew(false);
      }
    } catch (e) {
      console.error("Add member failed", e);
    }
  }

  async function handleSubmit() {
    if (!testimonialId || !allUploaded) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (teamMember) localStorage.setItem(LAST_TEAM_MEMBER_KEY, teamMember);
      const r = await fetch("/api/testimonials/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testimonialId,
          fields: {
            clientName,
            clientCompany,
            clientCity,
            productOrService,
            note,
            submittedByName: teamMember,
          },
          media: files.map((f) => ({
            path: f.storagePath,
            mimeType: f.file.type,
            sizeBytes: f.file.size,
          })),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Submit failed");
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForNew() {
    // Reset all and create new draft
    setSubmitted(false);
    setSubmitError(null);
    setFiles([]);
    setClientName("");
    setClientCompany("");
    setClientCity("");
    setProductOrService("");
    setNote("");
    fetch("/api/testimonials/init", { method: "POST" })
      .then((r) => r.json())
      .then((j) => j.testimonialId && setTestimonialId(j.testimonialId));
  }

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Thanks — SSW Testimonial Uploader</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: SSW_GREEN }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <CheckCircle2 className="mx-auto mb-4 text-green-600" size={64} />
            <h1 className="text-2xl font-bold mb-2" style={{ color: SSW_GREEN }}>
              Got it. Thanks.
            </h1>
            <p className="text-gray-700 mb-6">
              Your video is in. You can close this tab, or take another.
            </p>
            <button
              onClick={resetForNew}
              className="w-full py-4 rounded-xl text-white font-semibold text-lg active:scale-[0.98] transition-transform"
              style={{ background: SSW_HUNTER }}
            >
              Submit another
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Share Your Story — Soil Seed &amp; Water</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Helmet>
      <div className="min-h-screen pb-40 md:pb-12" style={{ background: "#f7f5f0" }}>
        {/* Header */}
        <div className="px-4 md:px-8 pt-6 md:pt-10 pb-4 md:pb-6" style={{ background: SSW_GREEN }}>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Share Your Story</h1>
            <p className="text-sm md:text-base mt-1" style={{ color: SSW_CAMEL }}>
              Drop a video from a happy client. 30 seconds, done.
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 max-w-2xl mx-auto">
          {/* File picker */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
            }}
            className={`mt-6 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? "bg-white border-[#3c5233]" : "bg-white/70 border-gray-300"
            }`}
          >
            <p className="font-semibold text-lg mb-1" style={{ color: SSW_GREEN }}>
              {files.length === 0 ? "Add a video or photo" : "Add another"}
            </p>
            <p className="hidden sm:block text-sm text-gray-600 mb-4">
              Or drag and drop here
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base active:scale-[0.98] transition-transform"
                style={{ background: SSW_HUNTER }}
              >
                <ImagePlus size={20} />
                Pick from gallery
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base active:scale-[0.98] transition-transform border-2"
                style={{ borderColor: SSW_HUNTER, color: SSW_HUNTER, background: "white" }}
              >
                <Camera size={20} />
                Take new
              </button>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="video/*,image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="video/*,image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              {files.map((f) => (
                <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: SSW_GREEN }}>
                        {f.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(f.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.state === "uploading" && (
                        <button
                          onClick={() => pauseUpload(f)}
                          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                          aria-label="Pause"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      {f.state === "paused" && (
                        <button
                          onClick={() => resumeUpload(f)}
                          className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                          aria-label="Resume"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      {f.state === "error" && (
                        <button
                          onClick={() => retryFile(f)}
                          className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(f)}
                        className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${f.progress}%`,
                          background:
                            f.state === "uploaded"
                              ? "#16a34a"
                              : f.state === "error"
                              ? "#dc2626"
                              : SSW_HUNTER,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-xs">
                      <span className="text-gray-600">
                        {f.state === "uploaded" && (
                          <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 size={14} /> Uploaded
                          </span>
                        )}
                        {f.state === "uploading" && `Uploading… ${f.progress}%`}
                        {f.state === "paused" && `Paused at ${f.progress}%`}
                        {f.state === "queued" && "Starting…"}
                        {f.state === "error" && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle size={14} /> {f.error || "Failed"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Optional fields */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  Client name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Shawn"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  Company or farm <span className="text-gray-400 font-normal">(optional, helps us shout them out)</span>
                </label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g. Wilcox Pistachio Orchard"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  City <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="e.g. Wilcox, AZ"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  Product or service <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={productOrService}
                  onChange={(e) => setProductOrService(e.target.value)}
                  placeholder="e.g. Compost extract on pistachios"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  Anything they said? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="A line or two — what stood out?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: SSW_GREEN }}>
                  Your name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                {!showAddNew ? (
                  <div className="flex gap-2">
                    <select
                      value={teamMember}
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          setShowAddNew(true);
                        } else {
                          setTeamMember(e.target.value);
                        }
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:ring-2"
                    >
                      <option value="">— Pick yourself —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add new person</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Type your name"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-base"
                      autoFocus
                    />
                    <button
                      onClick={addTeamMember}
                      className="px-4 rounded-xl text-white font-semibold"
                      style={{ background: SSW_HUNTER }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNew(false);
                        setNewMemberName("");
                      }}
                      className="p-3 rounded-xl bg-gray-100"
                      aria-label="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Submit — sticky on mobile, inline on desktop */}
        {files.length > 0 && (
          <>
            {/* Mobile sticky bar */}
            <div className="md:hidden fixed bottom-0 inset-x-0 p-4 bg-white border-t shadow-lg z-10">
              <div className="max-w-xl mx-auto">
                <button
                  onClick={handleSubmit}
                  disabled={!allUploaded || submitting}
                  className="w-full py-4 rounded-xl text-white font-semibold text-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: allUploaded ? SSW_HUNTER : "#9ca3af" }}
                >
                  {submitting ? (
                    <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                  ) : anyUploading ? (
                    <><Loader2 size={20} className="animate-spin" /> Uploading… wait for green</>
                  ) : allUploaded ? "Submit" : "Add a video first"}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Uploads keep going if your tab closes, just reopen this link.
                </p>
              </div>
            </div>

            {/* Desktop inline submit */}
            <div className="hidden md:block max-w-2xl mx-auto px-8 mt-8">
              <button
                onClick={handleSubmit}
                disabled={!allUploaded || submitting}
                className="w-full py-4 rounded-xl text-white font-semibold text-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: allUploaded ? SSW_HUNTER : "#9ca3af" }}
              >
                {submitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Submitting…</>
                ) : anyUploading ? (
                  <><Loader2 size={20} className="animate-spin" /> Uploading… wait for green</>
                ) : allUploaded ? "Submit" : "Add a video first"}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Uploads keep going if your tab closes, just reopen this link.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
