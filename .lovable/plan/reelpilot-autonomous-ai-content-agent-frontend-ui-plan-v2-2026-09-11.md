# ReelPilot — Autonomous AI Content Agent (Frontend UI) — Plan v2

"Your reels, on autopilot." — এই ভার্সনে আগের প্ল্যানের গ্যাপগুলো যোগ করা হয়েছে, সাথে দুইটা বড় নতুন requirement: **Bring-Your-Own-API-Key (BYOK)** এবং **যেকোনো সোশ্যাল প্ল্যাটফর্মে জেনেরিক কানেকশন** (হার্ডকোডেড ৪টা প্ল্যাটফর্মে সীমাবদ্ধ না)।

এই ধাপে শুধু ফ্রন্টএন্ড, স্যাম্পল ডেটা দিয়ে সম্পূর্ণ ক্লিকযোগ্য UI। ব্যাকএন্ড পরে।

## ডিজাইন

- ডার্ক থিম, গ্লাসমরফিজম কার্ড (ব্লার + সূক্ষ্ম বর্ডার), ভায়োলেট→পিংক গ্রেডিয়েন্ট অ্যাকসেন্ট
- সব রঙ ডিজাইন টোকেন হিসেবে সেন্ট্রাল স্টাইলে, গ্রেডিয়েন্ট গ্লো ব্যাকগ্রাউন্ড
- বাম পাশে কোলাপসিবল সাইডবার নেভিগেশন, মোবাইলেও কাজ করবে

## পেজসমূহ

1. **Onboarding** `/onboarding` *(নতুন)*
  - ৩-৪ ধাপের wizard: (১) niche/topic সেট করা → (২) কমপক্ষে একটা AI provider key বা একটা সোশ্যাল প্ল্যাটফর্ম কানেক্ট করা → (৩) প্রথম ডেমো ভিডিও জেনারেট করা
  - প্রথমবার লগইনে অটো-রিডাইরেক্ট, স্কিপ করার অপশনও থাকবে
  - Dashboard-এ "Setup checklist" ব্যানার থাকবে যতক্ষণ না সব ধাপ শেষ হয়
2. **Dashboard (হোম** `/`**)**
  - উপরে চারটি স্ট্যাট কার্ড: views, engagement rate, follower growth, এই মাসে জেনারেট হওয়া ভিডিও
  - ভিউ গ্রোথ চার্ট + প্ল্যাটফর্মভিত্তিক ব্রেকডাউন (কানেক্টেড প্ল্যাটফর্ম যতগুলোই হোক, ডাইনামিক লিজেন্ড)
  - "Upcoming scheduled posts" লিস্ট (সময়, প্ল্যাটফর্ম আইকন, থাম্বনেইল, স্ট্যাটাস)
  - "Recent generated videos" গ্রিড (৯:১৬ থাম্বনেইল, প্রিভিউ/পাবলিশ/ডিলিট অ্যাকশন) — "View all" লিংক Library পেজে
  - এজেন্ট স্ট্যাটাস ব্যানার: Active/Paused টগল, পরবর্তী রান কখন
  - Credits/usage strip: "AI generation: X/Y this month" (প্রোভাইডার অনুযায়ী ভাঙা — কে কোন key দিয়ে কতটুকু ব্যবহার করছে)
  - Notification bell (টপবারে): generation done, post published, post failed, API key expired — ড্রপডাউনে লিস্ট
3. **Agent Settings** `/settings`
  - Niche/topic, ব্র্যান্ড টোন/ভয়েস, ভাষা, ভিডিও দৈর্ঘ্য
  - Posting frequency (দিনে কতবার) + পছন্দের সময়স্লট
  - প্ল্যাটফর্ম টগল — Connections পেজে যা কানেক্ট করা আছে সেগুলো এখানে দেখাবে (ডাইনামিক লিস্ট, হার্ডকোডেড না)
  - মোড সিলেক্টর: **Full Auto** বনাম **Review Before Post**
  - সেভ করলে টোস্ট কনফার্মেশন, সেটিংস লোকালি ধরে রাখবে
4. **AI Providers / API Keys** `/providers` *(নতুন — এইটাই মূল "নিজের API ব্যবহার করার" ফিচার)*
  - Provider ক্যাটাগরি অনুযায়ী কার্ড: Video Generation, Voice/TTS, Script/LLM, Music
  - প্রতিটা ক্যাটাগরিতে একাধিক প্রোভাইডার অপশন (যেমন Video: Runway/Pika/Luma/Custom, TTS: ElevenLabs/Azure/Custom, LLM: OpenAI/Anthropic/Custom)
  - প্রতিটা প্রোভাইডারে "Add API Key" ফর্ম (key input মাস্কড, নাম/লেবেল, টেস্ট-কানেকশন বাটন যা সিমুলেটেড success/fail দেখাবে)
  - **"Custom / Bring Your Own Endpoint"** অপশন — যেকোনো OpenAI-compatible বা কাস্টম REST endpoint URL + key + optional headers ইনপুট করার generic ফর্ম, যাতে লিস্টে না-থাকা যেকোনো প্রোভাইডারও যোগ করা যায়
  - প্রতিটা key-এর স্ট্যাটাস ব্যাজ: Active / Invalid / Expired, লাস্ট-ইউজড টাইমস্ট্যাম্প
  - Default provider সিলেক্ট করার অপশন (একাধিক key থাকলে কোনটা primary)
5. **Content Generation** `/create`
  - ধাপে-ধাপে (stepper) ফ্লো: Brief → Script → Scenes → Voiceover → Captions → Render
  - প্রতিটা ধাপে কোন provider ব্যবহার হবে তা ড্রপডাউনে বাছাই করা যাবে (Providers পেজে যোগ করা key গুলো থেকে)
  - প্রতিটি ধাপে সিমুলেটেড প্রগ্রেস, এডিটযোগ্য স্ক্রিপ্ট, সিন-বাই-সিন কার্ড (ভিজ্যুয়াল প্রম্পট, সময়কাল, ভয়েস লাইন)
  - ভয়েস/ক্যাপশন স্টাইল বাছাই, ডান পাশে লাইভ ৯:১৬ প্রিভিউ ফ্রেম
  - শেষে ফাইনাল রিল কার্ড: Export / Schedule / Post now
6. **Schedule** `/schedule`
  - অটোমেশন রুল লিস্ট (কোন সময়ে, কোন প্ল্যাটফর্মে, দিনে কতবার)
  - কিউ টেবিল: pending / publishing / published / failed, ফেইলড আইটেমে Retry বাটন ও রিট্রাই কাউন্ট
  - রান হিস্ট্রি লগ
7. **Connections** `/connections` *(আপডেটেড — জেনেরিক প্ল্যাটফর্ম সিস্টেম)*
  - ৪টা কমন প্ল্যাটফর্মের প্রি-বিল্ট কার্ড (YouTube, Instagram, TikTok, Facebook) — কানেক্টেড অ্যাকাউন্ট নাম/অ্যাভাটার, স্ট্যাটাস ব্যাজ (Connected / Expired / Not connected)
  - **"Add Custom Platform"** বাটন — জেনেরিক OAuth/API কানেকশন ফর্ম (প্ল্যাটফর্ম নাম, API base URL, auth type: OAuth2/API-key/Webhook, credentials ইনপুট) — যাতে লিস্টে না-থাকা যেকোনো প্ল্যাটফর্ম (LinkedIn, Pinterest, X, কাস্টম CMS, ইত্যাদি) নিজে যোগ করা যায়
  - Connect বাটনে সিমুলেটেড OAuth মডাল, Disconnect কনফার্মেশন
  - প্রতিটা কানেকশনের পাশে "Test" বাটন
8. **Content Library** `/library` *(নতুন)*
  - সব জেনারেট করা ভিডিওর ফিল্টারযোগ্য/সার্চযোগ্য গ্রিড (তারিখ, প্ল্যাটফর্ম, স্ট্যাটাস অনুযায়ী ফিল্টার)
  - প্রতিটা কার্ডে: প্রিভিউ, রি-পোস্ট, ডাউনলোড, ডিলিট অ্যাকশন
9. **Calendar** `/calendar`
  - মাসিক ক্যালেন্ডার গ্রিড, প্রতিটি দিনে পোস্ট চিপ (প্ল্যাটফর্ম কালার + স্ট্যাটাস)
  - দিনে ক্লিক করলে সাইড প্যানেলে ওই দিনের পোস্ট বিস্তারিত
  - মাস/সপ্তাহ টগল
10. **Account & Billing** `/account` *(নতুন)*
  - প্রোফাইল ইনফো, প্ল্যান স্ট্যাটাস (এখানে "Pro Plan" এর মতো ব্যাজ)
  - Plan এর সাথে প্ল্যাটফর্ম/generation limit দেখানো (BYOK ব্যবহার করলে সেটাও আলাদা করে বলা — "নিজের key দিয়ে জেনারেট করলে প্ল্যাটফর্ম কোটায় ধরা হবে না" জাতীয় নোট)

## Empty States *(নতুন — প্রতিটা লিস্ট/গ্রিডে থাকবে)*

- No scheduled posts yet → "Schedule your first post" CTA
- No connections yet → "Connect a platform to get started" CTA
- No API keys yet → "Add your first provider key" CTA
- No videos in library yet → "Generate your first video" CTA

## টেকনিক্যাল

- TanStack Start রুট ফাইল: `src/routes/index.tsx` (dashboard) সহ উপরের প্রতিটি পাথ, নতুন: `providers.tsx`, `library.tsx`, `account.tsx`, `onboarding.tsx`
- শেয়ার্ড লেআউট: সাইডবার + টপবার (নোটিফিকেশন বেল সহ), `__root` এ Toaster মাউন্ট
- সব ডামি ডেটা এক জায়গায় `src/data/mock.ts` — প্ল্যাটফর্ম ও প্রোভাইডার লিস্ট **অ্যারে/কনফিগ থেকে ডাইনামিক্যালি রেন্ডার** হবে যাতে "কাস্টম" যোগ করলেই বাকি UI (Settings dropdown, Dashboard legend) স্বয়ংক্রিয়ভাবে আপডেট হয় — হার্ডকোডেড ৪-প্ল্যাটফর্ম লজিক এড়ানো হবে
- চার্ট: recharts; আইকন: lucide-react; UI: বিদ্যমান shadcn কম্পোনেন্ট
- ইন্টার‍্যাকশন স্টেট (টগল, জেনারেশন প্রগ্রেস, কানেকশন, key add/remove) ক্লায়েন্ট স্টেটে, তাই সব বাটন সত্যিকারের সাড়া দেবে
- API key ইনপুট ফিল্ড UI-তে মাস্কড দেখানো হবে (যদিও ব্যাকএন্ড ছাড়া আসল এনক্রিপশন সম্ভব না — placeholder behavior)
- প্রতিটি পেজে আলাদা টাইটেল/ডেসক্রিপশন মেটা

## এই ধাপে যা থাকছে না

সত্যিকারের AI জেনারেশন, আসল OAuth/API validation, key-এর এনক্রিপ্টেড স্টোরেজ, ব্যাকগ্রাউন্ড শিডিউলার ও ডেটাবেস — ব্যাকএন্ড ধাপে (Lovable Cloud) যোগ হবে। ব্যাকএন্ডে গেলে key স্টোরেজ ও থার্ড-পার্টি API কল অবশ্যই সার্ভার-সাইডে এনক্রিপ্টেড রাখতে হবে, ফ্রন্টএন্ডে কখনো raw key পাঠানো/রাখা যাবে না।