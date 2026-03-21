# Design System & UI Conventions

## Reference Screens
Always check /public/designs/ before building any screen or component.
These are the Stitch exports — they are the source of truth for visual decisions.

## Fonts
- Headings: Cormorant Garamond (serif, bold) — romantic
- Body & UI labels: DM Sans (sans-serif) — modern, clean
- Load both via next/font/google in /app/layout.tsx

## Color Tokens
Defined as CSS variables in /app/globals.css. Always use these — never hardcode hex values.

Dark mode (default):
```
--color-bg-primary: #0F0A14
--color-bg-secondary: #1A1025
--color-card: #1E1530
--color-border: #2D2040
--color-accent-rose: #C2185B
--color-accent-gold: #D4A853
--color-accent-lavender: #7C6A9E
--color-text-primary: #F5F0FF
--color-text-muted: #B0A8C8
```

Light mode:
```
--color-bg-primary: #FDF8FF
--color-bg-secondary: #F5EEF8
--color-card: #FFFFFF
--color-border: #E8D5F0
--color-text-primary: #2D1B4E
--color-text-muted: #6B5B8A
```

## Importance Badge Colors
- low → muted green #4ADE80
- medium → amber #FBBF24
- urgent → red #EF4444 with a subtle pulse ring animation (Framer Motion)

## Spacing & Shape
- Card border radius: 20–24px
- Badge/pill border radius: 100px
- Card background: var(--color-card) with 1px border var(--color-border)
- Interactive elements: rose or lavender glow shadow on hover/focus
- No glassmorphism, no backdrop-blur
- No hard drop shadows

## Gold Usage
Gold (--color-accent-gold) is a reward color. Use only for:
- Completed activity states
- Star ratings
- "Realizada" badge
- Confirm/CTA buttons in the ConfirmActivityModal

## Animations
- All transitions via Framer Motion — never CSS transitions alone
- Prefer spring physics: `type: "spring", stiffness: 300, damping: 30`
- Page transitions: fade + slight translateY (8px)
- Modal (bottom sheet): slide up from bottom with spring
- Cards: subtle scale on tap (0.97) using whileTap

## Theme Toggle
- Dark mode is default
- Toggle stored in localStorage under key `"nuestros_planes_theme"`
- Apply theme class on <html> element
- Use Tailwind dark: variant throughout

## Empty States
Every list or tab that can be empty must have an empty state:
- A small Lucide icon in --color-accent-lavender
- A heading in Cormorant Garamond
- A short subtext in DM Sans muted
- A CTA button if an action is available