import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, CalendarDays, Star, FileText, Clock, ArrowRight, Loader2, Settings,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, type DashboardStats } from "@/lib/api";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: DashboardPage,
});

const CARDS = [
  { key: "employees", label: "Employees", icon: Users, to: "/admin/employees", color: "#e1252a" },
  { key: "events", label: "Events", icon: CalendarDays, to: "/admin/events", color: "#1f7ed6" },
  { key: "reviews", label: "Reviews", icon: Star, to: "/admin/reviews", color: "#f7941d" },
  { key: "pages", label: "Pages", icon: FileText, to: "/admin/pages", color: "#0ea968" },
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
                <QuickLink to="/admin/events" icon={CalendarDays} label="Manage events" />
                <QuickLink to="/admin/reviews" icon={Star} label="Add customer reviews" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
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
