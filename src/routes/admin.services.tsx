import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, ImagePlus, Fuel, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Switch } from "@/components/ui/switch";
import { apiFetch, mediaUrl, type ServiceItem } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Services — Admin" }] }),
  component: ServicesAdminPage,
});

type Draft = Partial<ServiceItem> & { highlightsText?: string };

function emptyDraft(): Draft {
  return {
    title: "",
    category: "Fuel",
    description: "",
    long_description: "",
    availability: "Available",
    quantity: "",
    price: "",
    highlights: [],
    highlightsText: "",
    order: 0,
  };
}

function ServicesAdminPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<ServiceItem[]>({
    queryKey: ["admin", "services"],
    queryFn: () => apiFetch<ServiceItem[]>("/services/"),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "services"] });
    await refreshPublicContent(qc);
    await qc.invalidateQueries({ queryKey: ["service"], refetchType: "all" });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/services/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Service deleted");
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      apiFetch<ServiceItem>(`/services/${id}/`, { method: "PATCH", body: { featured } }),
    onSuccess: (saved) => {
      invalidate();
      toast.success(saved.featured ? "Featured on home" : "Removed from home features");
    },
    onError: (e: any) => toast.error("Could not update feature", { description: e?.message }),
  });

  async function removeGalleryImage(serviceId: number, imageId: number) {
    try {
      const updated = await apiFetch<ServiceItem>(`/services/${serviceId}/gallery/${imageId}/`, {
        method: "DELETE",
      });
      setEditing((prev) => (prev?.id === serviceId ? { ...prev, ...updated } : prev));
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
      const highlights = (editing.highlightsText ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        title: editing.title,
        category: editing.category,
        description: editing.description,
        long_description: editing.long_description,
        availability: editing.availability,
        quantity: editing.quantity,
        price: editing.price,
        highlights,
        order: editing.order ?? 0,
      };
      const saved = editing.id
        ? await apiFetch<ServiceItem>(`/services/${editing.id}/`, { method: "PATCH", body })
        : await apiFetch<ServiceItem>("/services/", { method: "POST", body });

      if (newImages.length) {
        const fd = new FormData();
        newImages.forEach((f) => fd.append("images", f));
        await apiFetch(`/services/${saved.id}/gallery/`, { method: "POST", body: fd });
      }

      await invalidate();
      toast.success("Service saved");
      setEditing(null);
      setNewImages([]);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(svc: ServiceItem) {
    setEditing({
      ...svc,
      highlightsText: (svc.highlights ?? []).join("\n"),
    });
    setNewImages([]);
  }

  return (
    <AdminShell title="Services" description="Manage station products & amenities (fuel, EV, air, and more)">
      <div className="mb-5">
        <button
          onClick={() => {
            setEditing(emptyDraft());
            setNewImages([]);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New service
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-background p-6 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">{editing.id ? "Edit service" : "New service"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field
              label="Category"
              value={editing.category ?? ""}
              onChange={(v) => setEditing({ ...editing, category: v })}
              placeholder="Fuel, EV & Charging, Forecourt Care…"
            />
            <Field
              label="Availability"
              value={editing.availability ?? ""}
              onChange={(v) => setEditing({ ...editing, availability: v })}
              placeholder="Available 24/7, Limited, Out of stock…"
            />
            <Field
              label="Quantity / stock"
              value={editing.quantity ?? ""}
              onChange={(v) => setEditing({ ...editing, quantity: v })}
              placeholder="e.g. 2 charging bays, High-volume tank"
            />
            <Field
              label="Price"
              value={editing.price ?? ""}
              onChange={(v) => setEditing({ ...editing, price: v })}
              placeholder="Ask at pump, Complimentary, Per kWh…"
            />
            <Field
              label="Display order"
              value={String(editing.order ?? 0)}
              onChange={(v) => setEditing({ ...editing, order: Number(v) || 0 })}
            />
            <div className="sm:col-span-2">
              <TextArea
                label="Short description"
                value={editing.description ?? ""}
                onChange={(v) => setEditing({ ...editing, description: v })}
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea
                label="Full description"
                value={editing.long_description ?? ""}
                onChange={(v) => setEditing({ ...editing, long_description: v })}
                rows={4}
              />
            </div>
            <div className="sm:col-span-2">
              <TextArea
                label="Highlights (one per line)"
                value={editing.highlightsText ?? ""}
                onChange={(v) => setEditing({ ...editing, highlightsText: v })}
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Service images (2 or more recommended)</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Images rotate on the services card when visitors hover. All images appear on the detail gallery.
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
                    <div
                      key={`${file.name}-${i}`}
                      className="relative h-20 w-28 overflow-hidden rounded-xl border border-dashed border-primary/40"
                    >
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
          {data
            ?.filter((svc) => svc.id !== editing?.id)
            .map((svc) => (
              <div key={svc.id} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
                <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {svc.image || svc.images?.length ? (
                    <img
                      src={mediaUrl(svc.images?.[0]?.image ?? svc.image)}
                      alt={svc.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Fuel className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{svc.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {svc.category}
                    {svc.availability ? ` · ${svc.availability}` : ""}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{svc.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="mb-1 flex items-center gap-2 rounded-xl border border-border px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Feature
                    </span>
                    <Switch
                      checked={Boolean(svc.featured)}
                      disabled={featureMutation.isPending}
                      onCheckedChange={(checked) =>
                        featureMutation.mutate({ id: svc.id, featured: checked })
                      }
                      aria-label={`Feature ${svc.title} on home`}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <IconBtn title="Edit" onClick={() => startEdit(svc)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${svc.title}"?`)) deleteMutation.mutate(svc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            ))}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-accent"
    >
      {children}
    </button>
  );
}
