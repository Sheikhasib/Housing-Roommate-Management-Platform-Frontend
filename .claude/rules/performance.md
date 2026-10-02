# Performance

- Run independent awaits in parallel with `Promise.all`.
- Load heavy client-only components (charts, editors, maps) with `next/dynamic`.
- Stream with `Suspense` and `loading.tsx` so the layout shows while data loads.
- Keep `"use client"` boundaries small and as deep in the tree as possible.
- Use TanStack Query for client-side caching; do not add another data-fetching library.
- Keep filter, sort, search and pagination state in the URL.
- Do not memoize prematurely; measure first.
