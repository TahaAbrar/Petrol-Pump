import { Mail, Phone } from "lucide-react";
import ownerImg from "@/assets/owner.jpg";
import emp2 from "@/assets/emp-2.jpg";
import emp1 from "@/assets/emp-1.jpg";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import type { LeadershipContent } from "@/lib/about-page-content";
import type { TextColors } from "@/lib/text-colors";

const FALLBACK_IMAGES = [ownerImg, emp2, emp1];

export function LeadershipSection({
  leadership,
  imageSrcs = [],
  colors,
}: {
  leadership: LeadershipContent;
  /** Order: CEO 1, CEO 2, Manager */
  imageSrcs?: (string | undefined)[];
  colors?: TextColors;
}) {
  return (
    <section className="bg-mesh py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
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
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {leadership.people.map((person, i) => {
            const src = imageSrcs[i] || FALLBACK_IMAGES[i] || ownerImg;
            return (
              <Reveal key={`${person.role}-${i}`} delay={i * 0.08}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-soft">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <img
                      src={src}
                      alt={person.name}
                      loading="lazy"
                      width={640}
                      height={800}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <ColoredText
                      as="div"
                      colors={colors}
                      field={`leadership_person_${i}_role`}
                      className="text-xs font-semibold uppercase tracking-wider text-primary"
                    >
                      {person.role}
                    </ColoredText>
                    <ColoredText
                      as="h3"
                      colors={colors}
                      field={`leadership_person_${i}_name`}
                      className="mt-1 text-xl font-semibold"
                    >
                      {person.name}
                    </ColoredText>
                    <ColoredText
                      as="p"
                      colors={colors}
                      field={`leadership_person_${i}_quote`}
                      className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground"
                    >
                      &ldquo;{person.quote}&rdquo;
                    </ColoredText>
                    {(person.phone || person.email) && (
                      <div className="mt-4 space-y-2 border-t border-border pt-4">
                        {person.phone ? (
                          <a
                            href={`tel:${person.phone.replace(/\s+/g, "")}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>{person.phone}</span>
                          </a>
                        ) : null}
                        {person.email ? (
                          <a
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="truncate">{person.email}</span>
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
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
      </div>
    </section>
  );
}
