# Auth & Permissions

## Users
Two hardcoded users: `"dani"` and `"fran"` (lowercase strings, no other values are valid).

## Session
- Stored in localStorage under key `"nuestros_planes_user"`
- No passwords, no tokens, no expiry
- `useAuth()` hook exposes: `{ user, login, logout }`
- `login(user)` writes to localStorage, `logout()` clears it

## Permission Rules
- Only `user === "dani"` can edit the countdown target date on the login screen
- Both users can create, confirm, and complete activities
- Both users can leave reviews and upload gallery photos
- Enforce permissions at component level with early returns — never trust props alone

## Implementation
- Never call localStorage directly from components — always use `useAuth()`
- `useAuth()` lives in `/lib/hooks/useAuth.ts`
- Add `"use client"` to any component that calls `useAuth()`