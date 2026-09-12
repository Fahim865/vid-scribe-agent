import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/common";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — ReelPilot" },
      { name: "description", content: "Set your niche, add an AI provider key and generate your first autopilot reel in three steps." },
      { property: "og:title", content: "Get started — ReelPilot" },
      { property: "og:description", content: "Three quick steps to put your short-form content on autopilot." },
    ],
  }),
  component: Onboarding,
});

const steps = ["Your niche", "Connect the engine", "First reel"];

function Onboarding() {
  const navigate = useNavigate();
  const { settings, updateSettings, setOnboardingDone, providerKeys, platforms } = useStore();
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState(settings.niche);
  const [generating, setGenerating] = useState(false);

  const connected = platforms.filter((p) => p.status === "connected").length;

  function finish() {
    setOnboardingDone(true);
    toast.success("Setup complete — your agent is live");
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="gradient-accent flex size-10 items-center justify-center rounded-xl">
            <Rocket className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold">
            Reel<span className="gradient-text">Pilot</span>
          </span>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  i <= step ? "gradient-accent text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("text-xs", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            </div>
          ))}
        </div>

        <GlassCard className="p-6">
          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">What should your agent talk about?</h2>
                <p className="text-sm text-muted-foreground">This drives every script, scene and hook it writes.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche or topic</Label>
                <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. AI tools for creators" />
              </div>
              <div className="flex flex-wrap gap-2">
                {["AI tools", "Fitness", "Personal finance", "Travel", "Cooking"].map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => setNiche(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Bring your own AI keys</h2>
                <p className="text-sm text-muted-foreground">
                  Add at least one provider key, or connect a social account to publish to.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/providers" className="glass rounded-xl p-4 transition-colors hover:bg-muted/30">
                  <KeyRound className="mb-2 size-5 text-primary" />
                  <p className="text-sm font-medium">AI provider keys</p>
                  <p className="text-xs text-muted-foreground">{providerKeys.length} key(s) added</p>
                </Link>
                <Link to="/connections" className="glass rounded-xl p-4 transition-colors hover:bg-muted/30">
                  <Sparkles className="mb-2 size-5 text-accent" />
                  <p className="text-sm font-medium">Social connections</p>
                  <p className="text-xs text-muted-foreground">{connected} platform(s) connected</p>
                </Link>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Generate your first reel</h2>
                <p className="text-sm text-muted-foreground">
                  We'll write a script, build the scenes and render a 9:16 reel about “{niche}”.
                </p>
              </div>
              <Button
                className="gradient-accent text-primary-foreground"
                disabled={generating}
                onClick={() => {
                  setGenerating(true);
                  setTimeout(() => {
                    setGenerating(false);
                    toast.success("Demo reel generated");
                  }, 1600);
                }}
              >
                <Sparkles className="mr-2 size-4" />
                {generating ? "Generating…" : "Generate demo reel"}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setOnboardingDone(true);
                navigate({ to: "/" });
              }}
            >
              Skip for now
            </Button>
            <div className="flex gap-2">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : null}
              <Button
                className="gradient-accent text-primary-foreground"
                onClick={() => {
                  if (step === 0) updateSettings({ niche });
                  if (step === steps.length - 1) finish();
                  else setStep((s) => s + 1);
                }}
              >
                {step === steps.length - 1 ? "Go to dashboard" : "Continue"}
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
