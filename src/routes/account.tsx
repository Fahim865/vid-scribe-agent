import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionTitle } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Billing — ReelPilot" },
      { name: "description", content: "Manage your ReelPilot profile, plan limits and how your own API keys affect your quota." },
      { property: "og:title", content: "Account & Billing — ReelPilot" },
      { property: "og:description", content: "Plan status, usage limits and bring-your-own-key billing notes." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { platforms, providerKeys, videos } = useStore();
  const connected = platforms.filter((p) => p.status === "connected").length;

  return (
    <AppShell title="Account" subtitle="Profile, plan and usage">
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <SectionTitle title="Profile" />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="gradient-accent flex size-14 items-center justify-center rounded-2xl text-lg font-semibold text-primary-foreground">
                RP
              </span>
              <div>
                <p className="font-medium">Creator Studio</p>
                <p className="text-sm text-muted-foreground">hello@reelpilot.app</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" defaultValue="Creator Studio" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="hello@reelpilot.app" />
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.success("Profile updated")}>
              Save profile
            </Button>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Plan"
            action={<Badge className="gradient-accent text-primary-foreground">Pro</Badge>}
          />
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Reels generated</span>
                <span className="text-muted-foreground">{videos.length}/120 this month</span>
              </div>
              <Progress value={(videos.length / 120) * 100} className="mt-2 h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Connected platforms</span>
                <span className="text-muted-foreground">{connected}/10</span>
              </div>
              <Progress value={(connected / 10) * 100} className="mt-2 h-1.5" />
            </div>
            <div className="rounded-xl border border-border/60 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRound className="size-4 text-primary" /> Bring your own keys
              </p>
              <p className="mt-1">
                You have {providerKeys.length} provider key(s). Reels generated with your own keys are billed by that
                provider and don't count against your plan quota.
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
                <Link to="/providers">Manage provider keys</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gradient-accent text-primary-foreground" onClick={() => toast.success("Upgrade flow opens once billing is connected")}>
                <Sparkles className="mr-2 size-4" /> Upgrade
              </Button>
              <Button variant="outline" onClick={() => toast.success("Billing portal opens once billing is connected")}>
                <CreditCard className="mr-2 size-4" /> Billing history
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
