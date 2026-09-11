import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Cable,
  Gauge,
  KeyRound,
  Library,
  Menu,
  Rocket,
  Settings2,
  Sparkles,
  Timer,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/data/mock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/create", label: "Create", icon: Sparkles },
  { to: "/library", label: "Library", icon: Library },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/schedule", label: "Schedule", icon: Timer },
  { to: "/connections", label: "Connections", icon: Cable },
  { to: "/providers", label: "AI Providers", icon: KeyRound },
  { to: "/settings", label: "Agent Settings", icon: Settings2 },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { settings } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border/60 bg-sidebar/80 p-4 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="gradient-accent flex size-9 items-center justify-center rounded-xl">
              <Rocket className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-semibold">
              Reel<span className="gradient-text">Pilot</span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  active && "gradient-accent text-primary-foreground shadow-lg shadow-primary/20 hover:text-primary-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="glass mt-6 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Agent status</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                settings.active ? "bg-success animate-pulse" : "bg-muted-foreground",
              )}
            />
            {settings.active ? "Running on autopilot" : "Paused"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {settings.frequency}× per day · {settings.mode === "auto" ? "Full Auto" : "Review before post"}
          </p>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
              {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="size-4" />
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                      {notifications.length}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">Notifications</div>
                  <ul className="max-h-80 divide-y divide-border/50 overflow-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px]",
                              n.tone === "error" && "border-destructive/40 text-destructive",
                              n.tone === "success" && "border-success/40 text-success",
                            )}
                          >
                            {n.at}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{n.detail}</p>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
