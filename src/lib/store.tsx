import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  initialPlatforms,
  initialProviderKeys,
  scheduledPosts as seedPosts,
  videos as seedVideos,
  type Platform,
  type ProviderKey,
  type ScheduledPost,
  type VideoItem,
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
  platforms: Platform[];
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  providerKeys: ProviderKey[];
  setProviderKeys: React.Dispatch<React.SetStateAction<ProviderKey[]>>;
  settings: AgentSettings;
  updateSettings: (patch: Partial<AgentSettings>) => void;
  videos: VideoItem[];
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  posts: ScheduledPost[];
  setPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
  onboardingDone: boolean;
  setOnboardingDone: (v: boolean) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = usePersisted<Platform[]>("rp.platforms", initialPlatforms);
  const [providerKeys, setProviderKeys] = usePersisted<ProviderKey[]>("rp.keys", initialProviderKeys);
  const [settings, setSettings] = usePersisted<AgentSettings>("rp.settings", defaultSettings);
  const [videos, setVideos] = usePersisted<VideoItem[]>("rp.videos", seedVideos);
  const [posts, setPosts] = usePersisted<ScheduledPost[]>("rp.posts", seedPosts);
  const [onboardingDone, setOnboardingDone] = usePersisted<boolean>("rp.onboarded", false);

  const updateSettings = useCallback(
    (patch: Partial<AgentSettings>) => setSettings((s) => ({ ...s, ...patch })),
    [setSettings],
  );

  const value = useMemo(
    () => ({
      platforms,
      setPlatforms,
      providerKeys,
      setProviderKeys,
      settings,
      updateSettings,
      videos,
      setVideos,
      posts,
      setPosts,
      onboardingDone,
      setOnboardingDone,
    }),
    [platforms, setPlatforms, providerKeys, setProviderKeys, settings, updateSettings, videos, setVideos, posts, setPosts, onboardingDone, setOnboardingDone],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
