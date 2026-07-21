import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import heroImg from "@/assets/hero-station.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { HomeStoryTeaser } from "@/components/HomeStoryTeaser";
import { OurBusinessesSection } from "@/components/OurBusinessesSection";
import { FaqSection } from "@/components/FaqSection";
import { FeaturedVideosSection } from "@/components/FeaturedVideosSection";
import { FeaturedServicesSection, FeaturedEventsSection } from "@/components/HomeFeaturedSections";
import { useReviews, usePage, pageTextColors } from "@/lib/content";
import { parseFeatures, resolveFeatureIcon } from "@/lib/home-features-content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Total Fuel Station — Premium Energy. Trusted Service." },
      { name: "description", content: "Premium fuel, fast service and a 24/7 modern forecourt experience. Visit Total Fuel Station today." },
      { property: "og:title", content: "Total Fuel Station — Premium Energy. Trusted Service." },
      { property: "og:description", content: "Premium fuel, fast service and a 24/7 modern forecourt experience." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <Hero />
      <FeaturedVideosSection />
      <HomeStoryTeaser />
      <OurBusinessesSection />
      <FeaturedServicesSection />
      <FeaturedEventsSection />
      <Features />
      <Reviews />
      <FaqSection />
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { data: page } = usePage("home");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const heroImages = pageBannerUrls(page, mediaUrl, heroImg);
  const heroTitle = (page?.title || "").trim();
  const heroBody = (page?.body || "").trim();
  const colors = pageTextColors(page);
  const hasText = Boolean(heroTitle || heroBody);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <BannerSlider images={heroImages} alt="Home banner" showDots={heroImages.length > 1} />
      </motion.div>

      {hasText && (
        <div className="container-x relative z-10 flex min-h-[100svh] items-center justify-start px-4 pb-16 pt-8 sm:px-5">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full max-w-xl text-left"
          >
            {heroTitle && (
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                <ColoredText as="span" colors={colors} field="title">
                  {heroTitle}
                </ColoredText>
              </h1>
            )}
            {heroBody && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                <ColoredText as="span" colors={colors} field="body">
                  {heroBody}
                </ColoredText>
              </p>
            )}
          </motion.div>
        </div>
      )}
    </section>
  );
}

function Features() {
  const { data: page } = usePage("home");
  const features = parseFeatures(page?.extra);
  const colors = pageTextColors(page);

  return (
    <section className="relative bg-mesh py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <ColoredText
            as="span"
            colors={colors}
            field="features_eyebrow"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {features.eyebrow}
          </ColoredText>
          <ColoredText
            as="h2"
            colors={colors}
            field="features_title"
            className="mt-3 text-4xl font-bold md:text-5xl"
          >
            {features.title}
          </ColoredText>
          <ColoredText
            as="p"
            colors={colors}
            field="features_subtitle"
            className="mt-4 text-muted-foreground"
          >
            {features.subtitle}
          </ColoredText>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.cards.map((f, i) => {
            const Icon = resolveFeatureIcon(f.icon);
            return (
              <Reveal key={`${f.title}-${i}`} delay={i * 0.06}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-red/15 to-brand-blue/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ColoredText
                    as="h3"
                    colors={colors}
                    field={`features_card_${i}_title`}
                    className="mt-5 text-lg font-semibold"
                  >
                    {f.title}
                  </ColoredText>
                  <ColoredText
                    as="p"
                    colors={colors}
                    field={`features_card_${i}_desc`}
                    className="mt-2 text-sm text-muted-foreground"
                  >
                    {f.desc}
                  </ColoredText>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const { data: reviews } = useReviews();
  return (
    <section className="py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reviews</span>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">Loved by the people we serve.</h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.06}>
              <figure className="relative h-full rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-soft">
                <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
                <div className="flex gap-0.5 text-brand-orange">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed">
                  <ColoredText as="span" colors={r.textColors} field="text">&ldquo;{r.text}&rdquo;</ColoredText>
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <ColoredText as="div" colors={r.textColors} field="name" className="text-sm font-semibold">
                    {r.name}
                  </ColoredText>
                  <ColoredText as="div" colors={r.textColors} field="role" className="text-xs text-muted-foreground">
                    {r.role}
                  </ColoredText>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
