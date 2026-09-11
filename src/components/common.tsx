import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("glass rounded-2xl p-5", className)}>{children}</section>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaTo,
  onCta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: "/create" | "/connections" | "/providers" | "/schedule" | "/library";
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
      <span className="gradient-accent mb-4 flex size-12 items-center justify-center rounded-2xl">
        <Icon className="size-6 text-primary-foreground" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {ctaLabel ? (
        ctaTo ? (
          <Button asChild className="mt-4">
            <Link to={ctaTo}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button className="mt-4" onClick={onCta}>
            {ctaLabel}
          </Button>
        )
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    published: "border-success/40 text-success",
    connected: "border-success/40 text-success",
    active: "border-success/40 text-success",
    success: "border-success/40 text-success",
    pending: "border-warning/40 text-warning",
    scheduled: "border-warning/40 text-warning",
    publishing: "border-primary/40 text-primary",
    draft: "border-border text-muted-foreground",
    disconnected: "border-border text-muted-foreground",
    failed: "border-destructive/40 text-destructive",
    expired: "border-destructive/40 text-destructive",
    invalid: "border-destructive/40 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", tone[status] ?? "border-border text-muted-foreground")}>
      {status}
    </Badge>
  );
}

export function ReelThumb({
  hue,
  title,
  duration,
  className,
}: {
  hue: number;
  title: string;
  duration?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border/60", className)}
      style={{
        backgroundImage: `linear-gradient(150deg, oklch(0.55 0.2 ${hue}), oklch(0.32 0.14 ${(hue + 60) % 360}))`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_20%,rgba(255,255,255,0.28),transparent)]" />
      <p className="absolute inset-x-2 bottom-2 line-clamp-3 text-xs font-medium leading-snug text-white drop-shadow">
        {title}
      </p>
      {duration ? (
        <span className="absolute right-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] text-white">
          {duration}
        </span>
      ) : null}
    </div>
  );
}

export function PlatformDots({ ids, all }: { ids: string[]; all: { id: string; name: string; color: string }[] }) {
  return (
    <div className="flex -space-x-1">
      {ids.map((id) => {
        const p = all.find((x) => x.id === id);
        return (
          <span
            key={id}
            title={p?.name ?? id}
            className="size-3.5 rounded-full border border-background"
            style={{ backgroundColor: p?.color ?? "oklch(0.6 0.05 300)" }}
          />
        );
      })}
    </div>
  );
}
