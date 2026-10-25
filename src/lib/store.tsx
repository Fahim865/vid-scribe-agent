import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  addProviderKey as addKeyFn,
  deleteProviderKey as deleteKeyFn,
  setDefaultProviderKey as setDefaultKeyFn,
  testProviderKey as testKeyFn,
  type ClientKey,
} from "@/lib/reelpilot.functions";
import type {
  Notification,
  Platform,
  ProviderKey,
  ProviderCategory,
  ScheduledPost,
  VideoItem,
} from "@/data/mock";

export type AgentSettings = {
  niche: string;
  tone: string;
  language: string;
  videoLength: number;
  frequency: number;
  timeSlots: string[];
  platforms: string[];
  mode: "auto" | "review";
  active: boolean;
};

const defaultSettings: AgentSettings = {
  niche: "AI tools & creator productivity",
  tone: "Punchy, friendly, no fluff",
  language: "English",
  videoLength: 40,
  frequency: 2,
  timeSlots: ["09:00", "18:30"],
  platforms: ["youtube", "instagram", "tiktok"],
  mode: "review",
  active: true,
};

type StoreValue = {
  ready: boolean;
  profile: { email: string; displayName: string } | null;
  platforms: Platform[];
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  providerKeys: ProviderKey[];
  addProviderKey: (input: {
    category: ProviderCategory;
    provider: string;
    label: string;
    secret: string;
    endpoint?: string;
    headers?: string;
  }) => Promise<boolean>;
  deleteProviderKey: (id: string) => Promise<void>;
  makeDefaultProviderKey: (id: string) => Promise<void>;
  testProviderKey: (input: { keyId?: string; category?: string; provider?: string; secret?: string; endpoint?: string }) => Promise<{ ok: boolean; message: string }>;
  settings: AgentSettings;
  updateSettings: (patch: Partial<AgentSettings>) => void;
  videos: VideoItem[];
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  posts: ScheduledPost[];
  setPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
  notifications: Notification[];
  markNotificationsRead: () => Promise<void>;
  onboardingDone: boolean;
  setOnboardingDone: (v: boolean) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function relative(value: string | null | undefined): string {
  if (!value) return "never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "never";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

type DbRow = Record<string, unknown>;

const mapPlatformRow = (r: DbRow): Platform => ({
  id: String(r.platform_id),
  name: String(r.name),
  handle: (r.handle as string) ?? "",
  color: (r.color as string) ?? "oklch(0.6 0.05 300)",
  status: (r.status as Platform["status"]) ?? "disconnected",
  followers: Number(r.followers ?? 0),
  custom: Boolean(r.custom),
  authType: (r.auth_type as Platform["authType"]) ?? undefined,
  baseUrl: (r.base_url as string) ?? undefined,
});

const mapVideoRow = (r: DbRow): VideoItem => ({
  id: String(r.id),
  title: String(r.title),
  topic: (r.topic as string) ?? "",
  duration: (r.duration as string) ?? "00:40",
  createdAt: String(r.created_at ?? "").slice(0, 10),
  status: (r.status as VideoItem["status"]) ?? "draft",
  platforms: ((r.platforms as string[]) ?? []) as string[],
  views: Number(r.views ?? 0),
  hue: Number(r.hue ?? 300),
  voiceUrl: (r.voice_url as string) ?? undefined,
});

const mapPostRow = (r: DbRow): ScheduledPost => ({
  id: String(r.id),
  videoId: (r.video_id as string) ?? "",
  title: String(r.title),
  date: String(r.post_date ?? "").slice(0, 10),
  time: (r.post_time as string) ?? "09:00",
  platforms: ((r.platforms as string[]) ?? []) as string[],
  status: (r.status as ScheduledPost["status"]) ?? "pending",
  retries: Number(r.retries ?? 0),
  hue: Number(r.hue ?? 300),
});

const mapKeyRow = (r: ClientKey): ProviderKey => ({
  id: r.id,
  category: r.category as ProviderCategory,
  provider: r.provider,
  label: r.label,
  maskedKey: r.key_hint,
  status: r.status as ProviderKey["status"],
  lastUsed: relative(r.last_used_at),
  isDefault: Boolean(r.is_default),
  endpoint: r.endpoint ?? undefined,
  usage: r.usage_count,
  quota: r.quota,
});

const mapNotificationRow = (r: DbRow): Notification => ({
  id: String(r.id),
  title: String(r.title),
  detail: (r.detail as string) ?? "",
  at: relative(r.created_at),
  tone: (r.tone as Notification["tone"]) ?? "info",
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StoreValue["profile"]>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([]);
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try {
      return window.localStorage.getItem("rp.onboarded") === "true";
    } catch {
      return false;
    }
  });

  const userIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);

  // Latest-state refs so async DB writes use fresh values.
  const stateRef = useRef({ platforms, videos, posts, settings });
  stateRef.current = { platforms, videos, posts, settings };

  useEffect(() => {
    try {
      window.localStorage.setItem("rp.onboarded", String(onboardingDone));
    } catch {
      /* ignore */
    }
  }, [onboardingDone]);

  const loadAll = useCallback(async (userId: string) => {
    const [settingsRes, platformsRes, keysRes, videosRes, postsRes, notifRes, profileRes] =
      await Promise.all([
        supabase.from("agent_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("platform_connections").select("*").eq("user_id", userId),
        supabase.from("provider_keys").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("videos").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("scheduled_posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("profiles").select("email, display_name").eq("id", userId).maybeSingle(),
      ]);

    if (settingsRes.data) {
      const s = settingsRes.data as DbRow;
      setSettings({
        niche: (s.niche as string) ?? defaultSettings.niche,
        tone: (s.tone as string) ?? defaultSettings.tone,
        language: (s.language as string) ?? defaultSettings.language,
        videoLength: Number(s.video_length ?? 40),
        frequency: Number(s.frequency ?? 2),
        timeSlots: ((s.time_slots as string[]) ?? []).filter(Boolean),
        platforms: ((s.platforms as string[]) ?? []).filter(Boolean),
        mode: ((s.mode as string) === "auto" ? "auto" : "review") as AgentSettings["mode"],
        active: Boolean(s.active),
      });
    }
    if (platformsRes.data) setPlatforms((platformsRes.data as DbRow[]).map(mapPlatformRow));
    if (keysRes.data) setProviderKeys((keysRes.data as ClientKey[]).map(mapKeyRow));
    if (videosRes.data) setVideos((videosRes.data as DbRow[]).map(mapVideoRow));
    if (postsRes.data) setPosts((postsRes.data as DbRow[]).map(mapPostRow));
    if (notifRes.data) setNotifications((notifRes.data as DbRow[]).map(mapNotificationRow));
    if (profileRes.data) {
      const p = profileRes.data as DbRow;
      setProfile({ email: (p.email as string) ?? "", displayName: (p.display_name as string) ?? "" });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (!userId || cancelled) {
        setReady(true);
        return;
      }
      userIdRef.current = userId;
      if (!loadedRef.current) {
        loadedRef.current = true;
        await loadAll(userId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // ---- write-through helpers ----
  const updateSettings = useCallback((patch: Partial<AgentSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    const userId = userIdRef.current;
    if (!userId) return;
    const merged = { ...stateRef.current.settings, ...patch };
    const payload: DbRow = {
      niche: merged.niche,
      tone: merged.tone,
      language: merged.language,
      video_length: merged.videoLength,
      frequency: merged.frequency,
      time_slots: merged.timeSlots,
      platforms: merged.platforms,
      mode: merged.mode,
      active: merged.active,
      updated_at: new Date().toISOString(),
    };
    void supabase
      .from("agent_settings")
      .update(payload)
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) toast.error(`Could not save settings: ${error.message}`);
      });
  }, []);

  const syncPlatforms = useCallback(async (userId: string) => {
    const { data } = await supabase.from("platform_connections").select("*").eq("user_id", userId);
    const rows = (data as DbRow[]) ?? [];
    const current = stateRef.current.platforms;

    const byId = new Map(rows.map((r) => [String(r.platform_id), r]));
    for (const p of current) {
      const row = byId.get(p.id);
      const payload: DbRow = {
        name: p.name,
        handle: p.handle,
        color: p.color,
        status: p.status,
        followers: p.followers,
        custom: Boolean(p.custom),
        auth_type: p.authType ?? null,
        base_url: p.baseUrl ?? null,
        updated_at: new Date().toISOString(),
      };
      if (row) {
        void supabase.from("platform_connections").update(payload).eq("id", String(row.id));
      } else {
        void supabase.from("platform_connections").insert({ user_id: userId, platform_id: p.id, ...payload });
      }
    }
    for (const r of rows) {
      const id = String(r.platform_id);
      if (!current.some((p) => p.id === id)) {
        void supabase.from("platform_connections").delete().eq("id", String(r.id));
      }
    }
  }, []);

  const setPlatformsWithSync: StoreValue["setPlatforms"] = useCallback(
    (updater) => {
      setPlatforms((prev) => {
        const next = typeof updater === "function" ? (updater as (p: Platform[]) => Platform[])(prev) : updater;
        const userId = userIdRef.current;
        if (userId) void syncPlatforms(userId);
        return next;
      });
    },
    [syncPlatforms],
  );

  const syncVideos = useCallback(async (userId: string) => {
    const { data } = await supabase.from("videos").select("*").eq("user_id", userId);
    const rows = (data as DbRow[]) ?? [];
    const current = stateRef.current.videos;
    const byId = new Map(rows.map((r) => [String(r.id), r]));
    for (const v of current) {
      const row = byId.get(v.id);
      const payload: DbRow = {
        title: v.title,
        topic: v.topic,
        duration: v.duration,
        status: v.status,
        platforms: v.platforms,
        views: v.views,
        hue: v.hue,
      };
      if (row) {
        void supabase.from("videos").update(payload).eq("id", v.id);
      } else {
        void supabase
          .from("videos")
          .insert({ user_id: userId, id: v.id, ...payload, created_at: new Date().toISOString() });
      }
    }
    for (const r of rows) {
      if (!current.some((v) => v.id === String(r.id))) {
        void supabase.from("videos").delete().eq("id", String(r.id));
      }
    }
  }, []);

  const setVideosWithSync: StoreValue["setVideos"] = useCallback(
    (updater) => {
      setVideos((prev) => {
        const next = typeof updater === "function" ? (updater as (v: VideoItem[]) => VideoItem[])(prev) : updater;
        const userId = userIdRef.current;
        if (userId) void syncVideos(userId);
        return next;
      });
    },
    [syncVideos],
  );

  const syncPosts = useCallback(async (userId: string) => {
    const { data } = await supabase.from("scheduled_posts").select("*").eq("user_id", userId);
    const rows = (data as DbRow[]) ?? [];
    const current = stateRef.current.posts;
    const byId = new Map(rows.map((r) => [String(r.id), r]));
    for (const p of current) {
      const row = byId.get(p.id);
      const payload: DbRow = {
        title: p.title,
        post_date: p.date,
        post_time: p.time,
        platforms: p.platforms,
        status: p.status,
        retries: p.retries,
        hue: p.hue,
      };
      if (row) {
        void supabase.from("scheduled_posts").update(payload).eq("id", p.id);
      } else {
        void supabase
          .from("scheduled_posts")
          .insert({
            user_id: userId,
            id: p.id,
            video_id: p.videoId || null,
            ...payload,
          });
      }
    }
    for (const r of rows) {
      if (!current.some((p) => p.id === String(r.id))) {
        void supabase.from("scheduled_posts").delete().eq("id", String(r.id));
      }
    }
  }, []);

  const setPostsWithSync: StoreValue["setPosts"] = useCallback(
    (updater) => {
      setPosts((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: ScheduledPost[]) => ScheduledPost[])(prev) : updater;
        const userId = userIdRef.current;
        if (userId) void syncPosts(userId);
        return next;
      });
    },
    [syncPosts],
  );

  // ---- provider keys via server functions (encrypted server-side) ----
  const refetchKeys = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    const { data } = await supabase.from("provider_keys").select("*").eq("user_id", userId).order("created_at");
    if (data) setProviderKeys((data as ClientKey[]).map(mapKeyRow));
  }, []);

  const addProviderKey = useCallback<StoreValue["addProviderKey"]>(
    async (input) => {
      try {
        await addKeyFn({ data: input });
        await refetchKeys();
        toast.success("API key added — encrypted and stored server-side");
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not add the key");
        return false;
      }
    },
    [refetchKeys],
  );

  const deleteProviderKey = useCallback(
    async (id: string) => {
      try {
        await deleteKeyFn({ data: { id } });
        setProviderKeys((prev) => prev.filter((k) => k.id !== id));
        toast.success("Key removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not remove the key");
      }
    },
    [],
  );

  const makeDefaultProviderKey = useCallback(
    async (id: string) => {
      try {
        await setDefaultKeyFn({ data: { id } });
        setProviderKeys((prev) =>
          prev.map((k) => (k.category === prev.find((x) => x.id === id)?.category ? { ...k, isDefault: k.id === id } : k)),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not set the default key");
      }
    },
    [],
  );

  const testProviderKey = useCallback<StoreValue["testProviderKey"]>(async (input) => {
    try {
      return await testKeyFn({ data: input });
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection test failed" };
    }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, tone: n.tone })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      profile,
      platforms,
      setPlatforms: setPlatformsWithSync,
      providerKeys,
      addProviderKey,
      deleteProviderKey,
      makeDefaultProviderKey,
      testProviderKey,
      settings,
      updateSettings,
      videos,
      setVideos: setVideosWithSync,
      posts,
      setPosts: setPostsWithSync,
      notifications,
      markNotificationsRead,
      onboardingDone,
      setOnboardingDone,
    }),
    [
      ready,
      profile,
      platforms,
      setPlatformsWithSync,
      providerKeys,
      addProviderKey,
      deleteProviderKey,
      makeDefaultProviderKey,
      testProviderKey,
      settings,
      updateSettings,
      videos,
      setVideosWithSync,
      posts,
      setPostsWithSync,
      notifications,
      markNotificationsRead,
      onboardingDone,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
