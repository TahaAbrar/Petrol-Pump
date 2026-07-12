import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Fuel, Gauge, Sparkles, ShieldCheck, Clock, Wrench, Star, ArrowRight, MapPin, Quote,
} from "lucide-react";
import heroImg from "@/assets/hero-station.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { OurStorySection } from "@/components/OurStorySection";
import { FeaturedVideosSection } from "@/components/FeaturedVideosSection";
import { FeaturedServicesSection, FeaturedEventsSection } from "@/components/HomeFeaturedSections";
import { useSiteContent, useReviews, usePage, pageTextColors } from "@/lib/content";
import { parseOurStory } from "@/lib/about-page-content";
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

const features = [
  { icon: Fuel, title: "Premium Quality Fuel", desc: "Refined to the highest purity standards for maximum mileage and engine health." },
  { icon: Gauge, title: "Fast Service", desc: "High-flow dispensers and trained crew get you back on the road in minutes." },
  { icon: Sparkles, title: "Spotless Facilities", desc: "Hospital-grade cleanliness across the forecourt, washrooms and lounge." },
  { icon: ShieldCheck, title: "Customer First", desc: "Every visit is backed by our satisfaction guarantee and care team." },
  { icon: Clock, title: "Open 24 / 7", desc: "Day or night, holiday or rush hour — we're always ready for you." },
  { icon: Wrench, title: "Modern Equipment", desc: "State-of-the-art pumps, EV chargers and calibrated meters you can trust." },
];

const whyUs = [
  "Trusted by 50,000+ regular customers",
  "ISO-certified fuel quality control",
  "Experienced & friendly service team",
  "Modern, well-lit, secure infrastructure",
  "Round-the-clock customer support",
];

function HomePage() {
  return (
    <div>
      <Hero />
      <FeaturedVideosSection />
      <About />
      <FeaturedServicesSection />
      <FeaturedEventsSection />
      <Features />
      <Reviews />
      <WhyAndMap />
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { data: SITE } = useSiteContent();
  const { data: page } = usePage("home");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const stats =
    (page?.extra?.stats as { v: string; l: string }[] | undefined) ?? [
      { v: "24/7", l: "Always open" },
      { v: "99.9%", l: "Uptime" },
      { v: "50k+", l: "Happy customers" },
    ];

  const heroImage = page?.banner ? mediaUrl(page.banner) : heroImg;
  const heroEyebrow = page?.subtitle || "Premium Energy Brand";
  const heroTitle =
    page?.title || "Fuel your journey with uncompromising quality.";
  const heroBody =
    page?.body ||
    `${SITE.tagline} A modern, premium fuel station built around your time, your vehicle and your peace of mind.`;
  const colors = pageTextColors(page);
  const titleHasCustomColor = Boolean(colors.title);

  return (
    <section ref={ref} className="relative -mt-20 min-h-[100svh] overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <img
          src={heroImage}
          alt="Premium petrol station at dusk"
          className="h-full w-full object-cover"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/30" />
      </motion.div>

      {/* Floating decorative orbs */}
      <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-brand-red/20 blur-3xl float-slow" />
      <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl float-slow" style={{ animationDelay: "2s" }} />

      <div className="container-x relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 pb-10 pt-20 sm:px-5 sm:pb-12 sm:pt-24">
        <div className="w-full max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur sm:px-4 sm:text-xs"
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary pulse-ring" />
            <ColoredText colors={colors} field="subtitle" className="truncate sm:whitespace-normal">
              {heroEyebrow}
            </ColoredText>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-balance text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:mt-6 sm:text-4xl sm:leading-[1.08] md:text-5xl lg:text-7xl"
          >
            {titleHasCustomColor ? (
              <ColoredText as="span" colors={colors} field="title">{heroTitle}</ColoredText>
            ) : heroTitle.includes("uncompromising quality") ? (
              <>
                Fuel your journey with{" "}
                <span className="text-gradient-brand">uncompromising quality</span>.
              </>
            ) : (
              heroTitle
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="mx-auto mt-4 max-w-xl px-1 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:px-0 sm:text-base md:text-lg"
          >
            <ColoredText as="span" colors={colors} field="body">{heroBody}</ColoredText>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${SITE.mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] sm:px-6 sm:py-3.5"
            >
              <MapPin className="h-4 w-4" /> Get Directions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/70 px-5 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-background sm:px-6 sm:py-3.5"
            >
              Learn more
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mx-auto mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 text-center sm:mt-16 sm:grid-cols-3 sm:gap-4"
          >
            {stats.map((s, i) => (
              <div key={s.l} className="glass-card rounded-2xl px-4 py-3.5 sm:px-3 sm:py-4">
                <ColoredText
                  as="div"
                  colors={colors}
                  field={`stats_${i}_v`}
                  className="text-xl font-bold text-gradient-brand sm:text-2xl md:text-3xl"
                >
                  {s.v}
                </ColoredText>
                <ColoredText
                  as="div"
                  colors={colors}
                  field={`stats_${i}_l`}
                  className="mt-0.5 text-xs text-muted-foreground sm:mt-1"
                >
                  {s.l}
                </ColoredText>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const { data: aboutPage } = usePage("about");
  const story = parseOurStory(aboutPage?.extra);
  const storyImage = aboutPage?.story_image ? mediaUrl(aboutPage.story_image) : undefined;
  const storyColors = pageTextColors(aboutPage);

  return <OurStorySection story={story} imageSrc={storyImage} showButton colors={storyColors} />;
}

function Features() {
  return (
    <section className="relative bg-mesh py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why customers stay</span>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">Everything you'd expect, refined.</h2>
          <p className="mt-4 text-muted-foreground">Six promises we keep on every visit, every single time.</p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-red/15 to-brand-blue/15 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
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

function WhyAndMap() {
  const { data: SITE } = useSiteContent();
  const { data: page } = usePage("home");
  const whyUsList = (page?.extra?.whyUs as string[] | undefined) ?? whyUs;
  const colors = pageTextColors(page);
  return (
    <section className="bg-mesh py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why choose us</span>
          <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
            Reasons our customers <span className="text-gradient-brand">never look elsewhere</span>.
          </h2>
          <ul className="mt-8 space-y-3">
            {whyUsList.map((w, i) => (
              <li key={w} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium transition-all hover:border-primary/40 hover:shadow-soft">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs">✓</span>
                <ColoredText as="span" colors={colors} field={`whyUs_${i}`}>{w}</ColoredText>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Location</span>
          <h3 className="mt-3 text-2xl font-bold md:text-3xl">Find us on the map</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            <ColoredText as="span" colors={SITE.textColors} field="address">{SITE.address}</ColoredText>
          </p>
          <div className="relative mt-6 overflow-hidden rounded-3xl border border-border shadow-elegant">
            <iframe
              title="Station location"
              className="aspect-[4/3] w-full"
              loading="lazy"
              src={`https://www.google.com/maps?q=${SITE.mapsQuery}&output=embed`}
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${SITE.mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <MapPin className="h-4 w-4" /> Get directions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
