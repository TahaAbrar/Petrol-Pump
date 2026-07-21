import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, MapPin, Loader2, Play } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { EventGallery } from "@/components/EventGallery";
import { useEvent, useSiteContent } from "@/lib/content";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({
    meta: [
      { title: "Event — Total Fuel Station" },
      { name: "description", content: "Event details at Total Fuel Station." },
    ],
  }),
  component: EventPage,
});

function EventPage() {
  const { id } = Route.useLoaderData();
  const { data: event, isFetching, isError } = useEvent(id);
  const { data: site } = useSiteContent();

  if (!event) {
    return (
      <div className="container-x py-32 text-center">
        {isFetching ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        ) : (
          <>
            <h1 className="text-3xl font-bold">{isError ? "Could not load event" : "Event not found"}</h1>
            <Link to="/events" className="mt-4 inline-block text-primary underline">
              Back to events
            </Link>
          </>
        )}
      </div>
    );
  }

  const heroImage = event.images[0] || event.image;

  return (
    <article className="pb-8">
      {/* Hero */}
      <section className="relative min-h-[72svh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover"
            width={1600}
            height={1000}
          />
        ) : (
          <div className="absolute inset-0 bg-mesh" />
        )}

        <div className="container-x relative z-10 flex min-h-[72svh] flex-col justify-end pb-14 pt-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All events
            </Link>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar className="h-3.5 w-3.5" />
              <ColoredText as="span" colors={event.textColors} field="date">{event.date}</ColoredText>
            </div>

            <ColoredText
              as="h1"
              colors={event.textColors}
              field="title"
              className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl"
            >
              {event.title}
            </ColoredText>

            {event.description && (
              <ColoredText
                as="p"
                colors={event.textColors}
                field="description"
                className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
              >
                {event.description}
              </ColoredText>
            )}
          </motion.div>
        </div>
      </section>

      {/* Story + details */}
      <section className="py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Overview</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">About this event</h2>
            <ColoredText
              as="p"
              colors={event.textColors}
              field="long_description"
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
            >
              {event.longDescription}
            </ColoredText>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Event details</h3>
              <dl className="mt-6 space-y-5 text-sm">
                <div className="flex gap-3 border-b border-border pb-4">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Date</dt>
                    <dd className="mt-1 font-medium">
                      <ColoredText as="span" colors={event.textColors} field="date">{event.date}</ColoredText>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3 border-b border-border pb-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Location</dt>
                    <dd className="mt-1 font-medium">{site.name}</dd>
                    <dd className="mt-1 text-muted-foreground">{site.address}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Hours</dt>
                    <dd className="mt-1 font-medium">{site.hours}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <EventGallery images={event.images} title={event.title} />

      {/* Uploaded video recap — last section */}
      {event.videoUrl && (
        <section className="bg-mesh py-16 md:py-24">
          <div className="container-x">
            <Reveal>
              <div className="flex items-center gap-2 text-primary">
                <Play className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Event recap</span>
              </div>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Watch the highlights</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Relive the best moments from {event.title}.
              </p>
              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-black shadow-elegant">
                <video
                  src={event.videoUrl}
                  controls
                  playsInline
                  className="aspect-video w-full"
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </article>
  );
}
