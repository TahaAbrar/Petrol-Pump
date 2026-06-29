import { useState } from "react";
import { Reveal } from "@/components/Reveal";

/** Editorial gallery layout for event detail pages. */
export function EventGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Gallery</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Moments from the event</h2>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <div className="overflow-hidden rounded-3xl border border-border shadow-elegant">
            <img
              src={images[active]}
              alt={`${title} — photo ${active + 1}`}
              className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
              width={1600}
              height={900}
            />
          </div>
        </Reveal>

        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((src, i) => (
              <Reveal key={`${src}-${i}`} delay={i * 0.04}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group relative w-full overflow-hidden rounded-2xl border transition-all ${
                    i === active
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${title} thumbnail ${i + 1}`}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
