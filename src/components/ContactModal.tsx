import { useState } from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { useBusinesses, useSiteContent } from "@/lib/content";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContactModal({ open, onOpenChange }: Props) {
  const { data: site } = useSiteContent();
  const { data: businesses } = useBusinesses();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const list = (businesses ?? []).filter((b) => b.is_active !== false);
  const contactEmail = (site?.email || "").trim();

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setBusinessSlug("");
    setComment("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !businessSlug || !comment.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/contact/", {
        method: "POST",
        auth: false,
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          business_slug: businessSlug,
          comment: comment.trim(),
        },
      });
      toast.success("Message sent — we'll get back to you soon.");
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error("Could not send message", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border p-0 sm:rounded-2xl [&>button]:right-3 [&>button]:top-3">
        <div className="grid md:grid-cols-2">
          {/* Left — contact info */}
          <div className="border-b border-border bg-muted/40 p-6 md:border-b-0 md:border-r md:p-8">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl font-bold">Contact us</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Reach Sukka Group — email and business lines below.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-5">
              {contactEmail && (
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-0.5 block text-sm font-medium text-foreground hover:text-primary"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Business contacts
                </p>
                <ul className="space-y-3">
                  {list.map((b) => (
                    <li key={b.slug} className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{b.name}</p>
                        {(b.phone || "").trim() ? (
                          <a
                            href={`tel:${(b.phone || "").replace(/\s/g, "")}`}
                            className="mt-0.5 block text-sm text-muted-foreground hover:text-primary"
                          >
                            {b.phone}
                          </a>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground/70">Number coming soon</p>
                        )}
                      </div>
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className="text-sm text-muted-foreground">No businesses listed yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <form onSubmit={onSubmit} className="space-y-4 p-6 md:p-8" noValidate>
            <h3 className="text-base font-semibold">Send a message</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                required
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                required
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
              />
            </div>
            <Field
              label="Email address"
              required
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Nature of Enquiry <span className="text-brand-red">*</span>
              </label>
              <select
                required
                value={businessSlug}
                onChange={(e) => setBusinessSlug(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              >
                <option value="">Select a business</option>
                {list.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Comment <span className="text-brand-red">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-red/90 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      />
    </div>
  );
}
