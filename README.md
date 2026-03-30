# Nuestros Planes

A private couples activity planning app built for Dani and Fran. A shared digital space to plan dates, confirm them with details, track countdowns, and collect memories with photos and reviews.

## Features

- **Activity planning** — Create activities with photo, name, and importance level (low / medium / urgent)
- **Three-state workflow** — Activities progress through `todo → confirmed → done`
- **Confirmation scheduling** — Set date, time, and location to confirm a plan
- **Countdown timers** — Real-time countdown to confirmed activities and a couple-level special date
- **Maps & Calendar** — Open the location in native maps or download an `.ics` calendar file
- **Reviews & ratings** — Each partner can leave a star rating (1–5) and comment on completed activities
- **Photo gallery** — Upload up to 5 photos per completed activity (client-side compressed)
- **Push notifications** — Partner is notified on every meaningful action (create, confirm, complete, review)
- **Overdue banner** — Alerts when a confirmed activity's date has passed without being completed
- **Real-time sync** — Activity list updates live across both devices via Firestore `onSnapshot`
- **PWA** — Installable on mobile via Service Worker

## Activity State Machine

```
[todo]
  Fields: name, photoUrl, importance
  Missing: date, time, location
  Actions: Edit · Delete · Confirm
      │
      ▼  (set date + time + location)
[confirmed]
  Fields: all of the above + date, time, location
  Actions: Edit date/time/location · Complete · Delete
      │
      ▼  (confirmation dialog)
[done]
  Fields: locked — adds completedAt
  Actions: Add/edit review · Upload gallery photos
```

Backward transitions are not allowed. State transitions use Firestore transactions to prevent race conditions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| Auth | Firebase Auth — Google OAuth |
| Database | Firestore (real-time) |
| Images | Cloudinary (upload + delete) |
| Push | Web Push API + `web-push` (no Firebase Cloud Functions) |
| Forms | React Hook Form 7 |
| Components | shadcn/ui |
| Toasts | Sonner |
| Date utils | date-fns 4 |
| Image compression | browser-image-compression |
| Hosting | Vercel |

## Project Structure

```
/app
  page.tsx                      Login / hero screen
  /dashboard/page.tsx           Main dashboard (3 tabs + countdown)
  /activity/[id]/page.tsx       Activity detail, confirm, complete, review
  /onboarding/                  Post-login couple pairing flow
  /join/[code]/page.tsx         Deep link to accept invite
  /api/push-notify/route.ts     Server-side push notification endpoint
  /api/cloudinary-delete/       Orphan image cleanup

/components
  /activity/                    ActivityCard, CountdownTimer, StarRating,
                                PhotoGallery, ImportanceBadge,
                                AddToCalendar, MapsButton
  /modals/                      AddActivityModal, ConfirmActivityModal
  /auth/                        ProfileSidebar

/lib
  firebase.ts                   Firebase singleton + COUPLE_ID
  notifications.ts              notifyPartner() helper (best-effort)
  types.ts                      All TypeScript interfaces
  utils.ts                      Maps URL, Calendar URL helpers
  /firestore/                   activities.ts, reviews.ts, gallery.ts,
                                config.ts, notifications.ts, couples.ts, users.ts
  /hooks/                       useAuth, useActivities, useCountdown,
                                usePushNotifications

/public
  sw.js                         Service Worker (receives push, shows notification)
```

## Firestore Schema

All data is scoped to `/couples/{coupleId}/`.

```
/couples/{coupleId}
  members[]           Firebase UIDs of both partners
  memberNames{}       Cached display names
  memberPhotos{}      Cached avatar URLs

  /activities/{activityId}
    name, photoUrl, importance, status
    date?, time?, location?     — set on confirmation
    createdBy, createdAt
    completedAt?                — set on completion

    /reviews/{uid}              One review per user
      rating, comment?, author, authorName, createdAt

    /gallery/{photoId}          Up to 5 photos
      url, cloudinaryId, uploadedBy, uploadedAt

  /config/countdown             Singleton
    targetDate, updatedBy, updatedAt

  /pushSubscriptions/{uid}      Web Push subscription objects
    subscription, savedAt

/users/{uid}
  uid, displayName, photoURL, coupleId, createdAt

/invites/{code}
  coupleId, createdBy, createdAt, expiresAt, usedBy
```

## Push Notifications

Uses the **Web Push API** with VAPID keys and `web-push` on the server. No Firebase Cloud Functions required.

**Flow:**
1. `usePushNotifications()` registers the Service Worker and saves the push subscription to Firestore
2. Any action (create, confirm, complete, review) calls `notifyPartner()`
3. `notifyPartner()` POSTs to `/api/push-notify` — best-effort, never throws
4. The API route fetches the partner's subscription from Firestore and sends the push via `web-push`
5. The Service Worker displays the notification; clicking it navigates to the relevant activity

**Notification events:** `activity_created` · `activity_confirmed` · `activity_completed` · `review_created` · `review_updated` · `countdown_created` · `countdown_deleted`

## Setup

### Prerequisites

- Node.js 20+
- Firebase project (Auth + Firestore enabled)
- Cloudinary account
- VAPID keys (generate once: `npx web-push generate-vapid-keys`)

### Environment Variables

Create `.env.local`:

```env
# Firebase (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary (public)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### Install & Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npx tsc --noEmit   # type check
```

### Firebase Setup

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

Add your production domain to **Firebase Console → Authentication → Authorized domains**.

## Deployment

The app is deployed on **Vercel**. Push to `main` to trigger a deployment.

Add all environment variables in Vercel → Project Settings → Environment Variables. `VAPID_PRIVATE_KEY` should be marked as server-only (no `NEXT_PUBLIC_` prefix).
