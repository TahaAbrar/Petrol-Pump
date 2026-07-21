import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const VISIBLE = 4;
const INTERVAL_MS = 4000;

/** Horizontal row of up to 4 images; pages forward every 4s when there are more. */
export function GalleryRowSlider({
  images,
  alt = "Gallery",
}: {
  images: string[];
  alt?: string;
}) {
  const slides = useMemo(() => images.filter(Boolean), [images]);
  const pageCount = Math.max(1, Math.ceil(slides.length / VISIBLE));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (slides.length <= VISIBLE) return;
    const id = window.setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, pageCount, slides.join("|")]);

  if (slides.length === 0) return null;

  const start = page * VISIBLE;
  const visible = slides.slice(start, start + VISIBLE);
  // If last page has fewer than 4, still fill from start for a full row feel when wrapping
  const row =
    visible.length < VISIBLE && slides.length > VISIBLE
      ? [...visible, ...slides.slice(0, VISIBLE - visible.length)]
      : visible;

  return (
    <div className="w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2"
        >
          {row.map((src, i) => (
            <div key={`${page}-${src}-${i}`} className="overflow-hidden bg-muted">
              <img
                src={src}
                alt={`${alt} ${start + i + 1}`}
                className="aspect-[4/3] h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
