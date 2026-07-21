import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Fuel,
  Loader2,
  Package,
  Tag,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { EventGallery } from "@/components/EventGallery";
import { EventCardSlideshow } from "@/components/EventCardSlideshow";
import { useService, useServices } from "@/lib/content";

export const Route = createFileRoute("/services/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({
    meta: [
      { title: "Service — Total Fuel Station" },
      { name: "description", content: "Service details at Total Fuel Station." },
    ],
  }),
  component: ServicePage,
});

function ServicePage() {
  const { id } = Route.useLoaderData();
  const { data: service, isFetching, isError } = useService(id);
  const { data: allServices } = useServices();

  if (!service) {
    return (
      <div className="container-x py-32 text-center">
        {isFetching ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        ) : (
          <>
            <h1 className="text-3xl font-bold">{isError ? "Could not load service" : "Service not found"}</h1>
            <Link to="/services" className="mt-4 inline-block text-primary underline">
              Back to services
            </Link>
          </>
        )}
      </div>
    );
  }

  const heroImage = service.images[0] || service.image;
  const related = allServices
    .filter((s) => s.id !== service.id)
    .sort((a, b) => {
      const aSame = a.category === service.category ? 0 : 1;
      const bSame = b.category === service.category ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 3);

  return (
    <article className="pb-8">
      <section className="relative min-h-[72svh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={service.title}
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
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All services
            </Link>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Fuel className="h-3.5 w-3.5" />
              <ColoredText as="span" colors={service.textColors} field="category">
                {service.category}
              </ColoredText>
            </div>

            <ColoredText
              as="h1"
              colors={service.textColors}
              field="title"
              className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl"
            >
              {service.title}
            </ColoredText>

            {service.description && (
              <ColoredText
                as="p"
                colors={service.textColors}
                field="description"
                className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
              >
                {service.description}
              </ColoredText>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Overview</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">About this service</h2>
            <ColoredText
              as="p"
              colors={service.textColors}
              field="long_description"
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
            >
              {service.longDescription}
            </ColoredText>

            {service.highlights.length > 0 && (
              <ul className="mt-8 space-y-3">
                {service.highlights.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm md:text-base">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <ColoredText as="span" colors={service.textColors} field={`highlight_${i}`}>
                      {item}
                    </ColoredText>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Availability & details</h3>
              <dl className="mt-6 space-y-5 text-sm">
                <div className="flex gap-3 border-b border-border pb-4">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Availability</dt>
                    <dd className="mt-1 font-medium">
                      <ColoredText as="span" colors={service.textColors} field="availability">
                        {service.availability}
                      </ColoredText>
                    </dd>
                  </div>
                </div>
                {service.quantity && (
                  <div className="flex gap-3 border-b border-border pb-4">
                    <Fuel className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Quantity / stock</dt>
                      <dd className="mt-1 font-medium">
                        <ColoredText as="span" colors={service.textColors} field="quantity">
                          {service.quantity}
                        </ColoredText>
                      </dd>
                    </div>
                  </div>
                )}
                {service.price && (
                  <div className="flex gap-3 border-b border-border pb-4">
                    <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">Price</dt>
                      <dd className="mt-1 font-medium">
                        <ColoredText as="span" colors={service.textColors} field="price">
                          {service.price}
                        </ColoredText>
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Fuel className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">Category</dt>
                    <dd className="mt-1 font-medium">
                      <ColoredText as="span" colors={service.textColors} field="category">
                        {service.category}
                      </ColoredText>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <EventGallery
        images={service.images}
        title={service.title}
        eyebrow="Gallery"
        heading="See it at the station"
      />

      {related.length > 0 && (
        <section className="bg-mesh py-16 md:py-24">
          <div className="container-x">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">More offerings</span>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Related services</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Other products and amenities available at our pump.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {related.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.06}>
                  <Link
                    to="/services/$id"
                    params={{ id: s.id }}
                    className="group block h-full overflow-hidden rounded-3xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <EventCardSlideshow images={s.images} alt={s.title} className="aspect-[16/10]" />
                    <div className="p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{s.category}</div>
                      <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
