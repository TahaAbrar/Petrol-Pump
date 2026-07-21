import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { apiFetch, mediaUrl, type AboutPerson, type PageContent } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/about")({
  head: () => ({ meta: [{ title: "About Us — Admin" }] }),
  component: AdminAboutPage,
});

type Tab = "overview" | "story" | "leadership";

type StoryDraft = {
  id?: number;
  file?: File | null;
  image?: string | null;
  caption: string;
  order: number;
};

type PersonDraft = Partial<AboutPerson> & { file?: File | null };

function AdminAboutPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <AdminShell title="About Us" description="Manage overview, our story, and leadership content">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabBtn>
          <TabBtn active={tab === "story"} onClick={() => setTab("story")}>
            Our Story
          </TabBtn>
          <TabBtn active={tab === "leadership"} onClick={() => setTab("leadership")}>
            Leadership
          </TabBtn>
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "story" && <StoryTab />}
        {tab === "leadership" && <LeadershipTab />}
      </div>
    </AdminShell>
  );
}

/* ─── Overview (page key: about) ─── */

function OverviewTab() {
  const qc = useQueryClient();
  const { data: page, isLoading } = useQuery<PageContent>({
    queryKey: ["admin", "page", "about"],
    queryFn: () => apiFetch<PageContent>("/pages/about/"),
  });

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) return;
    setTitle(page.title ?? "");
    setSubtitle(page.subtitle ?? "");
    setBody(page.body ?? "");
    setBannerFiles([]);
  }, [page?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin", "page", "about"] });
    await refreshPublicContent(qc, { pageKey: "about" });
  }

  async function removeBanner(id: number) {
    try {
      await apiFetch(`/pages/about/banner-images/${id}/`, { method: "DELETE" });
      await refresh();
      toast.success("Banner image removed");
    } catch (e: unknown) {
      toast.error("Remove failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/pages/about/", {
        method: "PATCH",
        body: { title, subtitle, body },
      });
      if (bannerFiles.length) {
        const fd = new FormData();
        bannerFiles.forEach((f) => fd.append("images", f));
        await apiFetch("/pages/about/banner-images/", { method: "POST", body: fd });
      }
      setBannerFiles([]);
      await refresh();
      toast.success("Overview saved");
    } catch (e: unknown) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !page) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="max-w-3xl space-y-5">
      <Section title="Banner" hint="Multi-image banner for the About overview page">
        <BannerGallery
          images={page.banner_images ?? []}
          pending={bannerFiles}
          onAdd={setBannerFiles}
          onRemovePending={(i) => setBannerFiles((p) => p.filter((_, idx) => idx !== i))}
          onRemoveLive={(id) => void removeBanner(id)}
        />
        <Field label="Banner title" value={title} onChange={setTitle} />
        <Field label="Banner body" value={subtitle} onChange={setSubtitle} multiline />
      </Section>

      <Section title="About Us content">
        <RichTextEditor label="About Us" value={body} onChange={setBody} />
      </Section>

      <SaveBtn saving={saving} onClick={() => void save()} />
    </div>
  );
}

/* ─── Our Story (page key: about_story) ─── */

function StoryTab() {
  const qc = useQueryClient();
  const { data: page, isLoading } = useQuery<PageContent>({
    queryKey: ["admin", "page", "about_story"],
    queryFn: () => apiFetch<PageContent>("/pages/about_story/"),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [storyItems, setStoryItems] = useState<StoryDraft[]>([]);
  const [newStory, setNewStory] = useState<StoryDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingStoryIdx, setSavingStoryIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!page) return;
    setTitle(page.title ?? "");
    setBody(page.body ?? "");
    setMission(String(page.extra?.mission ?? ""));
    setVision(String(page.extra?.vision ?? ""));
    setBannerFiles([]);
    setNewStory([]);
    setStoryItems(
      (page.story_gallery ?? []).map((g) => ({
        id: g.id,
        image: g.image,
        caption: g.caption,
        order: g.order,
      })),
    );
  }, [page?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin", "page", "about_story"] });
    await refreshPublicContent(qc, { pageKey: "about_story" });
  }

  async function removeBanner(id: number) {
    try {
      await apiFetch(`/pages/about_story/banner-images/${id}/`, { method: "DELETE" });
      await refresh();
      toast.success("Banner image removed");
    } catch (e: unknown) {
      toast.error("Remove failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function savePage() {
    setSaving(true);
    try {
      await apiFetch("/pages/about_story/", {
        method: "PATCH",
        body: {
          title,
          body,
          extra: { ...(page?.extra ?? {}), mission, vision },
        },
      });
      if (bannerFiles.length) {
        const fd = new FormData();
        bannerFiles.forEach((f) => fd.append("images", f));
        await apiFetch("/pages/about_story/banner-images/", { method: "POST", body: fd });
      }
      if (newStory.length) {
        const missing = newStory.find((s) => !s.file || !s.caption.trim());
        if (missing) {
          toast.error("Each new story image needs a file and caption");
          setSaving(false);
          return;
        }
        const fd = new FormData();
        newStory.forEach((s) => {
          if (s.file) fd.append("images", s.file);
          fd.append("captions", s.caption.trim());
          fd.append("orders", String(s.order));
        });
        await apiFetch("/pages/about_story/story-images/", { method: "POST", body: fd });
      }
      setBannerFiles([]);
      setNewStory([]);
      await refresh();
      toast.success("Our Story saved");
    } catch (e: unknown) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function saveStoryItem(index: number) {
    const item = storyItems[index];
    if (!item?.id) return;
    if (!item.caption.trim()) {
      toast.error("Caption is required");
      return;
    }
    setSavingStoryIdx(index);
    try {
      const fd = new FormData();
      fd.append("caption", item.caption.trim());
      fd.append("order", String(item.order));
      if (item.file) fd.append("image", item.file);
      await apiFetch(`/pages/about_story/story-images/${item.id}/`, { method: "PATCH", body: fd });
      await refresh();
      toast.success("Story image updated");
    } catch (e: unknown) {
      toast.error("Update failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSavingStoryIdx(null);
    }
  }

  async function deleteStoryItem(id: number) {
    try {
      await apiFetch(`/pages/about_story/story-images/${id}/`, { method: "DELETE" });
      await refresh();
      toast.success("Story image removed");
    } catch (e: unknown) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  function addNewStorySlot() {
    const nextOrder =
      Math.max(
        0,
        ...storyItems.map((s) => s.order),
        ...newStory.map((s) => s.order),
        -1,
      ) + 1;
    setNewStory((prev) => [...prev, { caption: "", order: nextOrder, file: null }]);
  }

  if (isLoading || !page) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="max-w-3xl space-y-5">
      <Section title="Banner" hint="Optional banner images for the Our Story page">
        <BannerGallery
          images={page.banner_images ?? []}
          pending={bannerFiles}
          onAdd={setBannerFiles}
          onRemovePending={(i) => setBannerFiles((p) => p.filter((_, idx) => idx !== i))}
          onRemoveLive={(id) => void removeBanner(id)}
        />
        <Field label="Banner title" value={title} onChange={setTitle} />
      </Section>

      <Section title="Story text">
        <RichTextEditor label="Body" value={body} onChange={setBody} />
      </Section>

      <Section title="Story images" hint="Each image needs a caption and display order (starting at 0)">
        {storyItems.map((item, i) => (
          <div key={item.id ?? i} className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold">Image {i + 1}</h4>
              <button
                type="button"
                onClick={() => item.id && void deleteStoryItem(item.id)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <ImageField
              label="Photo"
              preview={
                item.file
                  ? URL.createObjectURL(item.file)
                  : item.image
                    ? mediaUrl(item.image)
                    : null
              }
              onChange={(f) =>
                setStoryItems((prev) => prev.map((s, idx) => (idx === i ? { ...s, file: f } : s)))
              }
            />
            <Field
              label="Caption"
              value={item.caption}
              onChange={(v) =>
                setStoryItems((prev) => prev.map((s, idx) => (idx === i ? { ...s, caption: v } : s)))
              }
            />
            <Field
              label="Display order"
              value={String(item.order)}
              onChange={(v) =>
                setStoryItems((prev) =>
                  prev.map((s, idx) => (idx === i ? { ...s, order: Number(v) || 0 } : s)),
                )
              }
            />
            <button
              type="button"
              disabled={savingStoryIdx === i}
              onClick={() => void saveStoryItem(i)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {savingStoryIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save image
            </button>
          </div>
        ))}

        {newStory.map((item, i) => (
          <div key={`new-${i}`} className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold">New image</h4>
              <button
                type="button"
                onClick={() => setNewStory((prev) => prev.filter((_, idx) => idx !== i))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <ImageField
              label="Photo"
              preview={item.file ? URL.createObjectURL(item.file) : null}
              onChange={(f) =>
                setNewStory((prev) => prev.map((s, idx) => (idx === i ? { ...s, file: f } : s)))
              }
            />
            <Field
              label="Caption"
              value={item.caption}
              onChange={(v) =>
                setNewStory((prev) => prev.map((s, idx) => (idx === i ? { ...s, caption: v } : s)))
              }
            />
            <Field
              label="Display order"
              value={String(item.order)}
              onChange={(v) =>
                setNewStory((prev) =>
                  prev.map((s, idx) => (idx === i ? { ...s, order: Number(v) || 0 } : s)),
                )
              }
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addNewStorySlot}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Add story image
        </button>
      </Section>

      <Section title="Mission & Vision">
        <RichTextEditor label="Mission" value={mission} onChange={setMission} />
        <RichTextEditor label="Vision" value={vision} onChange={setVision} />
      </Section>

      <SaveBtn saving={saving} onClick={() => void savePage()} />
    </div>
  );
}

/* ─── Leadership ─── */

function LeadershipTab() {
  const qc = useQueryClient();
  const { data: page, isLoading: pageLoading } = useQuery<PageContent>({
    queryKey: ["admin", "page", "about_leadership"],
    queryFn: () => apiFetch<PageContent>("/pages/about_leadership/"),
  });
  const { data: leaders, isLoading: leadersLoading } = useQuery<AboutPerson[]>({
    queryKey: ["admin", "about-people", "leader"],
    queryFn: () => apiFetch<AboutPerson[]>("/about-people/?kind=leader"),
  });
  const { data: directors, isLoading: directorsLoading } = useQuery<AboutPerson[]>({
    queryKey: ["admin", "about-people", "director"],
    queryFn: () => apiFetch<AboutPerson[]>("/about-people/?kind=director"),
  });

  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [savingBanner, setSavingBanner] = useState(false);
  const [leaderDrafts, setLeaderDrafts] = useState<PersonDraft[]>([]);
  const [directorDrafts, setDirectorDrafts] = useState<PersonDraft[]>([]);
  const [savingPersonKey, setSavingPersonKey] = useState<string | null>(null);

  useEffect(() => {
    if (!page) return;
    setBannerTitle(page.title ?? "");
    setBannerFiles([]);
  }, [page?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!leaders) return;
    if (savingPersonKey?.startsWith("leader:")) return;
    setLeaderDrafts(leaders.map((p) => ({ ...p })));
  }, [leaders, savingPersonKey]);

  useEffect(() => {
    if (!directors) return;
    if (savingPersonKey?.startsWith("director:")) return;
    setDirectorDrafts(directors.map((p) => ({ ...p })));
  }, [directors, savingPersonKey]);

  async function refreshPeople() {
    await qc.invalidateQueries({ queryKey: ["admin", "about-people"] });
    await qc.invalidateQueries({ queryKey: ["admin", "page", "about_leadership"] });
    await refreshPublicContent(qc, { pageKey: "about_leadership" });
  }

  async function removeBanner(id: number) {
    try {
      await apiFetch(`/pages/about_leadership/banner-images/${id}/`, { method: "DELETE" });
      await refreshPeople();
      toast.success("Banner image removed");
    } catch (e: unknown) {
      toast.error("Remove failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function saveBanner() {
    setSavingBanner(true);
    try {
      await apiFetch("/pages/about_leadership/", {
        method: "PATCH",
        body: { title: bannerTitle },
      });
      if (bannerFiles.length) {
        const fd = new FormData();
        bannerFiles.forEach((f) => fd.append("images", f));
        await apiFetch("/pages/about_leadership/banner-images/", { method: "POST", body: fd });
      }
      setBannerFiles([]);
      await refreshPeople();
      toast.success("Leadership banner saved");
    } catch (e: unknown) {
      toast.error("Banner save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSavingBanner(false);
    }
  }

  async function savePerson(kind: "leader" | "director", index: number, drafts: PersonDraft[]) {
    const person = drafts[index];
    if (!person) return;
    if (!person.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    const key = `${kind}:${person.id ?? `new-${index}`}`;
    setSavingPersonKey(key);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("name", person.name.trim());
      fd.append("role", (person.role ?? "").trim());
      fd.append("message", person.message ?? "");
      fd.append("order", String(person.order ?? 0));
      if (kind === "director") {
        fd.append("border_color", person.border_color || "#c8102e");
      }
      if (person.file) fd.append("image", person.file);

      if (person.id) {
        await apiFetch(`/about-people/${person.id}/`, { method: "PATCH", body: fd });
      } else {
        await apiFetch("/about-people/", { method: "POST", body: fd });
      }
      setSavingPersonKey(null);
      await refreshPeople();
      toast.success(kind === "leader" ? "Leader saved" : "Director saved");
    } catch (e: unknown) {
      setSavingPersonKey(null);
      toast.error("Save failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function deletePerson(id: number) {
    try {
      await apiFetch(`/about-people/${id}/`, { method: "DELETE" });
      await refreshPeople();
      toast.success("Removed");
    } catch (e: unknown) {
      toast.error("Delete failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const isLoading = pageLoading || leadersLoading || directorsLoading;
  if (isLoading || !page) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  return (
    <div className="max-w-3xl space-y-5">
      <Section title="Banner" hint="Optional banner for the Leadership page">
        <BannerGallery
          images={page.banner_images ?? []}
          pending={bannerFiles}
          onAdd={setBannerFiles}
          onRemovePending={(i) => setBannerFiles((p) => p.filter((_, idx) => idx !== i))}
          onRemoveLive={(id) => void removeBanner(id)}
        />
        <Field label="Banner title" value={bannerTitle} onChange={setBannerTitle} />
        <SaveBtn saving={savingBanner} onClick={() => void saveBanner()} label="Save banner" />
      </Section>

      <Section title="Leaders (CEO / Management)" hint="Name, role, message, image, and order">
        {leaderDrafts.map((person, i) => (
          <PersonEditor
            key={person.id ?? `leader-new-${i}`}
            kind="leader"
            person={person}
            saving={savingPersonKey === `leader:${person.id ?? `new-${i}`}`}
            onChange={(next) =>
              setLeaderDrafts((prev) => prev.map((p, idx) => (idx === i ? next : p)))
            }
            onSave={() => void savePerson("leader", i, leaderDrafts)}
            onDelete={() => {
              if (person.id) void deletePerson(person.id);
              else setLeaderDrafts((prev) => prev.filter((_, idx) => idx !== i));
            }}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            setLeaderDrafts((prev) => [
              ...prev,
              {
                kind: "leader",
                name: "",
                role: "",
                message: "",
                order: prev.length,
                border_color: "",
              },
            ])
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Add leader
        </button>
      </Section>

      <Section title="Board of Directors" hint="Includes border color for the card frame">
        {directorDrafts.map((person, i) => (
          <PersonEditor
            key={person.id ?? `director-new-${i}`}
            kind="director"
            person={person}
            saving={savingPersonKey === `director:${person.id ?? `new-${i}`}`}
            onChange={(next) =>
              setDirectorDrafts((prev) => prev.map((p, idx) => (idx === i ? next : p)))
            }
            onSave={() => void savePerson("director", i, directorDrafts)}
            onDelete={() => {
              if (person.id) void deletePerson(person.id);
              else setDirectorDrafts((prev) => prev.filter((_, idx) => idx !== i));
            }}
          />
        ))}
        <button
          type="button"
          onClick={() =>
            setDirectorDrafts((prev) => [
              ...prev,
              {
                kind: "director",
                name: "",
                role: "",
                message: "",
                order: prev.length,
                border_color: "#c8102e",
              },
            ])
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Add director
        </button>
      </Section>
    </div>
  );
}

function PersonEditor({
  kind,
  person,
  saving,
  onChange,
  onSave,
  onDelete,
}: {
  kind: "leader" | "director";
  person: PersonDraft;
  saving: boolean;
  onChange: (p: PersonDraft) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">
          {person.name?.trim() || (kind === "leader" ? "New leader" : "New director")}
        </h4>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ImageField
        label="Photo"
        preview={
          person.file
            ? URL.createObjectURL(person.file)
            : person.image
              ? mediaUrl(person.image)
              : null
        }
        onChange={(f) => onChange({ ...person, file: f })}
      />
      <Field label="Name" value={person.name ?? ""} onChange={(v) => onChange({ ...person, name: v })} />
      <Field label="Role" value={person.role ?? ""} onChange={(v) => onChange({ ...person, role: v })} />
      <Field
        label={kind === "director" ? "Long description" : "Message"}
        value={person.message ?? ""}
        onChange={(v) => onChange({ ...person, message: v })}
        multiline
      />
      {kind === "director" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Border color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={person.border_color || "#c8102e"}
              onChange={(e) => onChange({ ...person, border_color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
            />
            <input
              value={person.border_color || "#c8102e"}
              onChange={(e) => onChange({ ...person, border_color: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </div>
        </div>
      )}
      <Field
        label="Display order"
        value={String(person.order ?? 0)}
        onChange={(v) => onChange({ ...person, order: Number(v) || 0 })}
      />
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save
      </button>
    </div>
  );
}

/* ─── Shared UI ─── */

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow"
          : "border border-border hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview: string | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {preview && (
        <img
          src={preview}
          alt=""
          className="mb-2 h-40 w-full max-w-sm rounded-xl border border-border object-cover"
        />
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
        <ImagePlus className="h-4 w-4" /> Change image
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

function BannerGallery({
  images,
  pending,
  onAdd,
  onRemovePending,
  onRemoveLive,
}: {
  images: { id: number; image: string | null }[];
  pending: File[];
  onAdd: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  onRemoveLive: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
            {img.image && (
              <img src={mediaUrl(img.image)} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onRemoveLive(img.id)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {pending.map((f, i) => (
          <div
            key={`${f.name}-${i}`}
            className="relative h-24 w-36 overflow-hidden rounded-xl border border-dashed border-primary/40"
          >
            <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemovePending(i)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {!images.length && !pending.length && (
          <div className="grid h-24 w-full place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            No banner images
          </div>
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
        <ImagePlus className="h-4 w-4" /> Add banner images
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onAdd([...pending, ...files]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function SaveBtn({
  saving,
  onClick,
  label = "Save",
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Saving…" : label}
    </button>
  );
}
