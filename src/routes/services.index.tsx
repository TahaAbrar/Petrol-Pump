import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Fuel, Package } from "lucide-react";
import heroStation from "@/assets/hero-station.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { EventCardSlideshow } from "@/components/EventCardSlideshow";
import { useServices, usePage, pageTextColors } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Services — Total Fuel Station" },
      {
        name: "description",
        content:
          "Premium fuels, EV charging, air & tyre care and more — see what is available at our petrol pump, with stock and details.",
      },
      { property: "og:title", content: "Services — Total Fuel Station" },
      { property: "og:description", content: "Fuels, EV charging, air care and station amenities." },
      { property: "og:image", content: heroStation },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesListPage,
});

function ServicesListPage() {
  const { data: services } = useServices();
  const { data: page } = usePage("services");
  const colors = pageTextColors(page);
  const titleHasCustomColor = Boolean(colors.title);
  const images = pageBannerUrls(page, mediaUrl, heroStation);

  return (
    <div>
      <section className="relative h-[92svh] min-h-[560px] overflow-hidden">
        <BannerSlider images={images} alt="Services" />
        <div className="container-x absolute inset-x-0 bottom-0 top-0 z-10 flex flex-col justify-end pb-12 pt-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <ColoredText
              as="span"
              colors={colors}
              field="subtitle"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
            >
              {page?.subtitle || "Services"}
            </ColoredText>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              {titleHasCustomColor ? (
                <ColoredText as="span" colors={colors} field="title">
                  {page?.title}
                </ColoredText>
              ) : (
                page?.title || (
                  <>
                    Everything under one <span className="text-gradient-brand">canopy</span>.
                  </>
                )
              )}
            </h1>
            {page?.body && (
              <ColoredText as="p" colors={colors} field="body" className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
                {page.body}
              </ColoredText>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.07}>
                <Link
                  to="/services/$id"
                  params={{ id: s.id }}
                  className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
                >
                  <EventCardSlideshow
                    images={s.images}
                    alt={s.title}
                    className="aspect-[16/10] transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary">
                        <Fuel className="h-3 w-3" />
                        <ColoredText as="span" colors={s.textColors} field="category">
                          {s.category}
                        </ColoredText>
                      </span>
                      {s.availability && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          <ColoredText as="span" colors={s.textColors} field="availability">
                            {s.availability}
                          </ColoredText>
                        </span>
                      )}
                    </div>
                    <ColoredText
                      as="h3"
                      colors={s.textColors}
                      field="title"
                      className="mt-3 text-xl font-semibold leading-snug"
                    >
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
                    {(s.quantity || s.price) && (
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {s.quantity && (
                          <span>
                            Qty:{" "}
                            <ColoredText as="span" colors={s.textColors} field="quantity" className="font-medium text-foreground">
                              {s.quantity}
                            </ColoredText>
                          </span>
                        )}
                        {s.price && (
                          <span>
                            Price:{" "}
                            <ColoredText as="span" colors={s.textColors} field="price" className="font-medium text-foreground">
                              {s.price}
                            </ColoredText>
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      View details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
