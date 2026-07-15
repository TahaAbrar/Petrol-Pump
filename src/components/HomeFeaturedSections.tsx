import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Fuel } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { EventCardSlideshow } from "@/components/EventCardSlideshow";
import { useEvents, useServices, type UiEvent, type UiService } from "@/lib/content";
import { cn } from "@/lib/utils";

const GAP_PX = 24; // matches gap-6

function useVisibleCount() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) setVisible(1);
      else if (window.innerWidth < 1024) setVisible(2);
      else setVisible(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visible;
}

function useTouchLike() {
  const [touchLike, setTouchLike] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const update = () => setTouchLike(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return touchLike;
}

/** One-row carousel: N cards visible; left/right arrows appear on hover when more exist. */
function FeaturedCarousel({ children }: { children: ReactNode[] }) {
  const items = children;
  const visible = useVisibleCount();
  const touchLike = useTouchLike();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [stepPx, setStepPx] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, items.length - visible);
  const canNav = items.length > visible;
  const showNav = canNav && (hovering || touchLike);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const card = viewport.querySelector<HTMLElement>("[data-carousel-card]");
      if (!card) return;
      setStepPx(card.offsetWidth + GAP_PX);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [items.length, visible]);

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }

  return (
    <div
      className="group/carousel relative mt-12"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            gap: GAP_PX,
            transform: stepPx ? `translateX(-${index * stepPx}px)` : undefined,
          }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              data-carousel-card
              className="min-w-0 shrink-0"
              style={{
                width:
                  visible === 1
                    ? "100%"
                    : `calc((100% - ${(visible - 1) * GAP_PX}px) / ${visible})`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {canNav && (
        <>
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous"
            className={cn(
              "absolute left-0 top-1/2 z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-elegant backdrop-blur transition-all duration-300 md:h-12 md:w-12",
              showNav && index > 0
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index >= maxIndex}
            aria-label="Next"
            className={cn(
              "absolute right-0 top-1/2 z-10 grid h-11 w-11 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-elegant backdrop-blur transition-all duration-300 md:h-12 md:w-12",
              showNav && index < maxIndex
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

export function FeaturedServicesSection() {
  const { data: services } = useServices();
  const featured = services.filter((s) => s.featured);
  if (!featured.length) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Featured</span>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Featured services</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Highlights from our forecourt — fuels, charging and care you can count on.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            All services <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <FeaturedCarousel>
          {featured.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 2) * 0.06}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </FeaturedCarousel>
      </div>
    </section>
  );
}

export function FeaturedEventsSection() {
  const { data: events } = useEvents();
  const featured = events.filter((e) => e.featured);
  if (!featured.length) return null;

  return (
    <section className="bg-mesh py-20 md:py-28">
      <div className="container-x">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Featured</span>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Featured events</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Moments from our station and community that we&apos;re proud to share.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            All events <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <FeaturedCarousel>
          {featured.map((e, i) => (
            <Reveal key={e.id} delay={Math.min(i, 2) * 0.06}>
              <EventCard event={e} />
            </Reveal>
          ))}
        </FeaturedCarousel>
      </div>
    </section>
  );
}

function ServiceCard({ service: s }: { service: UiService }) {
  return (
    <Link
      to="/services/$id"
      params={{ id: s.id }}
      className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <EventCardSlideshow images={s.images} alt={s.title} className="aspect-[16/10]" />
      <div className="p-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Fuel className="h-3 w-3" />
          <ColoredText as="span" colors={s.textColors} field="category">
            {s.category}
          </ColoredText>
        </div>
        <ColoredText as="h3" colors={s.textColors} field="title" className="mt-2 text-xl font-semibold">
          {s.title}
        </ColoredText>
        <ColoredText
          as="p"
          colors={s.textColors}
          field="description"
          className="mt-2 line-clamp-2 text-sm text-muted-foreground"
        >
          {s.description}
        </ColoredText>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function EventCard({ event: e }: { event: UiEvent }) {
  return (
    <Link
      to="/events/$id"
      params={{ id: e.id }}
      className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <EventCardSlideshow images={e.images} alt={e.title} className="aspect-[16/10]" />
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <ColoredText as="span" colors={e.textColors} field="date">
            {e.date}
          </ColoredText>
        </div>
        <ColoredText as="h3" colors={e.textColors} field="title" className="mt-3 text-xl font-semibold">
          {e.title}
        </ColoredText>
        <ColoredText
          as="p"
          colors={e.textColors}
          field="description"
          className="mt-2 line-clamp-2 text-sm text-muted-foreground"
        >
          {e.description}
        </ColoredText>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
