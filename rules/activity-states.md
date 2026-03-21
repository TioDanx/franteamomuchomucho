# Activity State Machine

## States
```
[todo] ──── assign date + time + location ────▶ [confirmed] ────▶ [done]
```

## todo
Required fields: name, photoUrl, importance
Missing fields: date, time, location
UI: shows importance badge, no date/countdown
Allowed actions: edit, delete, promote to confirmed (via ConfirmActivityModal)

## confirmed
Required fields: all todo fields + date, time, location
UI: shows countdown timer, Maps button, Add to Calendar button
Allowed actions: complete (via "Completar actividad" button → sets status to "done" and writes completedAt)

## done
All fields locked — name, photo, date, time, location are immutable
UI: shows completion date, reviews section, photo gallery
Allowed actions: add/edit own review, upload gallery photos (max 5)

## Rules
- Transitions are one-way and irreversible — never allow going backwards
- Promoting todo → confirmed requires all three fields: date, time, AND location
- Show a validation error if any of the three fields is missing on confirm
- Completing confirmed → done writes `completedAt: serverTimestamp()` to Firestore
- The "Completar" button must ask for confirmation before transitioning (simple modal or alert)

## Countdown Target
- For the login screen: target is `config/countdown.targetDate`
- For a confirmed activity: target is the combination of `activity.date` and `activity.time`
- Use date-fns `set()` to merge date and time into a single Date object before passing to useCountdown
- When the target date is in the past, show "¡Ya llegó el momento!" instead of the timer