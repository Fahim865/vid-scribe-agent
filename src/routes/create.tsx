import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, Loader2, Play, Send, Sparkles, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { GlassCard, ReelThumb, SectionTitle } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scenePreset } from "@/data/mock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Reel — ReelPilot" },
      { name: "description", content: "Brief to script, scene breakdown, AI clips, voiceover, burned captions and a finished 9:16 reel." },
      { property: "og:title", content: "Create a Reel — ReelPilot" },
      { property: "og:description", content: "Guided AI generation flow for vertical short-form video." },
    ],
  }),
  component: CreatePage,
});

const steps = ["Brief", "Script", "Scenes", "Voiceover", "Captions", "Render"] as const;

function CreatePage() {
  const { settings, providerKeys, videos, setVideos } = useStore();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [brief, setBrief] = useState("Why an AI agent beats hiring an editor");
  const [script, setScript] = useState(
    "Hook: Most creators burn six hours on one reel.\n\nBody: Your agent writes the script, builds the scenes, records the voiceover and posts it — while you sleep.\n\nCTA: Put your reels on autopilot.",
  );
  const [scenes, setScenes] = useState(scenePreset);
  const [voice, setVoice] = useState("Nova — warm female");
  const [captionStyle, setCaptionStyle] = useState("Bold karaoke");
  const [done, setDone] = useState(false);

  const keysFor = (c: string) => providerKeys.filter((k) => k.category === c).map((k) => `${k.provider} — ${k.label}`);

  function run(next: number, label: string) {
    setBusy(true);
    setProgress(0);
    const t = setInterval(() => setProgress((p) => Math.min(p + 12, 100)), 120);
    setTimeout(() => {
      clearInterval(t);
      setProgress(100);
      setBusy(false);
      setStep(next);
      toast.success(label);
      if (next === steps.length - 1) setDone(true);
    }, 1300);
  }

  return (
    <AppShell title="Create a reel" subtitle={`Niche: ${settings.niche}`}>
      <div className="mb-6 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
              i === step
                ? "gradient-accent border-transparent text-primary-foreground"
                : i < step
                  ? "border-success/40 text-success"
                  : "border-border/60 text-muted-foreground",
            )}
          >
            {i < step ? <Check className="size-3" /> : <span className="text-[10px]">{i + 1}</span>}
            {s}
          </button>
        ))}
      </div>

      {busy ? <Progress value={progress} className="mb-4 h-1.5" /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {step === 0 ? (
            <GlassCard>
              <SectionTitle title="Topic / brief" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brief">What is this reel about?</Label>
                  <Textarea id="brief" rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Script model</Label>
                  <Select defaultValue={keysFor("llm")[0] ?? "No key added"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(keysFor("llm").length ? keysFor("llm") : ["No key added"]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gradient-accent text-primary-foreground" disabled={busy} onClick={() => run(1, "Script written")}>
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                  Write the script
                </Button>
              </div>
            </GlassCard>
          ) : null}

          {step === 1 ? (
            <GlassCard>
              <SectionTitle title="Script" />
              <Textarea rows={10} value={script} onChange={(e) => setScript(e.target.value)} />
              <Button className="gradient-accent mt-4 text-primary-foreground" disabled={busy} onClick={() => run(2, "Scene breakdown ready")}>
                Break into scenes
              </Button>
            </GlassCard>
          ) : null}

          {step === 2 ? (
            <GlassCard>
              <SectionTitle title="Scene breakdown" />
              <ul className="space-y-3">
                {scenes.map((s, i) => (
                  <li key={s.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Scene {i + 1}</p>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="size-3" /> {s.duration}s
                      </span>
                    </div>
                    <Input
                      className="mt-2"
                      value={s.visual}
                      onChange={(e) =>
                        setScenes((all) => all.map((x) => (x.id === s.id ? { ...x, visual: e.target.value } : x)))
                      }
                    />
                    <Input
                      className="mt-2"
                      value={s.line}
                      onChange={(e) =>
                        setScenes((all) => all.map((x) => (x.id === s.id ? { ...x, line: e.target.value } : x)))
                      }
                    />
                  </li>
                ))}
              </ul>
              <Button className="gradient-accent mt-4 text-primary-foreground" disabled={busy} onClick={() => run(3, "Clips generated for every scene")}>
                Generate clips
              </Button>
            </GlassCard>
          ) : null}

          {step === 3 ? (
            <GlassCard>
              <SectionTitle title="Voiceover" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Nova — warm female", "Atlas — deep male", "Kai — energetic", "Mira — calm narrator"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TTS provider</Label>
                  <Select defaultValue={keysFor("voice")[0] ?? "No key added"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(keysFor("voice").length ? keysFor("voice") : ["No key added"]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gradient-accent text-primary-foreground" disabled={busy} onClick={() => run(4, "Voiceover recorded")}>
                  Record voiceover
                </Button>
              </div>
            </GlassCard>
          ) : null}

          {step === 4 ? (
            <GlassCard>
              <SectionTitle title="Captions" />
              <div className="grid gap-3 sm:grid-cols-3">
                {["Bold karaoke", "Clean minimal", "Neon pop"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCaptionStyle(c)}
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm transition-colors",
                      captionStyle === c ? "gradient-border bg-primary/10" : "border-border/60 hover:bg-muted/30",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Button className="gradient-accent mt-4 text-primary-foreground" disabled={busy} onClick={() => run(5, "Captions burned in")}>
                Burn captions & stitch
              </Button>
            </GlassCard>
          ) : null}

          {step === 5 ? (
            <GlassCard>
              <SectionTitle title="Final reel" />
              <p className="text-sm text-muted-foreground">
                9:16 · {scenes.reduce((a, s) => a + s.duration, 0)}s · {voice} · {captionStyle} captions
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => toast.success("Export started (MP4, 1080×1920)")}>
                  <Download className="mr-2 size-4" /> Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setVideos((all) => [
                      {
                        id: crypto.randomUUID(),
                        title: brief,
                        topic: settings.niche,
                        duration: `00:${scenes.reduce((a, s) => a + s.duration, 0)}`,
                        createdAt: new Date().toISOString().slice(0, 10),
                        status: "scheduled",
                        platforms: settings.platforms,
                        views: 0,
                        hue: 290,
                      },
                      ...all,
                    ]);
                    toast.success("Added to the schedule queue");
                  }}
                >
                  <Timer className="mr-2 size-4" /> Schedule
                </Button>
                <Button
                  className="gradient-accent text-primary-foreground"
                  onClick={() => {
                    setVideos((all) => [
                      {
                        id: crypto.randomUUID(),
                        title: brief,
                        topic: settings.niche,
                        duration: "00:23",
                        createdAt: new Date().toISOString().slice(0, 10),
                        status: "published",
                        platforms: settings.platforms,
                        views: 0,
                        hue: 320,
                      },
                      ...all,
                    ]);
                    toast.success(`Posted to ${settings.platforms.length} platform(s)`);
                  }}
                >
                  <Send className="mr-2 size-4" /> Post now
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{videos.length} reels in your library</p>
            </GlassCard>
          ) : null}
        </div>

        <GlassCard className="h-fit">
          <SectionTitle title="Preview" />
          <div className="mx-auto w-44">
            <ReelThumb hue={done ? 320 : 290} title={brief} duration={`00:${scenes.reduce((a, s) => a + s.duration, 0)}`} />
          </div>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p>Aspect ratio · 9:16</p>
            <p>Scenes · {scenes.length}</p>
            <p>Voice · {voice}</p>
            <p>Captions · {captionStyle}</p>
          </div>
          <Button variant="outline" className="mt-4 w-full" onClick={() => toast.success("Playing preview")}>
            <Play className="mr-2 size-4" /> Play preview
          </Button>
        </GlassCard>
      </div>
    </AppShell>
  );
}
