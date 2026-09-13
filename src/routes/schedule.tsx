import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Plus, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, PlatformDots, SectionTitle, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { runHistory } from "@/data/mock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Scheduling Engine — ReelPilot" },
      { name: "description", content: "Automation rules, the publish queue with retries, and a full run history for your agent." },
      { property: "og:title", content: "Scheduling Engine — ReelPilot" },
      { property: "og:description", content: "See what publishes next, what failed and what retried." },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { posts, setPosts, platforms, settings } = useStore();

  return (
    <AppShell
      title="Schedule"
      subtitle="Automation rules and the publish queue"
      actions={
        <Button className="gradient-accent text-primary-foreground" onClick={() => toast.success("New automation rule added")}>
          <Plus className="mr-2 size-4" /> New rule
        </Button>
      }
    >
      <div className="space-y-4">
        <GlassCard>
          <SectionTitle title="Automation rules" />
          <ul className="space-y-3">
            {settings.timeSlots.map((slot, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Daily reel · {slot}</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.niche} · {settings.mode === "auto" ? "Full Auto" : "Review before post"}
                  </p>
                </div>
                <PlatformDots ids={settings.platforms} all={platforms} />
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Publish queue" />
          {posts.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No scheduled posts yet"
              description="Your queue is empty — schedule a reel to fill it."
              ctaLabel="Schedule your first post"
              ctaTo="/create"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reel</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-56 truncate font-medium">{p.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {p.date} {p.time}
                      </TableCell>
                      <TableCell>
                        <PlatformDots ids={p.platforms} all={platforms} />
                      </TableCell>
                      <TableCell className={cn(p.retries > 0 && "text-warning")}>{p.retries}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "failed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPosts((all) =>
                                all.map((x) =>
                                  x.id === p.id ? { ...x, status: "publishing", retries: x.retries + 1 } : x,
                                ),
                              );
                              toast.success("Retrying publish…");
                              setTimeout(() => {
                                setPosts((all) =>
                                  all.map((x) => (x.id === p.id ? { ...x, status: "published" } : x)),
                                );
                                toast.success("Published");
                              }, 1500);
                            }}
                          >
                            <RotateCw className="mr-2 size-3.5" /> Retry
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Run history" />
          <ul className="space-y-2 text-sm">
            {runHistory.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 p-3">
                <span>{r.action}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {r.at}
                  <StatusBadge status={r.result === "success" ? "success" : "failed"} />
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
