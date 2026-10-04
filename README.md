# 🐼 CODMPanda — The Ultimate CODM Companion

> Find squads. Track camos. Build gunsmiths. Dominate.

A mobile-first Progressive Web App for Call of Duty Mobile players. Built with vanilla JS, Firebase, and Tailwind — deployable as a PWA or native Android APK via Capacitor.

---

## ✨ Features

### 🎮 PLAY — LFG Board
- Real-time squad finder with filters (Rank / Mode / Region / Mic)
- Live lobby feed, auto-expires after 2h
- One-tap join via Jitsi voice rooms
- Report & rate teammates

### 🔬 LAB — Vault & Camo Tracker
- **Gunsmith Vault:** Share codes, attachments, screenshots
- **Sens & HUD:** Store your best sensitivity and HUD layouts
- **Camo Tracker:** 80+ guns, all camos from Sand → Damascus
- Export your progress as a shareable image

### 👥 SQUAD — Community
- **Clans:** Create, join, browse by region/KD
- **Scrim Board:** Find competitive matches (expires in 1h)
- **Clip Feed:** Share YouTube/TikTok gameplay, like & filter trending

### 📊 INTEL — Tools
- **CP Calculator:** NGN / USD / GHS conversions + Draw cost calculator
- **Leaks:** Exclusive intel drops with rarity badges
- **Tier List:** Community-voted S/A/B/C rankings
- **Map Callouts:** BR Isolated pin map

### 👤 YOU — Profile & Pro
- Custom profile, rank badge, stats, and shareable referral code
- **CODMPanda Pro:** Unlimited vault, full camo tracker, create clans, no ads, gold crown badge
- Admin panel (visible only to admin UID)

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla JS SPA (single index.html) |
| Styling | Tailwind CDN + Inter font + Lucide icons |
| Backend | Firebase v10 modular (Auth, Firestore) |
| Images | Base64 stored in Firestore (no Storage billing) |
| PWA | manifest.json + sw.js (cache-first shell) |
| Hosting | Cloudflare Pages (auto-deploy from GitHub) |
| Mobile | Capacitor-ready for Android APK |

---

## 🚀 Deployment

### Cloudflare Pages
1. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Authorize GitHub, select this repo
3. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: /
4. Save and Deploy → live at codmpanda.pages.dev

### Firebase Auth — Authorized Domains
After deploy, add your Cloudflare URL to:
Firebase Console → Authentication → Settings → Authorized domains

---

## 🔒 Firebase Setup Checklist

- [x] Firebase project created (codmpanda-app)
- [x] Firestore in africa-south1 (Johannesburg)
- [x] Authentication → Google sign-in enabled
- [x] Test mode active (expires ~30 days from creation)
- [ ] Publish production rules from firestore.rules
- [ ] Add Cloudflare domain to Auth authorized domains
- [ ] Fill in ADMIN_UID in index.html

---

## 📁 File Structure

codmpanda/
├── index.html          # Full SPA (HTML + CSS + JS)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline cache)
├── firestore.rules     # Firestore security rules
└── README.md           # This file

---

## 💰 Monetization

- Free tier: Limited vault (3), limited camo tracking (5 guns)
- Pro tier: $1.99/mo or $9.99 lifetime
  - Paystack integration coming (Paystack link placeholder in code)
- AdMob placeholders ready for mobile build

---

## 🗺 Roadmap

- [x] v1.0 — Core app, 5 tabs, PWA
- [ ] v1.1 — Paystack payment integration
- [ ] v1.2 — AdMob native ads (Capacitor build)
- [ ] v1.3 — Push notifications (FCM)
- [ ] v2.0 — Firebase Storage migration for images

---

## 📜 License

Personal project. All rights reserved.

---

Built with 🔥 by the CODMPanda team.
