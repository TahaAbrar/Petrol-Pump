import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, ImagePlus, CalendarDays, Video, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, mediaUrl, type EventItem } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/events")({
  head: () => ({ meta: [{ title: "Events — Admin" }] }),
  component: EventsPage,
});

type Draft = Partial<EventItem>;

function emptyDraft(): Draft {
  return { title: "", date: "", description: "", long_description: "", order: 0 };
}

function EventsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<EventItem[]>({
    queryKey: ["admin", "events"],
    queryFn: () => apiFetch<EventItem[]>("/events/"),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "events"] });
    await refreshPublicContent(qc);
    await qc.invalidateQueries({ queryKey: ["event"], refetchType: "all" });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/events/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Event deleted");
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  async function removeGalleryImage(eventId: number, imageId: number) {
    try {
      const updated = await apiFetch<EventItem>(`/events/${eventId}/gallery/${imageId}/`, {
        method: "DELETE",
      });
      setEditing((prev) => (prev?.id === eventId ? { ...prev, ...updated } : prev));
      await invalidate();
      toast.success("Image removed");
    } catch (e: any) {
      toast.error("Could not remove image", { description: e?.message });
    }
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        title: editing.title,
        date: editing.date,
        description: editing.description,
        long_description: editing.long_description,
        order: editing.order ?? 0,
      };
      const saved = editing.id
        ? await apiFetch<EventItem>(`/events/${editing.id}/`, { method: "PATCH", body })
        : await apiFetch<EventItem>("/events/", { method: "POST", body });

      if (newImages.length) {
        const fd = new FormData();
        newImages.forEach((f) => fd.append("images", f));
        await apiFetch(`/events/${saved.id}/gallery/`, { method: "POST", body: fd });
      }

      if (videoFile) {
        const fd = new FormData();
        fd.append("video", videoFile);
        await apiFetch(`/events/${saved.id}/`, { method: "PATCH", body: fd });
      } else if (removeVideo) {
        await apiFetch(`/events/${saved.id}/`, { method: "PATCH", body: { video: null } });
      }

      await invalidate();
      toast.success("Event saved");
      setEditing(null);
      setNewImages([]);
      setVideoFile(null);
      setRemoveVideo(false);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ev: EventItem) {
    setEditing(ev);
    setNewImages([]);
    setVideoFile(null);
    setRemoveVideo(false);
  }

  return (
    <AdminShell title="Events" description="Add and manage station events">
      <div className="mb-5">
        <button
          onClick={() => {
            setEditing(emptyDraft());
            setNewImages([]);
            setVideoFile(null);
            setRemoveVideo(false);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-background p-6 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">{editing.id ? "Edit event" : "New event"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field label="Date (free text)" value={editing.date ?? ""} onChange={(v) => setEditing({ ...editing, date: v })} />
            <div className="sm:col-span-2">
              <TextArea label="Short description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} rows={2} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Full description" value={editing.long_description ?? ""} onChange={(v) => setEditing({ ...editing, long_description: v })} rows={4} />
            </div>
            <Field
              label="Display order"
              value={String(editing.order ?? 0)}
              onChange={(v) => setEditing({ ...editing, order: Number(v) || 0 })}
            />

            <div className="sm:col-span-2">
              <Label>Event images (add as many as you like)</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Images rotate on the events page card when visitors hover. All images appear in the event gallery.
              </p>

              {editing.images && editing.images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {editing.images.map((img) => (
                    <div key={img.id} className="relative h-20 w-28 overflow-hidden rounded-xl border border-border">
                      <img src={mediaUrl(img.image)} alt="" className="h-full w-full object-cover" />
                      {editing.id && (
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(editing.id!, img.id)}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {newImages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {newImages.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="relative h-20 w-28 overflow-hidden rounded-xl border border-dashed border-primary/40">
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                        aria-label="Remove pending image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
                <ImagePlus className="h-4 w-4" />
                Add images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) setNewImages((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="sm:col-span-2">
              <Label>Event video (optional)</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload a recap video. It appears at the bottom of the event detail page.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {videoFile ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="max-w-[200px] truncate">{videoFile.name}</span>
                    <button type="button" onClick={() => setVideoFile(null)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : editing.video && !removeVideo ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <span>Current video saved</span>
                    <button
                      type="button"
                      onClick={() => setRemoveVideo(true)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
                  <Video className="h-4 w-4" />
                  {videoFile || (editing.video && !removeVideo) ? "Replace video" : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setVideoFile(f);
                      setRemoveVideo(false);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setNewImages([]);
                setVideoFile(null);
                setRemoveVideo(false);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3">
          {data?.filter((ev) => ev.id !== editing?.id).map((ev) => (
            <div key={ev.id} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
              <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                {ev.image || ev.images?.length ? (
                  <img
                    src={mediaUrl(ev.images?.[0]?.image ?? ev.image)}
                    alt={ev.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{ev.title}</div>
                <div className="text-xs text-muted-foreground">{ev.date}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <IconBtn title="Edit" onClick={() => startEdit(ev)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Delete"
                  danger
                  onClick={() => {
                    if (confirm(`Delete "${ev.title}"?`)) deleteMutation.mutate(ev.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
          ))}
          {data?.filter((ev) => ev.id !== editing?.id).length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={
        "grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors " +
        (danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent")
      }
    >
      {children}
    </button>
  );
}
