# Features & Roadmap

Status legend: ⬜ pending · 🔄 in progress · ✅ done

---

## 🔴 Bloqueantes — fix before production

### ✅ 1. Fix Firestore security rules
**Files:** `firestore.rules`

Two overly-permissive rules must be corrected before the app is public:

- **Couple read leak:** `allow read: if isMember(coupleId) || isAuth()` lets any logged-in user
  read any couple's member names and photos.
  Fix: `allow read: if isMember(coupleId) || isJoining(coupleId)`

- **Invite create abuse:** `allow create: if isAuth()` lets any user create invite codes for
  couples they don't belong to.
  Fix: add `&& request.auth.uid == request.resource.data.createdBy`
  and `&& isMember(coupleId)` guard.

---

## 🟠 Alta prioridad — core UX incompleto

### ✅ 2. Validaciones en el form de creación de actividad
**Files:** `components/modals/AddActivityModal.tsx`

- Add minimum character count for name (e.g. 3 chars min, currently only max 60)
- Show compression progress feedback while uploading photo (button is frozen with no indication)
- Add file type/size guard before compression (reject non-image files early)

### ✅ 3. Editar actividad
**Files:** `components/modals/AddActivityModal.tsx` (or new `EditActivityModal.tsx`), `app/activity/[id]/page.tsx`

The `updateActivity(coupleId, id, patch)` function already exists in `lib/firestore/activities.ts`.
Only the UI is missing. Add an edit button (pencil icon) in the activity detail hero top bar.
Reuse or extend `AddActivityModal` with pre-filled values. Fields to edit: name, photo, importance.

### ✅ 4. Eliminar actividad
**Files:** `app/activity/[id]/page.tsx`, `lib/firestore/activities.ts`

`deleteActivity(coupleId, id)` already exists. Add a delete option in the activity detail page
(e.g. a destructive button at the bottom of the page, behind a confirmation dialog).
Note: deleting an activity leaves gallery photos as Cloudinary orphans — acceptable for now,
address in feature #8.

---

## 🟡 Features nuevas

### ✅ 5. Google Places autocomplete + mapa estático + deep link nativo
**Files:** `components/modals/ConfirmActivityModal.tsx`, `components/activity/MapsButton.tsx`,
`app/activity/[id]/page.tsx`, `lib/types.ts`, `lib/utils.ts`

Full replacement of the free-text location field + standalone Maps button:

**Part A — Autocomplete en ConfirmActivityModal:**
- Replace the plain `<input>` for location with a Google Places Autocomplete field
- On selection, save `{ address, lat, lng }` to Firestore (model already supports lat/lng in `ActivityLocation`)
- Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var and Places API enabled in Google Cloud Console

**Part B — Mapa estático en activity detail (CONFIRMED + DONE):**
- Replace `MapsButton` component with an embedded static map image
  (`https://maps.googleapis.com/maps/api/staticmap?center=lat,lng&zoom=15&size=600x200&markers=lat,lng&key=...`)
- Wrap it in an `<a>` that opens the native maps app:
  - iOS: `maps://?q=lat,lng`
  - Android: `geo:lat,lng`
  - Both can be handled with `geo:lat,lng` URI — iOS and Android both handle it
  - Fallback: `https://maps.google.com/?q=lat,lng`
- The `getMapsUrl()` util in `lib/utils.ts` already builds a Google Maps URL — extend or replace

**Part C — Fallback:**
- If location has no lat/lng (legacy data or manual entry), render the existing text `InfoRow` only, no map

### ✅ 6. Calendario nativo del dispositivo (archivo .ics)
**Files:** `components/activity/AddToCalendar.tsx`, `lib/utils.ts`

Replace the Google Calendar web URL with a `.ics` file generated on the fly:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nuestros Planes//ES
BEGIN:VEVENT
SUMMARY:{activity.name}
DTSTART:{date in YYYYMMDDTHHmmssZ}
DTEND:{date + 2h in YYYYMMDDTHHmmssZ}
LOCATION:{address}
DESCRIPTION:Plan de Nuestros Planes
END:VEVENT
END:VCALENDAR
```

- Create a `Blob` with `type: 'text/calendar'` and trigger download via `URL.createObjectURL`
- iOS opens Calendar natively, Android opens system calendar picker, desktop downloads the `.ics`
- No library needed — plain text generation
- The `getCalendarUrl()` util in `lib/utils.ts` can be replaced with a `generateIcs()` helper

### ✅ 7. Preview del partner antes de aceptar invite code
**Files:** `app/onboarding/couple/page.tsx`, `lib/firestore/couples.ts`

Before confirming join, fetch the invite doc, then fetch the creator's user profile, and show:
"¿Te querés unir a la pareja de **[nombre]**?" with their avatar.
Add a `getInvitePreview(code)` helper that returns `{ creatorName, creatorPhoto }`.
Already safe: Firestore rules allow any authenticated user to read invite docs.

### ✅ 8. Server-side Cloudinary cleanup al borrar foto de galería
**Files:** `app/api/cloudinary-delete/route.ts` (new), `lib/firestore/gallery.ts`

When a gallery photo is deleted, the Firestore doc is removed but the Cloudinary asset stays orphaned.
Fix: create a Next.js API route that accepts `cloudinaryId`, signs the delete request with
`CLOUDINARY_API_SECRET` (server-only env var), and calls the Cloudinary Admin API.
`gallery.ts:deletePhoto()` would POST to this route before deleting the Firestore doc.

---

## 🟢 Nice to have

### ⬜ 9. Notificaciones push (FCM)
**Files:** `public/firebase-messaging-sw.js` (new), `lib/firebase.ts`, Cloud Functions

Notify the partner when: activity added, confirmed, completed, review posted.
Requires Firebase Cloud Messaging setup, a Service Worker, and Cloud Functions triggered on Firestore writes.
Both users need to grant notification permission on first visit.

### ✅ 10. Recordatorio de actividades confirmadas vencidas
**Files:** `app/dashboard/page.tsx`

If a confirmed activity's date has passed and it hasn't been marked done, show a banner or
highlighted card: "¿Ya realizaron [nombre]? Marcala como completada."
Logic: filter confirmed activities where `activity.date.toDate() < new Date()`. No new Firestore query needed.

### ✅ 11. Deep link para invite code
**Files:** `app/join/[code]/page.tsx` (new route)

Instead of sharing a 6-character code manually, share a URL like `/join/ABC123`.
The new route reads the `code` param and redirects to `/onboarding/couple` with the code
pre-populated via query string.

### ✅ 12. Búsqueda y filtros en actividades realizadas
**Files:** `app/dashboard/page.tsx`

Once the "Realizadas" tab grows, add a search input and optional filters (by importance, by rating).
Client-side filtering over the already-loaded `activities` array — no new Firestore queries needed.

### ✅ 13. Editar actividad confirmada (fecha/hora/lugar)
**Files:** `app/activity/[id]/page.tsx`, `lib/firestore/activities.ts`

Allow changing `date`, `time`, and `location` after a plan is already confirmed.
Reuse `ConfirmActivityModal` with pre-filled values and an `updateActivity` call instead of `confirmActivity`.
Add a small edit icon next to the date/time InfoRow section in the confirmed state.
