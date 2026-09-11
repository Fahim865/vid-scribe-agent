import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Eye,
  Film,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, PlatformDots, ReelThumb, SectionTitle, StatusBadge } from "@/components/common";
import { viewsTrend } from "@/data/mock";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ReelPilot Agent" },
      { name: "description", content: "Track views, engagement, follower growth and every reel your ReelPilot agent generates and publishes." },
      { property: "og:title", content: "Dashboard — ReelPilot Agent" },
      { property: "og:description", content: "Analytics, upcoming posts and generated reels in one autopilot dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { settings, updateSettings, platforms, posts, videos, providerKeys, onboardingDone } = useStore();

  const connected = platforms.filter((p) => p.status === "connected");
  const upcoming = posts.filter((p) => p.status === "pending").slice(0, 4);
  const recent = videos.slice(0, 5);
  const followers = platforms.reduce((sum, p) => sum + p.followers, 0);

  const stats = [
    { label: "Views (7d)", value: "185.4K", change: "+24.1%", icon: Eye },
    { label: "Engagement rate", value: "7.8%", change: "+1.4%", icon: Heart },
    { label: "Follower growth", value: `+${(followers * 0.031).toFixed(0)}`, change: "+3.1%", icon: Users },
    { label: "Reels this month", value: String(videos.length * 4), change: "+8", icon: Film },
  ];

  const checklist = [
    { label: "Pick your niche", done: Boolean(settings.niche) },
    { label: "Add an AI provider key", done: providerKeys.length > 0 },
    { label: "Connect a platform", done: connected.length > 0 },
    { label: "Generate your first reel", done: videos.length > 0 },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your agent's last 7 days at a glance"
      actions={
        <Button asChild className="gradient-accent hidden text-primary-foreground sm:inline-flex">
          <Link to="/create">
            <Sparkles className="mr-2 size-4" /> New reel
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {!onboardingDone ? (
          <GlassCard className="gradient-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">Finish your setup</p>
                <p className="text-sm text-muted-foreground">
                  {checklist.filter((c) => c.done).length} of {checklist.length} steps complete
                </p>
                <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-1.5">
                      <CheckCircle2 className={c.done ? "size-3.5 text-success" : "size-3.5 opacity-40"} />
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="outline">
                <Link to="/onboarding">Continue setup</Link>
              </Button>
            </div>
          </GlassCard>
        ) : null}

        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="gradient-accent flex size-11 items-center justify-center rounded-2xl">
                <Activity className="size-5 text-primary-foreground" />
              </span>
              <div>
                <p className="font-medium">{settings.active ? "Agent is running" : "Agent is paused"}</p>
                <p className="text-sm text-muted-foreground">
                  Next run today at {settings.timeSlots[0] ?? "09:00"} · {settings.mode === "auto" ? "Full Auto" : "Review before post"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Autopilot</span>
              <Switch checked={settings.active} onCheckedChange={(v) => updateSettings({ active: v })} />
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <GlassCard key={s.label}>
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3" /> {s.change} vs last week
              </p>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <SectionTitle title="Views & engagement" />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsTrend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="var(--color-chart-1)" fill="url(#gv)" strokeWidth={2} />
                  <Area type="monotone" dataKey="engagement" stroke="var(--color-chart-2)" fill="url(#ge)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="By platform" />
            {connected.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No platforms connected"
                description="Connect a platform to see performance per account."
                ctaLabel="Connect a platform"
                ctaTo="/connections"
              />
            ) : (
              <ul className="space-y-4">
                {connected.map((p) => {
                  const share = Math.round((p.followers / (followers || 1)) * 100);
                  return (
                    <li key={p.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                        <span className="text-muted-foreground">{p.followers.toLocaleString()}</span>
                      </div>
                      <Progress value={share} className="mt-2 h-1.5" />
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-6 rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">AI generation this month</p>
              {providerKeys.map((k) => (
                <div key={k.id} className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>{k.provider}</span>
                    <span className="text-muted-foreground">
                      {k.usage}/{k.quota}
                    </span>
                  </div>
                  <Progress value={(k.usage / k.quota) * 100} className="mt-1 h-1" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <SectionTitle
              title="Upcoming scheduled posts"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/schedule">View queue</Link>
                </Button>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No scheduled posts yet"
                description="Queue a reel and your agent will publish it at the right time."
                ctaLabel="Schedule your first post"
                ctaTo="/schedule"
              />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                    <ReelThumb hue={p.hue} title="" className="w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.date} · {p.time}
                      </p>
                    </div>
                    <PlatformDots ids={p.platforms} all={platforms} />
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle
              title="Recent generated videos"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/library">View all</Link>
                </Button>
              }
            />
            {recent.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No videos yet"
                description="Generate your first reel to fill the library."
                ctaLabel="Generate your first video"
                ctaTo="/create"
              />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {recent.map((v) => (
                  <Link key={v.id} to="/library" className="transition-transform hover:-translate-y-1">
                    <ReelThumb hue={v.hue} title={v.title} duration={v.duration} />
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
