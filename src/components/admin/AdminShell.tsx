import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Settings, FileText, Users, CalendarDays, Star, LogOut, Menu, X, Loader2, UserCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useRequireAdmin, logout } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/site", label: "Site Info", icon: Settings },
  { to: "/admin/pages", label: "Pages & Banners", icon: FileText },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/account", label: "Account", icon: UserCircle },
] as const;

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { user, isLoading, authed } = useRequireAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (isLoading || (!authed && typeof window !== "undefined")) {
    return (
      <div className="grid min-h-screen place-items-center bg-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate({ to: "/admin/login" });
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <Logo className="h-8 w-auto" />
        </Link>
        <button
          className="rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-2 text-xs text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{user?.username ?? "admin"}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-background/80 backdrop-blur-xl md:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background md:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/70 px-5 py-4 backdrop-blur-xl">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 md:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
