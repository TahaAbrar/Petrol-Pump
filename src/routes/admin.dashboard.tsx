import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, CalendarDays, Star, FileText, Clock, ArrowRight, Loader2, Settings, Fuel, Video,
  ImagePlus, Trash2, Save,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Logo } from "@/components/Logo";
import { apiFetch, mediaUrl, type DashboardStats, type SiteSettings } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: DashboardPage,
});

const CARDS = [
  { key: "employees", label: "Employees", icon: Users, to: "/admin/employees", color: "#e1252a" },
  { key: "services", label: "Services", icon: Fuel, to: "/admin/services", color: "#0ea968" },
  { key: "events", label: "Events", icon: CalendarDays, to: "/admin/events", color: "#1f7ed6" },
  { key: "reviews", label: "Reviews", icon: Star, to: "/admin/reviews", color: "#f7941d" },
] as const;

function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiFetch<DashboardStats>("/dashboard/stats/"),
  });

  return (
    <AdminShell title="Dashboard" description="Overview of everything on your site">
      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Could not load stats. Make sure the backend is running on port 8000.
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link
                  to={c.to}
                  className="group block rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-1 hover:shadow-elegant"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl"
                      style={{ background: `${c.color}1a`, color: c.color }}
                    >
                      <c.icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="mt-4 text-3xl font-bold">
                    {(data as any)?.[c.key] ?? 0}
                  </div>
                  <div className="text-sm text-muted-foreground">{c.label}</div>
                </Link>
              </motion.div>
            ))}
          </div>

          <BrandLogoSection />

          {data && data.reviews_pending > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-4 text-sm">
              <Clock className="h-5 w-5 text-brand-orange" />
              <span>
                <strong>{data.reviews_pending}</strong> review(s) awaiting approval.
              </span>
              <Link to="/admin/reviews" className="ml-auto font-semibold text-primary hover:underline">
                Review now
              </Link>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Page banners
              </h2>
              <div className="mt-4 space-y-2">
                {data &&
                  Object.entries(data.page_banners).map(([key, hasBanner]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium capitalize">{key}</span>
                      <span
                        className={
                          hasBanner
                            ? "rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600"
                            : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {hasBanner ? "Banner set" : "No banner"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Quick actions
              </h2>
              <div className="mt-4 grid gap-2">
                <QuickLink to="/admin/site" icon={Settings} label="Edit site info & contact details" />
                <QuickLink to="/admin/pages" icon={FileText} label="Update page banners & content" />
                <QuickLink to="/admin/employees" icon={Users} label="Add or edit employees" />
                <QuickLink to="/admin/services" icon={Fuel} label="Manage station services" />
                <QuickLink to="/admin/events" icon={CalendarDays} label="Manage events" />
                <QuickLink to="/admin/videos" icon={Video} label="Upload featured videos" />
                <QuickLink to="/admin/reviews" icon={Star} label="Add customer reviews" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function BrandLogoSection() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data: site, isLoading } = useQuery<SiteSettings>({
    queryKey: ["admin", "site"],
    queryFn: () => apiFetch<SiteSettings>("/site/"),
  });

  const saveLogo = useMutation({
    mutationFn: async (next: File | null) => {
      if (next) {
        const fd = new FormData();
        fd.append("logo", next);
        return apiFetch<SiteSettings>("/site/", { method: "PATCH", body: fd });
      }
      return apiFetch<SiteSettings>("/site/", {
        method: "PATCH",
        body: { clear_logo: true },
      });
    },
    onSuccess: async (_data, next) => {
      setFile(null);
      await qc.invalidateQueries({ queryKey: ["admin", "site"] });
      await refreshPublicContent(qc);
      toast.success(next ? "Logo updated" : "Custom logo removed — default brand mark restored");
    },
    onError: (e: any) => toast.error("Logo update failed", { description: e?.message }),
  });

  const preview = file
    ? URL.createObjectURL(file)
    : site?.logo
      ? mediaUrl(site.logo)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="rounded-2xl border border-border bg-background p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Brand logo
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Upload your own logo for the navbar, footer, splash animation, and admin. If you
            remove it (or never upload one), the default Sukka PR mark is used.
          </p>
        </div>
        {site?.logo ? (
          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
            Custom logo active
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Using default logo
          </span>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-28 min-w-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6">
            {preview ? (
              <img
                src={preview}
                alt="Logo preview"
                className="max-h-20 w-auto max-w-full object-contain"
              />
            ) : (
              <Logo className="h-12 w-auto" src="" />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <ImagePlus className="h-4 w-4" />
                {file || site?.logo ? "Choose new logo" : "Upload logo"}
              </button>
              {file && (
                <button
                  type="button"
                  disabled={saveLogo.isPending}
                  onClick={() => saveLogo.mutate(file)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {saveLogo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save logo
                </button>
              )}
              {(site?.logo || file) && (
                <button
                  type="button"
                  disabled={saveLogo.isPending}
                  onClick={() => {
                    if (file) {
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                      return;
                    }
                    saveLogo.mutate(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {file ? "Cancel selection" : "Remove custom logo"}
                </button>
              )}
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{file.name}</span> — click Save
                to apply site-wide.
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
