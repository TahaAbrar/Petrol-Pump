import ownerImg from "@/assets/owner.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import type { LeadershipContent } from "@/lib/about-page-content";
import type { TextColors } from "@/lib/text-colors";

export function LeadershipSection({
  leadership,
  imageSrc = ownerImg,
  colors,
}: {
  leadership: LeadershipContent;
  imageSrc?: string;
  colors?: TextColors;
}) {
  return (
    <section className="bg-mesh py-24 md:py-32">
      <div className="container-x grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal>
          <ColoredText
            as="span"
            colors={colors}
            field="leadership_eyebrow"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {leadership.eyebrow}
          </ColoredText>
          <ColoredText
            as="h2"
            colors={colors}
            field="leadership_title"
            className="mt-3 text-4xl font-bold md:text-5xl"
          >
            {leadership.title}
          </ColoredText>
          <ColoredText as="p" colors={colors} field="leadership_quote" className="mt-5 text-muted-foreground">
            &ldquo;{leadership.quote}&rdquo;
          </ColoredText>
          <div className="mt-6">
            <ColoredText as="div" colors={colors} field="leadership_founderName" className="text-base font-semibold">
              {leadership.founderName}
            </ColoredText>
            <ColoredText
              as="div"
              colors={colors}
              field="leadership_founderRole"
              className="text-sm text-muted-foreground"
            >
              {leadership.founderRole}
            </ColoredText>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {leadership.stats.map((s, i) => (
              <div key={s.l} className="rounded-2xl border border-border bg-background p-4 text-center">
                <ColoredText
                  as="div"
                  colors={colors}
                  field={`leadership_stat_${i}_v`}
                  className="text-2xl font-bold text-gradient-brand"
                >
                  {s.v}
                </ColoredText>
                <ColoredText
                  as="div"
                  colors={colors}
                  field={`leadership_stat_${i}_l`}
                  className="text-xs text-muted-foreground"
                >
                  {s.l}
                </ColoredText>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-blue/25 to-brand-red/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
              <img
                src={imageSrc}
                alt={leadership.founderName}
                loading="lazy"
                width={960}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
