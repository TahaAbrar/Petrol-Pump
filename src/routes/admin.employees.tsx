import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, ImagePlus, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, mediaUrl, type Employee } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — Admin" }] }),
  component: EmployeesPage,
});

type Draft = Partial<Employee> & { _respText?: string };

function toDraft(e?: Employee): Draft {
  return e
    ? { ...e, _respText: (e.responsibilities ?? []).join("\n") }
    : { name: "", role: "", experience: "", email: "", bio: "", order: 0, _respText: "" };
}

function EmployeesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<Employee[]>({
    queryKey: ["admin", "employees"],
    queryFn: () => apiFetch<Employee[]>("/employees/"),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "employees"] });
    await refreshPublicContent(qc);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/employees/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Employee deleted");
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        name: editing.name,
        role: editing.role,
        experience: editing.experience,
        email: editing.email,
        bio: editing.bio,
        order: editing.order ?? 0,
        responsibilities: (editing._respText ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const saved = editing.id
        ? await apiFetch<Employee>(`/employees/${editing.id}/`, { method: "PATCH", body })
        : await apiFetch<Employee>("/employees/", { method: "POST", body });

      if (file) {
        const fd = new FormData();
        fd.append("image", file);
        await apiFetch(`/employees/${saved.id}/`, { method: "PATCH", body: fd });
      }
      invalidate();
      toast.success("Employee saved");
      setEditing(null);
      setFile(null);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Employees" description="Add and manage your team members">
      <div className="mb-5">
        <button
          onClick={() => {
            setEditing(toDraft());
            setFile(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New employee
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-background p-6 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold">
            {editing.id ? "Edit employee" : "New employee"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <Field label="Role" value={editing.role ?? ""} onChange={(v) => setEditing({ ...editing, role: v })} />
            <Field label="Experience" value={editing.experience ?? ""} onChange={(v) => setEditing({ ...editing, experience: v })} />
            <Field label="Email" value={editing.email ?? ""} onChange={(v) => setEditing({ ...editing, email: v })} />
            <div className="sm:col-span-2">
              <TextArea label="Bio" value={editing.bio ?? ""} onChange={(v) => setEditing({ ...editing, bio: v })} rows={3} />
            </div>
            <div className="sm:col-span-2">
              <TextArea label="Responsibilities (one per line)" value={editing._respText ?? ""} onChange={(v) => setEditing({ ...editing, _respText: v })} rows={4} />
            </div>
            <Field
              label="Display order"
              value={String(editing.order ?? 0)}
              onChange={(v) => setEditing({ ...editing, order: Number(v) || 0 })}
            />
            <div>
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-border bg-muted">
                  {file ? (
                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                  ) : editing.image ? (
                    <img src={mediaUrl(editing.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
                  <ImagePlus className="h-4 w-4" />
                  Choose
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
                setFile(null);
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
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.filter((emp) => emp.id !== editing?.id).map((emp) => (
            <div key={emp.id} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                {emp.image ? (
                  <img src={mediaUrl(emp.image)} alt={emp.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{emp.name}</div>
                <div className="text-sm text-muted-foreground">{emp.role}</div>
                <div className="mt-1 text-xs text-muted-foreground">{emp.experience}</div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <IconBtn title="Edit" onClick={() => { setEditing(toDraft(emp)); setFile(null); }}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Delete"
                  danger
                  onClick={() => {
                    if (confirm(`Delete ${emp.name}?`)) deleteMutation.mutate(emp.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
          ))}
          {data?.filter((emp) => emp.id !== editing?.id).length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">No employees yet.</p>
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
