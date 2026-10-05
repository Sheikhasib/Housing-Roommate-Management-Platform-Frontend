# UI

Direction: clean, trustworthy, photo-forward (Airbnb and Zillow style). Before any UI work read `.claude/specs/18-design-system.md`: it holds the tokens, type scale and page patterns.

- Use shadcn/ui, Tailwind CSS 4 utility classes, Lucide icons and Sonner toasts. One font only, loaded with `next/font/google`.
- Exactly three brand colors (teal primary, indigo secondary, amber accent) plus neutrals. Red is only for errors and destructive actions.
- Colors only through the tokens in `src/app/globals.css`. Never hard-code hex values or raw Tailwind palette colors in components.
- Every page and component must work in light and dark mode through the tokens; check both before saying it is done.
- Radius: cards and images `rounded-xl`, buttons and inputs `rounded-lg`, badges `rounded-full`. Shadows: `shadow-sm` at rest, `shadow-md` on hover. A faint ambient gradient built from the three brand tokens is allowed on page backgrounds and card hover glow; text must sit on solid surfaces or on a tint that keeps at least 4.5:1 contrast. No glass effects or heavy shadows.
- Cards of one kind are identical in size, radius and layout: fixed image ratio, 1-line title, 2-line description, meta row and the button at the bottom.
- Mobile-first: design for 360, then 768 and 1280 px. Tap targets at least 40 px high. Page container `max-w-7xl` with `px-4 sm:px-6 lg:px-8`.
- Build reusable components in `src/components/shared/` (`DataTable`, `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState` and the others named in 01-foundation). Never copy-paste the same markup across pages.
- Forms: validation errors, a loader, a success state, and labels connected to inputs.
- Accessibility: a label for every input, an accessible name for every icon-only button, a visible `focus-visible` ring, keyboard-friendly dialogs and menus, never rely on color alone, respect `prefers-reduced-motion`.
- Motion: 150 to 200 ms transitions on hover and focus only. No animation library.
