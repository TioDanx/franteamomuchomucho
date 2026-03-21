# Plan de Implementación: Nuestros Planes

## Stack
Next.js 16 · Firebase Auth (Google) · Firestore · Firebase Storage · Tailwind v4 · Framer Motion · shadcn/ui · React Hook Form · date-fns

---

## Prerrequisitos (hacer antes de escribir código)

- [ ] Crear proyecto en Firebase Console
- [ ] Habilitar Firestore (modo producción)
- [ ] Habilitar Firebase Storage
- [ ] Habilitar Authentication → Google como proveedor
- [ ] Crear `.env.local` con las credenciales:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  ```
- [ ] Agregar `.env.local` a `.gitignore`
- [ ] Leer `node_modules/next/dist/docs/` para breaking changes antes de escribir routing/Server Components

---

## Fase 1 — Tipos y configuración base

### 1.1 `lib/types.ts`
Definir todas las interfaces. Nada puede construirse sin esto.

```ts
// Auth & Users
interface UserProfile {
  uid: string
  displayName: string
  coupleId: string | null
  createdAt: Timestamp
}

// Couple
interface Couple {
  members: string[]             // UIDs
  roles: Record<string, "owner" | "member">
  memberNames: Record<string, string>
  createdAt: Timestamp
}

// Invite
interface Invite {
  coupleId: string
  createdBy: string             // UID
  createdAt: Timestamp
  expiresAt: Timestamp
  usedBy: string | null
}

// Activity
type ImportanceLevel = "low" | "medium" | "urgent"
type ActivityStatus = "todo" | "confirmed" | "done"

interface ActivityLocation {
  address: string
  lat?: number
  lng?: number
}

interface Activity {
  id: string
  name: string
  photoUrl: string
  importance: ImportanceLevel
  status: ActivityStatus
  date?: Timestamp
  time?: string                 // "19:30" format
  location?: ActivityLocation
  createdBy: string             // UID
  createdAt: Timestamp
  completedAt?: Timestamp
}

// Review
interface Review {
  rating: number                // 1–5
  comment?: string
  author: string                // UID (also the doc ID)
  createdAt: Timestamp
}

// Gallery
interface GalleryPhoto {
  id: string
  url: string
  uploadedBy: string            // UID
  uploadedAt: Timestamp
}

// Config
interface CountdownConfig {
  targetDate: Timestamp
  updatedBy: string             // UID (must be owner)
  updatedAt: Timestamp
}
```

### 1.2 `lib/firebase.ts`
Singleton con app, auth, db y storage.

---

## Fase 2 — Capa de datos: Firestore

### 2.1 `lib/firestore/users.ts`
- `createUserProfile(uid, displayName)` → setDoc /users/{uid}
- `getUserProfile(uid)` → getDoc /users/{uid} → UserProfile | null
- `updateUserCoupleId(uid, coupleId)` → updateDoc

### 2.2 `lib/firestore/couples.ts`
- `createCouple(ownerUid, ownerDisplayName)` → Promise<string> (returns invite code)
  1. setDoc /couples/{newId}
  2. setDoc /invites/{code} (6-char random, expires in 7 days)
  3. updateDoc /users/{uid} coupleId
  - returns code
- `joinCouple(uid, displayName, code)` → Promise<void>
  1. getDoc /invites/{code} → validate exists, not expired, usedBy == null
  2. updateDoc /couples/{coupleId} → arrayUnion uid, set roles.uid = "member", memberNames.uid
  3. updateDoc /invites/{code} usedBy = uid
  4. updateDoc /users/{uid} coupleId
- `getCouple(coupleId)` → Promise<Couple | null>

### 2.3 `lib/firestore/activities.ts`
- `subscribeActivities(coupleId, onData, onError)` → unsubscribe fn
- `addActivity(coupleId, data)` → Promise<string>
- `updateActivity(coupleId, activityId, data)` → Promise<void>
- `deleteActivity(coupleId, activityId)` → Promise<void>
- `getActivity(coupleId, activityId)` → Promise<Activity | null>
- `confirmActivity(coupleId, activityId, { date, time, location })` → Promise<void> (Transaction)
- `completeActivity(coupleId, activityId)` → Promise<void> (Transaction)

### 2.4 `lib/firestore/reviews.ts`
- `setReview(coupleId, activityId, uid, data)` → Promise<void>
- `subscribeReviews(coupleId, activityId, onData)` → unsubscribe fn

### 2.5 `lib/firestore/gallery.ts`
- `uploadPhoto(coupleId, activityId, uid, file)` → Promise<void>
  1. Comprimir con browser-image-compression (max 1MB, max 1920px)
  2. Upload a Storage: couples/{coupleId}/activities/{activityId}/gallery/{timestamp}
  3. getDownloadURL
  4. addDoc /gallery/{photoId}
- `subscribeGallery(coupleId, activityId, onData)` → unsubscribe fn
- `deletePhoto(coupleId, activityId, photoId, storageUrl)` → Promise<void>

### 2.6 `lib/firestore/config.ts`
- `getCountdown(coupleId)` → Promise<CountdownConfig | null>
- `setCountdown(coupleId, uid, targetDate)` → Promise<void>

---

## Fase 3 — Auth y hooks

### 3.1 `lib/hooks/useAuth.ts`
- onAuthStateChanged listener
- Si hay firebaseUser: getDoc /users/{uid}; si no existe → crear perfil vacío
- Expone: `{ user: UserProfile | null, firebaseUser, loading, signInWithGoogle, signOut }`

### 3.2 `lib/hooks/useActivities.ts`
- Parámetro: coupleId
- Llama subscribeActivities, retorna `{ data: Activity[], loading, error }`

### 3.3 `lib/hooks/useCountdown.ts`
- Parámetro: targetDate (Date)
- setInterval cada 1 segundo
- Retorna `{ days, hours, minutes, seconds, isPast }`

### 3.4 `lib/utils.ts`
- `mergeDateTime(date: Timestamp, time: string): Date`
- `getMapsUrl(location: ActivityLocation): string`
- `getCalendarUrl(activity: Activity): string`
- `generateInviteCode(): string` (6 chars alphanumeric uppercase)

---

## Fase 4 — Security Rules y Middleware

### 4.1 `firestore.rules`
Archivo en la raíz del proyecto. Deploy con Firebase CLI.

### 4.2 `middleware.ts`
- Rutas públicas: "/"
- Rutas que requieren auth pero no couple: "/onboarding", "/onboarding/couple"
- Rutas protegidas: "/dashboard", "/activity/*"
- Redirect según estado de auth

---

## Fase 5 — Design System

### 5.1 `app/globals.css`
CSS variables con tokens de colores (dark mode default, light mode via `.light` class).

### 5.2 `app/layout.tsx`
- Fonts: Cormorant Garamond (headings) + DM Sans (body)
- Metadata: título "Nuestros Planes"
- Theme desde localStorage
- Toaster de Sonner

---

## Fase 6 — Onboarding y Auth UI

### 6.1 `app/page.tsx` — Login
- Full-height con countdown
- Botón "Entrar con Google"

### 6.2 `app/onboarding/page.tsx` — Set nombre
- Formulario: "¿Cómo te llamamos?" (2–20 chars)

### 6.3 `app/onboarding/couple/page.tsx` — Crear o unirse
- Opción A: Crear pareja → mostrar código de 6 chars
- Opción B: Ingresar código de 6 chars

---

## Fase 7 — Dashboard

### 7.1 `app/dashboard/page.tsx`
- 3 tabs: "Por hacer" | "Confirmados" | "Realizadas"
- Lista de ActivityCard por tab
- FAB "+" para abrir AddActivityModal

### 7.2 `components/activity/ActivityCard.tsx`
- todo: foto, nombre, ImportanceBadge, botón "Confirmar"
- confirmed: foto, nombre, ImportanceBadge, CountdownTimer, botón "Ver detalle"
- done: foto, nombre, StarRating, "Realizada el [fecha]"

### 7.3 `components/activity/ImportanceBadge.tsx`
- low → verde, medium → amber, urgent → rojo + pulse ring

### 7.4 `components/modals/AddActivityModal.tsx`
- Bottom sheet (Framer Motion slide-up)
- Campos: nombre, foto, importancia

---

## Fase 8 — Activity Detail

### 8.1 `app/activity/[id]/page.tsx`
- Hero image con gradient overlay
- Acciones según estado

### 8.2 `components/modals/ConfirmActivityModal.tsx`
- Bottom sheet
- Campos: fecha, hora, ubicación

### 8.3 `components/activity/CountdownTimer.tsx`
- Días/horas/minutos/segundos o "¡Ya llegó el momento!"

### 8.4 `components/activity/StarRating.tsx`
- 5 estrellas en gold, clickeable si no readonly

### 8.5 `components/activity/PhotoGallery.tsx`
- Grid de fotos, máximo 5

### 8.6 `components/activity/MapsButton.tsx`

### 8.7 `components/activity/AddToCalendar.tsx`

---

## Fase 9 — Componentes de Auth

### 9.1 `components/auth/UserCard.tsx`
- Foto + displayName + botón logout

---

## Orden de implementación

```
1.  lib/types.ts
2.  lib/firebase.ts
3.  lib/firestore/users.ts
4.  lib/firestore/couples.ts
5.  lib/hooks/useAuth.ts
6.  firestore.rules
7.  lib/firestore/activities.ts
8.  lib/firestore/reviews.ts
9.  lib/firestore/gallery.ts
10. lib/firestore/config.ts
11. lib/hooks/useActivities.ts
12. lib/hooks/useCountdown.ts
13. lib/utils.ts
14. app/globals.css
15. app/layout.tsx
16. app/page.tsx
17. app/onboarding/page.tsx
18. app/onboarding/couple/page.tsx
19. middleware.ts
20. components/activity/ImportanceBadge.tsx
21. components/activity/CountdownTimer.tsx
22. components/activity/StarRating.tsx
23. components/activity/MapsButton.tsx
24. components/activity/AddToCalendar.tsx
25. components/activity/ActivityCard.tsx
26. components/modals/AddActivityModal.tsx
27. app/dashboard/page.tsx
28. components/modals/ConfirmActivityModal.tsx
29. components/activity/PhotoGallery.tsx
30. app/activity/[id]/page.tsx
31. components/auth/UserCard.tsx
```

---

## Verificación final

- [ ] Login con Google funciona en navegador
- [ ] Onboarding completo: nombre → crear pareja → ver código
- [ ] Partner puede unirse con el código en incógnito
- [ ] Ambos ven el dashboard sincronizado en tiempo real
- [ ] Crear actividad (todo) → aparece en "Por hacer"
- [ ] Confirmar actividad → pasa a "Confirmados" con countdown
- [ ] Completar actividad → pasa a "Realizadas"
- [ ] Agregar review (cada usuario la suya)
- [ ] Subir foto a galería (máx 5)
- [ ] Maps y Calendar abren correctamente
- [ ] Owner puede editar fecha de countdown en login
- [ ] Usuario sin coupleId → redirect a onboarding
- [ ] Usuario no autenticado → redirect a login
- [ ] Firestore Rules: acceso denegado desde Firebase Console con otro usuario
