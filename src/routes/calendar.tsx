import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { GlassCard, PlatformDots, SectionTitle, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Content Calendar — ReelPilot" },
      { name: "description", content: "A month-by-month calendar of every reel posted and every reel queued across your platforms." },
      { property: "og:title", content: "Content Calendar — ReelPilot" },
      { property: "og:description", content: "See what went out and what is coming next, day by day." },
    ],
  }),
  component: CalendarPage,
});

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const { posts, platforms } = useStore();
  const [cursor, setCursor] = useState(new Date(2026, 8, 1));
  const [selected, setSelected] = useState<string | null>("2026-09-11");
  const [view, setView] = useState<"month" | "week">("month");

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= total; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    if (view === "week") {
      const idx = cells.findIndex((c) => c === selected);
      const start = idx >= 0 ? Math.floor(idx / 7) * 7 : 0;
      return cells.slice(start, start + 7);
    }
    return cells;
  }, [cursor, view, selected]);

  const dayPosts = (date: string) => posts.filter((p) => p.date === date);
  const selectedPosts = selected ? dayPosts(selected) : [];

  return (
    <AppShell
      title="Content Calendar"
      subtitle={cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
      actions={
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
            Month
          </Button>
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
            Week
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
            {weekDays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, i) => {
              if (!date) return <div key={`e${i}`} />;
              const items = dayPosts(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelected(date)}
                  className={cn(
                    "min-h-20 rounded-xl border p-2 text-left transition-colors",
                    selected === date ? "gradient-border bg-primary/10" : "border-border/50 hover:bg-muted/30",
                  )}
                >
                  <span className="text-xs text-muted-foreground">{Number(date.slice(-2))}</span>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 2).map((p) => (
                      <span
                        key={p.id}
                        className="block truncate rounded-md px-1 py-0.5 text-[10px] text-white"
                        style={{
                          backgroundColor:
                            platforms.find((x) => x.id === p.platforms[0])?.color ?? "oklch(0.6 0.15 300)",
                        }}
                      >
                        {p.time} {p.title}
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="text-[10px] text-muted-foreground">+{items.length - 2} more</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="h-fit">
          <SectionTitle title={selected ?? "Pick a day"} />
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
          ) : (
            <ul className="space-y-3">
              {selectedPosts.map((p) => (
                <li key={p.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{p.time}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm">{p.title}</p>
                  <div className="mt-2">
                    <PlatformDots ids={p.platforms} all={platforms} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
