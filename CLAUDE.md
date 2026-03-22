@AGENTS.md
# Nuestros Planes

Private couples activity planning app for Dani and Fran.

## Stack
- Next.js 16 App Router
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Hook Form
- Lucide Icons
- date-fns
- Firebase Firestore
- Cloudinary (image uploads)
- web-push + Web Push API (push notifications, no Firebase Cloud Functions)
- Deploy: Vercel

## Project Structure
```
/app
  /page.tsx                    → Login screen
  /dashboard/page.tsx          → Dashboard (3 tabs)
  /activity/[id]/page.tsx      → Activity detail
/components
  /auth/                       → UserCard
  /activity/                   → ActivityCard, CountdownTimer, StarRating, PhotoGallery, ImportanceBadge, AddToCalendar, MapsButton
  /modals/                     → AddActivityModal, ConfirmActivityModal
  /ui/                         → shadcn/ui components
/lib
  /firebase.ts                 → Firebase singleton + COUPLE_ID constant
  /firestore/                  → activities.ts, reviews.ts, gallery.ts, config.ts, notifications.ts
  /hooks/                      → useAuth.ts, useActivities.ts, useCountdown.ts, usePushNotifications.ts
  /types.ts                    → All TypeScript interfaces
  /utils.ts                    → Maps URL, Calendar URL helpers
  /notifications.ts            → notifyPartner() helper (calls /api/push-notify, best-effort)
/app
  /api/push-notify/route.ts    → Sends Web Push to partner via web-push library
/public
  /sw.js                       → Service worker (receives push, shows notification)
/stitch/*                 → Stitch reference screens (do not modify)
```

## Rules — load before working in each domain
- Auth & permissions → .claude/rules/auth.md
- Firestore schema & data access → .claude/rules/firestore.md
- Activity state machine → .claude/rules/activity-states.md
- Design system & UI conventions → .claude/rules/design-system.md
- Code conventions & TypeScript → .claude/rules/conventions.md

## Commands
```
npm run dev        → localhost:3000
npm run build      → production build
npm run lint       → ESLint
npx tsc --noEmit   → type check (typecheck script not defined)
```

## Push notifications
- Uses Web Push API + `web-push` npm package. No Firebase Cloud Functions (no Blaze plan).
- VAPID keys in `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
- Subscriptions stored in Firestore: `couples/{coupleId}/pushSubscriptions/{uid}`.
- Flow: client calls `notifyPartner()` → `/api/push-notify` → reads partner subscription → sends push.
- Service worker registered from `usePushNotifications` hook (called in dashboard).
- Notification permission banner in dashboard: shows when `Notification.permission === "default"`, dismissal persisted in `localStorage`.
- `notifyPartner()` is always best-effort — never throws, never blocks the main action.
- `AddActivityModal` requires `senderName` prop. `ConfirmActivityModal` requires `senderUid` + `senderName` props.

## Before writing any code
1. Check /public/designs/ for the relevant screen reference
2. Read the relevant rule file for the domain you're working in
3. Check /lib/types.ts before creating new interfaces
4. Check /lib/firestore/ before writing any Firestore logic