import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import orbImg from "@/assets/total-orb.png";
import { login } from "@/lib/admin-auth";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Total Fuel Station" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && getToken()) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      toast.success(`Welcome back, ${user.username}!`, {
        description: "Redirecting to your dashboard…",
      });
      setTimeout(() => navigate({ to: "/admin/dashboard" }), 600);
    } catch (err: any) {
      toast.error("Login failed", {
        description: err?.message ?? "Please check your credentials and try again.",
      });
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-mesh px-4">
      {/* Drifting brand light blobs */}
      <motion.div
        className="absolute left-[15%] top-[18%] h-72 w-72 rounded-full blur-[100px]"
        style={{ background: "rgba(225,37,42,0.45)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[15%] bottom-[18%] h-80 w-80 rounded-full blur-[110px]"
        style={{ background: "rgba(0,90,200,0.4)" }}
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl border border-brand-red/35 bg-background p-8 shadow-elegant">
          <div className="mb-7 flex flex-col items-center text-center">
            <motion.img
              src={orbImg}
              alt="Total"
              className="h-16 w-auto"
              initial={{ rotate: -120, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage Total Fuel Station</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#e1252a] to-[#f7941d] py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Sign In
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Authorized personnel only · Total Fuel Station
          </p>
        </div>
      </motion.div>
    </div>
  );
}
