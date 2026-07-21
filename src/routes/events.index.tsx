import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import eventsBanner from "@/assets/events-banner.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { EventCardSlideshow } from "@/components/EventCardSlideshow";
import { useEvents, usePage, pageTextColors } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Total Fuel Station" },
      { name: "description", content: "Grand openings, community celebrations and green initiatives — see what we're up to." },
      { property: "og:title", content: "Events — Total Fuel Station" },
      { property: "og:description", content: "Grand openings, community celebrations and green initiatives." },
      { property: "og:image", content: eventsBanner },
      { property: "og:url", content: "/events" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
  }),
  component: EventsListPage,
});

function EventsListPage() {
  const { data: events } = useEvents();
  const { data: page } = usePage("events");
  const colors = pageTextColors(page);
  const titleHasCustomColor = Boolean(colors.title);
  const images = pageBannerUrls(page, mediaUrl, eventsBanner);
  return (
    <div>
      <section className="relative h-[92svh] min-h-[560px] overflow-hidden">
        <BannerSlider images={images} alt="Events" />
        <div className="container-x absolute inset-x-0 bottom-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <ColoredText as="span" colors={colors} field="subtitle" className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {page?.subtitle || "Events"}
            </ColoredText>
            <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
              {titleHasCustomColor ? (
                <ColoredText as="span" colors={colors} field="title">{page?.title}</ColoredText>
              ) : page?.title || (
                <>
                  Moments that <span className="text-gradient-brand">define us</span>.
                </>
              )}
            </h1>
            {page?.body && (
              <ColoredText as="p" colors={colors} field="body" className="mt-4 max-w-2xl text-muted-foreground">
                {page.body}
              </ColoredText>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.07}>
                <Link
                  to="/events/$id"
                  params={{ id: e.id }}
                  className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                >
                  <EventCardSlideshow
                    images={e.images}
                    alt={e.title}
                    className="aspect-[16/10] transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <ColoredText as="span" colors={e.textColors} field="date">{e.date}</ColoredText>
                    </div>
                    <ColoredText as="h3" colors={e.textColors} field="title" className="mt-3 text-xl font-semibold leading-snug">
                      {e.title}
                    </ColoredText>
                    <ColoredText as="p" colors={e.textColors} field="description" className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {e.description}
                    </ColoredText>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
