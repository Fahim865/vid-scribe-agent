import { createFileRoute } from "@tanstack/react-router";
import { Cable, Plus, Radio, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, GlassCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Social Connections — ReelPilot" },
      { name: "description", content: "Connect YouTube Shorts, Instagram Reels, TikTok, Facebook — or add any custom platform endpoint." },
      { property: "og:title", content: "Social Connections — ReelPilot" },
      { property: "og:description", content: "Manage where your agent publishes, with status for every account." },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { platforms, setPlatforms } = useStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<"oauth2" | "api-key" | "webhook">("oauth2");
  const [credential, setCredential] = useState("");

  function connect(id: string) {
    setConnecting(id);
    setTimeout(() => {
      setPlatforms((all) => all.map((p) => (p.id === id ? { ...p, status: "connected" } : p)));
      setConnecting(null);
      toast.success("Account connected");
    }, 1200);
  }

  function addCustom() {
    if (!name.trim()) {
      toast.error("Give the platform a name");
      return;
    }
    setPlatforms((all) => [
      ...all,
      {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        handle: credential ? "custom account" : "not linked",
        color: `oklch(0.7 0.18 ${Math.floor(Math.random() * 360)})`,
        status: credential ? "connected" : "disconnected",
        followers: 0,
        custom: true,
        authType,
        baseUrl,
      },
    ]);
    toast.success(`${name} added`);
    setOpen(false);
    setName("");
    setBaseUrl("");
    setCredential("");
  }

  return (
    <AppShell
      title="Connections"
      subtitle="Every account your agent can publish to"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent text-primary-foreground">
              <Plus className="mr-2 size-4" /> Add platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a custom platform</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pname">Platform name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="LinkedIn, Pinterest, X…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="burl">API base URL</Label>
                <Input id="burl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com" />
              </div>
              <div className="space-y-2">
                <Label>Auth type</Label>
                <Select value={authType} onValueChange={(v) => setAuthType(v as typeof authType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="api-key">API key</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred">Credential</Label>
                <Input id="cred" type="password" value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="Client secret or token" />
              </div>
            </div>
            <DialogFooter>
              <Button className="gradient-accent text-primary-foreground" onClick={addCustom}>
                Add platform
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {platforms.length === 0 ? (
        <EmptyState
          icon={Cable}
          title="No connections yet"
          description="Connect a platform to get started."
          ctaLabel="Add platform"
          onCta={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {platforms.map((p) => (
            <GlassCard key={p.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-11 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.handle}</p>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {p.followers ? `${p.followers.toLocaleString()} followers` : "No audience data yet"}
                {p.custom ? ` · ${p.authType}` : ""}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.status === "connected" ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => toast.success(`${p.name} connection is healthy`)}>
                      <Radio className="mr-2 size-4" /> Test
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Scheduled posts for this account will be paused until you reconnect.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setPlatforms((all) =>
                                all.map((x) => (x.id === p.id ? { ...x, status: "disconnected" } : x)),
                              );
                              toast.success(`${p.name} disconnected`);
                            }}
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="gradient-accent text-primary-foreground"
                    disabled={connecting === p.id}
                    onClick={() => connect(p.id)}
                  >
                    {connecting === p.id ? "Opening OAuth…" : p.status === "expired" ? "Reconnect" : "Connect"}
                  </Button>
                )}
                {p.custom ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPlatforms((all) => all.filter((x) => x.id !== p.id));
                      toast.success(`${p.name} removed`);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
