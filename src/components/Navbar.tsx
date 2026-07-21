import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { BusinessNavDropdown, BASE_NAV } from "./BusinessNavDropdown";
import { AboutNavDropdown } from "./AboutNavDropdown";
import { ContactModal } from "./ContactModal";
import { useBusinesses } from "@/lib/content";

const nav = BASE_NAV;

const ABOUT_LINKS = [
  { to: "/about", label: "Overview" },
  { to: "/about/our-story", label: "Our Story" },
  { to: "/about/leadership", label: "Leadership Overview" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileBizOpen, setMobileBizOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: businesses } = useBusinesses();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileAboutOpen(false);
    setMobileBizOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      setMobileAboutOpen(false);
      setMobileBizOpen(false);
    }
  }, [open]);

  const aboutActive = pathname === "/about" || pathname.startsWith("/about/");
  const bizActive = pathname.startsWith("/businesses");

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out ${
          scrolled ? "py-2.5" : "py-0"
        }`}
      >
        <div
          className={`transition-all duration-500 ease-out ${
            scrolled ? "container-x" : "w-full"
          }`}
        >
          <div
            className={`relative flex h-16 items-center justify-between gap-3 px-4 transition-all duration-500 ease-out sm:px-6 lg:h-[4.25rem] ${
              scrolled
                ? "rounded-2xl border border-border/80 bg-background/90 py-0 shadow-elegant backdrop-blur-xl"
                : "rounded-none border-0 bg-background shadow-none lg:px-8 xl:px-12"
            }`}
          >
            <Link to="/" className="relative z-10 flex shrink-0 items-center gap-2">
              <Logo className="h-9 w-auto md:h-10" />
            </Link>

            {/* Desktop: centered nav */}
            <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 lg:flex">
              <Link
                to="/"
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pathname === "/" && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                Home
              </Link>
              <AboutNavDropdown pathname={pathname} />
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
              <BusinessNavDropdown pathname={pathname} />
            </nav>

            <div className="relative z-10 flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setContactOpen(true);
                }}
                className="hidden rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red/90 lg:inline-flex"
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background lg:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile + tablet menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`overflow-hidden lg:hidden ${scrolled ? "" : "mx-3 sm:mx-4"}`}
              >
                <nav
                  className="mt-2 max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-elegant"
                  aria-label="Mobile navigation"
                >
                  <MobileLink to="/" active={pathname === "/"}>
                    Home
                  </MobileLink>
                  {nav.map((item) => (
                    <MobileLink key={item.to} to={item.to} active={pathname === item.to}>
                      {item.label}
                    </MobileLink>
                  ))}

                  <MobileAccordion
                    label="About Us"
                    open={mobileAboutOpen}
                    active={aboutActive}
                    onToggle={() => {
                      setMobileAboutOpen((v) => !v);
                      setMobileBizOpen(false);
                    }}
                  >
                    {ABOUT_LINKS.map((item) => (
                      <MobileLink
                        key={item.to}
                        to={item.to}
                        active={pathname === item.to}
                        nested
                      >
                        {item.label}
                      </MobileLink>
                    ))}
                  </MobileAccordion>

                  <MobileAccordion
                    label="Our Businesses"
                    open={mobileBizOpen}
                    active={bizActive}
                    onToggle={() => {
                      setMobileBizOpen((v) => !v);
                      setMobileAboutOpen(false);
                    }}
                  >
                    <MobileLink to="/businesses" active={pathname === "/businesses"} nested>
                      Overview
                    </MobileLink>
                    {(businesses ?? []).map((b) => (
                      <MobileLink
                        key={b.slug}
                        to="/businesses/$slug"
                        params={{ slug: b.slug }}
                        active={pathname === `/businesses/${b.slug}`}
                        nested
                      >
                        {b.name}
                      </MobileLink>
                    ))}
                  </MobileAccordion>

                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setContactOpen(true);
                    }}
                    className="mt-2 w-full rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white"
                  >
                    Contact
                  </button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}

function MobileLink({
  to,
  params,
  active,
  nested,
  children,
}: {
  to: string;
  params?: Record<string, string>;
  active?: boolean;
  nested?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      className={`block rounded-xl text-sm font-medium transition-colors ${
        nested ? "px-4 py-2.5 pl-5" : "px-4 py-3"
      } ${
        active
          ? "bg-muted text-foreground"
          : "text-foreground/90 hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileAccordion({
  label,
  open,
  active,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  active?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-1 border-t border-border/80 pt-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
          active || open ? "bg-muted/70 text-foreground" : "text-foreground hover:bg-muted"
        }`}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1 pl-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
