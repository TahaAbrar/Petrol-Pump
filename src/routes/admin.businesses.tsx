import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImagePlus, Loader2, Pencil, Plus, Save, Trash2, Undo2, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { SectionActionBar, type SectionAction, undoExpiresInMs } from "@/components/admin/SectionActionBar";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { StyledFieldEditor } from "@/components/admin/StyledFieldEditor";
import {
  apiFetch, mediaUrl, type BusinessDetail, type BusinessHub, type BusinessListItem, type BusinessTeamMember,
} from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";
import { parseTextStyle, type TextStyle } from "@/lib/text-style";

export const Route = createFileRoute("/admin/businesses")({
  head: () => ({ meta: [{ title: "Our Businesses — Admin" }] }),
  component: AdminBusinessesPage,
});

type TeamDraft = {
  id?: number;
  name: string;
  role: string;
  name_style: TextStyle;
  role_style: TextStyle;
  file?: File | null;
  image?: string | null;
};

type BannerUndoSnap = {
  token: string;
  expires_at: string;
  previous: {
    banner_subtitle: string;
    banner_title: string;
    banner_body: string;
    banner_fields: Record<string, boolean>;
    image_ids: number[];
  };
};

const UNDO_MS = 5 * 60 * 1000;

function mapTeam(members: BusinessTeamMember[]): TeamDraft[] {
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    name_style: parseTextStyle(m.name_style),
    role_style: parseTextStyle(m.role_style),
    image: m.image,
  }));
}

function makeBannerUndo(prev: BannerUndoSnap["previous"]): BannerUndoSnap {
  return {
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + UNDO_MS).toISOString(),
    previous: prev,
  };
}

function AdminBusinessesPage() {
  const qc = useQueryClient();
  const { data: hub, isLoading: hubLoading } = useQuery<BusinessHub>({
    queryKey: ["admin", "business-hub"],
    queryFn: () => apiFetch<BusinessHub>("/business-hub/"),
  });
  const { data: businesses, isLoading: bizLoading } = useQuery<BusinessListItem[]>({
    queryKey: ["admin", "businesses"],
    queryFn: () => apiFetch<BusinessListItem[]>("/businesses/"),
  });

  const [tab, setTab] = useState<"overview" | string>("overview");
  const [hubForm, setHubForm] = useState<Partial<BusinessHub>>({});
  const [overviewFile, setOverviewFile] = useState<File | null>(null);
  const [hubBannerFiles, setHubBannerFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [selectedHubSection, setSelectedHubSection] = useState<"banner" | "overview" | "businesses" | null>(null);
  const [editingHubSection, setEditingHubSection] = useState<"banner" | null>(null);
  const [bannerUndo, setBannerUndo] = useState<BannerUndoSnap | null>(null);
  const [undoTick, setUndoTick] = useState(0);

  useEffect(() => {
    if (hub) setHubForm(hub);
  }, [hub?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setUndoTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (bannerUndo && undoExpiresInMs(bannerUndo.expires_at) <= 0) {
      setBannerUndo(null);
    }
  }, [undoTick, bannerUndo]);

  async function saveHub() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        banner_subtitle: hubForm.banner_subtitle ?? "",
        banner_title: hubForm.banner_title ?? "",
        banner_body: hubForm.banner_body ?? "",
        banner_fields: hubForm.banner_fields ?? {},
        overview_title: hubForm.overview_title ?? "",
        overview_subtitle: hubForm.overview_subtitle ?? "",
        overview_html: hubForm.overview_html ?? "",
        businesses_title: hubForm.businesses_title ?? "",
        businesses_subtitle: hubForm.businesses_subtitle ?? "",
      };
      await apiFetch("/business-hub/save/", { method: "PATCH", body });
      if (overviewFile) {
        const fd = new FormData();
        fd.append("overview_image", overviewFile);
        await apiFetch("/business-hub/save/", { method: "PATCH", body: fd });
      }
      setOverviewFile(null);
      await qc.invalidateQueries({ queryKey: ["admin", "business-hub"] });
      await refreshPublicContent(qc);
      toast.success("Overview saved");
    } catch (e: unknown) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function saveHubBanner() {
    if (!hub) return;
    setSavingBanner(true);
    const previous = {
      banner_subtitle: hub.banner_subtitle ?? "",
      banner_title: hub.banner_title ?? "",
      banner_body: hub.banner_body ?? "",
      banner_fields: { ...(hub.banner_fields ?? {}) },
      image_ids: (hub.banner_images ?? []).map((img) => img.id),
    };
    try {
      const body: Record<string, unknown> = {
        banner_subtitle: hubForm.banner_subtitle ?? "",
        banner_title: hubForm.banner_title ?? "",
        banner_body: hubForm.banner_body ?? "",
        banner_fields: hubForm.banner_fields ?? {},
      };
      await apiFetch("/business-hub/save/", { method: "PATCH", body });
      if (hubBannerFiles.length) {
        const fd = new FormData();
        hubBannerFiles.forEach((f) => fd.append("images", f));
        await apiFetch("/business-hub/banner-images/", { method: "POST", body: fd });
      }
      setHubBannerFiles([]);
      setBannerUndo(makeBannerUndo(previous));
      setEditingHubSection(null);
      await qc.invalidateQueries({ queryKey: ["admin", "business-hub"] });
      await refreshPublicContent(qc);
      toast.success("Banner saved");
    } catch (e: unknown) {
      toast.error("Banner save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSavingBanner(false);
    }
  }

  async function undoHubBanner() {
    if (!bannerUndo || !hub) return;
    const { previous } = bannerUndo;
    try {
      await apiFetch("/business-hub/save/", {
        method: "PATCH",
        body: {
          banner_subtitle: previous.banner_subtitle,
          banner_title: previous.banner_title,
          banner_body: previous.banner_body,
          banner_fields: previous.banner_fields,
        },
      });
      const liveIds = (hub.banner_images ?? []).map((img) => img.id);
      for (const id of liveIds) {
        if (!previous.image_ids.includes(id)) {
          await apiFetch(`/business-hub/banner-images/${id}/`, { method: "DELETE" });
        }
      }
      setBannerUndo(null);
      setEditingHubSection(null);
      await qc.invalidateQueries({ queryKey: ["admin", "business-hub"] });
      await refreshPublicContent(qc);
      toast.success("Banner undone");
    } catch (e: unknown) {
      toast.error("Undo failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function removeHubBanner(id: number) {
    try {
      await apiFetch(`/business-hub/banner-images/${id}/`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["admin", "business-hub"] });
      await refreshPublicContent(qc);
      toast.success("Banner removed");
    } catch (e: unknown) {
      toast.error("Remove failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const isLoading = hubLoading || bizLoading;
  const hubBannerUndoLive = bannerUndo && undoExpiresInMs(bannerUndo.expires_at) > 0 ? bannerUndo : null;

  const bannerActions: SectionAction[] = [];
  if (selectedHubSection === "banner" && editingHubSection !== "banner") {
    bannerActions.push({
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: (e) => {
        e.stopPropagation();
        setEditingHubSection("banner");
      },
    });
    if (hubBannerUndoLive) {
      bannerActions.push({
        key: "undo",
        label: "Undo",
        icon: Undo2,
        tone: "accent",
        onClick: (e) => {
          e.stopPropagation();
          void undoHubBanner();
        },
      });
    }
  }

  return (
    <AdminShell title="Our Businesses" description="Manage overview page and individual business pages">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
              Overview
            </TabBtn>
            {businesses?.map((b) => (
              <TabBtn key={b.slug} active={tab === b.slug} onClick={() => setTab(b.slug)}>
                {b.name}
              </TabBtn>
            ))}
          </div>

          {tab === "overview" && hub && (
            <div className="max-w-3xl space-y-5">
              <SelectableSection
                title="Banner"
                hint="Click section, then Edit to change images and text. Undo available for 5 minutes after save."
                selected={selectedHubSection === "banner"}
                onSelect={() => {
                  setSelectedHubSection("banner");
                }}
                actions={bannerActions}
              >
                <div className="flex flex-wrap gap-3">
                  {(hub.banner_images ?? []).map((img) => (
                    <div key={img.id} className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
                      {img.image && <img src={mediaUrl(img.image)} alt="" className="h-full w-full object-cover" />}
                      {editingHubSection === "banner" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeHubBanner(img.id);
                          }}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editingHubSection === "banner" &&
                    hubBannerFiles.map((f, i) => (
                      <div key={i} className="relative h-24 w-36 overflow-hidden rounded-xl border border-dashed border-primary/40">
                        <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                </div>
                {editingHubSection === "banner" ? (
                  <div className="grid gap-4" onClick={(e) => e.stopPropagation()}>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent w-fit">
                      <ImagePlus className="h-4 w-4" /> Add banner images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => setHubBannerFiles((p) => [...p, ...Array.from(e.target.files ?? [])])}
                      />
                    </label>
                    <Field label="Banner subtitle" value={hubForm.banner_subtitle ?? ""} onChange={(v) => setHubForm({ ...hubForm, banner_subtitle: v })} />
                    <Field label="Banner title" value={hubForm.banner_title ?? ""} onChange={(v) => setHubForm({ ...hubForm, banner_title: v })} />
                    <Field label="Banner body" value={hubForm.banner_body ?? ""} onChange={(v) => setHubForm({ ...hubForm, banner_body: v })} multiline />
                    <ToggleRow
                      label="Show subtitle"
                      value={(hubForm.banner_fields?.subtitle as boolean | undefined) !== false}
                      onChange={(value) => setHubForm({ ...hubForm, banner_fields: { ...(hubForm.banner_fields ?? {}), subtitle: value } })}
                    />
                    <ToggleRow
                      label="Show title"
                      value={(hubForm.banner_fields?.title as boolean | undefined) !== false}
                      onChange={(value) => setHubForm({ ...hubForm, banner_fields: { ...(hubForm.banner_fields ?? {}), title: value } })}
                    />
                    <ToggleRow
                      label="Show body"
                      value={(hubForm.banner_fields?.body as boolean | undefined) !== false}
                      onChange={(value) => setHubForm({ ...hubForm, banner_fields: { ...(hubForm.banner_fields ?? {}), body: value } })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingBanner}
                        onClick={() => void saveHubBanner()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        {savingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save banner
                      </button>
                      <button
                        type="button"
                        disabled={savingBanner}
                        onClick={() => {
                          setEditingHubSection(null);
                          setHubBannerFiles([]);
                          if (hub) setHubForm(hub);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {(hub.banner_images ?? []).length
                      ? `${hub.banner_images.length} banner image(s). Click Edit to change.`
                      : "No banner images yet. Click Edit to add."}
                  </p>
                )}
              </SelectableSection>

              <Section title="Overview section">
                <Field label="Title" value={hubForm.overview_title ?? ""} onChange={(v) => setHubForm({ ...hubForm, overview_title: v })} />
                <Field label="Subtitle" value={hubForm.overview_subtitle ?? ""} onChange={(v) => setHubForm({ ...hubForm, overview_subtitle: v })} />
                <RichTextEditor label="Overview description" value={hubForm.overview_html ?? ""} onChange={(v) => setHubForm({ ...hubForm, overview_html: v })} />
                <ImageField
                  label="Overview image"
                  preview={overviewFile ? URL.createObjectURL(overviewFile) : hub.overview_image ? mediaUrl(hub.overview_image) : null}
                  onChange={setOverviewFile}
                />
                <ToggleRow
                  label="Show section on frontend"
                  value={(hubForm.banner_fields?.overview as boolean | undefined) !== false}
                  onChange={(value) => setHubForm({ ...hubForm, banner_fields: { ...(hubForm.banner_fields ?? {}), overview: value } })}
                />
              </Section>

              <Section title="Our Businesses section heading">
                <Field label="Section title" value={hubForm.businesses_title ?? ""} onChange={(v) => setHubForm({ ...hubForm, businesses_title: v })} />
                <Field label="Section subtitle" value={hubForm.businesses_subtitle ?? ""} onChange={(v) => setHubForm({ ...hubForm, businesses_subtitle: v })} />
                <ToggleRow
                  label="Show section on frontend"
                  value={(hubForm.banner_fields?.businesses as boolean | undefined) !== false}
                  onChange={(value) => setHubForm({ ...hubForm, banner_fields: { ...(hubForm.banner_fields ?? {}), businesses: value } })}
                />
                <p className="text-xs text-muted-foreground">Business cards are managed in each business tab below.</p>
              </Section>

              <SaveBtn saving={saving} onClick={() => void saveHub()} />
            </div>
          )}

          {tab !== "overview" && (
            <BusinessEditor slug={tab} qc={qc} />
          )}
        </div>
      )}
    </AdminShell>
  );
}

function BusinessEditor({ slug, qc }: { slug: string; qc: ReturnType<typeof useQueryClient> }) {
  const { data: business, isLoading } = useQuery<BusinessDetail>({
    queryKey: ["admin", "business", slug],
    queryFn: () => apiFetch<BusinessDetail>(`/businesses/${slug}/`),
  });
  const [form, setForm] = useState<Partial<BusinessDetail>>({});
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bgFiles, setBgFiles] = useState<File[]>([]);
  const [invFiles, setInvFiles] = useState<File[]>([]);
  const [ovFiles, setOvFiles] = useState<File[]>([]);
  const [team, setTeam] = useState<TeamDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingTeamIdx, setSavingTeamIdx] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<"banner" | null>(null);
  const [editingSection, setEditingSection] = useState<"banner" | null>(null);
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number | null>(null);
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
  const [bannerUndo, setBannerUndo] = useState<BannerUndoSnap | null>(null);
  const [undoTick, setUndoTick] = useState(0);

  useEffect(() => {
    if (business) {
      setForm({
        ...business,
        why_us: Array.isArray(business.why_us) && business.why_us.length ? business.why_us : [""],
      });
    }
  }, [business?.updated_at, business?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync team list from server only when not mid-edit/save/delete
  useEffect(() => {
    if (!business) return;
    if (editingTeamIdx !== null || savingTeamIdx !== null || deletingTeamId !== null) return;
    setTeam(mapTeam(business.team_members ?? []));
  }, [
    business?.updated_at,
    business?.slug,
    (business?.team_members ?? []).map((m) => `${m.id}:${m.name}:${m.role}:${m.image ?? ""}`).join("|"),
    editingTeamIdx,
    savingTeamIdx,
    deletingTeamId,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setUndoTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (bannerUndo && undoExpiresInMs(bannerUndo.expires_at) <= 0) {
      setBannerUndo(null);
    }
  }, [undoTick, bannerUndo]);

  async function saveBusiness() {
    if (!business) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name ?? "",
        short_description: form.short_description ?? "",
        icon_key: form.icon_key ?? "Building2",
        accent_color: form.accent_color ?? "#0ea5e9",
        banner_subtitle: form.banner_subtitle ?? "",
        banner_title: form.banner_title ?? "",
        banner_body: form.banner_body ?? "",
        background_html: form.background_html ?? "",
        investment_history_html: form.investment_history_html ?? "",
        overview_html: form.overview_html ?? "",
        why_us: (Array.isArray(form.why_us) ? form.why_us : []).map((s) => String(s).trim()).filter(Boolean),
        section_meta: form.section_meta ?? {},
        is_active: form.is_active ?? true,
      };
      await apiFetch(`/businesses/${slug}/`, { method: "PATCH", body });
      if (cardFile) {
        const fd = new FormData();
        fd.append("card_image", cardFile);
        await apiFetch(`/businesses/${slug}/`, { method: "PATCH", body: fd });
      }
      if (bgFiles.length) {
        const fd = new FormData();
        bgFiles.forEach((f) => fd.append("images", f));
        await apiFetch(`/businesses/${slug}/gallery/background/`, { method: "POST", body: fd });
      }
      if (invFiles.length) {
        const fd = new FormData();
        invFiles.forEach((f) => fd.append("images", f));
        await apiFetch(`/businesses/${slug}/gallery/investment/`, { method: "POST", body: fd });
      }
      if (ovFiles.length) {
        const fd = new FormData();
        ovFiles.forEach((f) => fd.append("images", f));
        await apiFetch(`/businesses/${slug}/gallery/overview/`, { method: "POST", body: fd });
      }
      setCardFile(null);
      setBgFiles([]);
      setInvFiles([]);
      setOvFiles([]);
      await qc.invalidateQueries({ queryKey: ["admin", "business", slug] });
      await qc.invalidateQueries({ queryKey: ["admin", "businesses"] });
      await refreshPublicContent(qc);
      toast.success("Business saved");
    } catch (e: unknown) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function saveBusinessBanner() {
    if (!business) return;
    setSavingBanner(true);
    const previous = {
      banner_subtitle: business.banner_subtitle ?? "",
      banner_title: business.banner_title ?? "",
      banner_body: business.banner_body ?? "",
      banner_fields: { ...((form.section_meta as any)?.banner_fields ?? {}) },
      image_ids: (business.banner_images ?? []).map((img) => img.id),
    };
    try {
      const body: Record<string, unknown> = {
        banner_subtitle: form.banner_subtitle ?? "",
        banner_title: form.banner_title ?? "",
        banner_body: form.banner_body ?? "",
        section_meta: form.section_meta ?? {},
      };
      await apiFetch(`/businesses/${slug}/`, { method: "PATCH", body });
      if (bannerFiles.length) {
        const fd = new FormData();
        bannerFiles.forEach((f) => fd.append("images", f));
        await apiFetch(`/businesses/${slug}/banner-images/`, { method: "POST", body: fd });
      }
      setBannerFiles([]);
      setBannerUndo(makeBannerUndo(previous));
      setEditingSection(null);
      await qc.invalidateQueries({ queryKey: ["admin", "business", slug] });
      await refreshPublicContent(qc);
      toast.success("Banner saved");
    } catch (e: unknown) {
      toast.error("Banner save failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSavingBanner(false);
    }
  }

  async function undoBusinessBanner() {
    if (!bannerUndo || !business) return;
    const { previous } = bannerUndo;
    try {
      const sectionMeta = { ...(form.section_meta ?? {}), banner_fields: previous.banner_fields };
      await apiFetch(`/businesses/${slug}/`, {
        method: "PATCH",
        body: {
          banner_subtitle: previous.banner_subtitle,
          banner_title: previous.banner_title,
          banner_body: previous.banner_body,
          section_meta: sectionMeta,
        },
      });
      const liveIds = (business.banner_images ?? []).map((img) => img.id);
      for (const id of liveIds) {
        if (!previous.image_ids.includes(id)) {
          await apiFetch(`/businesses/${slug}/banner-images/${id}/`, { method: "DELETE" });
        }
      }
      setBannerUndo(null);
      setEditingSection(null);
      await qc.invalidateQueries({ queryKey: ["admin", "business", slug] });
      await refreshPublicContent(qc);
      toast.success("Banner undone");
    } catch (e: unknown) {
      toast.error("Undo failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function removeBanner(id: number) {
    await apiFetch(`/businesses/${slug}/banner-images/${id}/`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["admin", "business", slug] });
    await refreshPublicContent(qc);
  }

  async function removeGallery(section: "background" | "investment" | "overview", id: number) {
    const updated = await apiFetch<BusinessDetail>(
      `/businesses/${slug}/gallery/${section}/${id}/`,
      { method: "DELETE" },
    );
    qc.setQueryData(["admin", "business", slug], updated);
    await qc.invalidateQueries({ queryKey: ["admin", "business", slug] });
    await refreshPublicContent(qc);
  }

  async function saveTeamMember(index: number) {
    const member = team[index];
    if (!member) return;
    const name = member.name.trim();
    const role = member.role.trim();
    const hasImage = Boolean(member.file || member.image);
    if (!name || !role || !hasImage) {
      toast.error("Name, role, and image are required");
      return;
    }

    setSavingTeamIdx(index);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("role", role);
      fd.append("name_style", JSON.stringify(member.name_style));
      fd.append("role_style", JSON.stringify(member.role_style));
      if (member.file) fd.append("image", member.file);

      const updated = member.id
        ? await apiFetch<BusinessDetail>(`/businesses/${slug}/team/${member.id}/`, { method: "PATCH", body: fd })
        : await apiFetch<BusinessDetail>(`/businesses/${slug}/team/`, { method: "POST", body: fd });

      const nextTeam = mapTeam(updated.team_members ?? []);
      qc.setQueryData(["admin", "business", slug], updated);
      setTeam(nextTeam);
      setEditingTeamIdx(null);
      setSelectedTeamIdx(null);
      setSavingTeamIdx(null);
      void refreshPublicContent(qc);
      toast.success(`Team member ${nextTeam.length} saved`);
    } catch (e: unknown) {
      setSavingTeamIdx(null);
      toast.error("Team save failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function deleteTeamMember(id: number, index: number) {
    setDeletingTeamId(id);
    setTeam((prev) => prev.filter((m) => m.id !== id));
    setSelectedTeamIdx(null);
    setEditingTeamIdx(null);
    try {
      const updated = await apiFetch<BusinessDetail>(`/businesses/${slug}/team/${id}/`, { method: "DELETE" });
      const nextTeam = mapTeam(updated.team_members ?? []);
      qc.setQueryData(["admin", "business", slug], updated);
      setTeam(nextTeam);
      setDeletingTeamId(null);
      void refreshPublicContent(qc);
      toast.success("Team member removed");
    } catch (e: unknown) {
      setDeletingTeamId(null);
      if (business) setTeam(mapTeam(business.team_members ?? []));
      setSelectedTeamIdx(index);
      toast.error("Delete failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  if (isLoading || !business) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  const bgImages = (business.gallery_images ?? []).filter((g) => g.section === "background");
  const invImages = (business.gallery_images ?? []).filter((g) => g.section === "investment");
  const ovImages = (business.gallery_images ?? []).filter((g) => g.section === "overview");

  const sectionMeta = (form.section_meta ?? {}) as Record<string, any>;
  const backgroundMeta = sectionMeta.background ?? { title: "Background", visible: true };
  const investmentMeta = sectionMeta.investment ?? { title: "Investment History", visible: true };
  const overviewMeta = sectionMeta.overview ?? { title: "Overview", visible: true };
  const teamMeta = sectionMeta.team ?? { title: "Team", visible: true };
  const bannerUndoLive = bannerUndo && undoExpiresInMs(bannerUndo.expires_at) > 0 ? bannerUndo : null;

  const bannerActions: SectionAction[] = [];
  if (selectedSection === "banner" && editingSection !== "banner") {
    bannerActions.push({
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: (e) => {
        e.stopPropagation();
        setEditingSection("banner");
      },
    });
    if (bannerUndoLive) {
      bannerActions.push({
        key: "undo",
        label: "Undo",
        icon: Undo2,
        tone: "accent",
        onClick: (e) => {
          e.stopPropagation();
          void undoBusinessBanner();
        },
      });
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Section title="Card on overview page">
        <Field label="Business name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Short description (card)" value={form.short_description ?? ""} onChange={(v) => setForm({ ...form, short_description: v })} multiline />
        <Field
          label="Overview icon key (Building2, Fuel, Package, Ship, Store, Truck)"
          value={form.icon_key ?? "Building2"}
          onChange={(v) => setForm({ ...form, icon_key: v })}
        />
        <label className="block space-y-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Accent color (About “consists of”)</span>
          <input
            type="color"
            className="h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-2"
            value={form.accent_color || "#0ea5e9"}
            onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
          />
        </label>
        <ImageField
          label="Card image"
          preview={cardFile ? URL.createObjectURL(cardFile) : form.card_image ? mediaUrl(form.card_image) : null}
          onChange={setCardFile}
        />
      </Section>

      <SelectableSection
        title="Page banner"
        hint="Click section, then Edit. Undo available for 5 minutes after save."
        selected={selectedSection === "banner"}
        onSelect={() => setSelectedSection("banner")}
        actions={bannerActions}
      >
        <GalleryThumbs
          images={business.banner_images ?? []}
          onRemove={editingSection === "banner" ? (id) => void removeBanner(id) : undefined}
        />
        {editingSection === "banner" ? (
          <div className="grid gap-4" onClick={(e) => e.stopPropagation()}>
            <FileAdd label="Add banner images" files={bannerFiles} onAdd={setBannerFiles} />
            <Field label="Banner subtitle" value={form.banner_subtitle ?? ""} onChange={(v) => setForm({ ...form, banner_subtitle: v })} />
            <Field label="Banner title" value={form.banner_title ?? ""} onChange={(v) => setForm({ ...form, banner_title: v })} />
            <Field label="Banner body" value={form.banner_body ?? ""} onChange={(v) => setForm({ ...form, banner_body: v })} multiline />
            <ToggleRow
              label="Show subtitle"
              value={(sectionMeta.banner_fields?.subtitle as boolean | undefined) !== false}
              onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, banner_fields: { ...(sectionMeta.banner_fields ?? {}), subtitle: value } } })}
            />
            <ToggleRow
              label="Show title"
              value={(sectionMeta.banner_fields?.title as boolean | undefined) !== false}
              onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, banner_fields: { ...(sectionMeta.banner_fields ?? {}), title: value } } })}
            />
            <ToggleRow
              label="Show body"
              value={(sectionMeta.banner_fields?.body as boolean | undefined) !== false}
              onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, banner_fields: { ...(sectionMeta.banner_fields ?? {}), body: value } } })}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingBanner}
                onClick={() => void saveBusinessBanner()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {savingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save banner
              </button>
              <button
                type="button"
                disabled={savingBanner}
                onClick={() => {
                  setEditingSection(null);
                  setBannerFiles([]);
                  setForm(business);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {(business.banner_images ?? []).length
              ? `${business.banner_images.length} banner image(s). Click Edit to change.`
              : "No banner images yet. Click Edit to add."}
          </p>
        )}
      </SelectableSection>

      <Section title="Background section">
        <Field
          label="Section name"
          value={backgroundMeta.title}
          onChange={(v) => setForm({ ...form, section_meta: { ...sectionMeta, background: { ...backgroundMeta, title: v } } })}
        />
        <ToggleRow
          label="Show section on frontend"
          value={backgroundMeta.visible !== false}
          onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, background: { ...backgroundMeta, visible: value } } })}
        />
        <RichTextEditor label="Background description" value={form.background_html ?? ""} onChange={(v) => setForm({ ...form, background_html: v })} />
        <GalleryThumbs images={bgImages} onRemove={(id) => void removeGallery("background", id)} />
        <FileAdd label="Add background images" files={bgFiles} onAdd={setBgFiles} />
      </Section>

      <Section title="Investment History" hint="Shown below Background on the public business page">
        <Field
          label="Section name"
          value={investmentMeta.title}
          onChange={(v) => setForm({ ...form, section_meta: { ...sectionMeta, investment: { ...investmentMeta, title: v } } })}
        />
        <ToggleRow
          label="Show section on frontend"
          value={investmentMeta.visible !== false}
          onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, investment: { ...investmentMeta, visible: value } } })}
        />
        <RichTextEditor
          label="Investment history description"
          value={form.investment_history_html ?? ""}
          onChange={(v) => setForm({ ...form, investment_history_html: v })}
        />
        <GalleryThumbs images={invImages} onRemove={(id) => void removeGallery("investment", id)} />
        <FileAdd label="Add investment images" files={invFiles} onAdd={setInvFiles} />
      </Section>

      <Section title="Overview section">
        <Field
          label="Section name"
          value={overviewMeta.title}
          onChange={(v) => setForm({ ...form, section_meta: { ...sectionMeta, overview: { ...overviewMeta, title: v } } })}
        />
        <ToggleRow
          label="Show section on frontend"
          value={overviewMeta.visible !== false}
          onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, overview: { ...overviewMeta, visible: value } } })}
        />
        <RichTextEditor label="Overview description" value={form.overview_html ?? ""} onChange={(v) => setForm({ ...form, overview_html: v })} />
        <GalleryThumbs images={ovImages} onRemove={(id) => void removeGallery("overview", id)} />
        <FileAdd label="Add overview images" files={ovFiles} onAdd={setOvFiles} />
      </Section>

      <Section title="Why choose us" hint="Shown at the bottom of this business page (next to Location)">
        <ToggleRow
          label="Show section on frontend"
          value={(sectionMeta.why_us?.visible as boolean | undefined) !== false}
          onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, why_us: { ...(sectionMeta.why_us ?? {}), visible: value } } })}
        />
        {(Array.isArray(form.why_us) ? form.why_us : [""]).map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...(Array.isArray(form.why_us) ? form.why_us : [""])];
                next[i] = e.target.value;
                setForm({ ...form, why_us: next });
              }}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
              placeholder={`Reason ${i + 1}`}
            />
            <button
              type="button"
              disabled={(form.why_us ?? []).length <= 1}
              onClick={() =>
                setForm({
                  ...form,
                  why_us: (form.why_us ?? []).filter((_, idx) => idx !== i),
                })
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setForm({ ...form, why_us: [...(form.why_us ?? []), ""] })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Add reason
        </button>
        <p className="text-xs text-muted-foreground">
          Location / map for this business is edited in Admin → Site Info → Business locations.
        </p>
      </Section>

      <Section title="Team members" hint="Shown 4 per row on the public page. Name, role, and image are required.">
        <Field
          label="Section name"
          value={teamMeta.title}
          onChange={(v) => setForm({ ...form, section_meta: { ...sectionMeta, team: { ...teamMeta, title: v } } })}
        />
        <ToggleRow
          label="Show section on frontend"
          value={teamMeta.visible !== false}
          onChange={(value) => setForm({ ...form, section_meta: { ...sectionMeta, team: { ...teamMeta, visible: value } } })}
        />
        {team.map((member, i) => (
          <div
            key={member.id ?? `new-${i}`}
            className={`relative space-y-3 rounded-xl border bg-muted/30 p-4 ${selectedTeamIdx === i || editingTeamIdx === i ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (editingTeamIdx === i) return;
              setSelectedTeamIdx(i);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (editingTeamIdx !== i) setSelectedTeamIdx(i);
              }
            }}
          >
            {selectedTeamIdx === i && editingTeamIdx !== i && (
              <SectionActionBar
                actions={[
                  {
                    key: "edit",
                    label: "Edit",
                    icon: Pencil,
                    onClick: (e) => {
                      e.stopPropagation();
                      setEditingTeamIdx(i);
                    },
                  },
                  ...(member.id
                    ? [{
                        key: "delete",
                        label: "Delete",
                        icon: Trash2,
                        tone: "danger" as const,
                        loading: deletingTeamId === member.id,
                        disabled: deletingTeamId === member.id,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          void deleteTeamMember(member.id!, i);
                        },
                      }]
                    : []),
                ]}
              />
            )}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Member {i + 1}</h4>
              {editingTeamIdx === i && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!member.id) {
                      setTeam((t) => t.filter((_, idx) => idx !== i));
                      setEditingTeamIdx(null);
                      setSelectedTeamIdx(null);
                    } else {
                      setEditingTeamIdx(null);
                      if (business) setTeam(mapTeam(business.team_members ?? []));
                    }
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {editingTeamIdx === i ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <ImageField
                  label="Photo (required)"
                  preview={member.file ? URL.createObjectURL(member.file) : member.image ? mediaUrl(member.image) : null}
                  onChange={(f) => setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, file: f } : m)))}
                />
                <StyledFieldEditor
                  label="Name (required)"
                  value={member.name}
                  onChange={(v) => setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, name: v } : m)))}
                  style={member.name_style}
                  onStyleChange={(s) => setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, name_style: s } : m)))}
                />
                <StyledFieldEditor
                  label="Role (required)"
                  value={member.role}
                  onChange={(v) => setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, role: v } : m)))}
                  style={member.role_style}
                  onStyleChange={(s) => setTeam((t) => t.map((m, idx) => (idx === i ? { ...m, role_style: s } : m)))}
                />
                <button
                  type="button"
                  disabled={savingTeamIdx === i}
                  onClick={() => void saveTeamMember(i)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {savingTeamIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save member
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {member.image && (
                  <img src={mediaUrl(member.image)} alt="" className="h-12 w-12 rounded-full object-cover border border-border" />
                )}
                <div>
                  <p className="font-medium text-foreground">{member.name || "Unnamed"}</p>
                  <p>{member.role || "No role"}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const newIdx = team.length;
            setTeam((t) => [...t, { name: "", role: "", name_style: {}, role_style: {} }]);
            setSelectedTeamIdx(newIdx);
            setEditingTeamIdx(newIdx);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Add team member
        </button>
      </Section>

      <SaveBtn saving={saving} onClick={() => void saveBusiness()} />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground shadow" : "border border-border hover:bg-accent"}`}
    >
      {children}
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function SelectableSection({
  title,
  hint,
  children,
  selected,
  onSelect,
  actions,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  actions: SectionAction[];
}) {
  return (
    <div className="relative pt-4">
      {actions.length > 0 && <SectionActionBar actions={actions} />}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`rounded-2xl border bg-background p-6 transition-shadow outline-none ${selected ? "border-primary shadow-md ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60" />
      )}
    </div>
  );
}

function ImageField({ label, preview, onChange }: { label: string; preview: string | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {preview && <img src={preview} alt="" className="mb-2 h-40 w-full max-w-sm rounded-xl border border-border object-cover" />}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
        <ImagePlus className="h-4 w-4" /> Change image
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

function GalleryThumbs({
  images,
  onRemove,
}: {
  images: { id: number; image: string | null }[];
  onRemove?: (id: number) => void;
}) {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img) => (
        <div key={img.id} className="relative h-24 w-36 overflow-hidden rounded-xl border border-border">
          {img.image && <img src={mediaUrl(img.image)} alt="" className="h-full w-full object-cover" />}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(img.id);
              }}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive shadow"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function FileAdd({ label, files, onAdd }: { label: string; files: File[]; onAdd: (files: File[]) => void }) {
  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="h-20 w-28 overflow-hidden rounded-lg border border-dashed border-primary/40">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-accent">
        <ImagePlus className="h-4 w-4" /> {label}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onAdd([...files, ...Array.from(e.target.files ?? [])])}
        />
      </label>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Saving…" : "Save"}
    </button>
  );
}
