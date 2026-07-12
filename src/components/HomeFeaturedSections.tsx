import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Fuel } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { EventCardSlideshow } from "@/components/EventCardSlideshow";
import { useEvents, useServices, type UiEvent, type UiService } from "@/lib/content";

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

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
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

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.06}>
              <EventCard event={e} />
            </Reveal>
          ))}
        </div>
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
