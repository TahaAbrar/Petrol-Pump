import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, type BusinessListItem, type SiteSettings } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/site")({
  head: () => ({ meta: [{ title: "Site Info — Admin" }] }),
  component: SitePage,
});

type FaqDraft = { question: string; answer: string };
type BizLoc = { slug: string; name: string; address: string; maps_query: string; phone: string };

const TEXT_FIELDS: { key: keyof SiteSettings; label: string; full?: boolean }[] = [
  { key: "name", label: "Station name" },
  { key: "tagline", label: "Tagline" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "hours", label: "Opening hours" },
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "twitter", label: "Twitter URL" },
  { key: "linkedin", label: "LinkedIn URL" },
];

function SitePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: ["admin", "site"],
    queryFn: () => apiFetch<SiteSettings>("/site/"),
  });
  const { data: businesses, isLoading: bizLoading } = useQuery<BusinessListItem[]>({
    queryKey: ["admin", "businesses"],
    queryFn: () => apiFetch<BusinessListItem[]>("/businesses/"),
  });

  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [faqs, setFaqs] = useState<FaqDraft[]>([]);
  const [bizLocs, setBizLocs] = useState<BizLoc[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setFaqs(
        Array.isArray(data.faqs) && data.faqs.length
          ? data.faqs.map((f) => ({ question: f.question ?? "", answer: f.answer ?? "" }))
          : [{ question: "", answer: "" }],
      );
    }
  }, [data]);

  useEffect(() => {
    if (businesses) {
      setBizLocs(
        businesses.map((b) => ({
          slug: b.slug,
          name: b.name,
          address: b.address ?? "",
          maps_query: b.maps_query ?? "",
          phone: b.phone ?? "",
        })),
      );
    }
  }, [businesses]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { logo: _logo, ...rest } = form;
      await apiFetch<SiteSettings>("/site/", {
        method: "PATCH",
        body: {
          ...rest,
          footer_description: form.footer_description ?? "",
          faqs: faqs
            .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
            .filter((f) => f.question && f.answer),
        },
      });
      for (const b of bizLocs) {
        await apiFetch(`/businesses/${b.slug}/`, {
          method: "PATCH",
          body: { address: b.address, maps_query: b.maps_query, phone: b.phone },
        });
      }
      await qc.invalidateQueries({ queryKey: ["admin", "site"] });
      await qc.invalidateQueries({ queryKey: ["admin", "businesses"] });
      await refreshPublicContent(qc);
      toast.success("Site info saved");
    } catch (err: unknown) {
      toast.error("Save failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  const loading = isLoading || bizLoading;

  return (
    <AdminShell title="Site Info" description="Contact, footer text, FAQs and per-business locations">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="max-w-3xl space-y-5">
          <div className="grid gap-4 rounded-2xl border border-border bg-background p-6 sm:grid-cols-2">
            {TEXT_FIELDS.map((f) => (
              <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <Field
                  label={f.label}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Field
                label="Footer description (under brand name)"
                value={(form.footer_description as string) ?? ""}
                onChange={(v) => setForm((s) => ({ ...s, footer_description: v }))}
                multiline
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Home FAQ</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Questions shown in the FAQ section on the home page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqs((f) => [...f, { question: "", answer: "" }])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add FAQ
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground">FAQ {i + 1}</h4>
                    <button
                      type="button"
                      disabled={faqs.length <= 1}
                      onClick={() => setFaqs((f) => f.filter((_, idx) => idx !== i))}
                      className="grid h-7 w-7 place-items-center rounded-full border border-border text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Field
                    label="Question"
                    value={faq.question}
                    onChange={(v) => setFaqs((f) => f.map((x, idx) => (idx === i ? { ...x, question: v } : x)))}
                  />
                  <Field
                    label="Answer"
                    value={faq.answer}
                    onChange={(v) => setFaqs((f) => f.map((x, idx) => (idx === i ? { ...x, answer: v } : x)))}
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Business locations</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Set address, contact phone, and Google Maps pin for each business. Phone numbers appear in the Contact popup.
            </p>
            <div className="space-y-5">
              {bizLocs.map((b, i) => (
                <div key={b.slug} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold">{b.name}</h4>
                  <Field
                    label="Contact phone"
                    value={b.phone}
                    onChange={(v) =>
                      setBizLocs((list) => list.map((x, idx) => (idx === i ? { ...x, phone: v } : x)))
                    }
                    placeholder="+92 300 1234567"
                  />
                  <Field
                    label="Address"
                    value={b.address}
                    onChange={(v) =>
                      setBizLocs((list) => list.map((x, idx) => (idx === i ? { ...x, address: v } : x)))
                    }
                  />
                  <Field
                    label="Map search / pin location"
                    value={b.maps_query}
                    onChange={(v) =>
                      setBizLocs((list) => list.map((x, idx) => (idx === i ? { ...x, maps_query: v } : x)))
                    }
                    placeholder="Place name or lat,lng"
                  />
                  {b.maps_query.trim() && (
                    <div className="overflow-hidden rounded-xl border border-border">
                      <iframe
                        title={`${b.name} map`}
                        className="aspect-[16/10] w-full"
                        loading="lazy"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(b.maps_query.trim())}&output=embed`}
                      />
                    </div>
                  )}
                </div>
              ))}
              {bizLocs.length === 0 && (
                <p className="text-sm text-muted-foreground">No businesses found yet.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </form>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
        />
      )}
    </div>
  );
}
