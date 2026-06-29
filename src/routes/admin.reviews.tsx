import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Star, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, type Review } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: ReviewsPage,
});

type Draft = Partial<Review>;
const EMPTY: Draft = { name: "", role: "", rating: 5, text: "", approved: true };

function ReviewsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);

  const { data, isLoading } = useQuery<Review[]>({
    queryKey: ["admin", "reviews"],
    queryFn: () => apiFetch<Review[]>("/reviews/"),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    await refreshPublicContent(qc);
  };

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      d.id
        ? apiFetch(`/reviews/${d.id}/`, { method: "PATCH", body: d })
        : apiFetch("/reviews/", { method: "POST", body: d }),
    onSuccess: () => {
      invalidate();
      toast.success("Review saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error("Save failed", { description: e?.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/reviews/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Review deleted");
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  return (
    <AdminShell title="Reviews" description="Add and manage customer reviews">
      <div className="mb-5">
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New review
        </button>
      </div>

      {editing && (
        <ReviewForm
          draft={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => saveMutation.mutate(editing)}
          saving={saveMutation.isPending}
        />
      )}

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3">
          {data?.filter((r) => r.id !== editing?.id).map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.role}</span>
                  <span className="flex items-center gap-0.5 text-brand-orange">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                  {!r.approved && (
                    <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-medium text-brand-orange">
                      Pending
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.text}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <IconBtn
                  title={r.approved ? "Unapprove" : "Approve"}
                  onClick={() => saveMutation.mutate({ id: r.id, approved: !r.approved })}
                >
                  {r.approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </IconBtn>
                <IconBtn title="Edit" onClick={() => setEditing(r)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Delete"
                  danger
                  onClick={() => {
                    if (confirm(`Delete review by ${r.name}?`)) deleteMutation.mutate(r.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
          ))}
          {data?.filter((r) => r.id !== editing?.id).length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">No reviews yet. Add your first one.</p>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function ReviewForm({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-primary/30 bg-background p-6 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold">{draft.id ? "Edit review" : "New review"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" value={draft.name ?? ""} onChange={(v) => onChange({ ...draft, name: v })} />
        <Input label="Role / type" value={draft.role ?? ""} onChange={(v) => onChange({ ...draft, role: v })} />
        <div>
          <Label>Rating</Label>
          <select
            value={draft.rating ?? 5}
            onChange={(e) => onChange({ ...draft, rating: Number(e.target.value) })}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!draft.approved}
              onChange={(e) => onChange({ ...draft, approved: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            Show on website (approved)
          </label>
        </div>
        <div className="sm:col-span-2">
          <TextArea label="Review text" value={draft.text ?? ""} onChange={(v) => onChange({ ...draft, text: v })} rows={3} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function Input({
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
