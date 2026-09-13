import { createFileRoute } from "@tanstack/react-router";
import { Download, Film, Repeat2, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, PlatformDots, ReelThumb, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Content Library — ReelPilot" },
      { name: "description", content: "Search, filter, re-post, download or delete every reel your agent has generated." },
      { property: "og:title", content: "Content Library — ReelPilot" },
      { property: "og:description", content: "Every generated reel in one searchable library." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { videos, setVideos, platforms } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");

  const filtered = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(q.toLowerCase()) &&
      (status === "all" || v.status === status) &&
      (platform === "all" || v.platforms.includes(platform)),
  );

  return (
    <AppShell title="Content Library" subtitle={`${videos.length} reels generated`}>
      <GlassCard className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search reels…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["all", "draft", "scheduled", "published", "failed"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos here yet"
          description="Generate your first video and it will show up in this library."
          ctaLabel="Generate your first video"
          ctaTo="/create"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((v) => (
            <GlassCard key={v.id} className="p-3">
              <ReelThumb hue={v.hue} title={v.title} duration={v.duration} />
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{v.title}</p>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.createdAt} · {v.views.toLocaleString()} views
                </p>
                <PlatformDots ids={v.platforms} all={platforms} />
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => toast.success("Re-posting queued")}>
                    <Repeat2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.success("Download started")}>
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVideos((all) => all.filter((x) => x.id !== v.id));
                      toast.success("Reel deleted");
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
