import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Video, X, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, mediaUrl, type FeaturedVideo } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/videos")({
  head: () => ({ meta: [{ title: "Featured Videos — Admin" }] }),
  component: VideosAdminPage,
});

type Draft = Partial<FeaturedVideo> & { videoFile?: File | null };

function emptyDraft(): Draft {
  return { title: "", videoFile: null };
}

function sortVideos(list: FeaturedVideo[]) {
  return list.slice().sort((a, b) => a.order - b.order || a.id - b.id);
}

function VideosAdminPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const { data, isLoading } = useQuery<FeaturedVideo[]>({
    queryKey: ["admin", "featured-videos"],
    queryFn: () => apiFetch<FeaturedVideo[]>("/featured-videos/"),
  });

  const sorted = sortVideos(data ?? []);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "featured-videos"] });
    await refreshPublicContent(qc);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/featured-videos/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Video deleted");
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  async function moveVideo(id: number, direction: "up" | "down") {
    const list = sortVideos(data ?? []).filter((v) => v.id !== editing?.id);
    const index = list.findIndex((v) => v.id === id);
    if (index < 0) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= list.length) return;

    const next = [...list];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];

    setReordering(true);
    try {
      await Promise.all(
        next.map((v, i) =>
          apiFetch(`/featured-videos/${v.id}/`, { method: "PATCH", body: { order: i } }),
        ),
      );
      await invalidate();
      toast.success(direction === "up" ? "Moved up (shows earlier)" : "Moved down (shows later)");
    } catch (e: any) {
      toast.error("Could not reorder", { description: e?.message });
    } finally {
      setReordering(false);
    }
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.id && !editing.videoFile) {
      toast.error("Please choose a video file");
      return;
    }
    setSaving(true);
    try {
      const nextOrder =
        editing.id != null
          ? editing.order ?? 0
          : sorted.length
            ? Math.max(...sorted.map((v) => v.order)) + 1
            : 0;

      let saved: FeaturedVideo;
      if (editing.id) {
        saved = await apiFetch<FeaturedVideo>(`/featured-videos/${editing.id}/`, {
          method: "PATCH",
          body: { title: editing.title ?? "", order: nextOrder },
        });
        if (editing.videoFile) {
          const fd = new FormData();
          fd.append("video", editing.videoFile);
          saved = await apiFetch<FeaturedVideo>(`/featured-videos/${saved.id}/`, {
            method: "PATCH",
            body: fd,
          });
        }
      } else {
        const fd = new FormData();
        fd.append("title", editing.title ?? "");
        fd.append("order", String(nextOrder));
        if (editing.videoFile) fd.append("video", editing.videoFile);
        saved = await apiFetch<FeaturedVideo>("/featured-videos/", { method: "POST", body: fd });
      }

      await invalidate();
      toast.success(`Video saved${saved.title ? `: ${saved.title}` : ""}`);
      setEditing(null);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const listForUi = sorted.filter((v) => v.id !== editing?.id);

  return (
    <AdminShell
      title="Featured Videos"
      description="Use ↑ ↓ to set which video plays first on the home page carousel"
    >
      <div className="mb-5">
        <button
          onClick={() => setEditing(emptyDraft())}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add video
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-background p-6 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">{editing.id ? "Edit video" : "New video"}</h3>
          <div className="grid gap-4">
            <div>
              <Label>Title (optional)</Label>
              <input
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. Station tour"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <Label>Video file</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload MP4/WebM. Order on the home page is controlled with the ↑ ↓ buttons in the list.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {editing.videoFile ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="max-w-[220px] truncate">{editing.videoFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, videoFile: null })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : editing.video ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <span>Current video saved</span>
                    <a
                      href={mediaUrl(editing.video)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Preview
                    </a>
                  </div>
                ) : null}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
                  <Video className="h-4 w-4" />
                  {editing.video || editing.videoFile ? "Replace video" : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setEditing({ ...editing, videoFile: f });
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
              onClick={() => setEditing(null)}
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
          {listForUi.map((v, index) => (
            <div key={v.id} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  title="Move up (show earlier)"
                  disabled={reordering || index === 0}
                  onClick={() => moveVideo(v.id, "up")}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-accent disabled:opacity-35"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move down (show later)"
                  disabled={reordering || index === listForUi.length - 1}
                  onClick={() => moveVideo(v.id, "down")}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-accent disabled:opacity-35"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                {v.video ? (
                  <video src={mediaUrl(v.video)} className="h-full w-full object-cover" muted preload="metadata" />
                ) : (
                  <Video className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{v.title || `Video #${v.id}`}</div>
                <div className="text-xs text-muted-foreground">
                  Position {index + 1}
                  {index === 0 ? " · plays first on home" : ""}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  title="Edit"
                  onClick={() => setEditing({ ...v, videoFile: null })}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (confirm(`Delete "${v.title || `Video #${v.id}`}"?`)) deleteMutation.mutate(v.id);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          {listForUi.length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">No featured videos yet. Add two or more for a carousel.</p>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}
