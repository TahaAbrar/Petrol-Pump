import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BannerSliderProps = {
  images: string[];
  alt?: string;
  className?: string;
  intervalMs?: number;
  showDots?: boolean;
};

/** Full-bleed banner image carousel — advances every `intervalMs` (default 3s). */
export function BannerSlider({
  images,
  alt = "Banner",
  className = "h-full w-full object-cover",
  intervalMs = 3000,
  showDots = false,
}: BannerSliderProps) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs, slides.join("|")]);

  if (slides.length === 0) return null;

  const dots =
    showDots && slides.length > 1 ? (
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full border-2 transition-colors ${
              i === index
                ? "border-sky-500 bg-sky-500"
                : "border-sky-500/80 bg-white/90"
            }`}
          />
        ))}
      </div>
    ) : null;

  if (slides.length === 1) {
    return (
      <>
        <img src={slides[0]} alt={alt} className={className} width={1920} height={1280} />
        {dots}
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.img
            key={slides[index]}
            src={slides[index]}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`absolute inset-0 ${className}`}
            width={1920}
            height={1280}
          />
        </AnimatePresence>
      </div>
      {dots}
    </>
  );
}

/** Resolve ordered banner URLs from page API payload (+ fallback). */
export function pageBannerUrls(
  page: { banner?: string | null; banner_images?: { image: string | null; order?: number }[] } | null | undefined,
  mediaUrl: (path: string) => string,
  fallback?: string,
): string[] {
  const slides = (page?.banner_images ?? [])
    .filter((b) => b.image)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => mediaUrl(b.image!));
  if (slides.length > 0) return slides;
  if (page?.banner) return [mediaUrl(page.banner)];
  if (fallback) return [fallback];
  return [];
}
