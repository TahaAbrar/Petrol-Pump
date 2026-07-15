import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch, type SiteSettings } from "@/lib/api";
import { refreshPublicContent } from "@/lib/content";

export const Route = createFileRoute("/admin/site")({
  head: () => ({ meta: [{ title: "Site Info — Admin" }] }),
  component: SitePage,
});

const TEXT_FIELDS: { key: keyof SiteSettings; label: string; full?: boolean; multiline?: boolean }[] = [
  { key: "name", label: "Station name" },
  { key: "tagline", label: "Tagline" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address", full: true },
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
  const [form, setForm] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: Partial<SiteSettings>) => {
      const { logo: _logo, ...rest } = body;
      return apiFetch<SiteSettings>("/site/", { method: "PATCH", body: rest });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "site"] });
      await refreshPublicContent(qc);
      toast.success("Site info saved");
    },
    onError: (e: any) => toast.error("Save failed", { description: e?.message }),
  });

  const mapsQuery = (form.maps_query as string) ?? "";

  return (
    <AdminShell title="Site Info" description="Contact details, map location and socials">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="max-w-3xl space-y-5"
        >
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
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Map location</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Set the address shown on the site and the Google Maps pin. Use a place name or coordinates
              (e.g. <code className="rounded bg-muted px-1">28.6139,77.2090</code> or{" "}
              <code className="rounded bg-muted px-1">Total+Fuel+Station+Mumbai</code>).
            </p>
            <div className="space-y-4">
              <Field
                label="Map search / pin location"
                value={mapsQuery}
                onChange={(v) => setForm((s) => ({ ...s, maps_query: v }))}
                placeholder="Total+Fuel+Station+Mumbai"
              />
              {mapsQuery.trim() && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <iframe
                    title="Map preview"
                    className="aspect-[16/10] w-full"
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery.trim())}&output=embed`}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </div>
  );
}
