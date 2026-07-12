import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ImagePlus, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { ColoredField } from "@/components/admin/ColoredField";
import { apiFetch, mediaUrl, type PageContent } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";
import { DEFAULT_TEXT_COLOR, normalizeHexColor, parseTextColors, type TextColors } from "@/lib/text-colors";
import {
  DEFAULT_LEADERSHIP,
  DEFAULT_OUR_STORY,
  parseLeadership,
  parseOurStory,
  type LeadershipContent,
  type LeadershipStat,
  type OurStoryContent,
} from "@/lib/about-page-content";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({ meta: [{ title: "Pages & Banners — Admin" }] }),
  component: PagesPage,
});

type HomeStat = { v: string; l: string };

const DEFAULT_HOME_STATS: HomeStat[] = [
  { v: "24/7", l: "Always open" },
  { v: "99.9%", l: "Uptime" },
  { v: "50k+", l: "Happy customers" },
];

const DEFAULT_WHY_US = [
  "Trusted by 50,000+ regular customers",
  "ISO-certified fuel quality control",
  "Experienced & friendly service team",
  "Modern, well-lit, secure infrastructure",
  "Round-the-clock customer support",
];

function parseHomeStats(extra?: Record<string, unknown>): HomeStat[] {
  const raw = extra?.stats;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_HOME_STATS.map((s) => ({ ...s }));
  return DEFAULT_HOME_STATS.map((fallback, i) => {
    const item = raw[i];
    if (item && typeof item === "object" && "v" in item && "l" in item) {
      return { v: String((item as HomeStat).v), l: String((item as HomeStat).l) };
    }
    return { ...fallback };
  });
}

function parseWhyUs(extra?: Record<string, unknown>): string[] {
  const raw = extra?.whyUs;
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_WHY_US];
  return raw.map((s) => String(s));
}

const BANNER_COLOR_KEYS = new Set(["subtitle", "title", "body"]);

function bannerTextColors(colors: TextColors): TextColors {
  const out: TextColors = {};
  for (const [k, v] of Object.entries(colors)) {
    if (BANNER_COLOR_KEYS.has(k)) out[k] = v;
  }
  return out;
}

function PagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<PageContent[]>({
    queryKey: ["admin", "pages"],
    queryFn: () => apiFetch<PageContent[]>("/pages/"),
  });

  const [activeKey, setActiveKey] = useState<string>("home");
  const [form, setForm] = useState<Partial<PageContent>>({});
  const [homeStats, setHomeStats] = useState<HomeStat[]>(DEFAULT_HOME_STATS);
  const [whyUsItems, setWhyUsItems] = useState<string[]>(DEFAULT_WHY_US);
  const [ourStory, setOurStory] = useState<OurStoryContent>(DEFAULT_OUR_STORY);
  const [leadership, setLeadership] = useState<LeadershipContent>(DEFAULT_LEADERSHIP);
  const [file, setFile] = useState<File | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [founderFile, setFounderFile] = useState<File | null>(null);
  const [ceo2File, setCeo2File] = useState<File | null>(null);
  const [managerFile, setManagerFile] = useState<File | null>(null);
  const [textColors, setTextColors] = useState<TextColors>({});
  const [saving, setSaving] = useState(false);

  const pageList = data?.filter((p) => p.key !== "contact") ?? [];

  const current = pageList.find((p) => p.key === activeKey) ?? pageList[0];
  const isHome = activeKey === "home";
  const isAbout = activeKey === "about";

  useEffect(() => {
    if (current) {
      setForm(current);
      setFile(null);
      setStoryFile(null);
      setFounderFile(null);
      setCeo2File(null);
      setManagerFile(null);
      setTextColors(bannerTextColors(parseTextColors(current.extra?.text_colors)));
      if (current.key === "home") {
        setHomeStats(parseHomeStats(current.extra));
        setWhyUsItems(parseWhyUs(current.extra));
      }
      if (current.key === "about") {
        setOurStory(parseOurStory(current.extra));
        setLeadership(parseLeadership(current.extra));
      }
    }
  }, [current?.key, current?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
      };

      if (!isAbout) {
        body.body = form.body ?? "";
      }

      const extraBase = { ...(current.extra ?? {}), text_colors: bannerTextColors(textColors) };

      if (isHome) {
        body.extra = {
          ...extraBase,
          stats: homeStats.map((s) => ({ v: s.v.trim(), l: s.l.trim() })),
          whyUs: whyUsItems.map((s) => s.trim()).filter(Boolean),
        };
      } else if (isAbout) {
        body.extra = {
          ...extraBase,
          ourStory: {
            eyebrow: ourStory.eyebrow.trim(),
            title: ourStory.title.trim(),
            body: ourStory.body.trim(),
            mission: ourStory.mission.trim(),
            vision: ourStory.vision.trim(),
            services: ourStory.services.trim(),
          },
          leadership: {
            eyebrow: leadership.eyebrow.trim(),
            title: leadership.title.trim(),
            people: leadership.people.map((p) => ({
              name: p.name.trim(),
              role: p.role.trim(),
              quote: p.quote.trim(),
            })),
            stats: leadership.stats.map((s) => ({ v: s.v.trim(), l: s.l.trim() })),
          },
        };
      } else {
        body.extra = extraBase;
      }

      await apiFetch(`/pages/${current.key}/`, { method: "PATCH", body });

      const imageFd = new FormData();
      if (file) imageFd.append("banner", file);
      if (storyFile) imageFd.append("story_image", storyFile);
      if (founderFile) imageFd.append("founder_image", founderFile);
      if (ceo2File) imageFd.append("ceo2_image", ceo2File);
      if (managerFile) imageFd.append("manager_image", managerFile);
      if ([...imageFd.keys()].length > 0) {
        await apiFetch(`/pages/${current.key}/`, { method: "PATCH", body: imageFd });
      }

      await qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      await refreshPublicContent(qc, { pageKey: current.key });
      toast.success(`"${current.key}" page saved`);
      setFile(null);
      setStoryFile(null);
      setFounderFile(null);
      setCeo2File(null);
      setManagerFile(null);
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Pages & Banners" description="Edit banner images, titles and content for each page">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {pageList.map((p) => (
              <button
                key={p.key}
                onClick={() => setActiveKey(p.key)}
                className={
                  "rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors " +
                  (activeKey === p.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "border border-border hover:bg-accent")
                }
              >
                {p.key}
              </button>
            ))}
          </div>

          {current && (
            <div className="max-w-3xl space-y-5">
              <div className="rounded-2xl border border-border bg-background p-6">
                <ImageUpload
                  label="Banner image"
                  preview={file ? URL.createObjectURL(file) : current.banner ? mediaUrl(current.banner) : null}
                  onChange={setFile}
                />
              </div>

              <div className="grid gap-4 rounded-2xl border border-border bg-background p-6">
                <ColoredField
                  label={isAbout ? "Hero eyebrow" : "Subtitle / eyebrow"}
                  value={form.subtitle ?? ""}
                  onChange={(v) => setForm({ ...form, subtitle: v })}
                  color={textColors.subtitle ?? DEFAULT_TEXT_COLOR}
                  onColorChange={(c) => setTextColors((p) => ({ ...p, subtitle: normalizeHexColor(c) }))}
                />
                <ColoredField
                  label={isAbout ? "Hero title" : "Title"}
                  value={form.title ?? ""}
                  onChange={(v) => setForm({ ...form, title: v })}
                  color={textColors.title ?? DEFAULT_TEXT_COLOR}
                  onColorChange={(c) => setTextColors((p) => ({ ...p, title: normalizeHexColor(c) }))}
                />
                {!isAbout && (
                  <ColoredField
                    label="Body text"
                    value={form.body ?? ""}
                    onChange={(v) => setForm({ ...form, body: v })}
                    color={textColors.body ?? DEFAULT_TEXT_COLOR}
                    onColorChange={(c) => setTextColors((p) => ({ ...p, body: normalizeHexColor(c) }))}
                    multiline
                    rows={4}
                  />
                )}
              </div>

              {isAbout && (
                <>
                  <SectionHeading
                    title="Our story"
                    description="Shown on the About page and in the home page preview section."
                  />
                  <div className="grid gap-4 rounded-2xl border border-border bg-background p-6">
                    <ImageUpload
                      label="Our story image"
                      preview={
                        storyFile
                          ? URL.createObjectURL(storyFile)
                          : current.story_image
                            ? mediaUrl(current.story_image)
                            : null
                      }
                      onChange={setStoryFile}
                      buttonLabel="Change story image"
                    />
                    <Field
                      label="Section eyebrow"
                      value={ourStory.eyebrow}
                      onChange={(v) => setOurStory((s) => ({ ...s, eyebrow: v }))}
                    />
                    <Field
                      label="Section title"
                      value={ourStory.title}
                      onChange={(v) => setOurStory((s) => ({ ...s, title: v }))}
                    />
                    <TextArea
                      label="Story text"
                      value={ourStory.body}
                      onChange={(v) => setOurStory((s) => ({ ...s, body: v }))}
                    />
                    <Field
                      label="Mission"
                      value={ourStory.mission}
                      onChange={(v) => setOurStory((s) => ({ ...s, mission: v }))}
                    />
                    <Field
                      label="Vision"
                      value={ourStory.vision}
                      onChange={(v) => setOurStory((s) => ({ ...s, vision: v }))}
                    />
                    <Field
                      label="Services"
                      value={ourStory.services}
                      onChange={(v) => setOurStory((s) => ({ ...s, services: v }))}
                    />
                  </div>

                  <SectionHeading
                    title="Leadership"
                    description="Two CEOs and one Manager — each with photo, name, role and quote on the About page."
                  />
                  <div className="grid gap-4 rounded-2xl border border-border bg-background p-6">
                    <Field
                      label="Section eyebrow"
                      value={leadership.eyebrow}
                      onChange={(v) => setLeadership((s) => ({ ...s, eyebrow: v }))}
                    />
                    <Field
                      label="Section title"
                      value={leadership.title}
                      onChange={(v) => setLeadership((s) => ({ ...s, title: v }))}
                    />

                    {(
                      [
                        {
                          label: "CEO 1",
                          file: founderFile,
                          setFile: setFounderFile,
                          image: current.founder_image,
                          buttonLabel: "Change CEO 1 photo",
                        },
                        {
                          label: "CEO 2",
                          file: ceo2File,
                          setFile: setCeo2File,
                          image: current.ceo2_image,
                          buttonLabel: "Change CEO 2 photo",
                        },
                        {
                          label: "Manager",
                          file: managerFile,
                          setFile: setManagerFile,
                          image: current.manager_image,
                          buttonLabel: "Change Manager photo",
                        },
                      ] as const
                    ).map((slot, i) => {
                      const person = leadership.people[i] ?? { name: "", role: "", quote: "" };
                      return (
                        <div
                          key={slot.label}
                          className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
                        >
                          <h4 className="text-sm font-semibold">{slot.label}</h4>
                          <ImageUpload
                            label={`${slot.label} portrait`}
                            preview={
                              slot.file
                                ? URL.createObjectURL(slot.file)
                                : slot.image
                                  ? mediaUrl(slot.image)
                                  : null
                            }
                            onChange={slot.setFile}
                            buttonLabel={slot.buttonLabel}
                            tall
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Name"
                              value={person.name}
                              onChange={(v) =>
                                setLeadership((s) => ({
                                  ...s,
                                  people: s.people.map((p, idx) =>
                                    idx === i ? { ...p, name: v } : p,
                                  ),
                                }))
                              }
                            />
                            <Field
                              label="Role"
                              value={person.role}
                              onChange={(v) =>
                                setLeadership((s) => ({
                                  ...s,
                                  people: s.people.map((p, idx) =>
                                    idx === i ? { ...p, role: v } : p,
                                  ),
                                }))
                              }
                              placeholder={i < 2 ? "CEO" : "Manager"}
                            />
                          </div>
                          <TextArea
                            label="Quote"
                            value={person.quote}
                            onChange={(v) =>
                              setLeadership((s) => ({
                                ...s,
                                people: s.people.map((p, idx) =>
                                  idx === i ? { ...p, quote: v } : p,
                                ),
                              }))
                            }
                          />
                        </div>
                      );
                    })}

                    <div className="space-y-3">
                      <Label>Leadership stats</Label>
                      {leadership.stats.map((stat, i) => (
                        <StatRow
                          key={i}
                          index={i}
                          stat={stat}
                          onChange={(next) =>
                            setLeadership((s) => ({
                              ...s,
                              stats: s.stats.map((item, idx) => (idx === i ? next : item)),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isHome && (
                <>
                  <div className="rounded-2xl border border-border bg-background p-6">
                    <h3 className="text-sm font-semibold">Hero stats</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Three highlight numbers shown below the hero section on the home page.
                    </p>
                    <div className="mt-4 space-y-3">
                      {homeStats.map((stat, i) => (
                        <div key={i} className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                          <Field
                            label={`Stat ${i + 1} — value`}
                            value={stat.v}
                            onChange={(v) =>
                              setHomeStats((prev) =>
                                prev.map((s, idx) => (idx === i ? { ...s, v } : s)),
                              )
                            }
                            placeholder="e.g. 24/7"
                          />
                          <Field
                            label={`Stat ${i + 1} — label`}
                            value={stat.l}
                            onChange={(v) =>
                              setHomeStats((prev) =>
                                prev.map((s, idx) => (idx === i ? { ...s, l: v } : s)),
                              )
                            }
                            placeholder="e.g. Always open"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Why choose us</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Bullet points shown in the &quot;Why choose us&quot; section on the home page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhyUsItems((prev) => [...prev, ""])}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add point
                      </button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {whyUsItems.map((item, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={item}
                            onChange={(e) =>
                              setWhyUsItems((prev) =>
                                prev.map((s, idx) => (idx === i ? e.target.value : s)),
                              )
                            }
                            placeholder={`Point ${i + 1}`}
                            className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setWhyUsItems((prev) =>
                                prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
                              )
                            }
                            disabled={whyUsItems.length <= 1}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                            aria-label="Remove point"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save page
              </button>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function ImageUpload({
  label,
  preview,
  onChange,
  buttonLabel = "Change image",
  tall = false,
}: {
  label: string;
  preview: string | null;
  onChange: (file: File | null) => void;
  buttonLabel?: string;
  tall?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted">
        {preview ? (
          <img
            src={preview}
            alt=""
            className={`w-full object-cover ${tall ? "h-64" : "h-48"}`}
          />
        ) : (
          <div className={`grid place-items-center ${tall ? "h-64" : "h-48"}`}>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
        <ImagePlus className="h-4 w-4" />
        {buttonLabel}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}

function StatRow({
  index,
  stat,
  onChange,
}: {
  index: number;
  stat: LeadershipStat;
  onChange: (stat: LeadershipStat) => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
      <Field
        label={`Stat ${index + 1} — value`}
        value={stat.v}
        onChange={(v) => onChange({ ...stat, v })}
      />
      <Field
        label={`Stat ${index + 1} — label`}
        value={stat.l}
        onChange={(l) => onChange({ ...stat, l })}
      />
    </div>
  );
}
