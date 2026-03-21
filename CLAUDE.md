@AGENTS.md
# Nuestros Planes

Private couples activity planning app for Dani and Fran.

## Stack
- Next.js 15 App Router
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Hook Form
- Lucide Icons
- date-fns
- Firebase Firestore
- Cloudinary (image uploads)
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
  /firestore/                  → activities.ts, reviews.ts, gallery.ts, config.ts
  /hooks/                      → useAuth.ts, useActivities.ts, useCountdown.ts
  /types.ts                    → All TypeScript interfaces
  /utils.ts                    → Maps URL, Calendar URL helpers
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
npm run typecheck  → tsc --noEmit
```

## Before writing any code
1. Check /public/designs/ for the relevant screen reference
2. Read the relevant rule file for the domain you're working in
3. Check /lib/types.ts before creating new interfaces
4. Check /lib/firestore/ before writing any Firestore logic