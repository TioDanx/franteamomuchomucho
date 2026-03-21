# Code Conventions & TypeScript

## TypeScript
- Strict mode enabled — no `any` types, ever
- All component props must have explicit interfaces
- All Firestore documents must map to interfaces defined in /lib/types.ts
- Check /lib/types.ts before creating any new interface — extend existing ones if possible

## Components
- Named exports for all components
- Default export only for Next.js page files (app/*/page.tsx)
- Server Components by default
- Add "use client" only when the component uses: hooks, event handlers, localStorage, Framer Motion, or browser APIs
- Keep components under 150 lines — split into smaller components if longer
- Co-locate component-specific helpers at the bottom of the file, not in utils.ts

## Styling
- Tailwind classes only — no inline styles, no CSS modules
- Use cn() utility (from shadcn/ui) for conditional class merging
- Never use arbitrary Tailwind values for colors — use CSS variables via Tailwind config
- Responsive classes: mobile-first always (base → sm → md)

## Data Fetching
- All Firestore logic goes through /lib/firestore/ files — never import firebase/firestore directly in components
- All hooks that use onSnapshot must return { data, loading, error }
- Always unsubscribe from onSnapshot listeners in the useEffect cleanup function

## Forms
- All forms use React Hook Form
- Validation rules defined inline in register() calls
- Error messages displayed below each field in DM Sans, --color-accent-rose, text-sm
- Disable submit button while form is submitting

## Dates
- All date formatting and arithmetic uses date-fns
- Never use new Date().toLocaleDateString() or .toLocaleString()
- Store dates as Firestore Timestamps, convert to Date with .toDate() when needed
- Display format: "Sábado 12 de abril" → use date-fns format() with Spanish locale

## File Naming
- Components: PascalCase (ActivityCard.tsx)
- Hooks: camelCase prefixed with use (useActivities.ts)
- Utilities and lib files: camelCase (utils.ts, firebase.ts)
- All files in TypeScript (.ts / .tsx) — no .js files

## Imports
- Use @/ path alias for all internal imports
- Group imports: 1) React/Next, 2) third-party, 3) internal — separated by blank lines
- No default imports from internal modules except page files