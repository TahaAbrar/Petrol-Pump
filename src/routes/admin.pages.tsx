import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { ColoredField } from "@/components/admin/ColoredField";
import {
  SectionActionBar,
  findUndo,
  undoExpiresInMs,
  type SectionAction,
} from "@/components/admin/SectionActionBar";
import {
  apiFetch,
  mediaUrl,
  type ActiveUndo,
  type BannerImageItem,
  type PageContent,
} from "@/lib/api";
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
import {
  DEFAULT_FEATURES,
  FEATURE_ICON_OPTIONS,
  parseFeatures,
  type FeatureCard,
  type FeatureIconKey,
  type FeaturesSectionContent,
} from "@/lib/home-features-content";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({ meta: [{ title: "Pages & Banners — Admin" }] }),
  component: PagesPage,
});

type HomeStat = { v: string; l: string };

type BannerFieldFlags = {
  subtitle: boolean;
  title: boolean;
  body: boolean;
  stats: boolean;
};

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

const DEFAULT_BANNER_FIELDS: BannerFieldFlags = {
  subtitle: true,
  title: true,
  body: true,
  stats: true,
};

function parseHomeStats(extra?: Record<string, unknown>): HomeStat[] {
  const raw = extra?.stats;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_HOME_STATS.map((s) => ({ ...s }));
  return raw.map((item) => {
    if (item && typeof item === "object" && "v" in item && "l" in item) {
      return { v: String((item as HomeStat).v), l: String((item as HomeStat).l) };
    }
    return { v: "", l: "" };
  });
}

function parseWhyUs(extra?: Record<string, unknown>): string[] {
  const raw = extra?.whyUs;
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_WHY_US];
  return raw.map((s) => String(s));
}

function parseBannerFields(extra?: Record<string, unknown>): BannerFieldFlags {
  const raw = extra?.banner_fields;
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BANNER_FIELDS };
  const src = raw as Record<string, unknown>;
  return {
    subtitle: src.subtitle !== false,
    title: src.title !== false,
    body: src.body !== false,
    stats: src.stats !== false,
  };
}

const BANNER_COLOR_KEYS = new Set(["subtitle", "title", "body"]);

function bannerTextColors(colors: TextColors): TextColors {
  const out: TextColors = {};
  for (const [k, v] of Object.entries(colors)) {
    if (BANNER_COLOR_KEYS.has(k)) out[k] = v;
  }
  return out;
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "jpg";
  const name = filename.includes(".") ? filename : `${filename}.${ext}`;
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

function liveBannerImages(page?: PageContent | null): BannerImageItem[] {
  if (!page) return [];
  if (page.banner_images?.length) return page.banner_images;
  if (page.banner) return [{ id: -1, image: page.banner, order: 0 }];
  return [];
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
  const [featuresSection, setFeaturesSection] = useState<FeaturesSectionContent>(DEFAULT_FEATURES);
  const [ourStory, setOurStory] = useState<OurStoryContent>(DEFAULT_OUR_STORY);
  const [leadership, setLeadership] = useState<LeadershipContent>(DEFAULT_LEADERSHIP);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [founderFile, setFounderFile] = useState<File | null>(null);
  const [ceo2File, setCeo2File] = useState<File | null>(null);
  const [managerFile, setManagerFile] = useState<File | null>(null);
  const [textColors, setTextColors] = useState<TextColors>({});
  const [bannerFields, setBannerFields] = useState<BannerFieldFlags>({ ...DEFAULT_BANNER_FIELDS });
  const [saving, setSaving] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingFeatureIdx, setSavingFeatureIdx] = useState<number | null>(null);
  const [deletingFeatureIdx, setDeletingFeatureIdx] = useState<number | null>(null);

  // Selection / edit state
  const [selectedSection, setSelectedSection] = useState<"banner" | `feature:${number}` | null>(null);
  const [bannerEditing, setBannerEditing] = useState(false);
  const [featureEditingIdx, setFeatureEditingIdx] = useState<number | null>(null);
  const [pendingNewFiles, setPendingNewFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [maxStats, setMaxStats] = useState(3);
  const [localUndos, setLocalUndos] = useState<ActiveUndo[]>([]);
  const [undoTick, setUndoTick] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);

  const ABOUT_KEYS = new Set(["about", "about_story", "about_leadership"]);
  const pageList = data?.filter((p) => p.key !== "contact" && !ABOUT_KEYS.has(p.key)) ?? [];
  const current = pageList.find((p) => p.key === activeKey) ?? pageList[0];
  const isHome = activeKey === "home";
  const isAbout = activeKey === "about";

  const mergedUndos = useMemo(() => {
    const fromServer = current?.active_undos ?? [];
    const map = new Map<string, ActiveUndo>();
    for (const u of fromServer) map.set(u.scope, u);
    for (const u of localUndos) map.set(u.scope, u);
    return Array.from(map.values());
  }, [current?.active_undos, localUndos, undoTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const bannerUndo = findUndo(mergedUndos, "banner");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const u of mergedUndos) {
      const ms = undoExpiresInMs(u.expires_at);
      if (ms > 0 && ms < 1000 * 60 * 30) {
        timers.push(setTimeout(() => setUndoTick((t) => t + 1), ms + 50));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [mergedUndos]);

  useEffect(() => {
    if (current) {
      setForm(current);
      setStoryFile(null);
      setFounderFile(null);
      setCeo2File(null);
      setManagerFile(null);
      setTextColors(bannerTextColors(parseTextColors(current.extra?.text_colors)));
      setBannerFields(parseBannerFields(current.extra));
      setPendingNewFiles([]);
      setRemovedImageIds([]);
      setBannerEditing(false);
      setFeatureEditingIdx(null);
      setSelectedSection(null);
      setLocalUndos(current.active_undos ?? []);
      if (current.key === "home") {
        const stats = parseHomeStats(current.extra);
        setHomeStats(stats);
        setMaxStats(Math.max(stats.length, DEFAULT_HOME_STATS.length));
        setWhyUsItems(parseWhyUs(current.extra));
        setFeaturesSection(parseFeatures(current.extra));
      }
      if (current.key === "about") {
        setOurStory(parseOurStory(current.extra));
        setLeadership(parseLeadership(current.extra));
      }
    }
  }, [current?.key, current?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside to deselect
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (bannerEditing || featureEditingIdx !== null) return;
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setSelectedSection(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [bannerEditing, featureEditingIdx]);

  function rememberUndo(undo?: ActiveUndo | null) {
    if (!undo?.token) return;
    setLocalUndos((prev) => {
      const next = prev.filter((u) => u.scope !== undo.scope);
      next.push(undo);
      return next;
    });
  }

  async function refreshAfterSave(pageKey: string) {
    await qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    await refreshPublicContent(qc, { pageKey });
  }

  function enterBannerEdit() {
    setBannerEditing(true);
    setSelectedSection("banner");
    if (isHome) {
      setMaxStats(Math.max(homeStats.length, 1));
    }
  }

  function cancelBannerEdit() {
    if (!current) return;
    setBannerEditing(false);
    setForm(current);
    setTextColors(bannerTextColors(parseTextColors(current.extra?.text_colors)));
    setBannerFields(parseBannerFields(current.extra));
    setPendingNewFiles([]);
    setRemovedImageIds([]);
    if (current.key === "home") {
      setHomeStats(parseHomeStats(current.extra));
    }
  }

  async function handleSaveBanner() {
    if (!current) return;
    setSavingBanner(true);
    try {
      const existing = liveBannerImages(current).filter(
        (img) => img.id > 0 && !removedImageIds.includes(img.id),
      );
      // Prefer archive+reupload whenever any removal happened; for add-only skip archive
      const shouldArchive = removedImageIds.length > 0;
      const onlyAdding = pendingNewFiles.length > 0 && removedImageIds.length === 0;

      const extraBase: Record<string, unknown> = {
        ...(current.extra ?? {}),
        text_colors: bannerTextColors(textColors),
        banner_fields: { ...bannerFields },
      };

      if (isHome) {
        extraBase.stats = homeStats.map((s) => ({ v: s.v.trim(), l: s.l.trim() }));
        // Preserve features / whyUs from current extra
        if (current.extra?.whyUs) extraBase.whyUs = current.extra.whyUs;
        if (current.extra?.features) extraBase.features = current.extra.features;
      }

      const body: Record<string, unknown> = {
        title: form.title ?? "",
        subtitle: form.subtitle ?? "",
        extra: extraBase,
        create_undo: true,
        undo_scope: "banner",
      };
      if (!isAbout) {
        body.body = form.body ?? "";
      }
      if (shouldArchive) {
        body.archive_banner_images = true;
      }

      const patched = await apiFetch<PageContent>(`/pages/${current.key}/`, {
        method: "PATCH",
        body,
      });
      rememberUndo(patched.undo ?? null);

      if (shouldArchive) {
        // Re-upload kept existing images (as blobs) + pending new files
        const filesToUpload: File[] = [...pendingNewFiles];
        for (const img of existing) {
          if (!img.image) continue;
          const file = await urlToFile(mediaUrl(img.image), `banner-${img.id}`);
          filesToUpload.push(file);
        }
        if (filesToUpload.length > 0) {
          const fd = new FormData();
          for (const f of filesToUpload) fd.append("images", f);
          await apiFetch(`/pages/${current.key}/banner-images/`, { method: "POST", body: fd });
        }
      } else if (onlyAdding) {
        const fd = new FormData();
        for (const f of pendingNewFiles) fd.append("images", f);
        await apiFetch(`/pages/${current.key}/banner-images/`, { method: "POST", body: fd });
      }

      setPendingNewFiles([]);
      setRemovedImageIds([]);
      setBannerEditing(false);
      await refreshAfterSave(current.key);
      toast.success("Banner saved");
    } catch (e: any) {
      toast.error("Banner save failed", { description: e?.message });
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleUndo(token: string, label = "Change") {
    if (!current) return;
    try {
      await apiFetch(`/pages/${current.key}/undo/`, { method: "POST", body: { token } });
      setLocalUndos((prev) => prev.filter((u) => u.token !== token));
      setBannerEditing(false);
      setFeatureEditingIdx(null);
      await refreshAfterSave(current.key);
      toast.success(`${label} undone`);
    } catch (e: any) {
      toast.error("Undo failed", { description: e?.message });
    }
  }

  async function patchFeatures(
    cards: FeatureCard[],
    opts: { createUndo?: boolean; undoScope?: string; headers?: FeaturesSectionContent } = {},
  ) {
    if (!current) return null;
    const section = opts.headers ?? featuresSection;
    const body: Record<string, unknown> = {
      extra: {
        ...(current.extra ?? {}),
        features: {
          eyebrow: section.eyebrow.trim(),
          title: section.title.trim(),
          subtitle: section.subtitle.trim(),
          cards: cards.map((c) => ({
            icon: c.icon,
            title: c.title.trim(),
            desc: c.desc.trim(),
          })),
        },
      },
    };
    if (opts.createUndo && opts.undoScope) {
      body.create_undo = true;
      body.undo_scope = opts.undoScope;
    }
    const res = await apiFetch<PageContent>(`/pages/${current.key}/`, { method: "PATCH", body });
    rememberUndo(res.undo ?? null);
    return res;
  }

  async function handleSaveFeatureCard(index: number) {
    if (!current) return;
    setSavingFeatureIdx(index);
    try {
      await patchFeatures(featuresSection.cards, {
        createUndo: true,
        undoScope: `feature_card:${index}`,
      });
      setFeatureEditingIdx(null);
      await refreshAfterSave(current.key);
      toast.success(`Feature card ${index + 1} saved`);
    } catch (e: any) {
      toast.error("Feature save failed", { description: e?.message });
    } finally {
      setSavingFeatureIdx(null);
    }
  }

  async function handleDuplicateFeature(index: number) {
    if (!current) return;
    const card = featuresSection.cards[index];
    if (!card) return;
    const nextCards = [...featuresSection.cards, { ...card }];
    setFeaturesSection((s) => ({ ...s, cards: nextCards }));
    try {
      await patchFeatures(nextCards);
      await refreshAfterSave(current.key);
      toast.success("Feature card duplicated");
    } catch (e: any) {
      toast.error("Duplicate failed", { description: e?.message });
      setFeaturesSection(parseFeatures(current.extra));
    }
  }

  async function handleDeleteFeature(index: number) {
    if (!current) return;
    if (featuresSection.cards.length <= 1) {
      toast.error("Keep at least one feature card");
      return;
    }
    setDeletingFeatureIdx(index);
    const nextCards = featuresSection.cards.filter((_, i) => i !== index);
    try {
      await patchFeatures(nextCards);
      setFeaturesSection((s) => ({ ...s, cards: nextCards }));
      setSelectedSection(null);
      setFeatureEditingIdx(null);
      await refreshAfterSave(current.key);
      toast.success("Feature card deleted");
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message });
      setFeaturesSection(parseFeatures(current.extra));
    } finally {
      setDeletingFeatureIdx(null);
    }
  }

  /** Save about / why-us / features header (non-banner). */
  async function handleSavePageContent() {
    if (!current) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      const extraBase = { ...(current.extra ?? {}) };

      if (isHome) {
        body.extra = {
          ...extraBase,
          features: {
            eyebrow: featuresSection.eyebrow.trim(),
            title: featuresSection.title.trim(),
            subtitle: featuresSection.subtitle.trim(),
            cards: featuresSection.cards.map((c) => ({
              icon: c.icon,
              title: c.title.trim(),
              desc: c.desc.trim(),
            })),
          },
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
              phone: p.phone.trim(),
              email: p.email.trim(),
            })),
            stats: leadership.stats.map((s) => ({ v: s.v.trim(), l: s.l.trim() })),
          },
        };
      } else {
        toast.message("Nothing else to save — use the banner Edit toolbar");
        setSaving(false);
        return;
      }

      await apiFetch(`/pages/${current.key}/`, { method: "PATCH", body });

      const imageFd = new FormData();
      if (storyFile) imageFd.append("story_image", storyFile);
      if (founderFile) imageFd.append("founder_image", founderFile);
      if (ceo2File) imageFd.append("ceo2_image", ceo2File);
      if (managerFile) imageFd.append("manager_image", managerFile);
      if ([...imageFd.keys()].length > 0) {
        await apiFetch(`/pages/${current.key}/`, { method: "PATCH", body: imageFd });
      }

      await refreshAfterSave(current.key);
      toast.success(`"${current.key}" content saved`);
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

  const existingPreviewImages = liveBannerImages(current).filter(
    (img) => !removedImageIds.includes(img.id),
  );

  const bannerActions: SectionAction[] = [];
  if (selectedSection === "banner" && !bannerEditing) {
    bannerActions.push({
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: (e) => {
        e.stopPropagation();
        enterBannerEdit();
      },
    });
    if (bannerUndo) {
      bannerActions.push({
        key: "undo",
        label: "Undo",
        icon: Undo2,
        tone: "accent",
        onClick: (e) => {
          e.stopPropagation();
          void handleUndo(bannerUndo.token, "Banner");
        },
      });
    }
  }

  return (
    <AdminShell title="Pages & Banners" description="Edit banner images, titles and content for each page">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div ref={rootRef} className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {pageList.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setActiveKey(p.key);
                  setSelectedSection(null);
                  setBannerEditing(false);
                  setFeatureEditingIdx(null);
                }}
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
              {/* —— Banner section —— */}
              <div className="relative pt-4">
                {bannerActions.length > 0 && <SectionActionBar actions={bannerActions} />}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (bannerEditing) return;
                    setSelectedSection("banner");
                    setFeatureEditingIdx(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!bannerEditing) setSelectedSection("banner");
                    }
                  }}
                  className={
                    "rounded-2xl border bg-background p-6 transition-shadow outline-none " +
                    (selectedSection === "banner" || bannerEditing
                      ? "border-primary shadow-md ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40")
                  }
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">Banner</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {bannerEditing
                          ? "Editing — change images and copy, then save."
                          : "Click to select, then Edit."}
                      </p>
                    </div>
                    {bannerEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelBannerEdit();
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Image thumbnails */}
                  <div className="space-y-3" onClick={(e) => bannerEditing && e.stopPropagation()}>
                    <div className="flex flex-wrap gap-3">
                      {existingPreviewImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative h-24 w-36 overflow-hidden rounded-xl border border-border bg-muted"
                        >
                          {img.image ? (
                            <img
                              src={mediaUrl(img.image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {bannerEditing && img.id > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setRemovedImageIds((ids) =>
                                  ids.includes(img.id) ? ids : [...ids, img.id],
                                )
                              }
                              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
                              aria-label="Remove image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pendingNewFiles.map((file, i) => (
                        <div
                          key={`pending-${i}-${file.name}`}
                          className="relative h-24 w-36 overflow-hidden rounded-xl border border-dashed border-primary/50 bg-muted"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {bannerEditing && (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingNewFiles((files) => files.filter((_, idx) => idx !== i))
                              }
                              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
                              aria-label="Remove pending image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!existingPreviewImages.length && !pendingNewFiles.length && (
                        <div className="grid h-24 w-full place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                          No banner images
                        </div>
                      )}
                    </div>

                    {bannerEditing && (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
                        <ImagePlus className="h-4 w-4" />
                        Add images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length) setPendingNewFiles((prev) => [...prev, ...files]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Text fields */}
                  {bannerEditing ? (
                    <div className="mt-5 grid gap-4" onClick={(e) => e.stopPropagation()}>
                      {bannerFields.subtitle && (
                        <div className="relative">
                          <ColoredField
                            label={isAbout ? "Hero eyebrow" : "Subtitle / eyebrow"}
                            value={form.subtitle ?? ""}
                            onChange={(v) => setForm({ ...form, subtitle: v })}
                            color={textColors.subtitle ?? DEFAULT_TEXT_COLOR}
                            onColorChange={(c) =>
                              setTextColors((p) => ({ ...p, subtitle: normalizeHexColor(c) }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setBannerFields((f) => ({ ...f, subtitle: false }))}
                            className="absolute right-0 top-0 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove field
                          </button>
                        </div>
                      )}
                      {bannerFields.title && (
                        <div className="relative">
                          <ColoredField
                            label={isAbout ? "Hero title" : "Title"}
                            value={form.title ?? ""}
                            onChange={(v) => setForm({ ...form, title: v })}
                            color={textColors.title ?? DEFAULT_TEXT_COLOR}
                            onColorChange={(c) =>
                              setTextColors((p) => ({ ...p, title: normalizeHexColor(c) }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setBannerFields((f) => ({ ...f, title: false }))}
                            className="absolute right-0 top-0 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove field
                          </button>
                        </div>
                      )}
                      {!isAbout && bannerFields.body && (
                        <div className="relative">
                          <ColoredField
                            label="Body text"
                            value={form.body ?? ""}
                            onChange={(v) => setForm({ ...form, body: v })}
                            color={textColors.body ?? DEFAULT_TEXT_COLOR}
                            onColorChange={(c) =>
                              setTextColors((p) => ({ ...p, body: normalizeHexColor(c) }))
                            }
                            multiline
                            rows={4}
                          />
                          <button
                            type="button"
                            onClick={() => setBannerFields((f) => ({ ...f, body: false }))}
                            className="absolute right-0 top-0 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Remove field
                          </button>
                        </div>
                      )}

                      {/* Add removed text fields */}
                      {(!bannerFields.subtitle ||
                        !bannerFields.title ||
                        (!isAbout && !bannerFields.body) ||
                        (isHome && !bannerFields.stats)) && (
                        <div className="flex flex-wrap gap-2">
                          {!bannerFields.subtitle && (
                            <button
                              type="button"
                              onClick={() => setBannerFields((f) => ({ ...f, subtitle: true }))}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
                            >
                              + Subtitle
                            </button>
                          )}
                          {!bannerFields.title && (
                            <button
                              type="button"
                              onClick={() => setBannerFields((f) => ({ ...f, title: true }))}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
                            >
                              + Title
                            </button>
                          )}
                          {!isAbout && !bannerFields.body && (
                            <button
                              type="button"
                              onClick={() => setBannerFields((f) => ({ ...f, body: true }))}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
                            >
                              + Body
                            </button>
                          )}
                          {isHome && !bannerFields.stats && (
                            <button
                              type="button"
                              onClick={() => setBannerFields((f) => ({ ...f, stats: true }))}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-accent"
                            >
                              + Stats
                            </button>
                          )}
                        </div>
                      )}

                      {isHome && bannerFields.stats && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold">Hero stats</h4>
                              <p className="text-xs text-muted-foreground">
                                Up to {maxStats} cards (set when you entered edit mode).
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={homeStats.length >= maxStats}
                                onClick={() =>
                                  setHomeStats((prev) =>
                                    prev.length < maxStats ? [...prev, { v: "", l: "" }] : prev,
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-40"
                              >
                                <Plus className="h-3 w-3" /> Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setBannerFields((f) => ({ ...f, stats: false }))}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove stats
                              </button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {homeStats.map((stat, i) => (
                              <div
                                key={i}
                                className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
                              >
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    setHomeStats((prev) => prev.filter((_, idx) => idx !== i))
                                  }
                                  className="mt-6 grid h-10 w-10 place-items-center self-start rounded-xl border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="Delete stat"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleSaveBanner()}
                        disabled={savingBanner}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
                      >
                        {savingBanner ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save banner
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {bannerFields.subtitle && (
                        <p>
                          <span className="font-medium text-foreground">Subtitle:</span>{" "}
                          {form.subtitle || "—"}
                        </p>
                      )}
                      {bannerFields.title && (
                        <p>
                          <span className="font-medium text-foreground">Title:</span>{" "}
                          {form.title || "—"}
                        </p>
                      )}
                      {!isAbout && bannerFields.body && (
                        <p className="line-clamp-2">
                          <span className="font-medium text-foreground">Body:</span>{" "}
                          {form.body || "—"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* —— About blocks —— */}
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
                    description="Two CEOs and one Manager — each with photo, name, role, phone, email and quote on the About page."
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
                      const person = leadership.people[i] ?? {
                        name: "",
                        role: "",
                        quote: "",
                        phone: "",
                        email: "",
                      };
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
                            <Field
                              label="Phone"
                              value={person.phone}
                              onChange={(v) =>
                                setLeadership((s) => ({
                                  ...s,
                                  people: s.people.map((p, idx) =>
                                    idx === i ? { ...p, phone: v } : p,
                                  ),
                                }))
                              }
                              placeholder="+91 98765 43210"
                            />
                            <Field
                              label="Email"
                              value={person.email}
                              onChange={(v) =>
                                setLeadership((s) => ({
                                  ...s,
                                  people: s.people.map((p, idx) =>
                                    idx === i ? { ...p, email: v } : p,
                                  ),
                                }))
                              }
                              placeholder="name@example.com"
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

              {/* —— Home: features —— */}
              {isHome && (
                <>
                  <div className="rounded-2xl border border-border bg-background p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Features section</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Section heading fields + interactive promise cards.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newIdx = featuresSection.cards.length;
                          setFeaturesSection((s) => ({
                            ...s,
                            cards: [...s.cards, { icon: "Fuel", title: "", desc: "" }],
                          }));
                          setFeatureEditingIdx(newIdx);
                          setSelectedSection(`feature:${newIdx}`);
                          setBannerEditing(false);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add card
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <Field
                        label="Section eyebrow"
                        value={featuresSection.eyebrow}
                        onChange={(v) => setFeaturesSection((s) => ({ ...s, eyebrow: v }))}
                        placeholder="Why customers stay"
                      />
                      <Field
                        label="Section title"
                        value={featuresSection.title}
                        onChange={(v) => setFeaturesSection((s) => ({ ...s, title: v }))}
                      />
                      <TextArea
                        label="Section description"
                        value={featuresSection.subtitle}
                        onChange={(v) => setFeaturesSection((s) => ({ ...s, subtitle: v }))}
                      />
                    </div>

                    <div className="mt-5 space-y-5">
                      {featuresSection.cards.map((card, i) => {
                        const scope = `feature_card:${i}`;
                        const cardUndo = findUndo(mergedUndos, scope);
                        const selected = selectedSection === `feature:${i}`;
                        const editing = featureEditingIdx === i;
                        const actions: SectionAction[] = [];
                        if (selected && !editing) {
                          actions.push({
                            key: "edit",
                            label: "Edit",
                            icon: Pencil,
                            onClick: (e) => {
                              e.stopPropagation();
                              setFeatureEditingIdx(i);
                              setSelectedSection(`feature:${i}`);
                              setBannerEditing(false);
                            },
                          });
                          actions.push({
                            key: "duplicate",
                            label: "Duplicate",
                            icon: Copy,
                            onClick: (e) => {
                              e.stopPropagation();
                              void handleDuplicateFeature(i);
                            },
                          });
                          actions.push({
                            key: "delete",
                            label: "Delete",
                            icon: Trash2,
                            tone: "danger",
                            loading: deletingFeatureIdx === i,
                            disabled: deletingFeatureIdx === i || savingFeatureIdx === i,
                            onClick: (e) => {
                              e.stopPropagation();
                              void handleDeleteFeature(i);
                            },
                          });
                          if (cardUndo) {
                            actions.push({
                              key: "undo",
                              label: "Undo",
                              icon: Undo2,
                              tone: "accent",
                              onClick: (e) => {
                                e.stopPropagation();
                                void handleUndo(cardUndo.token, `Card ${i + 1}`);
                              },
                            });
                          }
                        }

                        return (
                          <div key={i} className="relative pt-4">
                            {actions.length > 0 && <SectionActionBar actions={actions} />}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (editing) return;
                                setSelectedSection(`feature:${i}`);
                                setBannerEditing(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  if (!editing) setSelectedSection(`feature:${i}`);
                                }
                              }}
                              className={
                                "space-y-3 rounded-xl border bg-muted/30 p-4 outline-none transition-shadow " +
                                (selected || editing
                                  ? "border-primary shadow-md ring-1 ring-primary/30"
                                  : "border-border hover:border-primary/40")
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold">Card {i + 1}</h4>
                                {editing && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeatureEditingIdx(null);
                                      if (current) {
                                        setFeaturesSection(parseFeatures(current.extra));
                                      }
                                    }}
                                    className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent"
                                    aria-label="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>

                              {editing ? (
                                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                  <div>
                                    <Label>Icon</Label>
                                    <select
                                      value={card.icon}
                                      onChange={(e) =>
                                        setFeaturesSection((s) => ({
                                          ...s,
                                          cards: s.cards.map((c, idx) =>
                                            idx === i
                                              ? { ...c, icon: e.target.value as FeatureIconKey }
                                              : c,
                                          ),
                                        }))
                                      }
                                      className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                                    >
                                      {FEATURE_ICON_OPTIONS.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <Field
                                    label="Card title"
                                    value={card.title}
                                    onChange={(v) =>
                                      setFeaturesSection((s) => ({
                                        ...s,
                                        cards: s.cards.map((c, idx) =>
                                          idx === i ? { ...c, title: v } : c,
                                        ),
                                      }))
                                    }
                                  />
                                  <TextArea
                                    label="Card description"
                                    value={card.desc}
                                    onChange={(v) =>
                                      setFeaturesSection((s) => ({
                                        ...s,
                                        cards: s.cards.map((c, idx) =>
                                          idx === i ? { ...c, desc: v } : c,
                                        ),
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveFeatureCard(i)}
                                    disabled={savingFeatureIdx === i}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                  >
                                    {savingFeatureIdx === i ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                    Save card
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium">{card.title || "Untitled"}</p>
                                  <p className="line-clamp-2 text-muted-foreground">
                                    {card.desc || "No description"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Icon: {card.icon}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {(isHome || isAbout) && (
                <button
                  type="button"
                  onClick={() => void handleSavePageContent()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save page content
                </button>
              )}
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
