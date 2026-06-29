import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import aboutFueling from "@/assets/about-fueling.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import type { OurStoryContent } from "@/lib/about-page-content";
import type { TextColors } from "@/lib/text-colors";

export function OurStorySection({
  story,
  imageSrc = aboutFueling,
  showButton = false,
  className = "",
  colors,
}: {
  story: OurStoryContent;
  imageSrc?: string;
  showButton?: boolean;
  className?: string;
  colors?: TextColors;
}) {
  const pillars = [
    { k: "Mission", v: story.mission, field: "ourStory_mission" },
    { k: "Vision", v: story.vision, field: "ourStory_vision" },
    { k: "Services", v: story.services, field: "ourStory_services" },
  ];

  return (
    <section className={`relative py-24 md:py-32 ${className}`}>
      <div className="container-x grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal className={showButton ? "relative" : undefined}>
          {showButton && (
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-red/20 to-brand-blue/20 blur-2xl" />
          )}
          <div
            className={
              showButton
                ? "relative overflow-hidden rounded-3xl border border-border shadow-elegant"
                : "overflow-hidden rounded-3xl border border-border shadow-elegant"
            }
          >
            <img
              src={imageSrc}
              alt="Fuel nozzle"
              loading="lazy"
              width={1280}
              height={960}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ColoredText
            as="span"
            colors={colors}
            field="ourStory_eyebrow"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {story.eyebrow}
          </ColoredText>
          <ColoredText
            as="h2"
            colors={colors}
            field="ourStory_title"
            className="mt-3 text-4xl font-bold leading-tight md:text-5xl"
          >
            {story.title}
          </ColoredText>
          <ColoredText
            as="p"
            colors={colors}
            field="ourStory_body"
            className="mt-5 text-muted-foreground"
          >
            {story.body}
          </ColoredText>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {pillars.map((b) => (
              <div key={b.k} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">{b.k}</div>
                <ColoredText as="p" colors={colors} field={b.field} className="mt-2 text-sm text-muted-foreground">
                  {b.v}
                </ColoredText>
              </div>
            ))}
          </div>

          {showButton && (
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
            >
              Read our story <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
