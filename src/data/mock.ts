export type PlatformId = string;

export type Platform = {
  id: PlatformId;
  name: string;
  handle: string;
  color: string;
  status: "connected" | "expired" | "disconnected";
  followers: number;
  custom?: boolean;
  authType?: "oauth2" | "api-key" | "webhook";
  baseUrl?: string;
};

export const initialPlatforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube Shorts",
    handle: "@reelpilot.studio",
    color: "oklch(0.65 0.22 25)",
    status: "connected",
    followers: 18420,
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    handle: "@reelpilot",
    color: "oklch(0.7 0.2 350)",
    status: "connected",
    followers: 24870,
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@reelpilot",
    color: "oklch(0.78 0.15 200)",
    status: "connected",
    followers: 40310,
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "ReelPilot Page",
    color: "oklch(0.66 0.17 255)",
    status: "expired",
    followers: 7120,
  },
];

export type ProviderCategory = "video" | "voice" | "llm" | "music";

export type ProviderKey = {
  id: string;
  category: ProviderCategory;
  provider: string;
  label: string;
  maskedKey: string;
  status: "active" | "invalid" | "expired";
  lastUsed: string;
  isDefault: boolean;
  endpoint?: string;
  usage: number;
  quota: number;
};

export const providerCatalog: Record<
  ProviderCategory,
  { title: string; description: string; options: string[] }
> = {
  video: {
    title: "Video Generation",
    description: "Scene clips generated from visual prompts",
    options: ["Runway", "Pika", "Luma", "Custom endpoint"],
  },
  voice: {
    title: "Voice / TTS",
    description: "Voiceover narration for every scene",
    options: ["ElevenLabs", "Azure Speech", "PlayHT", "Custom endpoint"],
  },
  llm: {
    title: "Script / LLM",
    description: "Hooks, scripts and scene breakdowns",
    options: ["OpenAI", "Anthropic", "Google Gemini", "Custom endpoint"],
  },
  music: {
    title: "Music",
    description: "Background tracks and sound beds",
    options: ["Suno", "Mubert", "Custom endpoint"],
  },
};

export const initialProviderKeys: ProviderKey[] = [
  {
    id: "k1",
    category: "llm",
    provider: "OpenAI",
    label: "Main script key",
    maskedKey: "sk-••••••••••••4f2a",
    status: "active",
    lastUsed: "2 hours ago",
    isDefault: true,
    usage: 312,
    quota: 1000,
  },
  {
    id: "k2",
    category: "video",
    provider: "Runway",
    label: "Reel clips",
    maskedKey: "rw-••••••••••••91cc",
    status: "active",
    lastUsed: "5 hours ago",
    isDefault: true,
    usage: 128,
    quota: 300,
  },
  {
    id: "k3",
    category: "voice",
    provider: "ElevenLabs",
    label: "Narrator voice",
    maskedKey: "el-••••••••••••7b10",
    status: "expired",
    lastUsed: "6 days ago",
    isDefault: true,
    usage: 96,
    quota: 500,
  },
];

export type VideoItem = {
  id: string;
  title: string;
  topic: string;
  duration: string;
  createdAt: string;
  status: "draft" | "scheduled" | "published" | "failed";
  platforms: PlatformId[];
  views: number;
  hue: number;
};

export const videos: VideoItem[] = [
  {
    id: "v1",
    title: "3 AI tools that replaced my editor",
    topic: "AI productivity",
    duration: "00:38",
    createdAt: "2026-09-10",
    status: "published",
    platforms: ["youtube", "instagram", "tiktok"],
    views: 84200,
    hue: 300,
  },
  {
    id: "v2",
    title: "Why your reels stop at 200 views",
    topic: "Creator growth",
    duration: "00:44",
    createdAt: "2026-09-09",
    status: "published",
    platforms: ["instagram", "tiktok"],
    views: 51800,
    hue: 340,
  },
  {
    id: "v3",
    title: "The 5-second hook formula",
    topic: "Copywriting",
    duration: "00:31",
    createdAt: "2026-09-11",
    status: "scheduled",
    platforms: ["youtube", "facebook"],
    views: 0,
    hue: 265,
  },
  {
    id: "v4",
    title: "Automate your whole content week",
    topic: "Automation",
    duration: "00:52",
    createdAt: "2026-09-08",
    status: "published",
    platforms: ["youtube", "tiktok", "instagram"],
    views: 129400,
    hue: 210,
  },
  {
    id: "v5",
    title: "Faceless channels: honest numbers",
    topic: "Creator economy",
    duration: "00:47",
    createdAt: "2026-09-07",
    status: "failed",
    platforms: ["facebook"],
    views: 0,
    hue: 20,
  },
  {
    id: "v6",
    title: "Script templates that always work",
    topic: "Copywriting",
    duration: "00:35",
    createdAt: "2026-09-06",
    status: "draft",
    platforms: [],
    views: 0,
    hue: 160,
  },
];

export type ScheduledPost = {
  id: string;
  videoId: string;
  title: string;
  date: string;
  time: string;
  platforms: PlatformId[];
  status: "pending" | "publishing" | "published" | "failed";
  retries: number;
  hue: number;
};

export const scheduledPosts: ScheduledPost[] = [
  {
    id: "s1",
    videoId: "v3",
    title: "The 5-second hook formula",
    date: "2026-09-11",
    time: "18:30",
    platforms: ["youtube", "instagram"],
    status: "pending",
    retries: 0,
    hue: 265,
  },
  {
    id: "s2",
    videoId: "v6",
    title: "Script templates that always work",
    date: "2026-09-12",
    time: "09:00",
    platforms: ["tiktok", "instagram"],
    status: "pending",
    retries: 0,
    hue: 160,
  },
  {
    id: "s3",
    videoId: "v5",
    title: "Faceless channels: honest numbers",
    date: "2026-09-10",
    time: "20:00",
    platforms: ["facebook"],
    status: "failed",
    retries: 2,
    hue: 20,
  },
  {
    id: "s4",
    videoId: "v1",
    title: "3 AI tools that replaced my editor",
    date: "2026-09-10",
    time: "08:30",
    platforms: ["youtube", "instagram", "tiktok"],
    status: "published",
    retries: 0,
    hue: 300,
  },
  {
    id: "s5",
    videoId: "v2",
    title: "Why your reels stop at 200 views",
    date: "2026-09-09",
    time: "19:15",
    platforms: ["instagram", "tiktok"],
    status: "published",
    retries: 1,
    hue: 340,
  },
  {
    id: "s6",
    videoId: "v4",
    title: "Automate your whole content week",
    date: "2026-09-14",
    time: "12:00",
    platforms: ["youtube", "tiktok"],
    status: "pending",
    retries: 0,
    hue: 210,
  },
];

export const viewsTrend = [
  { day: "Mon", views: 12400, engagement: 820 },
  { day: "Tue", views: 18800, engagement: 1240 },
  { day: "Wed", views: 15200, engagement: 990 },
  { day: "Thu", views: 26400, engagement: 1810 },
  { day: "Fri", views: 31200, engagement: 2360 },
  { day: "Sat", views: 42800, engagement: 3120 },
  { day: "Sun", views: 38600, engagement: 2870 },
];

export const runHistory = [
  { id: "r1", at: "2026-09-11 06:00", action: "Generated reel “The 5-second hook formula”", result: "success" },
  { id: "r2", at: "2026-09-10 20:02", action: "Publish to Facebook", result: "failed" },
  { id: "r3", at: "2026-09-10 08:30", action: "Published to 3 platforms", result: "success" },
  { id: "r4", at: "2026-09-10 06:00", action: "Daily generation run", result: "success" },
  { id: "r5", at: "2026-09-09 19:15", action: "Published to 2 platforms", result: "success" },
];

export type Notification = {
  id: string;
  title: string;
  detail: string;
  at: string;
  tone: "info" | "success" | "error";
};

export const notifications: Notification[] = [
  { id: "n1", title: "Reel ready", detail: "“The 5-second hook formula” finished rendering.", at: "12m ago", tone: "success" },
  { id: "n2", title: "Publish failed", detail: "Facebook token expired — reconnect the account.", at: "1h ago", tone: "error" },
  { id: "n3", title: "API key expired", detail: "ElevenLabs key needs to be replaced.", at: "6h ago", tone: "error" },
  { id: "n4", title: "Post published", detail: "3 platforms received today's reel.", at: "9h ago", tone: "info" },
];

export const scenePreset = [
  { id: "sc1", visual: "Fast zoom on a glowing phone screen, neon studio", duration: 4, line: "Most creators burn 6 hours on one reel." },
  { id: "sc2", visual: "Split screen: tired editor vs. automated dashboard", duration: 6, line: "Your agent does the same job while you sleep." },
  { id: "sc3", visual: "UI close-up of a schedule filling itself in", duration: 5, line: "Pick a niche, pick a time, that's the setup." },
  { id: "sc4", visual: "Creator smiling at rising analytics chart", duration: 5, line: "Thirty reels a month, zero editing nights." },
  { id: "sc5", visual: "Logo sting on violet-pink gradient", duration: 3, line: "Put your reels on autopilot." },
];
