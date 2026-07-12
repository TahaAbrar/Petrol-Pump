import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useFeaturedVideos } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Home-page video carousel — first video shown; left/right appear on hover. */
export function FeaturedVideosSection() {
  const { data: videos } = useFeaturedVideos();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  if (!videos.length) return null;

  const safeIndex = ((index % videos.length) + videos.length) % videos.length;
  const current = videos[safeIndex];
  const showNav = videos.length > 1 && hovering;

  function prev() {
    setIndex((i) => (i - 1 + videos.length) % videos.length);
  }

  function next() {
    setIndex((i) => (i + 1) % videos.length);
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Watch</span>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Featured videos</h2>
          <p className="mt-3 text-muted-foreground">
            A closer look at our station, fuels and community moments.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mx-auto mt-10 max-w-5xl">
          <div
            className="group/video relative"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-elegant">
              <video
                key={current.id}
                src={current.videoUrl}
                controls
                playsInline
                className="aspect-video w-full"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            </div>

            {videos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous video"
                  className={cn(
                    "absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg backdrop-blur transition-all duration-300 md:left-5 md:h-12 md:w-12",
                    showNav ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next video"
                  className={cn(
                    "absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg backdrop-blur transition-all duration-300 md:right-5 md:h-12 md:w-12",
                    showNav ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </>
            )}
          </div>

          {(current.title || videos.length > 1) && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                {current.title && (
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{current.title}</span>
                  </div>
                )}
                {videos.length > 1 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {safeIndex + 1} / {videos.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
