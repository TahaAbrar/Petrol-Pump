import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Briefcase, Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ColoredText } from "@/components/ColoredText";
import { useEmployees } from "@/lib/content";
import type { TextColors } from "@/lib/text-colors";

export const Route = createFileRoute("/employees/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({
    meta: [
      { title: "Our Team — Total Fuel Station" },
      { name: "description", content: "Meet the team behind Total Fuel Station." },
    ],
  }),
  component: EmployeePage,
});

function EmployeePage() {
  const { id } = Route.useLoaderData();
  const { data: employees, isFetching } = useEmployees();
  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <div className="container-x py-32 text-center">
        {isFetching ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        ) : (
          <>
            <h1 className="text-3xl font-bold">Employee not found</h1>
            <Link to="/about" className="mt-4 inline-block text-primary underline">Back to team</Link>
          </>
        )}
      </div>
    );
  }

  const others = employees.filter((e) => e.id !== employee.id);

  return (
    <div>
      <section className="bg-mesh py-16 md:py-24">
        <div className="container-x">
          <Link to="/about" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to team
          </Link>
          <Reveal>
            <ColoredText as="span" colors={employee.textColors} field="role" className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {employee.role}
            </ColoredText>
            <ColoredText as="h1" colors={employee.textColors} field="name" className="mt-3 text-5xl font-bold md:text-7xl">
              {employee.name}
            </ColoredText>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-border shadow-elegant">
              <img src={employee.image} alt={employee.name} width={800} height={1000} className="h-full w-full object-cover" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ColoredText as="p" colors={employee.textColors} field="bio" className="text-lg leading-relaxed">
              {employee.bio}
            </ColoredText>

            <div className="mt-8 grid gap-3">
              <InfoRow icon={Briefcase} label="Experience" value={employee.experience} field="experience" colors={employee.textColors} />
              <InfoRow icon={Mail} label="Email" value={employee.email} field="email" colors={employee.textColors} />
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Responsibilities</h3>
              <ul className="mt-4 space-y-2.5">
                {employee.responsibilities.map((r: string) => (
                  <li key={r} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    <ColoredText as="span" colors={employee.textColors} field="responsibilities">{r}</ColoredText>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-mesh py-20">
        <div className="container-x">
          <h2 className="text-2xl font-bold md:text-3xl">Meet the rest of the team</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((e) => (
              <Link
                key={e.id}
                to="/employees/$id"
                params={{ id: e.id }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <img src={e.image} alt={e.name} className="h-16 w-16 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <ColoredText as="div" colors={e.textColors} field="name" className="truncate font-semibold">
                    {e.name}
                  </ColoredText>
                  <ColoredText as="div" colors={e.textColors} field="role" className="text-xs text-muted-foreground">
                    {e.role}
                  </ColoredText>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  field,
  colors,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  field: string;
  colors: TextColors;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <ColoredText as="div" colors={colors} field={field} className="truncate text-sm font-medium">
          {value}
        </ColoredText>
      </div>
    </div>
  );
}
