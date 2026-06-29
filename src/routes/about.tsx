import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import aboutBanner from "@/assets/about-banner.jpg";
import { Reveal } from "@/components/Reveal";
import { OurStorySection } from "@/components/OurStorySection";
import { LeadershipSection } from "@/components/LeadershipSection";
import { ColoredText } from "@/components/ColoredText";
import { useEmployees, usePage, pageTextColors } from "@/lib/content";
import { parseLeadership, parseOurStory } from "@/lib/about-page-content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Total Fuel Station" },
      { name: "description", content: "Three decades of fuel-retail expertise, a passionate leadership team and a service culture built around our customers." },
      { property: "og:title", content: "About — Total Fuel Station" },
      { property: "og:description", content: "Three decades of fuel-retail expertise and a service culture built around our customers." },
      { property: "og:image", content: aboutBanner },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <Banner />
      <Overview />
      <Owner />
      <Team />
    </div>
  );
}

function Banner() {
  const { data: page } = usePage("about");
  const banner = page?.banner ? mediaUrl(page.banner) : aboutBanner;
  const colors = pageTextColors(page);
  const titleHasCustomColor = Boolean(colors.title);
  return (
    <section className="relative -mt-20 h-[60svh] min-h-[420px] overflow-hidden">
      <img src={banner} alt="Modern petrol station aerial" className="h-full w-full object-cover" width={1920} height={900} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
      <div className="container-x absolute inset-x-0 bottom-12 z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <ColoredText as="span" colors={colors} field="subtitle" className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {page?.subtitle || "About Us"}
          </ColoredText>
          <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            {titleHasCustomColor ? (
              <ColoredText as="span" colors={colors} field="title">{page?.title}</ColoredText>
            ) : page?.title || (
              <>
                A <span className="text-gradient-brand">family business</span> built on trust.
              </>
            )}
          </h1>
        </motion.div>
      </div>
    </section>
  );
}

function Overview() {
  const { data: page } = usePage("about");
  const story = parseOurStory(page?.extra);
  const storyImage = page?.story_image ? mediaUrl(page.story_image) : undefined;
  const colors = pageTextColors(page);
  return <OurStorySection story={story} imageSrc={storyImage} colors={colors} />;
}

function Owner() {
  const { data: page } = usePage("about");
  const leadership = parseLeadership(page?.extra);
  const founderImage = page?.founder_image ? mediaUrl(page.founder_image) : undefined;
  const colors = pageTextColors(page);
  return <LeadershipSection leadership={leadership} imageSrc={founderImage} colors={colors} />;
}

function Team() {
  const { data: employees } = useEmployees();
  return (
    <section className="py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our team</span>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">The people behind the service.</h2>
          <p className="mt-4 text-muted-foreground">Click any team member to learn more.</p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {employees.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.06}>
              <Link
                to="/employees/$id"
                params={{ id: e.id }}
                className="group block overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={e.image} alt={e.name} loading="lazy" width={800} height={1000}
                       className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <div className="p-5">
                  <ColoredText as="div" colors={e.textColors} field="role" className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {e.role}
                  </ColoredText>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <ColoredText as="h3" colors={e.textColors} field="name" className="text-lg font-semibold">
                      {e.name}
                    </ColoredText>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
