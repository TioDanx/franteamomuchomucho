---
paths:
  - "lib/firestore/**"
  - "lib/firebase.ts"
  - "lib/hooks/useActivities.ts"
  - "lib/types.ts"
---

# Firestore Schema & Data Access

## Couple Namespace
All data lives under `/couples/{coupleId}/`.

### How coupleId is resolved
- `coupleId` is never hardcoded anywhere in the codebase
- It is derived from the logged-in user via `getCoupleId(user)` in `/lib/firestore/utils.ts`
- Today there is only one couple, so the function returns a deterministic ID from the user:

```ts
// lib/firestore/utils.ts
const COUPLE_MAP: Record<string, string> = {
  dani: "dani-fran",
  fran: "dani-fran",
}

export function getCoupleId(user: string): string {
  const id = COUPLE_MAP[user]
  if (!id) throw new Error(`No couple found for user: ${user}`)
  return id
}
```

- When scaling to multiple couples, replace `COUPLE_MAP` with a Firestore lookup — no other code changes needed
- All `/lib/firestore/` functions receive `coupleId` as a parameter — they never call `getCoupleId` themselves
- Only hooks (`useActivities`, etc.) call `getCoupleId(user)` and pass the result down

## Collections

### couples/{coupleId}  ← root document (required for Security Rules)
```
members: [userId, userId]     → array of exactly 2 user IDs
roles: {
  [userId]: "owner" | "member"
}
createdAt: Timestamp
```
- This document must exist before any subcollection can be accessed
- `members` is used by Firestore Security Rules to restrict read/write to couple members only
- `roles.owner` is the user allowed to perform privileged actions (e.g. edit countdown)
- Today `userId` is a plain string ("dani" or "fran") — when migrating to Firebase Auth, replace with UID
- Create this document manually in the Firebase Console for the "dani-fran" couple on first setup

### activities/{activityId}
```
name: string
photoUrl: string              → Firebase Storage URL
importance: "low" | "medium" | "urgent"
status: "todo" | "confirmed" | "done"
date?: Timestamp
time?: string                 → "19:30" format
location?: {
  address: string
  lat?: number
  lng?: number
}
createdBy: "dani" | "fran"
createdAt: Timestamp
completedAt?: Timestamp
```

### activities/{activityId}/reviews/{userId}
```
rating: number                → 1 to 5 inclusive
comment?: string
author: "dani" | "fran"
createdAt: Timestamp
```
Document ID must equal the author's username (e.g. "dani").
This enforces one review per user per activity at the database level.

### activities/{activityId}/gallery/{photoId}
```
url: string                   → Firebase Storage URL
uploadedBy: "dani" | "fran"
uploadedAt: Timestamp
```
Maximum 5 photos per activity — enforce in UI before upload.

### config/countdown
```
targetDate: Timestamp
updatedBy: "dani"
updatedAt: Timestamp
```
Read by both users. Write only allowed for "dani" (enforced at component level).

## Data Access Rules
- Use `onSnapshot` for activities — always realtime, never one-time fetch
- Use `getDoc` for config/countdown — no need for realtime
- All Firestore logic lives in `/lib/firestore/` — never import firebase directly in components
- Always return `{ data, loading, error }` from hooks that use onSnapshot
- Always unsubscribe from onSnapshot listeners in the useEffect cleanup function

## Firestore Security Rules
A `firestore.rules` file must exist at the project root.
Every new collection added to the schema needs a corresponding rule.
The base rule pattern for this app is:

```
match /couples/{coupleId} {
  allow read, write: if request.auth.uid in resource.data.members;

  match /activities/{activityId} {
    allow read, write: if request.auth.uid in
      get(/databases/$(database)/documents/couples/$(coupleId)).data.members;
  }
}
```

Today auth is localStorage-only so Security Rules are not enforced yet.
When migrating to Firebase Auth, these rules activate automatically — no schema changes needed.
Never delete or weaken these rules when migrating.

## Storage Paths
```
couples/{coupleId}/activities/{activityId}/cover
couples/{coupleId}/activities/{activityId}/gallery/{timestamp}
```
- Always use the resolved `coupleId` from `getCoupleId(user)` — never hardcode the path
- Compress images client-side with `browser-image-compression` before any upload