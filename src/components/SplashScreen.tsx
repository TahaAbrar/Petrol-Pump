import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useState } from "react";
import orbImg from "@/assets/total-orb.png";
import wordmarkImg from "@/assets/total-wordmark.png";

const STORAGE_KEY = "total_splash_seen";
const DURATION = 3400;
const FAILSAFE_MS = DURATION + 1200;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function clearSplashLock() {
  document.documentElement.classList.remove("splash-active");
}

export function SplashScreen() {
  // Always false on SSR — real state is synced in useLayoutEffect to avoid hydration mismatch.
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY);

    const finish = () => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      clearSplashLock();
      setShow(false);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || sessionStorage.getItem(STORAGE_KEY)) {
        clearSplashLock();
        setShow(false);
      }
    };

    window.addEventListener("pageshow", onPageShow);

    if (seen) {
      clearSplashLock();
      setShow(false);
      return () => window.removeEventListener("pageshow", onPageShow);
    }

    document.documentElement.classList.add("splash-active");
    setShow(true);

    const doneTimer = window.setTimeout(finish, DURATION);
    const failsafeTimer = window.setTimeout(clearSplashLock, FAILSAFE_MS);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.clearTimeout(doneTimer);
      window.clearTimeout(failsafeTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-mesh"
        >
          {/* Drifting brand-colored light blobs */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute inset-0"
          >
            <motion.div
              className="absolute left-[20%] top-[22%] h-72 w-72 rounded-full blur-[90px]"
              style={{ background: "rgba(225,37,42,0.55)" }}
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[18%] top-[30%] h-80 w-80 rounded-full blur-[100px]"
              style={{ background: "rgba(0,90,200,0.5)" }}
              animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-1/2 bottom-[18%] h-72 w-72 -translate-x-1/2 rounded-full blur-[90px]"
              style={{ background: "rgba(247,148,29,0.45)" }}
              animate={{ x: [0, 30, -20, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Rotating brand-colored ribbon rings sweeping in from behind */}
          <motion.div
            aria-hidden
            initial={{ rotate: -220, scale: 0.3, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE_OUT }}
            className="pointer-events-none absolute h-[460px] w-[460px] md:h-[620px] md:w-[620px]"
          >
            <div className="absolute inset-0 rounded-full border border-[#e1252a]/30" />
            <div className="absolute inset-[8%] rounded-full border border-[#f7941d]/25" />
            <div className="absolute inset-[16%] rounded-full border border-[#1f7ed6]/30" />
            <div
              className="absolute inset-[24%] rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, rgba(225,37,42,0.18), transparent 35%, rgba(31,126,214,0.18), transparent 70%, rgba(247,148,29,0.16), transparent)",
                filter: "blur(2px)",
              }}
            />
          </motion.div>

          {/* Orbiting brand particles */}
          {[
            { c: "#e1252a", d: 5, r: 230, s: 8 },
            { c: "#1f7ed6", d: 6.5, r: 270, s: 6 },
            { c: "#f7941d", d: 8, r: 200, s: 10 },
          ].map((p, i) => (
            <motion.div
              key={i}
              aria-hidden
              className="pointer-events-none absolute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{
                opacity: { duration: 1, delay: 0.6 },
                rotate: { duration: p.d, repeat: Infinity, ease: "linear" },
              }}
              style={{ width: p.r, height: p.r }}
            >
              <span
                className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
                style={{
                  width: p.s,
                  height: p.s,
                  background: p.c,
                  boxShadow: `0 0 14px 2px ${p.c}`,
                }}
              />
            </motion.div>
          ))}

          {/* Logo lockup */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            exit={{ scale: 0.32, y: "-42vh", opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
          >
            <div className="relative flex items-center gap-2 md:gap-3">
              {/* Orb: spins in from depth and locks into place */}
              <motion.img
                src={orbImg}
                alt="Total"
                draggable={false}
                className="h-20 w-auto md:h-28"
                initial={{ opacity: 0, scale: 2.6, rotate: -210 }}
                animate={{
                  opacity: 1,
                  scale: [2.6, 0.92, 1],
                  rotate: [-210, 10, 0],
                }}
                transition={{ duration: 1.35, ease: EASE_OUT, times: [0, 0.78, 1] }}
              />

              {/* Wordmark: wipes out from behind the orb */}
              <motion.img
                src={wordmarkImg}
                alt="TOTAL"
                draggable={false}
                className="h-11 w-auto md:h-16"
                initial={{ opacity: 0, x: -24, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.7, delay: 1.0, ease: EASE_OUT }}
              />

              {/* Shine sweep across the assembled lockup */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ overflow: "hidden" }}
              >
                <motion.div
                  className="absolute top-0 h-full w-1/3 -skew-x-12"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                    mixBlendMode: "overlay",
                  }}
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 0.9, delay: 1.75, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.42em" }}
              transition={{ duration: 0.8, delay: 1.55, ease: EASE_OUT }}
              className="mt-6 pl-[0.42em] text-[10px] font-medium uppercase text-muted-foreground md:text-xs"
            >
              Premium Energy · Trusted Service
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
