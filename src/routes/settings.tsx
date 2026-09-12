import { createFileRoute, Link } from "@tanstack/react-router";
import { Cable, Save, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, SectionTitle } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Agent Settings — ReelPilot" },
      { name: "description", content: "Set niche, brand tone, posting frequency, target platforms and choose Full Auto or Review Before Post." },
      { property: "og:title", content: "Agent Settings — ReelPilot" },
      { property: "og:description", content: "Tune how your autonomous content agent writes and publishes." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings, platforms } = useStore();
  const [draft, setDraft] = useState(settings);
  const available = platforms.filter((p) => p.status !== "disconnected");

  function togglePlatform(id: string) {
    setDraft((d) => ({
      ...d,
      platforms: d.platforms.includes(id) ? d.platforms.filter((p) => p !== id) : [...d.platforms, id],
    }));
  }

  function setSlot(i: number, value: string) {
    setDraft((d) => {
      const slots = [...d.timeSlots];
      slots[i] = value;
      return { ...d, timeSlots: slots };
    });
  }

  return (
    <AppShell
      title="Agent Settings"
      subtitle="Define what your agent makes and when it posts"
      actions={
        <Button
          className="gradient-accent text-primary-foreground"
          onClick={() => {
            updateSettings(draft);
            toast.success("Agent settings saved");
          }}
        >
          <Save className="mr-2 size-4" /> Save
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <SectionTitle title="Content identity" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche / topic</Label>
              <Input id="niche" value={draft.niche} onChange={(e) => setDraft({ ...draft, niche: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Brand tone / voice</Label>
              <Textarea id="tone" rows={3} value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={draft.language} onValueChange={(v) => setDraft({ ...draft, language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["English", "Bangla", "Hindi", "Spanish", "Arabic"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Video length: {draft.videoLength}s</Label>
                <Slider
                  value={[draft.videoLength]}
                  min={15}
                  max={90}
                  step={5}
                  onValueChange={(v) => setDraft({ ...draft, videoLength: v[0] ?? draft.videoLength })}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Posting schedule" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Posts per day: {draft.frequency}</Label>
              <Slider
                value={[draft.frequency]}
                min={1}
                max={6}
                step={1}
                onValueChange={([v]) =>
                  setDraft((d) => {
                    const slots = Array.from({ length: v }, (_, i) => d.timeSlots[i] ?? "12:00");
                    return { ...d, frequency: v, timeSlots: slots };
                  })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {draft.timeSlots.map((slot, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`slot-${i}`}>Slot {i + 1}</Label>
                  <Input id={`slot-${i}`} type="time" value={slot} onChange={(e) => setSlot(i, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Autopilot</p>
                <p className="text-xs text-muted-foreground">Generate and publish without prompting</p>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Target platforms"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/connections">Manage</Link>
              </Button>
            }
          />
          {available.length === 0 ? (
            <EmptyState
              icon={Cable}
              title="No connections yet"
              description="Connect a platform to choose where your reels go."
              ctaLabel="Connect a platform"
              ctaTo="/connections"
            />
          ) : (
            <ul className="space-y-2">
              {available.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                    {p.status === "expired" ? (
                      <span className="text-xs text-destructive">(token expired)</span>
                    ) : null}
                  </span>
                  <Switch checked={draft.platforms.includes(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Publishing mode" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: "auto" as const, icon: Zap, title: "Full Auto", desc: "Agent generates and publishes on its own." },
              { id: "review" as const, icon: ShieldCheck, title: "Review Before Post", desc: "Every reel waits for your approval." },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setDraft({ ...draft, mode: m.id })}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  draft.mode === m.id ? "gradient-border bg-primary/10" : "border-border/60 hover:bg-muted/30",
                )}
              >
                <m.icon className={cn("mb-2 size-5", draft.mode === m.id ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium">{m.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
