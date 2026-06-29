import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, type AdminUser } from "@/lib/api";
import { useRequireAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/account")({
  head: () => ({ meta: [{ title: "Account — Admin" }] }),
  component: AccountPage,
});

function AccountPage() {
  const qc = useQueryClient();
  const { user, refresh } = useRequireAdmin();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email ?? "");
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch<AdminUser>("/auth/credentials/", { method: "PATCH", body }),
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ["admin", "me"] });
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Account updated", {
        description: `Signed in as ${updated.username}`,
      });
    },
    onError: (e: any) => toast.error("Update failed", { description: e?.message }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, string> = {};

    if (username.trim() && username !== user?.username) body.username = username.trim();
    if (email.trim() !== (user?.email ?? "")) body.email = email.trim();

    if (newPassword || confirmPassword || currentPassword) {
      body.current_password = currentPassword;
      body.new_password = newPassword;
      body.new_password_confirm = confirmPassword;
    }

    if (Object.keys(body).length === 0) {
      toast.message("No changes to save");
      return;
    }

    mutation.mutate(body);
  }

  return (
    <AdminShell title="Account" description="Update your admin login credentials">
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <div className="rounded-2xl border border-border bg-background p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Profile</h3>
          </div>
          <div className="space-y-4">
            <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
            <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="mb-1 text-sm font-semibold">Change password</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Leave blank if you only want to update username or email.
          </p>
          <div className="space-y-4">
            <Field
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
              autoComplete="current-password"
            />
            <Field
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              autoComplete="new-password"
            />
            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save credentials
        </button>
      </form>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}
