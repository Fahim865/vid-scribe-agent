import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Plus, Star, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { providerCatalog, type ProviderCategory } from "@/data/mock";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "AI Providers & API Keys — ReelPilot" },
      { name: "description", content: "Bring your own API keys for video, voice, script and music providers, or plug in any custom endpoint." },
      { property: "og:title", content: "AI Providers & API Keys — ReelPilot" },
      { property: "og:description", content: "Use your own AI accounts — including any custom OpenAI-compatible endpoint." },
    ],
  }),
  component: ProvidersPage,
});

const categories = Object.keys(providerCatalog) as ProviderCategory[];

function ProvidersPage() {
  const { providerKeys, setProviderKeys } = useStore();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProviderCategory>("video");
  const [provider, setProvider] = useState("Runway");
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [headers, setHeaders] = useState("");

  const isCustom = provider === "Custom endpoint";

  function addKey() {
    if (!secret.trim()) {
      toast.error("Paste an API key first");
      return;
    }
    setProviderKeys((keys) => [
      ...keys,
      {
        id: crypto.randomUUID(),
        category,
        provider: isCustom ? label || "Custom endpoint" : provider,
        label: label || `${provider} key`,
        maskedKey: `${secret.slice(0, 3)}••••••••${secret.slice(-4)}`,
        status: "active",
        lastUsed: "never",
        isDefault: !keys.some((k) => k.category === category && k.isDefault),
        ...(isCustom && endpoint ? { endpoint } : {}),
        usage: 0,
        quota: 500,
      },
    ]);
    toast.success("API key added");
    setOpen(false);
    setLabel("");
    setSecret("");
    setEndpoint("");
    setHeaders("");
  }

  return (
    <AppShell
      title="AI Providers"
      subtitle="Bring your own keys — nothing runs on someone else's account"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent text-primary-foreground">
              <Plus className="mr-2 size-4" /> Add key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add an API key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    const c = v as ProviderCategory;
                    setCategory(c);
                    setProvider(providerCatalog[c].options[0] ?? "Custom endpoint");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {providerCatalog[c].title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerCatalog[category].options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main script key" />
              </div>
              {isCustom ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headers">Extra headers (optional)</Label>
                    <Input
                      id="headers"
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      placeholder="X-Org-Id: 1234"
                    />
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="secret">API key</Label>
                <Input id="secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="sk-…" />
                <p className="text-xs text-muted-foreground">
                  Stored locally in this demo. Once the backend is connected, keys are encrypted server-side.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => toast.success(secret ? "Connection test passed" : "Add a key to test")}
              >
                <Wand2 className="mr-2 size-4" /> Test connection
              </Button>
              <Button className="gradient-accent text-primary-foreground" onClick={addKey}>
                Save key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((c) => {
          const keys = providerKeys.filter((k) => k.category === c);
          return (
            <GlassCard key={c}>
              <SectionTitle title={providerCatalog[c].title} />
              <p className="-mt-2 mb-4 text-sm text-muted-foreground">{providerCatalog[c].description}</p>
              {keys.length === 0 ? (
                <EmptyState
                  icon={KeyRound}
                  title="No API keys yet"
                  description={`Add a ${providerCatalog[c].title.toLowerCase()} key to power this step.`}
                  ctaLabel="Add your first provider key"
                  onCta={() => {
                    setCategory(c);
                    setProvider(providerCatalog[c].options[0] ?? "Custom endpoint");
                    setOpen(true);
                  }}
                />
              ) : (
                <ul className="space-y-3">
                  {keys.map((k) => (
                    <li key={k.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium">
                            {k.provider}
                            {k.isDefault ? <Star className="size-3.5 fill-primary text-primary" /> : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {k.label} · {k.maskedKey} · used {k.lastUsed}
                          </p>
                          {k.endpoint ? <p className="text-xs text-muted-foreground">{k.endpoint}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={k.status} />
                          {!k.isDefault ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setProviderKeys((all) =>
                                  all.map((x) =>
                                    x.category === k.category ? { ...x, isDefault: x.id === k.id } : x,
                                  ),
                                )
                              }
                            >
                              Make default
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProviderKeys((all) => all.filter((x) => x.id !== k.id));
                              toast.success("Key removed");
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          );
        })}
      </div>
    </AppShell>
  );
}
