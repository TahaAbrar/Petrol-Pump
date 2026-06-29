import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, X, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useSiteContent } from "@/lib/content";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/events", label: "Events" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: SITE } = useSiteContent();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="container-x">
        <div
          className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-2.5 transition-all duration-500 ${
            scrolled
              ? "border-border bg-background/85 shadow-soft backdrop-blur-xl"
              : "border-transparent bg-background/40 backdrop-blur"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo className="h-9 w-auto md:h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-muted"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${SITE.mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
            >
              <MapPin className="h-4 w-4" /> Get Directions
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-background"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-2xl border border-border bg-background p-3 shadow-soft"
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${SITE.mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <MapPin className="h-4 w-4" /> Get Directions
            </a>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
